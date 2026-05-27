import apiClient from './api';

export interface CommissionRule {
  id: number;
  rule_name: string;
  rule_type: string;
  sql_expression?: string;
  python_module?: string;
  python_function?: string;
  parameters?: Record<string, any>;
  source_table?: string;
  target_table?: string;
  source_fields?: string[];
  target_field?: string;
  condition_expression?: string;
  priority: number;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionResult {
  id: number;
  period: string;
  salesman_id: number;
  salesman_code?: string;
  salesman_name?: string;
  ns_commission: number;
  br_commission: number;
  total_commission: number;
  breakdown_json?: Record<string, any>;
  calculation_date: string;
  rule_id?: number;
  job_id?: number;
  status: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
}

export interface CommissionSummary {
  period: string;
  ns_commission: number;
  br_commission: number;
  total_commission: number;
  previous_period?: string;
  ns_change_percent?: number;
  br_change_percent?: number;
  total_change_percent?: number;
  channel_breakdown?: any[];
  top_salesmen?: any[];
}

export const commissionApi = {
  listRules: async (isActive?: boolean): Promise<CommissionRule[]> => {
    const response = await apiClient.get('/api/commission/rules', { params: { is_active: isActive } });
    return response.data;
  },

  createRule: async (rule: Partial<CommissionRule>) => {
    const response = await apiClient.post('/api/commission/rules', rule);
    return response.data;
  },

  updateRule: async (ruleId: number, rule: Partial<CommissionRule>) => {
    const response = await apiClient.put(`/api/commission/rules/${ruleId}`, rule);
    return response.data;
  },

  calculate: async (period: string, ruleIds?: number[], forceRecalculate?: boolean) => {
    const response = await apiClient.post('/api/commission/calculate', {
      period,
      rule_ids: ruleIds,
      force_recalculate: forceRecalculate,
    });
    return response.data;
  },

  listResults: async (params?: {
    period?: string;
    salesman_id?: number;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ results: CommissionResult[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/api/commission/results', { params });
    return response.data;
  },

  getSummary: async (period: string): Promise<CommissionSummary> => {
    const response = await apiClient.get(`/api/commission/summary/${period}`);
    return response.data;
  },

  approveResult: async (resultId: number) => {
    const response = await apiClient.post(`/api/commission/results/${resultId}/approve`);
    return response.data;
  },
};
