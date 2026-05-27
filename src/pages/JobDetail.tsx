import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Activity,
  HardDrive,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { jobsApi, type JobStatus } from '@/services/jobService';
import { config } from '@/config';

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: () => jobsApi.getJobDetail(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.job?.status;
      return status && ['processing', 'validating', 'queued', 'uploading'].includes(status) ? config.pollingIntervalMs : false;
    }
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> {status === 'completed' ? 'Completed' : 'Approved'}</Badge>;
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
      case 'processing':
      case 'validating':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {status === 'processing' ? 'Processing' : 'Validating'}</Badge>;
      case 'pending_approval':
      case 'queued':
      case 'pending':
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800"><Clock className="w-3 h-3 mr-1" /> {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600">Loading job details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Job</h2>
        <p className="text-slate-600 mb-6">{(error as Error)?.message || 'Could not find job details.'}</p>
        <Button onClick={() => navigate('/job-history')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
        </Button>
      </div>
    );
  }

  const { job, status_history, files } = data;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Job Details
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-1">ID: {job.job_id}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(job.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              File Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-sm font-medium text-slate-500">File Name</p>
                <p className="text-sm font-semibold text-slate-900 truncate" title={job.file_name}>{job.file_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">File Size</p>
                <p className="text-sm text-slate-900">{job.file_size ? `${(job.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Created At</p>
                <p className="text-sm text-slate-900">{formatDate(job.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Completed At</p>
                <p className="text-sm text-slate-900">{formatDate(job.completed_at || '')}</p>
              </div>
              
              <div className="sm:col-span-2 mt-2">
                <p className="text-sm font-medium text-slate-500 mb-2 flex justify-between">
                  <span>Processing Progress</span>
                  <span>{job.progress_percent}%</span>
                </p>
                <Progress value={job.progress_percent} className="h-2" />
              </div>
            </div>
          </div>

          {/* Records Summary */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Records Summary
            </h2>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-slate-800">{job.total_records}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-sm font-medium text-green-700 mb-1">Valid</p>
                <p className="text-2xl font-bold text-green-700">{job.valid_records}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm font-medium text-red-700 mb-1">Invalid</p>
                <p className="text-2xl font-bold text-red-700">{job.invalid_records}</p>
              </div>
            </div>
            
            {job.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-semibold text-red-800">Error Message</p>
                <p className="text-sm text-red-600 mt-1">{job.error_message}</p>
              </div>
            )}
          </div>
          
          {/* Associated Files */}
          {files && files.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                Generated Files
              </h2>
              <div className="space-y-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-md">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.file_name}</p>
                        <p className="text-xs text-slate-500">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}</p>
                      </div>
                    </div>
                    {getStatusBadge(f.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Status History Timeline */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm h-full max-h-[800px] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Status Timeline
            </h2>
            
            <div className="relative pl-4 border-l-2 border-slate-200 space-y-8 pb-4">
              {status_history && status_history.length > 0 ? (
                status_history.map((historyItem, index) => {
                  const isLast = index === status_history.length - 1;
                  return (
                    <div key={index} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-white ${isLast && job.status === historyItem.status ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                      
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-800 capitalize">
                            {historyItem.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(historyItem.changed_at)}
                          </span>
                        </div>
                        {historyItem.message && (
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100 mt-1">
                            {historyItem.message}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500 italic">No history recorded yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
