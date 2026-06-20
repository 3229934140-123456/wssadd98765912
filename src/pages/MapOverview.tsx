import React from 'react';
import { Truck, Thermometer, AlertTriangle, CheckCircle, Route, Filter, RotateCcw, User, Phone, ChevronRight, X } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import MapView from '@/components/MapView';
import TempChart from '@/components/TempChart';
import { Timeline, TimelineItem } from '@/components/Timeline';
import { useVehicleStore } from '@/store/vehicleStore';
import { useBatchStore } from '@/store/batchStore';
import { routes, carriers, vaccineTypes } from '@/mock/vehicles';
import { formatTemperature, getEventTypeText, getVehicleStatusText } from '@/utils/format';

const MapOverview: React.FC = () => {
  const {
    filters,
    selectedVehicleId,
    setFilters,
    resetFilters,
    setSelectedVehicle,
    getFilteredVehicles,
    getTrackPointsByVehicleId,
    getVehicleStats,
  } = useVehicleStore();

  const { getBatchesByVehicleId } = useBatchStore();

  const stats = getVehicleStats();
  const filteredVehicles = getFilteredVehicles();
  const selectedVehicle = filteredVehicles.find((v) => v.id === selectedVehicleId);
  const trackPoints = selectedVehicle ? getTrackPointsByVehicleId(selectedVehicleId!) : [];
  const relatedBatches = selectedVehicle ? getBatchesByVehicleId(selectedVehicle.id, selectedVehicle.batchNumbers) : [];

  const timelineItems: TimelineItem[] = trackPoints.map((tp) => ({
    type: tp.eventType,
    title: getEventTypeText(tp.eventType),
    time: tp.timestamp,
    description: tp.eventDesc,
    temp: tp.temp,
  }));

  const tempRecords = trackPoints.map((tp) => ({
    timestamp: tp.timestamp,
    temp: tp.temp,
  }));

  return (
    <div className="h-full flex flex-col gap-5 -m-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="在途车辆"
          value={stats.inTransit}
          subtitle={`共 ${stats.total} 辆登记车辆`}
          icon={Truck}
          color="blue"
        />
        <StatsCard
          title="温度正常"
          value={stats.normal}
          subtitle="车厢温度 2-8°C 区间"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="异常预警"
          value={stats.abnormal}
          subtitle="需立即关注"
          icon={AlertTriangle}
          color="red"
          trend={{ value: '较昨日+1', positive: false }}
        />
        <StatsCard
          title="今日配送"
          value={stats.todayDeliveries}
          subtitle="批次运输任务"
          icon={Route}
          color="yellow"
        />
      </div>

      <div className="dashboard-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选条件:</span>
        </div>
        <select
          className="select-field min-w-[160px]"
          value={filters.route}
          onChange={(e) => setFilters({ route: e.target.value })}
        >
          {routes.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[160px]"
          value={filters.carrier}
          onChange={(e) => setFilters({ carrier: e.target.value })}
        >
          {carriers.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[160px]"
          value={filters.vaccineType}
          onChange={(e) => setFilters({ vaccineType: e.target.value })}
        >
          {vaccineTypes.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <button className="btn-secondary ml-auto" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4" />
          <span>重置筛选</span>
        </button>
      </div>

      <div className="flex-1 flex gap-5 min-h-0">
        <div className="flex-1 min-h-[500px]">
          <MapView
            vehicles={filteredVehicles}
            selectedVehicleId={selectedVehicleId}
            trackPoints={trackPoints}
            onVehicleClick={(id) => setSelectedVehicle(id === selectedVehicleId ? null : id)}
          />
        </div>

        <div className="w-80 flex flex-col gap-4">
          <div className="dashboard-card p-4 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">车辆列表</h3>
              <span className="text-xs text-slate-500">{filteredVehicles.length} 辆</span>
            </div>
            <div className="space-y-2">
              {filteredVehicles.map((v) => {
                const isAbnormal = v.currentTemp > 8 || v.currentTemp < 2;
                const isWarning = v.currentTemp > 6 && !isAbnormal;
                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-md border cursor-pointer transition-all duration-200 ${
                      selectedVehicleId === v.id
                        ? 'bg-primary-600/20 border-primary-500/50'
                        : 'bg-dashboard-surface border-dashboard-border hover:border-primary-500/30'
                    }`}
                    onClick={() => setSelectedVehicle(v.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className={`w-4 h-4 ${isAbnormal ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span className="text-sm font-medium text-white">{v.plateNumber}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        isAbnormal ? 'bg-red-500/20 text-red-400' :
                        isWarning ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {formatTemperature(v.currentTemp)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">{v.route}</div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{getVehicleStatusText(v.status)}</span>
                      <span>ETA {v.eta.split(' ')[1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedVehicle(null)}>
          <div className="w-full max-w-5xl max-h-[90vh] bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">
                  {selectedVehicle.plateNumber} - 运输详情
                </h2>
              </div>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setSelectedVehicle(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-72px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="dashboard-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-primary-400" />
                      运输温度曲线
                    </h3>
                    {tempRecords.length > 0 ? (
                      <TempChart records={tempRecords} height={180} />
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">
                        暂无温度数据
                      </div>
                    )}
                  </div>

                  <div className="dashboard-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Route className="w-4 h-4 text-primary-400" />
                      运输轨迹与事件
                    </h3>
                    {timelineItems.length > 0 ? (
                      <div className="max-h-64 overflow-auto pr-2">
                        <Timeline items={timelineItems} />
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm">暂无轨迹数据</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="dashboard-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">车辆信息</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">承运公司</span>
                        <span className="text-slate-200">{selectedVehicle.carrier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">配送线路</span>
                        <span className="text-slate-200">{selectedVehicle.route}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">疫苗品类</span>
                        <span className="text-slate-200">{selectedVehicle.vaccineType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">运输状态</span>
                        <span className="text-slate-200">{getVehicleStatusText(selectedVehicle.status)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">当前温度</span>
                        <span className={`data-number font-semibold ${
                          selectedVehicle.currentTemp > 8 || selectedVehicle.currentTemp < 2 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {formatTemperature(selectedVehicle.currentTemp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">司机信息</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-dashboard-hover flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-white">{selectedVehicle.driver}</div>
                          <div className="text-xs text-slate-500">冷链运输司机</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{selectedVehicle.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-card p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">运载批次</h3>
                    <div className="space-y-2">
                      {relatedBatches.map((b) => (
                        <div
                          key={b.id}
                          className="p-2 rounded bg-dashboard-hover flex items-center justify-between text-sm cursor-pointer hover:bg-dashboard-border transition-colors"
                        >
                          <div>
                            <div className="text-white font-mono text-xs">{b.batchNumber}</div>
                            <div className="text-xs text-slate-500">{b.vaccineName} · {b.quantity}剂</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      ))}
                      {relatedBatches.length === 0 && (
                        <div className="text-xs text-slate-500">暂无批次信息</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapOverview;
