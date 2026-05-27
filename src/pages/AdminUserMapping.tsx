import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Shield,
  Plus,
  RefreshCw,
  UserCheck,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export default function AdminUserMapping() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authApi.listUsers(1, 100),
  });

  const { data: oktaGroups } = useQuery({
    queryKey: ['okta-groups'],
    queryFn: authApi.listOktaGroups,
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      authApi.assignRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      authApi.removeRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const syncGroupsMutation = useMutation({
    mutationFn: authApi.syncOktaGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okta-groups'] });
      alert('Okta groups synced successfully');
    },
  });

  const users = usersData?.users || [];
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignRole = (userId: number, role: string) => {
    assignRoleMutation.mutate({ userId, role });
  };

  const handleRemoveRole = (userId: number, role: string) => {
    if (confirm(`Remove ${role} role from this user?`)) {
      removeRoleMutation.mutate({ userId, role });
    }
  };

  const ROLES = ['admin', 'planner', 'approver'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User & Role Management</h1>
              <p className="text-sm text-slate-500">
                Manage Okta user mappings and role assignments
              </p>
            </div>
          </div>
          <Button onClick={() => syncGroupsMutation.mutate()} disabled={syncGroupsMutation.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncGroupsMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Okta Groups
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Total Users</p>
                <p className="text-2xl font-black text-slate-900">{usersData?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Admins</p>
                <p className="text-2xl font-black text-slate-900">
                  {users.filter((u) => u.roles.includes('admin')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Planners</p>
                <p className="text-2xl font-black text-slate-900">
                  {users.filter((u) => u.roles.includes('planner')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Approvers</p>
                <p className="text-2xl font-black text-slate-900">
                  {users.filter((u) => u.roles.includes('approver')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Okta Groups Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Okta Groups</CardTitle>
          <CardDescription>
            Synced Okta groups for role mapping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {oktaGroups && oktaGroups.length > 0 ? (
              oktaGroups.map((group: any) => (
                <Badge key={group.id} variant="outline" className="text-sm">
                  {group.group_name}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No groups synced. Click "Sync Okta Groups" to fetch groups.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Users</CardTitle>
              <CardDescription>
                Manage user role assignments
              </CardDescription>
            </div>
            <div className="relative">
              <Input
                className="w-64"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Roles</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Last Login</th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-sm font-bold text-slate-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{user.name}</p>
                          <p className="text-xs text-slate-400">OKTA: {user.okta_user_id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{user.email}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="default" className="text-xs">
                            {role}
                            <button
                              className="ml-1 hover:text-red-300"
                              onClick={() => handleRemoveRole(user.id, role)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        {ROLES.filter((r) => !user.roles.includes(r)).map((role) => (
                          <Button
                            key={role}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAssignRole(user.id, role)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {role}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
