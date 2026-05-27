import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  Info,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { uploadApi } from '@/services/jobService';
import { useAuthStore } from '@/stores/authStore';

export default function ProjectIdentificationUpload() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleRefreshToken = () => {
    setDebugInfo('Redirecting to login for fresh token...');
    logout();
    navigate('/login');
  };

  const handleClearOldTokens = () => {
    setDebugInfo('Cleared old tokens');
    window.location.reload();
  };

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (selectedFile) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();

      if (validExtensions.includes(fileExt)) {
        setFile(selectedFile);
        setUploadError(null);
        setDebugInfo(`File selected: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        setUploadError('Invalid file type. Please upload an Excel (.xlsx/.xls) or CSV file.');
      }
    }
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files?.[0] || null;
    handleFileSelect(selectedFile);
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setDebugInfo(prev => prev + '\nStarting upload...');

    try {
      setDebugInfo(prev => prev + `\n=== Upload Info ===`);
      setDebugInfo(prev => prev + `\nFile: ${file.name}`);
      setDebugInfo(prev => prev + `\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      setDebugInfo(prev => prev + `\nUser: ${user?.email || 'Not logged in'}`);
      setDebugInfo(prev => prev + `\nRoles: ${user?.roles?.join(', ') || 'None'}`);
      
      // Note: Token is in httpOnly cookie, not accessible from JavaScript
      setDebugInfo(prev => prev + `\nAuth: Using httpOnly cookie (token not visible in JS)`);
      
      setDebugInfo(prev => prev + `\n=== Starting API Call ===`);
      const response = await uploadApi.uploadFile(file);
      setDebugInfo(prev => prev + `\n✅ Upload successful! Job ID: ${response.job_id}`);

      // Navigate to job history to monitor progress
      // Use batch_id for filtering since we're uploading single file
      navigate(`/job-history?batch_id=${response.batch_id || response.job_id}`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setDebugInfo(prev => prev + `\n=== Upload Error ===`);
      setDebugInfo(prev => prev + `\nError message: ${error.message}`);
      setDebugInfo(prev => prev + `\nError status: ${error.response?.status}`);
      setDebugInfo(prev => prev + `\nError data: ${JSON.stringify(error.response?.data, null, 2)}`);
      setDebugInfo(prev => prev + `\nError headers: ${JSON.stringify(error.response?.headers, null, 2)}`);
      
      setUploadError(error.response?.data?.detail || error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadError(null);
    setDebugInfo('');
  };

  const downloadTemplate = () => {
    // TODO: Implement template download
    alert('Template download will be implemented');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Identification Upload</h1>
            <p className="text-sm text-slate-500">Upload project incentive data for validation and processing</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          {/* Debug Info - Shows token being used */}
          {debugInfo && (
            <div className="bg-slate-900 text-green-400 rounded-xl p-4 font-mono text-xs overflow-auto max-h-48">
              <div className="flex items-center gap-2 mb-2 text-white">
                <Info className="w-4 h-4" />
                <span className="font-bold">Debug Information</span>
              </div>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}

          {/* User & Token Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-blue-900">Authentication Status</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleClearOldTokens}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Clear Old Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleRefreshToken}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-red-600 hover:text-red-700"
                      onClick={() => { logout(); navigate('/login'); }}
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Logout
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-blue-600">User:</span> {user?.name || 'Not logged in'}
                  </div>
                  <div>
                    <span className="text-blue-600">Email:</span> {user?.email || 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">Roles:</span> {user?.roles?.join(', ') || 'None'}
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">Auth:</span>
                    <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-green-700">
                      httpOnly Cookie (secure)
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Formula Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-2 flex-1">
                <h2 className="text-sm font-bold text-slate-800 uppercase">Submission Guidelines</h2>
                <p className="text-sm text-slate-600">
                  Submit the project incentive, calculated by:
                </p>
                <div className="bg-slate-50 p-3 rounded border border-slate-100 font-mono text-sm text-blue-700 overflow-x-auto">
                  Project Incentive = Project Value × Net Contribution Rate × PI Rate
                </div>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between bg-slate-900 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-bold">Standardized Input Template</p>
                <p className="text-xs text-slate-400">Download the required structure for incentive calculation.</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-none text-xs"
              onClick={downloadTemplate}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download Template
            </Button>
          </div>

          {/* Drag & Drop Upload */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 transition-all ${
              file
                ? 'border-green-500 bg-green-50'
                : isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {!file ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-slate-300'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Drag & Drop file here</h3>
                  <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-6"
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-slate-400">Maximum file size: 200MB</p>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-6 bg-white border border-green-200 rounded-xl shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeFile}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-100">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    File ready. System will validate data against quality rules.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full py-6 text-base"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Submit for Validation'}
                </Button>
              </div>
            )}
          </div>

          {/* Error message */}
          {uploadError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTitle className="text-red-800 font-bold">Upload Failed</AlertTitle>
              <AlertDescription className="text-red-700 text-sm">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* Footer Info */}
          <div className="flex justify-center items-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Audit Ready</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Validation Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
