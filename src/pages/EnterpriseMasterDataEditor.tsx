import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Save,
  Database,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Settings2,
  Lock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { masterDataApi } from '@/services/masterDataService';
import { useAuthStore } from '@/stores/authStore';

export default function EnterpriseMasterDataEditor() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [editedCells, setEditedCells] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: tablesData, error: tablesError } = useQuery({
    queryKey: ['master-data-tables'],
    queryFn: () => masterDataApi.listTables(),
  });

  // Set initial table when tables are loaded
  useEffect(() => {
    if (!selectedTable && tablesData?.tables && tablesData.tables.length > 0) {
      setSelectedTable(tablesData.tables[0].table_name);
    }
  }, [tablesData, selectedTable]);

  const { data: schema, isLoading: isLoadingSchema, error: schemaError } = useQuery({
    queryKey: ['master-data-schema', selectedTable],
    queryFn: () => masterDataApi.getSchema(selectedTable),
    enabled: !!selectedTable,
  });

  const { data: recordsData, isLoading: isLoadingRecords, error: recordsError } = useQuery({
    queryKey: ['master-data-records', selectedTable, filters, page],
    queryFn: () => masterDataApi.listRecords(selectedTable, {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      page,
      page_size: pageSize,
    }),
    enabled: !!selectedTable,
  });

  const isLoading = isLoadingSchema || isLoadingRecords;
  const error = tablesError || schemaError || recordsError;

  const bulkUpdateMutation = useMutation({
    mutationFn: (updates: { id: number; values: Record<string, any> }[]) =>
      masterDataApi.bulkUpdate(selectedTable, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-data-records', selectedTable] });
      setEditedCells({});
      alert('Changes submitted successfully');
    },
    onError: (error: any) => {
      alert(`Failed to submit changes: ${error.message || 'Unknown error'}`);
    }
  });

  const handleCellChange = (rowId: number, field: string, value: string) => {
    const key = `${rowId}-${field}`;
    setEditedCells((prev) => {
      const newCells = { ...prev, [key]: value };
      // If the value is the same as the original, remove it from editedCells
      const originalRecord = records.find(r => r.id === rowId);
      if (originalRecord && originalRecord[field] === value) {
        delete newCells[key];
      }
      return newCells;
    });
  };

  const handleSubmitBulk = async () => {
    if (Object.keys(editedCells).length === 0) return;

    setIsSubmitting(true);
    try {
      // Group edits by row ID
      const updatesMap: Record<number, Record<string, any>> = {};
      Object.entries(editedCells).forEach(([key, value]) => {
        const [rowIdStr, field] = key.split('-');
        const rowId = parseInt(rowIdStr);
        if (!updatesMap[rowId]) {
          updatesMap[rowId] = {};
        }
        updatesMap[rowId][field] = value;
      });

      const updates = Object.entries(updatesMap).map(([id, values]) => ({
        id: parseInt(id),
        values,
      }));

      await bulkUpdateMutation.mutateAsync(updates);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const records = recordsData?.data || [];
  const columns = schema?.columns || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Enterprise Master Data Editor</h1>
              <p className="text-sm text-slate-500">
                Edit master data records directly with validation queue submission
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={user?.roles.includes('admin') ? 'default' : 'secondary'}>
              {user?.roles.includes('admin') ? 'Admin Mode' : 'Read-Only Mode'}
            </Badge>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              disabled={Object.keys(editedCells).length === 0 || isSubmitting}
              onClick={handleSubmitBulk}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Submit to Validation Queue ({Object.keys(editedCells).length})
            </Button>
          </div>
        </div>
      </div>

      {/* Table Selector */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">Table:</label>
        <select
          className="h-10 px-3 rounded-md border border-slate-200 text-sm"
          value={selectedTable}
          onChange={(e) => {
            setSelectedTable(e.target.value);
            setPage(1);
            setFilters({});
            setEditedCells({});
          }}
        >
          {!selectedTable && <option value="">Select a table...</option>}
          {tablesData?.tables.map((table) => (
            <option key={table.table_name} value={table.table_name}>
              {table.table_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        {schema && (
          <span className="text-sm text-slate-500">
            {schema.total_records.toLocaleString()} total records
          </span>
        )}
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-lg mb-4">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-500 uppercase tracking-wider"
          onClick={() => setShowFilters(!showFilters)}
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Search Criteria
          </span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFilters && (
          <div className="p-4 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {columns.filter(col => !col.name.includes('datetime') && col.name !== 'id').slice(0, 8).map((col) => (
                <div key={col.name}>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {col.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <Input
                    className="h-8 text-sm"
                    placeholder={`Filter ${col.name}...`}
                    value={filters[col.name] || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [col.name]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPage(1);
                  queryClient.invalidateQueries({ queryKey: ['master-data-records', selectedTable] });
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white border border-slate-200 rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
            <p className="font-bold mb-2">Error loading data</p>
            <p className="text-sm text-center">{(error as any)?.message || 'An unexpected error occurred'}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => queryClient.invalidateQueries()}
            >
              Retry
            </Button>
          </div>
        ) : records.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase w-16">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.name}
                      className="p-3 text-left text-xs font-bold text-slate-600 uppercase min-w-[150px]"
                    >
                      <div className="flex items-center gap-2">
                        {col.name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        <Settings2 className="w-3 h-3 text-slate-300" />
                      </div>
                    </th>
                  ))}
                  <th className="p-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record, rowIndex) => {
                  const isRowEdited = Object.keys(editedCells).some(key => key.startsWith(`${record.id}-`));
                  return (
                    <tr key={record.id} className={`hover:bg-blue-50 transition-colors ${isRowEdited ? 'bg-blue-50/50' : ''}`}>
                      <td className="p-3 text-center text-xs text-slate-400">
                        {isRowEdited ? (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto" title="Row has unsaved changes" />
                        ) : (
                          rowIndex + 1
                        )}
                      </td>
                      {columns.map((col) => {
                        const key = `${record.id}-${col.name}`;
                        const isEdited = key in editedCells;
                        const isReadOnly = col.name === 'id' || col.name.includes('datetime');

                        return (
                          <td key={col.name} className="p-2">
                            {isReadOnly ? (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="truncate">{String(record[col.name] || '')}</span>
                                <Lock className="w-3 h-3 text-slate-300" />
                              </div>
                            ) : (
                              <div className="relative group">
                                <Input
                                  className={`h-8 text-sm transition-all ${
                                    isEdited
                                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50'
                                      : 'border-transparent hover:border-slate-200 focus:border-blue-500'
                                  }`}
                                  value={editedCells[key] ?? record[col.name] ?? ''}
                                  onChange={(e) => handleCellChange(record.id, col.name, e.target.value)}
                                />
                                {isEdited && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white" />
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Database className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-sm">No records found</p>
            <Button
              variant="link"
              onClick={handleResetFilters}
            >
              Clear filters and reload
            </Button>
          </div>
        )}

      </div>

      {/* Pagination - Located right below the data display area, aligned to the left */}
      {recordsData && (
        <div className="mt-4 flex items-center gap-6 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="h-8"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-slate-600">Page</span>
              <Input
                type="number"
                className="w-16 h-8 text-sm text-center"
                value={page}
                min={1}
                max={Math.ceil(recordsData.total / pageSize)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0 && val <= Math.ceil(recordsData.total / pageSize)) {
                    setPage(val);
                  }
                }}
              />
              <span className="text-sm text-slate-600">
                of {Math.ceil(recordsData.total / pageSize)}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= recordsData.total}
              onClick={() => setPage(page + 1)}
              className="h-8"
            >
              Next
            </Button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <div className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-900">{(page - 1) * pageSize + 1}</span> -{' '}
            <span className="font-semibold text-slate-900">{Math.min(page * pageSize, recordsData.total)}</span> of{' '}
            <span className="font-semibold text-slate-900">{recordsData.total.toLocaleString()}</span> records
          </div>
        </div>
      )}
    </div>
  );
}
