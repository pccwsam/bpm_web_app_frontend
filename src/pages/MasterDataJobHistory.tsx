import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Download,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Database,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { jobsApi, type JobStatus, STATUS_CATEGORIES } from '@/services/jobService';
import { config } from '@/config';

export default function MasterDataJobHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Get batch_id from query params (for filtering after upload)
  const batchIdFilter = searchParams.get('batch_id');

  const { data, isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['jobs', {
      status: statusFilter === 'all' ? undefined : statusFilter,
      batch_id: batchIdFilter,
      page,
      page_size: pageSize
    }],
    queryFn: () => jobsApi.listJobs({
      status: statusFilter === 'all' ? undefined : statusFilter,
      batch_id: batchIdFilter || undefined,
      page,
      page_size: pageSize,
    }),
    // Auto-refresh based on config if there are processing jobs
    refetchInterval: (query) => {
      const hasProcessingJobs = query.state.data?.jobs.some(
        job => STATUS_CATEGORIES.PROCESSING.includes(job.status as any)
      );
      return hasProcessingJobs ? config.pollingIntervalMs : false;
    },
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> {status === 'completed' ? 'Completed' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'processing':
      case 'validating':
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> {status === 'processing' ? 'Processing' : 'Validating'}</Badge>;
      case 'pending_approval':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending Approval</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'queued':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
      case 'uploading':
        return <Badge variant="outline"><Download className="w-3 h-3 mr-1" /> Uploading</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    if (STATUS_CATEGORIES.PROCESSING.includes(status as any)) {
      return 'text-blue-600';
    }
    if (STATUS_CATEGORIES.COMPLETED.includes(status as any)) {
      return 'text-green-600';
    }
    if (STATUS_CATEGORIES.FAILED.includes(status as any)) {
      return 'text-red-600';
    }
    return 'text-slate-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredJobs = data?.jobs.filter((job) =>
    job.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.job_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-600" />
                  Job Submission History
                </h1>
                {isRefetching && (
                  <Badge variant="outline" className="animate-pulse">
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Refreshing...
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">Monitor and audit all data validation tasks</p>
              {batchIdFilter && (
                <p className="text-xs text-indigo-600 mt-1">
                  Filtering by batch: {batchIdFilter.slice(0, 8)}...
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 ml-2 text-xs"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams.toString());
                      newParams.delete('batch_id');
                      navigate(`/job-history?${newParams.toString()}`);
                    }}
                  >
                    Clear filter
                  </Button>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-2" />
              Export History
            </Button>
            <Button size="sm" onClick={() => navigate('/upload')}>
              <Database className="w-3.5 h-3.5 mr-2" />
              New Upload
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Failed to load jobs</p>
            <p className="text-sm text-red-600">{(error as Error).message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search by Job ID or File Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 px-3 rounded-md border border-slate-200 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
          >
            <option value="all">All Status</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="validating">Validating</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-lg">
        <div className="overflow-y-auto h-full">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Job ID</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">File</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Records</th>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading jobs...
                  </td>
                </tr>
              ) : error && !data ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-red-500">
                    Failed to load jobs. Please try again.
                  </td>
                </tr>
              ) : filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-mono text-sm font-bold text-slate-700">{job.job_id.slice(0, 8)}...</div>
                      <div className="text-xs text-slate-400">{formatDate(job.created_at)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                            {job.file_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {job.file_size ? `${(job.file_size / 1024 / 1024).toFixed(2)} MB` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(job.status)}</td>
                    <td className="p-4 w-48">
                      <Progress value={job.progress_percent} className="h-2" />
                      <div className="text-xs text-slate-500 mt-1">{job.progress_percent}%</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600">
                        {job.valid_records !== undefined && job.total_records !== undefined ? (
                          <>
                            <span className={getStatusColor(job.status)}>
                              {job.valid_records}
                            </span>
                            {' / '}
                            {job.total_records}
                          </>
                        ) : (
                          '-'
                        )}
                      </div>
                      {job.invalid_records > 0 && (
                        <div className="text-xs text-red-600">{job.invalid_records} errors</div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {job.completed_at ? formatDate(job.completed_at) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/validation-errors/${job.id}`)}
                          title="View validation errors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => navigate(`/job-detail/${job.job_id}`)}
                          title="View job details"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No jobs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.total)} of {data.total} jobs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= data.total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
