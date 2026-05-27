import apiClient from './api';

export type JobStatus =
  | 'pending'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'validating'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Status categories for UI grouping
export const STATUS_CATEGORIES = {
  PROCESSING: ['processing', 'validating', 'uploading'],
  PENDING: ['pending', 'queued'],
  COMPLETED: ['completed', 'approved'],
  FAILED: ['failed', 'rejected', 'cancelled'],
} as const;

export interface UploadJob {
  id: number;
  job_id: string;
  batch_id?: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  file_path?: string;
  status: JobStatus;
  progress_percent: number;
  error_message?: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  uploaded_by?: number;
  approved_by?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface JobStatusHistory {
  id: number;
  job_id: number;
  status: JobStatus;
  message?: string;
  changed_by?: number;
  changed_at: string;
}

export interface JobFile {
  id: number;
  job_id: number;
  file_name: string;
  file_path?: string;
  file_size?: number;
  status: JobStatus;
  error_message?: string;
  processed_at?: string;
  created_at: string;
}

export interface ValidationError {
  id: number;
  job_id: number;
  table_name: string;
  row_number?: number;
  record_id?: string;
  field_name?: string;
  error_code?: string;
  error_type?: string;
  error_message: string;
  original_value?: string;
  created_at: string;
}

export interface JobDetail {
  job: UploadJob;
  status_history: JobStatusHistory[];
  files: JobFile[];
}

export const uploadApi = {
  uploadFile: async (file: File, batchId?: string): Promise<{ job_id: string; batch_id?: string; status: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (batchId) {
      formData.append('batch_id', batchId);
    }

    try {
      // Don't set Content-Type manually - let axios handle it with proper boundary
      const response = await apiClient.post('/api/upload/', formData);
      return response.data;
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Upload error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });
      throw error;
    }
  },

  uploadBatch: async (files: File[]): Promise<{ batch_id: string; total_files: number; results: any[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Don't set Content-Type manually - let axios handle it with proper boundary
      const response = await apiClient.post('/api/upload/batch', formData);
      return response.data;
    } catch (error: any) {
      console.error('Batch upload error:', error);
      throw error;
    }
  },

  listJobs: async (params?: {
    status?: JobStatus;
    batch_id?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ jobs: UploadJob[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/api/jobs/', { params });
    return response.data;
  },

  getJob: async (jobId: string): Promise<UploadJob> => {
    const response = await apiClient.get(`/api/jobs/${jobId}`);
    return response.data;
  },

  getJobDetail: async (jobId: string): Promise<JobDetail> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/detail`);
    return response.data;
  },

  getJobHistory: async (jobId: string): Promise<JobStatusHistory[]> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/history`);
    return response.data;
  },

  getJobFiles: async (jobId: string): Promise<JobFile[]> => {
    const response = await apiClient.get(`/api/jobs/${jobId}/files`);
    return response.data;
  },

  getBatchJobs: async (batchId: string): Promise<UploadJob[]> => {
    const response = await apiClient.get(`/api/jobs/batch/${batchId}`);
    return response.data;
  },

  approveJob: async (jobId: string, approved: boolean, message?: string) => {
    const response = await apiClient.post(`/api/jobs/${jobId}/approve`, {
      approved,
      message,
    });
    return response.data;
  },

  retryJob: async (jobId: string) => {
    const response = await apiClient.post(`/api/jobs/${jobId}/retry`);
    return response.data;
  },
};

export const validationApi = {
  listRules: async (params?: {
    table_name?: string;
    rule_type?: string;
    is_active?: boolean;
  }): Promise<{ rules: any[]; total: number }> => {
    const response = await apiClient.get('/api/validation/rules', { params });
    return response.data;
  },

  getRule: async (ruleId: number) => {
    const response = await apiClient.get(`/api/validation/rules/${ruleId}`);
    return response.data;
  },

  createRule: async (rule: any) => {
    const response = await apiClient.post('/api/validation/rules', rule);
    return response.data;
  },

  updateRule: async (ruleId: number, rule: any) => {
    const response = await apiClient.put(`/api/validation/rules/${ruleId}`, rule);
    return response.data;
  },

  deleteRule: async (ruleId: number) => {
    const response = await apiClient.delete(`/api/validation/rules/${ruleId}`);
    return response.data;
  },

  listErrors: async (jobId: number, params?: {
    table_name?: string;
    error_type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ errors: ValidationError[]; total: number; page: number; page_size: number; summary: any }> => {
    const response = await apiClient.get('/api/validation/errors', {
      params: { job_id: jobId, ...params },
    });
    return response.data;
  },
};

export const jobsApi = {
  ...uploadApi,
  ...validationApi,
};
