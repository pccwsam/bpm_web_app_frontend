import apiClient from './api';

export interface MasterDataRecord {
  id: number;
  [key: string]: any;
}

export interface MasterDataSchema {
  table_name: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    default?: any;
    is_primary: boolean;
  }[];
  primary_key: string;
  total_records: number;
}

export const masterDataApi = {
  listTables: async (): Promise<{ tables: { table_name: string; model_name: string; record_count: number }[] }> => {
    const response = await apiClient.get('/api/master-data/tables');
    return response.data;
  },

  getSchema: async (tableName: string): Promise<MasterDataSchema> => {
    const response = await apiClient.get(`/api/master-data/schema/${tableName}`);
    return response.data;
  },

  listRecords: async (
    tableName: string,
    params?: {
      filters?: Record<string, any>;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      page?: number;
      page_size?: number;
    }
  ): Promise<{ data: MasterDataRecord[]; total: number; page: number; page_size: number; table_name: string }> => {
    const response = await apiClient.get(`/api/master-data/${tableName}`, {
      params: {
        ...params,
        filters: params?.filters ? JSON.stringify(params.filters) : undefined,
      },
    });
    return response.data;
  },

  updateRecord: async (tableName: string, recordId: number, values: Record<string, any>) => {
    const response = await apiClient.put(`/api/master-data/${tableName}/${recordId}`, values);
    return response.data;
  },

  bulkUpdate: async (tableName: string, updates: { id: number; values: Record<string, any> }[], jobId?: string) => {
    const response = await apiClient.post(`/api/master-data/${tableName}/bulk-update`, {
      table_name: tableName,
      updates,
      job_id: jobId,
    });
    return response.data;
  },

  createRecord: async (tableName: string, values: Record<string, any>) => {
    const response = await apiClient.post(`/api/master-data/${tableName}`, values);
    return response.data;
  },

  deleteRecord: async (tableName: string, recordId: number) => {
    const response = await apiClient.delete(`/api/master-data/${tableName}/${recordId}`);
    return response.data;
  },

  getAuditTrail: async (tableName: string, recordId: number) => {
    const response = await apiClient.get(`/api/master-data/${tableName}/audit/${recordId}`);
    return response.data;
  },
};
