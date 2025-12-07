import axios from 'axios';
import type {
  InspectionResponse,
  InspectionsResponse,
  InspectionCreateData,
  InspectionUpdateData,
  InspectionResult,
  ResultResponse,
  SignatureResponse,
} from '../types/inspection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

/**
 * Get all inspections, optionally filtered by status
 */
export const getAllInspections = async (status?: string): Promise<InspectionsResponse> => {
  const url = status
    ? `${API_URL}/inspections?status=${status}`
    : `${API_URL}/inspections`;

  const response = await axios.get<InspectionsResponse>(url, getAuthHeaders());
  return response.data;
};

/**
 * Get single inspection with full details
 */
export const getInspectionById = async (id: string): Promise<InspectionResponse> => {
  const response = await axios.get<InspectionResponse>(
    `${API_URL}/inspections/${id}`,
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Create new inspection from template
 */
export const createInspection = async (data: InspectionCreateData): Promise<InspectionResponse> => {
  const response = await axios.post<InspectionResponse>(
    `${API_URL}/inspections`,
    data,
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Update inspection details
 */
export const updateInspection = async (
  id: string,
  data: InspectionUpdateData
): Promise<InspectionResponse> => {
  const response = await axios.put<InspectionResponse>(
    `${API_URL}/inspections/${id}`,
    data,
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Delete draft inspection
 */
export const deleteInspection = async (id: string): Promise<{ status: 'success'; message: string }> => {
  const response = await axios.delete<{ status: 'success'; message: string }>(
    `${API_URL}/inspections/${id}`,
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Save/update inspection result
 */
export const saveResult = async (
  inspectionId: string,
  result: Omit<InspectionResult, 'id' | 'inspectionId' | 'createdAt' | 'updatedAt'>
): Promise<ResultResponse> => {
  const response = await axios.post<ResultResponse>(
    `${API_URL}/inspections/${inspectionId}/results`,
    result,
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Mark inspection as completed
 */
export const completeInspection = async (id: string): Promise<InspectionResponse> => {
  const response = await axios.put<InspectionResponse>(
    `${API_URL}/inspections/${id}/complete`,
    {},
    getAuthHeaders()
  );
  return response.data;
};

/**
 * Save signature for inspection
 */
export const saveSignature = async (
  id: string,
  signatureData: string,
  signedBy: string
): Promise<SignatureResponse> => {
  const response = await axios.post<SignatureResponse>(
    `${API_URL}/inspections/${id}/signature`,
    { signatureData, signedBy },
    getAuthHeaders()
  );
  return response.data;
};
