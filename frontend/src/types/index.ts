// User types
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'inspector'
  createdAt: string
  updatedAt: string
}

// Authentication types
export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

// Project types
export interface Project {
  id: string
  name: string
  address: string
  clientName: string
  clientContact: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Inspection types
export interface Inspection {
  id: string
  projectId: string
  inspectorId: string
  type: string
  status: 'draft' | 'in_progress' | 'completed' | 'submitted'
  scheduledDate?: string
  completedDate?: string
  data: InspectionData
  photos: Photo[]
  signatures: Signature[]
  createdAt: string
  updatedAt: string
}

export interface InspectionData {
  // General information
  installationType?: string
  voltage?: string
  earthingSystem?: string

  // Measurements
  measurements?: Measurement[]

  // Observations
  observations?: string
  defects?: Defect[]

  // NEN1010 compliance
  compliance?: ComplianceCheck[]
}

export interface Measurement {
  id: string
  type: string
  location: string
  value: number
  unit: string
  passed: boolean
  notes?: string
}

export interface Defect {
  id: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  photoIds?: string[]
  resolved: boolean
}

export interface ComplianceCheck {
  id: string
  section: string
  requirement: string
  status: 'compliant' | 'non_compliant' | 'not_applicable'
  notes?: string
}

export interface Photo {
  id: string
  inspectionId: string
  url: string
  localPath?: string
  caption?: string
  location?: string
  timestamp: string
  synced: boolean
}

export interface Signature {
  id: string
  inspectionId: string
  type: 'inspector' | 'client'
  imageData: string
  name: string
  timestamp: string
  synced: boolean
}

// Report types
export interface Report {
  id: string
  inspectionId: string
  generatedAt: string
  pdfUrl?: string
  status: 'generating' | 'ready' | 'error'
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Form types
export interface InspectionFormData {
  projectId: string
  type: string
  scheduledDate?: string
  installationType?: string
  voltage?: string
  earthingSystem?: string
}
