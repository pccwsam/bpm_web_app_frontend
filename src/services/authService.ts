import apiClient from './api';

export interface User {
  id: number;
  okta_user_id: string;
  email: string;
  name: string;
  picture?: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  roles: string[];
}

export interface UserRoleAssignment {
  role: string;
}

export const authApi = {
  login: () => {
    // Redirect to Okta login
    window.location.href = `${import.meta.env.VITE_OKTA_ISSUER || 'https://your-okta-domain.okta.com'}/oauth2/v1/authorize?client_id=${import.meta.env.VITE_OKTA_CLIENT_ID}&response_type=token&scope=openid%20profile%20email&redirect_uri=${window.location.origin}/callback`;
  },

  logout: () => {
    localStorage.removeItem('okta_token');
    window.location.href = '/api/auth/logout';
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  listUsers: async (page = 1, pageSize = 20): Promise<{ users: User[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get('/api/auth/users', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  assignRole: async (userId: number, role: string) => {
    const response = await apiClient.post(`/api/auth/users/${userId}/roles`, { role });
    return response.data;
  },

  removeRole: async (userId: number, role: string) => {
    const response = await apiClient.delete(`/api/auth/users/${userId}/roles/${role}`);
    return response.data;
  },

  syncOktaGroups: async () => {
    const response = await apiClient.post('/api/auth/okta-groups/sync');
    return response.data;
  },

  listOktaGroups: async () => {
    const response = await apiClient.get('/api/auth/okta-groups');
    return response.data;
  },
};
