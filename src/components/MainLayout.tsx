import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  UploadCloud,
  History,
  FileWarning,
  Database,
  PieChart,
  Settings,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const navigation = [
  { name: 'Project Upload', href: '/upload', icon: UploadCloud, roles: ['planner', 'admin'] },
  { name: 'Job History', href: '/job-history', icon: History, roles: ['planner', 'approver', 'admin'] },
  { name: 'Validation Errors', href: '/validation-errors', icon: FileWarning, roles: ['planner', 'approver', 'admin'] },
  { name: 'Master Data Editor', href: '/master-data-editor', icon: Database, roles: ['planner', 'admin'] },
  { name: 'Commission Summary', href: '/commission-summary', icon: PieChart, roles: ['planner', 'approver', 'admin'] },
  { name: 'Admin', href: '/admin', icon: Settings, roles: ['admin'] },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter navigation items based on user roles
  const filteredNav = navigation.filter((item) =>
    item.roles.some((role) => user?.roles.includes(role))
  );

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
            <h1 className="text-lg font-bold">Commission System</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-slate-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              {user?.roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-slate-300 border-slate-600 hover:bg-slate-800"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
