import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  XCircle,
  ArrowLeft,
  Download,
  Search,
  ShieldAlert,
  AlertCircle,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validationApi, jobsApi } from '@/services/jobService';

export default function ValidationRejectedDashboard() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
  const pageSize = 50;

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getJob(jobId!),
    enabled: !!jobId,
  });

  const { data: errorsData, isLoading } = useQuery({
    queryKey: ['validation-errors', jobId, page],
    queryFn: () => validationApi.listErrors(parseInt(jobId!), { page, page_size: pageSize }),
    enabled: !!jobId,
  });

  // Use actual job record counts from API
  const totalRows = job?.total_records || 0;
  const passedCount = job?.valid_records || 0;
  const failedCount = job?.invalid_records || 0;
  const progressPercent = job?.progress_percent || 0;

  // Debug: log job data
  if (job) {
    console.log('Validation Dashboard - Job data:', {
      id: job.id,
      file_name: job.file_name,
      total_records: job.total_records,
      valid_records: job.valid_records,
      invalid_records: job.invalid_records,
      progress_percent: job.progress_percent,
    });
  }

  const filteredErrors = errorsData?.errors.filter(
    (err) =>
      err.field_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(err.row_number || '').includes(searchTerm)
  );

  const downloadRejectionPackage = () => {
    // TODO: Implement download
    alert('Download rejection package will be implemented');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Status Bar */}
      <div className="bg-red-600 px-6 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-sm font-bold">
          <XCircle className="w-5 h-5" />
          FILE STATUS: REJECTED
        </div>
        <div className="text-xs font-mono opacity-80">
          Job ID: {jobId}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/job-history')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Job History
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">VALIDATION SUMMARY</h1>
            <p className="text-sm text-slate-500">
              {job?.file_name} • Processed at {job?.completed_at ? new Date(job.completed_at).toLocaleString() : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/job-history')}>
            <History className="w-4 h-4 mr-2" />
            View Job History
          </Button>
          <Button onClick={downloadRejectionPackage}>
            <Download className="w-4 h-4 mr-2" />
            Download Error Log
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 px-6 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Processing Progress</div>
          <Progress value={progressPercent} className="h-2" />
          <div className="text-sm font-bold text-green-600 mt-2">{progressPercent}%</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Total Rows</div>
          <div className="text-2xl font-black text-slate-800">{totalRows}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-xs font-bold text-slate-500 uppercase mb-2">Passed</div>
          <div className="text-2xl font-black text-green-600">{passedCount}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-xs font-bold text-red-500 uppercase mb-2">Failed (Rejected)</div>
          <div className="text-2xl font-black text-red-600">{failedCount}</div>
        </div>
      </div>

      {/* Error Table */}
      <div className="flex-1 overflow-hidden mx-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Validation Exceptions</h2>
                <p className="text-sm text-slate-500">
                  {failedCount} records must be corrected before the file can be accepted
                </p>
              </div>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-10 w-64"
                placeholder="Search by Row or Field..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Error Code</th>
                  <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Failure Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Loading errors...
                    </td>
                  </tr>
                ) : filteredErrors && filteredErrors.length > 0 ? (
                  filteredErrors.map((err) => (
                    <tr key={err.id} className="hover:bg-red-50">
                      <td className="p-4 text-sm text-slate-500 font-mono">
                        {new Date(err.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            {err.row_number ? `Row ${err.row_number}` : 'N/A'}
                          </span>
                          {err.record_id && (
                            <span className="text-xs text-indigo-600 font-mono">{err.record_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs bg-white text-red-600 border-red-200">
                          {err.error_code || err.error_type || 'UNKNOWN'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {err.field_name && (
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              Field: {err.field_name}
                            </span>
                          )}
                          <span className="text-sm text-red-700">{err.error_message}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No validation errors found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rejection Alert */}
      <div className="mx-6">
        <Alert className="bg-red-50 border-red-200 border-l-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold text-sm uppercase ml-2">
            Batch Rejection Notice
          </AlertTitle>
          <AlertDescription className="text-red-700 text-sm mt-2 ml-2">
            This submission has been <strong>Rejected</strong> because it contains {failedCount} critical errors.
            No data from this batch has been written to the database. Please correct the errors and resubmit.
            <br />
            <span className="text-xs opacity-75">
              Total: {totalRows} rows | Passed: {passedCount} | Failed: {failedCount}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
