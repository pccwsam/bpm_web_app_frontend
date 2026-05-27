// import { useState } from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { LogIn, User, Lock, Info } from 'lucide-react';
import { LogIn, User, Lock, Info, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginDemo } = useAuthStore();
  // const [username, setUsername] = useState('');
  // const [password, setPassword] = useState('');
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  // const [isLoading, setIsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-login on component mount
  useEffect(() => {
    let isMounted = true;

    const triggerAutoLogin = async () => {
      try {
        const result = await loginDemo("admin", "admin");
        if (!isMounted) return;

        if (result.success) {
          navigate("/");
        } else {
          setError(result.error || "Auto login failed");
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("An unexpected error occurred during auto login");
          setIsLoading(false);
        }
      }
    };

    triggerAutoLogin();

    return () => {
      isMounted = false;
    };
  }, [loginDemo, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await loginDemo(username.toLowerCase(), password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: string) => {
    setIsLoading(true);
    setError("");
    const result = await loginDemo(role, role);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Login failed");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Demo Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-center p-12">
        <div className="max-w-md space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">
              Commission Management System
            </h1>
            <p className="text-slate-300 text-lg">
              Demo Mode - Local Authentication
            </p>
          </div>

          <Alert className="bg-blue-900/50 border-blue-700 text-blue-100">
            <Info className="w-5 h-5" />
            <AlertDescription className="ml-2">
              <p className="font-bold mb-2">Demo Credentials:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    Username:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">admin</code>
                  </span>
                  <span>
                    Password:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">admin</code>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Username:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">
                      planner
                    </code>
                  </span>
                  <span>
                    Password:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">
                      planner
                    </code>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Username:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">
                      approver
                    </code>
                  </span>
                  <span>
                    Password:{" "}
                    <code className="bg-blue-800 px-2 py-1 rounded">
                      approver
                    </code>
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Admin</h3>
                <p className="text-slate-300 text-sm">
                  Full access including user management and all CRUD operations
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <LogIn className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Planner</h3>
                <p className="text-slate-300 text-sm">
                  Upload files, edit master data, view reports
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-orange-600 p-3 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Approver</h3>
                <p className="text-slate-300 text-sm">
                  Review and approve/reject pending jobs, view reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            {/* <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Demo Login</CardTitle>
            <CardDescription>
              Enter username and password (must match) to access the system
            </CardDescription> */}
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {isLoading ? "Authenticating..." : "Demo Login"}
            </CardTitle>
            <CardDescription>
              {isLoading
                ? "Please wait while we log you in automatically."
                : "Enter username and password to access the system"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="admin, planner, or approver"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Same as username"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? "Logging in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                {/* <span className="bg-white px-2 text-slate-500">Quick Login</span> */}
                <span className="bg-white px-2 text-slate-500">
                  Quick Login Switcher
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => quickLogin("admin")}
                disabled={isLoading}
                className="text-xs"
              >
                Admin
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin("planner")}
                disabled={isLoading}
                className="text-xs"
              >
                Planner
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin("approver")}
                disabled={isLoading}
                className="text-xs"
              >
                Approver
              </Button>
            </div>

            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <p className="text-xs text-slate-600 text-center">
                {/* <strong>Note:</strong> This is demo mode. Okta authentication is disabled for testing. */}
                <strong>Auto-Login Active:</strong> Bypassing authentication
                form for local fast-track development.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
