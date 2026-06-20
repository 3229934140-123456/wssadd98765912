import React, { useState } from 'react';
import { FileBarChart, Search, RotateCcw, Package, Building2, Calendar, Thermometer, User, Truck, X, ChevronRight, Warehouse, MapPin, AlertTriangle } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import TempChart from '@/components/TempChart';
import { Timeline, TimelineItem } from '@/components/Timeline';
import { useBatchStore } from '@/store/batchStore';
import { vaccineNames, batchStatusOptions } from '@/mock/batches';
import { getBatchStatusText } from '@/utils/format';
import type { VaccineBatch } from '@/types';

const BatchArchives: React.FC = () => {
  const { filters, setFilters, resetFilters, getFilteredBatches, selectedBatchId, setSelectedBatch, getBatchById } = useBatchStore();
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const batches = getFilteredBatches();
  const selectedBatch = selectedBatchId ? getBatchById(selectedBatchId) : null;

  const normalCount = batches.filter((b) => b.status === 'normal').length;
  const warningCount = batches.filter((b) => b.status === 'warning').length;

  const handleOpenDetail = (batch: VaccineBatch) => {
    setSelectedBatch(batch.id);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedBatch(null), 300);
  };

  return (
    <div className="h-full flex flex-col gap-5 -m-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="批次总数"
          value={batches.length}
          subtitle="在库/在途批次"
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="正常批次"
          value={normalCount}
          subtitle="温度全程合规"
          icon={Building2}
          color="green"
        />
        <StatsCard
          title="预警批次"
          value={warningCount}
          subtitle="温度异常待评估"
          icon={AlertTriangle}
          color="yellow"
        />
        <StatsCard
          title="召回批次"
          value={0}
          subtitle="本月无召回"
          icon={FileBarChart}
          color="red"
        />
      </div>

      <div className="dashboard-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Search className="w-4 h-4" />
          <span className="text-sm">搜索筛选:</span>
        </div>
        <div className="relative">
          <input
            type="text"
            className="input-field w-64 pl-9"
            placeholder="输入批号/疫苗名称/厂家..."
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <select
          className="select-field min-w-[160px]"
          value={filters.vaccineName}
          onChange={(e) => setFilters({ vaccineName: e.target.value })}
        >
          {vaccineNames.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[140px]"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
        >
          {batchStatusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="btn-secondary ml-auto" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
      </div>

      <div className="dashboard-card flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-dashboard-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">批次档案列表</h3>
          <span className="text-xs text-slate-500">共 {batches.length} 条记录</span>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-dashboard-surface text-left text-xs text-slate-400 sticky top-0">
                <th className="px-4 py-3 font-medium">批号</th>
                <th className="px-4 py-3 font-medium">疫苗名称</th>
                <th className="px-4 py-3 font-medium">生产厂家</th>
                <th className="px-4 py-3 font-medium">数量</th>
                <th className="px-4 py-3 font-medium">生产日期</th>
                <th className="px-4 py-3 font-medium">有效期</th>
                <th className="px-4 py-3 font-medium">起始仓库</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {batches.map((batch, idx) => (
                <tr
                  key={batch.id}
                  className="hover:bg-dashboard-hover transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => handleOpenDetail(batch)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-white">{batch.batchNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{batch.vaccineName}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{batch.manufacturer}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 data-number">{batch.quantity.toLocaleString()} 剂</td>
                  <td className="px-4 py-3 text-sm text-slate-400 data-number">{batch.productionDate}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 data-number">{batch.expiryDate}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{batch.warehouse}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs ${
                      batch.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                      batch.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <span className={`status-dot ${
                        batch.status === 'normal' ? 'bg-emerald-500' :
                        batch.status === 'warning' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`} />
                      {getBatchStatusText(batch.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 ml-auto">
                      <span>查看详情</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                    <FileBarChart className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <div>未找到匹配的批次记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailOpen && selectedBatch && (
        <BatchDetailDrawer batch={selectedBatch} onClose={handleCloseDetail} />
      )}
    </div>
  );
};

const BatchDetailDrawer: React.FC<{ batch: VaccineBatch; onClose: () => void }> = ({ batch, onClose }) => {
  const timelineItems: TimelineItem[] = batch.transportChain.map((node) => ({
    type: node.type,
    title: node.name,
    time: node.time,
    description: node.description,
    person: node.person,
  }));

  const hasAnomaly = batch.temperatureRecords.some((r) => r.temp > 8 || r.temp < 2);
  const avgTemp = batch.temperatureRecords.reduce((sum, r) => sum + r.temp, 0) / (batch.temperatureRecords.length || 1);
  const maxTemp = Math.max(...batch.temperatureRecords.map((r) => r.temp));
  const minTemp = Math.min(...batch.temperatureRecords.map((r) => r.temp));

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="ml-auto w-full max-w-3xl h-full bg-dashboard-surface border-l border-dashboard-border overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white font-mono">{batch.batchNumber}</h2>
              <p className="text-xs text-slate-400">{batch.vaccineName}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ml-2 ${
              batch.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
              batch.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {hasAnomaly && batch.status === 'normal' && <AlertTriangle className="w-3 h-3" />}
              {getBatchStatusText(batch.status)}
            </span>
          </div>
          <button
            className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="dashboard-card p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Building2 className="w-3.5 h-3.5" />
                生产厂家
              </div>
              <div className="text-sm text-white">{batch.manufacturer}</div>
            </div>
            <div className="dashboard-card p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Package className="w-3.5 h-3.5" />
                批次数量
              </div>
              <div className="text-sm text-white data-number">{batch.quantity.toLocaleString()} 剂</div>
            </div>
            <div className="dashboard-card p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Calendar className="w-3.5 h-3.5" />
                生产日期
              </div>
              <div className="text-sm text-white data-number">{batch.productionDate}</div>
            </div>
            <div className="dashboard-card p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Calendar className="w-3.5 h-3.5" />
                有效期至
              </div>
              <div className="text-sm text-white data-number">{batch.expiryDate}</div>
            </div>
          </div>

          <div className="dashboard-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary-400" />
                温度监控记录
              </h3>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">平均:</span>
                  <span className={`data-number ${avgTemp > 8 || avgTemp < 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {avgTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">最高:</span>
                  <span className={`data-number ${maxTemp > 8 ? 'text-red-400' : 'text-slate-200'}`}>
                    {maxTemp.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">最低:</span>
                  <span className={`data-number ${minTemp < 2 ? 'text-red-400' : 'text-slate-200'}`}>
                    {minTemp.toFixed(1)}°C
                  </span>
                </div>
              </div>
            </div>
            <TempChart records={batch.temperatureRecords} height={200} />
            {hasAnomaly && (
              <div className="mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  该批次存在温度异常记录，部分时段温度超出 2-8°C 安全范围，请结合运输记录评估疫苗有效性并决定是否召回。
                </span>
              </div>
            )}
          </div>

          <div className="dashboard-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-400" />
              全链路追溯
            </h3>
            <div className="pl-2">
              <Timeline items={timelineItems} />
            </div>
          </div>

          <div className="dashboard-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-400" />
              责任人员汇总
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {batch.transportChain.map((node, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded bg-dashboard-surface">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    node.type === 'warehouse' ? 'bg-blue-500/20 text-blue-400' :
                    node.type === 'vehicle' ? 'bg-primary-500/20 text-primary-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {node.type === 'warehouse' ? <Warehouse className="w-4 h-4" /> :
                     node.type === 'vehicle' ? <Truck className="w-4 h-4" /> :
                     <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-white truncate">{node.person}</div>
                    <div className="text-xs text-slate-500 truncate">{node.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dashboard-border flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            <Warehouse className="w-3.5 h-3.5 inline mr-1" />
            起始仓: {batch.warehouse}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>关闭</button>
            <button className="btn-warning">
              <AlertTriangle className="w-4 h-4" />
              标记预警
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchArchives;
