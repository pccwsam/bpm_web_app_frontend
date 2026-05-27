import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Download,
  PieChart,
  Filter,
  ArrowUpRight,
  Calendar,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { commissionApi } from '@/services/commissionService';

export default function MonthlyCommissionSummary() {
  const [selectedPeriod] = useState('2024-01');

  const { data: summary } = useQuery({
    queryKey: ['commission-summary', selectedPeriod],
    queryFn: () => commissionApi.getSummary(selectedPeriod),
  });

  const metrics = [
    {
      label: 'NS Commission',
      value: summary?.ns_commission || 0,
      change: summary?.ns_change_percent || 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'BR Commission',
      value: summary?.br_commission || 0,
      change: summary?.br_change_percent || 0,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Total Commission',
      value: summary?.total_commission || 0,
      change: summary?.total_change_percent || 0,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  const channelBreakdown = summary?.channel_breakdown || [
    { channel: 'CSA', commission: 12500, bonus: 2000, incentive: 1500, project: 800, yearEnd: 0 },
    { channel: 'CSB', commission: 10200, bonus: 1500, incentive: 1200, project: 450, yearEnd: 0 },
    { channel: 'CSC', commission: 8900, bonus: 1100, incentive: 900, project: 1200, yearEnd: 5000 },
    { channel: 'SB', commission: 6450, bonus: 800, incentive: 400, project: 300, yearEnd: 0 },
    { channel: 'ET', commission: 4800, bonus: 500, incentive: 200, project: 150, yearEnd: 2500 },
  ];

  const calculateTotal = (row: any) =>
    row.commission + row.bonus + row.incentive + row.project + row.yearEnd;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <PieChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Monthly Commission Summary</h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Financial Period: {selectedPeriod}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-3.5 h-3.5 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Download className="w-3.5 h-3.5 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {metrics.map((metric, i) => (
          <Card key={i} className="border-none shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className={`h-1 w-full ${metric.color.replace('text', 'bg')}`} />
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <div className={`${metric.bg} p-2 rounded-lg`}>
                    <DollarSign className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <h3 className="text-2xl font-black text-slate-900">
                    {formatCurrency(metric.value)}
                  </h3>
                  {metric.change !== null && metric.change !== undefined && (
                    <span
                      className={`flex items-center text-xs font-bold ${
                        metric.change >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                      } px-1.5 py-0.5 rounded`}
                    >
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      {metric.change >= 0 ? '+' : ''}
                      {metric.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel Breakdown Table */}
      <Card className="flex-1 overflow-hidden border border-slate-200 shadow-xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-800">Channel Breakdown Detail</h2>
          </div>
          <Badge variant="outline" className="text-xs font-mono bg-slate-50">
            CURRENCY: USD
          </Badge>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase border-r border-slate-200">
                  Channel
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Commission
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Bonus
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Incentive
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Project Comm.
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Year-End Bonus
                </th>
                <th className="p-4 text-right text-xs font-bold text-slate-900 uppercase bg-slate-100/50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {channelBreakdown.map((row) => (
                <tr key={row.channel} className="hover:bg-blue-50/30">
                  <td className="p-4 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-600">
                        {row.channel}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{row.channel} Segment</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right font-mono">
                    {formatCurrency(row.commission)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right font-mono">
                    {formatCurrency(row.bonus)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right font-mono">
                    {formatCurrency(row.incentive)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right font-mono">
                    {formatCurrency(row.project)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right font-mono">
                    {formatCurrency(row.yearEnd)}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-900 text-right bg-slate-50/50 font-mono">
                    {formatCurrency(calculateTotal(row))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold">
              <tr>
                <td className="p-4 text-xs uppercase tracking-widest border-r border-slate-700">
                  Grand Total
                </td>
                <td className="p-4 text-right text-sm font-mono">
                  {formatCurrency(channelBreakdown.reduce((acc, r) => acc + r.commission, 0))}
                </td>
                <td className="p-4 text-right text-sm font-mono">
                  {formatCurrency(channelBreakdown.reduce((acc, r) => acc + r.bonus, 0))}
                </td>
                <td className="p-4 text-right text-sm font-mono">
                  {formatCurrency(channelBreakdown.reduce((acc, r) => acc + r.incentive, 0))}
                </td>
                <td className="p-4 text-right text-sm font-mono">
                  {formatCurrency(channelBreakdown.reduce((acc, r) => acc + r.project, 0))}
                </td>
                <td className="p-4 text-right text-sm font-mono">
                  {formatCurrency(channelBreakdown.reduce((acc, r) => acc + r.yearEnd, 0))}
                </td>
                <td className="p-4 text-right text-base font-mono bg-emerald-600">
                  {formatCurrency(
                    channelBreakdown.reduce((acc, r) => acc + calculateTotal(r), 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Bottom Note */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mt-6">
        <Info className="w-5 h-5 text-amber-600" />
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>Note:</strong> Year-end bonuses are only calculated for the <strong>CSC</strong> and{' '}
          <strong>ET</strong> channels during this period.
        </p>
      </div>
    </div>
  );
}
