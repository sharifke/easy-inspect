import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Inspection, Photo, Signature, Project, User } from '../types'

// Define the database schema
export class ElektroInspectDB extends Dexie {
  // Tables
  inspections!: Table<Inspection, string>
  photos!: Table<Photo, string>
  signatures!: Table<Signature, string>
  projects!: Table<Project, string>
  users!: Table<User, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('ElektroInspectDB')

    // Define database schema
    this.version(1).stores({
      inspections: 'id, projectId, inspectorId, status, createdAt, updatedAt',
      photos: 'id, inspectionId, synced, timestamp',
      signatures: 'id, inspectionId, type, synced, timestamp',
      projects: 'id, status, createdAt',
      users: 'id, email, role',
      syncQueue: '++id, type, entityId, synced, timestamp'
    })
  }
}

// Sync queue item type
export interface SyncQueueItem {
  id?: number
  type: 'inspection' | 'photo' | 'signature' | 'project'
  action: 'create' | 'update' | 'delete'
  entityId: string
  data?: any
  synced: boolean
  timestamp: string
  error?: string
}

// Create and export database instance
export const db = new ElektroInspectDB()

// Database utility functions
export const dbService = {
  // Inspections
  async saveInspection(inspection: Inspection): Promise<string> {
    const id = await db.inspections.put(inspection)
    await this.addToSyncQueue('inspection', 'create', inspection.id, inspection)
    return id
  },

  async getInspection(id: string): Promise<Inspection | undefined> {
    return await db.inspections.get(id)
  },

  async getAllInspections(): Promise<Inspection[]> {
    return await db.inspections.toArray()
  },

  async getInspectionsByStatus(status: Inspection['status']): Promise<Inspection[]> {
    return await db.inspections.where('status').equals(status).toArray()
  },

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<void> {
    await db.inspections.update(id, updates)
    await this.addToSyncQueue('inspection', 'update', id, updates)
  },

  async deleteInspection(id: string): Promise<void> {
    await db.inspections.delete(id)
    await this.addToSyncQueue('inspection', 'delete', id)
  },

  // Photos
  async savePhoto(photo: Photo): Promise<string> {
    const id = await db.photos.put(photo)
    await this.addToSyncQueue('photo', 'create', photo.id, photo)
    return id
  },

  async getPhotosForInspection(inspectionId: string): Promise<Photo[]> {
    return await db.photos.where('inspectionId').equals(inspectionId).toArray()
  },

  async deletePhoto(id: string): Promise<void> {
    await db.photos.delete(id)
    await this.addToSyncQueue('photo', 'delete', id)
  },

  // Signatures
  async saveSignature(signature: Signature): Promise<string> {
    const id = await db.signatures.put(signature)
    await this.addToSyncQueue('signature', 'create', signature.id, signature)
    return id
  },

  async getSignaturesForInspection(inspectionId: string): Promise<Signature[]> {
    return await db.signatures.where('inspectionId').equals(inspectionId).toArray()
  },

  // Projects
  async saveProject(project: Project): Promise<string> {
    return await db.projects.put(project)
  },

  async getProject(id: string): Promise<Project | undefined> {
    return await db.projects.get(id)
  },

  async getAllProjects(): Promise<Project[]> {
    return await db.projects.toArray()
  },

  // Users
  async saveUser(user: User): Promise<string> {
    return await db.users.put(user)
  },

  async getUser(id: string): Promise<User | undefined> {
    return await db.users.get(id)
  },

  // Sync Queue
  async addToSyncQueue(
    type: SyncQueueItem['type'],
    action: SyncQueueItem['action'],
    entityId: string,
    data?: any
  ): Promise<void> {
    await db.syncQueue.add({
      type,
      action,
      entityId,
      data,
      synced: false,
      timestamp: new Date().toISOString()
    })
  },

  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.where('synced').equals(0).toArray()
  },

  async markAsSynced(id: number): Promise<void> {
    await db.syncQueue.update(id, { synced: true })
  },

  async markSyncError(id: number, error: string): Promise<void> {
    await db.syncQueue.update(id, { error })
  },

  // Clear all data (for logout)
  async clearAll(): Promise<void> {
    await db.inspections.clear()
    await db.photos.clear()
    await db.signatures.clear()
    await db.projects.clear()
    await db.users.clear()
    await db.syncQueue.clear()
  },

  // Get database statistics
  async getStats() {
    const inspectionsCount = await db.inspections.count()
    const photosCount = await db.photos.count()
    const signaturesCount = await db.signatures.count()
    const unsyncedCount = await db.syncQueue.where('synced').equals(0).count()

    return {
      inspections: inspectionsCount,
      photos: photosCount,
      signatures: signaturesCount,
      unsynced: unsyncedCount
    }
  }
}

export default db
