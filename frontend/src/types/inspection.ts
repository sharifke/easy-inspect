// Inspection-related TypeScript interfaces

export type InspectionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';

export type Classification = 'C1' | 'C2' | 'C3' | 'ACCEPTABLE' | 'N_A';

export interface InspectionResult {
  id?: string;
  inspectionId?: string;
  subComponentId: string;
  rating: number; // 0-5: 0=N/A, 1=Very Poor, 2=Poor, 3=Fair, 4=Good, 5=Excellent
  classification: Classification;
  notes?: string;
  photoUrls?: string[];
  photos?: Photo[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionCreateData {
  templateId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  location: string;
  address?: string;
  city?: string;
  postalCode?: string;
  scheduledFor?: string;
}

export interface InspectionUpdateData {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  location?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  scheduledFor?: string;
  status?: InspectionStatus;
}

export interface Signature {
  id?: string;
  inspectionId?: string;
  signatureData: string; // Base64 encoded image
  signedBy: string;
  signedAt?: string;
  createdAt?: string;
}

export interface Inspection {
  id: string;
  templateId: string;
  template?: {
    id: string;
    name: string;
    description?: string;
    installationType: string;
    mainComponents?: Array<{
      id: string;
      name: string;
      sortOrder: number;
      subComponents?: Array<{
        id: string;
        name: string;
        criterion: string;
        expectedOutcome: string;
        requiresPhoto: boolean;
        sortOrder: number;
      }>;
    }>;
  };
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  location: string;
  address?: string;
  city?: string;
  postalCode?: string;
  scheduledFor?: string;
  completedAt?: string;
  status: InspectionStatus;
  inspectorId: string;
  inspector?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  results?: InspectionResult[];
  signature?: Signature;
  overallNotes?: string;
  recommendations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionResponse {
  status: 'success';
  data: {
    inspection: Inspection;
  };
}

export interface InspectionsResponse {
  status: 'success';
  data: {
    inspections: Inspection[];
  };
}

export interface ResultResponse {
  status: 'success';
  data: {
    result: InspectionResult;
  };
}

export interface SignatureResponse {
  status: 'success';
  data: {
    signature: Signature;
  };
}

export interface Photo {
  id: string;
  inspectionResultId: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  takenAt: string;
  annotations?: PhotoAnnotations;
  createdAt?: string;
}

export interface PhotoAnnotations {
  arrows: Arrow[];
  circles: Circle[];
  text: TextAnnotation[];
}

export interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width?: number;
}

export interface Circle {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  width?: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export interface PhotoResponse {
  status: 'success';
  data: {
    photo: Photo;
  };
}

export interface PhotosResponse {
  status: 'success';
  data: {
    photos: Photo[];
  };
}
