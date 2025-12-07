import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// TypeScript Interfaces
export interface SubComponent {
  id?: string;
  name: string;
  criterion: string;
  expectedOutcome: string;
  requiresPhoto: boolean;
  sortOrder: number;
  mainComponentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MainComponent {
  id?: string;
  name: string;
  sortOrder: number;
  templateId?: string;
  subComponents?: SubComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Template {
  id?: string;
  name: string;
  description?: string;
  installationType: 'woning' | 'kantoor' | 'industrie';
  active?: boolean;
  createdBy?: string;
  mainComponents?: MainComponent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateResponse {
  status: 'success';
  data: {
    template: Template;
  };
}

export interface TemplatesResponse {
  status: 'success';
  data: {
    templates: Template[];
  };
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  installationType: 'woning' | 'kantoor' | 'industrie';
  mainComponents: {
    name: string;
    sortOrder: number;
    subComponents: {
      name: string;
      criterion: string;
      expectedOutcome: string;
      requiresPhoto: boolean;
      sortOrder: number;
    }[];
  }[];
}

export interface UpdateTemplateData extends CreateTemplateData {}

/**
 * Get all templates
 */
export const getAllTemplates = async (): Promise<TemplatesResponse> => {
  const response = await axios.get<TemplatesResponse>(`${API_URL}/templates`);
  return response.data;
};

/**
 * Get template by ID with all components
 */
export const getTemplateById = async (id: string): Promise<TemplateResponse> => {
  const response = await axios.get<TemplateResponse>(`${API_URL}/templates/${id}`);
  return response.data;
};

/**
 * Create new template
 */
export const createTemplate = async (data: CreateTemplateData): Promise<TemplateResponse> => {
  const response = await axios.post<TemplateResponse>(`${API_URL}/templates`, data);
  return response.data;
};

/**
 * Update existing template
 */
export const updateTemplate = async (
  id: string,
  data: UpdateTemplateData
): Promise<TemplateResponse> => {
  const response = await axios.put<TemplateResponse>(`${API_URL}/templates/${id}`, data);
  return response.data;
};

/**
 * Delete (deactivate) template
 */
export const deleteTemplate = async (id: string): Promise<{ status: 'success'; message: string }> => {
  const response = await axios.delete<{ status: 'success'; message: string }>(
    `${API_URL}/templates/${id}`
  );
  return response.data;
};

/**
 * Duplicate template
 */
export const duplicateTemplate = async (id: string): Promise<TemplateResponse> => {
  const response = await axios.post<TemplateResponse>(`${API_URL}/templates/${id}/duplicate`);
  return response.data;
};
