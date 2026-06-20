import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Thermometer, AlertTriangle, CheckCircle, Route, Filter, RotateCcw, User, Phone, ChevronRight, X, Maximize2, MapPin, Clock, Crosshair, MessageSquare, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '@/components/StatsCard';
import MapView from '@/components/MapView';
import TempChart from '@/components/TempChart';
import { Timeline, TimelineItem } from '@/components/Timeline';
import JurisdictionSelector from '@/components/JurisdictionSelector';
import RiskBadge from '@/components/RiskBadge';
import { useVehicleStore } from '@/store/vehicleStore';
import { useBatchStore } from '@/store/batchStore';
import { useExceptionStore } from '@/store/exceptionStore';
import { useJurisdictionStore } from '@/store/jurisdictionStore';
import { routes, carriers, vaccineTypes } from '@/mock/vehicles';
import { formatTemperature, getEventTypeText, getVehicleStatusText, getExceptionTypeText, formatRelativeTime, getExceptionStatusText, formatDateTime, getRelevantPointIdsForException } from '@/utils/format';
import type { TrackPoint, ExceptionEvent } from '@/types';

const MapOverview: React.FC = () => {
  const navigate = useNavigate();
  const {
    filters,
    selectedVehicleId,
    highlightTrackSegment,
    activeExceptionId,
    setFilters,
    resetFilters,
    setSelectedVehicle,
    setHighlightTrackSegment,
    setActiveExceptionId,
    getFilteredVehicles,
    getTrackPointsByVehicleId,
    getVehicleStats,
  } = useVehicleStore();

  const { getBatchesByVehicleId } = useBatchStore();
  const { exceptions, locateVehicleId, setLocateVehicleId } = useExceptionStore();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const { level: jurisdictionLevel, county: countyDistrict } = useJurisdictionStore();

  const stats = getVehicleStats();
  const filteredVehicles = getFilteredVehicles();
  const selectedVehicle = filteredVehicles.find((v) => v.id === selectedVehicleId);
  const trackPoints = selectedVehicle ? getTrackPointsByVehicleId(selectedVehicleId!) : [];
  const relatedBatches = selectedVehicle ? getBatchesByVehicleId(selectedVehicle.id, selectedVehicle.batchNumbers) : [];
  const activeException = activeExceptionId ? exceptions.find((e) => e.id === activeExceptionId) : null;

  const filteredTrackPoints = useMemo(() => {
    if (!activeException) return trackPoints;
    return trackPoints;
  }, [trackPoints, activeException]);

  const highlightPointIds = useMemo(() => {
    if (highlightTrackSegment && highlightTrackSegment.vehicleId === selectedVehicleId) {
      return highlightTrackSegment.pointIds;
    }
    if (activeException && selectedVehicle && activeException.vehicleId === selectedVehicleId) {
      return getRelevantPointIdsForException(activeException, trackPoints);
    }
    return [];
  }, [highlightTrackSegment, selectedVehicleId, activeException, trackPoints]);

  const mapEventPoints = useMemo(() => {
    if (!activeException) return trackPoints;
    return trackPoints.filter((p) => highlightPointIds.includes(p.id));
  }, [trackPoints, activeException, highlightPointIds]);

  const vehicleExceptions = selectedVehicle
    ? exceptions.filter((e) => e.vehicleId === selectedVehicle.id)
    : [];

  useEffect(() => {
    const { locateVehicleId, setLocateVehicleId } = useExceptionStore.getState();
    if (locateVehicleId) {
      setSelectedVehicle(locateVehicleId);
      const vehicle = useVehicleStore.getState().vehicles.find((v) => v.id === locateVehicleId);
      if (vehicle) {
        const tps = useVehicleStore.getState().trackPoints[locateVehicleId] || [];
        const recentEx = exceptions
          .filter((e) => e.vehicleId === locateVehicleId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (recentEx) {
          setActiveExceptionId(recentEx.id);
          const relevantIds = getRelevantPointIdsForException(recentEx, tps);
          setHighlightTrackSegment({ vehicleId: locateVehicleId, pointIds: relevantIds });
        }
      }
      setLocateVehicleId(null);
    }
  }, []);

  const jurisdictionLabel = jurisdictionLevel === 'city' ? '市级' : `县级·${countyDistrict || '未选择'}`;

  const timelineItems: TimelineItem[] = filteredTrackPoints.map((tp) => ({
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

  const handleClearActiveException = () => {
    setActiveExceptionId(null);
    setHighlightTrackSegment(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 -m-6 p-6">
      <JurisdictionSelector />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
        />
        <StatsCard
          title="今日配送"
          value={stats.todayDeliveries}
          subtitle="批次运输任务"
          icon={Route}
          color="yellow"
        />
      </div>

      <div className="dashboard-card p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm">筛选:</span>
        </div>
        <select
          className="select-field min-w-[140px] text-sm"
          value={filters.route}
          onChange={(e) => setFilters({ route: e.target.value })}
        >
          {routes.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[140px] text-sm"
          value={filters.carrier}
          onChange={(e) => setFilters({ carrier: e.target.value })}
        >
          {carriers.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="select-field min-w-[140px] text-sm"
          value={filters.vaccineType}
          onChange={(e) => setFilters({ vaccineType: e.target.value })}
        >
          {vaccineTypes.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
        <button className="btn-secondary ml-auto text-sm" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 min-h-[400px]">
          <MapView
            vehicles={filteredVehicles}
            selectedVehicleId={selectedVehicleId}
            trackPoints={activeException ? mapEventPoints : trackPoints}
            highlightPointIds={highlightPointIds}
            onVehicleClick={(id) => {
              setSelectedVehicle(id === selectedVehicleId ? null : id);
              setHighlightTrackSegment(null);
              setActiveExceptionId(null);
            }}
          />
        </div>

        <div className="w-80 flex flex-col gap-3 overflow-hidden">
          {activeException && selectedVehicle && (
            <div className="dashboard-card border-red-500/40 animate-slide-up flex flex-col overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-dashboard-border flex-shrink-0 bg-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-white">异常复盘 · {getExceptionTypeText(activeException.type)}</span>
                  </div>
                  <RiskBadge level={activeException.level} />
                </div>
                <div className="text-xs text-amber-300 mb-2 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3" />
                  地图仅显示本次异常相关路段
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-slate-300">{activeException.location || '未知位置'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-slate-300">{formatDateTime(activeException.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span className={`data-number font-medium ${
                      activeException.temperature && activeException.temperature > 8 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {activeException.temperature !== undefined ? formatTemperature(activeException.temperature) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className={
                      activeException.status === 'pending' ? 'text-red-400' :
                      activeException.status === 'handling' ? 'text-amber-400' :
                      'text-emerald-400'
                    }>
                      {getExceptionStatusText(activeException.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 border-b border-dashboard-border">
                <p className="text-xs text-slate-300 mb-2">{activeException.description}</p>
                {activeException.handleOpinion ? (
                  <div className="bg-dashboard-surface rounded p-2">
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3" />
                      最新处置意见 · {activeException.handler} · {formatDateTime(activeException.handleTime!)}
                    </div>
                    <div className="text-xs text-primary-300">{activeException.handleOpinion}</div>
                  </div>
                ) : (
                  <button
                    className="btn-primary w-full text-xs justify-center"
                    onClick={() => {
                      useExceptionStore.getState().setSelectedException(activeException.id);
                      navigate('/exception-handling');
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>去下发处置意见</span>
                  </button>
                )}
              </div>

              <div className="p-3 flex-shrink-0 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{selectedVehicle.plateNumber} · {selectedVehicle.driver}</span>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  onClick={handleClearActiveException}
                >
                  退出复盘模式 <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {selectedVehicle && (
            <div className="dashboard-card border-primary-500/30 animate-slide-up flex flex-col overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-dashboard-border flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className={`w-4 h-4 ${
                      selectedVehicle.currentTemp > 8 || selectedVehicle.currentTemp < 2 ? 'text-red-400' : 'text-emerald-400'
                    }`} />
                    <span className="text-sm font-semibold text-white">{selectedVehicle.plateNumber}</span>
                  </div>
                  <button
                    className="p-1 rounded hover:bg-dashboard-hover text-slate-500 hover:text-white transition-colors"
                    onClick={() => {
                      setSelectedVehicle(null);
                      setHighlightTrackSegment(null);
                      setActiveExceptionId(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span className={`data-number font-medium ${
                      selectedVehicle.currentTemp > 8 || selectedVehicle.currentTemp < 2 ? 'text-red-400' : 'text-emerald-400'
                    }`}>{formatTemperature(selectedVehicle.currentTemp)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-slate-300 truncate">{selectedVehicle.district}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-slate-300">{selectedVehicle.driver}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-slate-300">{selectedVehicle.phone}</span>
                  </div>
                </div>
                {vehicleExceptions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashboard-border">
                    <div className="text-xs text-amber-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      {vehicleExceptions.length} 条关联异常
                    </div>
                    {vehicleExceptions.slice(0, 2).map((ex) => (
                      <div
                        key={ex.id}
                        className={`text-xs flex items-center gap-1 mb-0.5 p-1 rounded cursor-pointer transition-colors ${
                          activeExceptionId === ex.id ? 'bg-primary-500/20 text-white' : 'text-slate-400 hover:bg-dashboard-hover'
                        }`}
                        onClick={() => {
                          setActiveExceptionId(ex.id === activeExceptionId ? null : ex.id);
                          const relevantIds = getRelevantPointIdsForException(ex, trackPoints);
                          setHighlightTrackSegment({ vehicleId: selectedVehicle.id, pointIds: relevantIds });
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          ex.level === 'high' ? 'bg-red-500' : ex.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="truncate">{getExceptionTypeText(ex.type)} - {formatRelativeTime(ex.timestamp)}</span>
                      </div>
                    ))}
                    <button
                      className="text-xs text-primary-400 hover:text-primary-300 mt-1 flex items-center gap-0.5"
                      onClick={() => navigate('/exception-handling')}
                    >
                      查看全部异常 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 overflow-auto">
                <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" />
                  {activeException ? '异常相关事件' : '轨迹与事件'}
                </div>
                {timelineItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {timelineItems
                      .filter((_, idx) => {
                        if (!activeException) return true;
                        return highlightPointIds.includes(trackPoints[idx]?.id || '');
                      })
                      .map((item, idx) => {
                        const tp = activeException
                          ? trackPoints.find((p) => p.id === highlightPointIds[idx])
                          : trackPoints[idx];
                        const isHighlighted = tp && highlightPointIds.includes(tp.id);
                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 p-1.5 rounded text-xs ${
                              isHighlighted
                                ? 'bg-red-500/10 border border-red-500/20'
                                : item.type !== 'normal' ? 'bg-amber-500/5 border border-amber-500/10' : ''
                            }`}
                          >
                            <span className="flex-shrink-0 mt-0.5">
                              {item.type === 'loading' ? '📦' :
                               item.type === 'unloading' ? '📤' :
                               item.type === 'stop' ? '🛑' :
                               item.type === 'door-open' ? '🚪' :
                               item.type === 'door-close' ? '🔒' : '🔵'}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{item.title}</span>
                                {item.temp !== undefined && (
                                  <span className={`data-number ${
                                    item.temp > 8 || item.temp < 2 ? 'text-red-400' : 'text-slate-400'
                                  }`}>
                                    {formatTemperature(item.temp)}
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 truncate">{item.description}</div>
                              <div className="text-slate-600 data-number">{item.time.split(' ')[1]}</div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">暂无轨迹数据</div>
                )}
              </div>

              <div className="p-3 border-t border-dashboard-border flex-shrink-0">
                <button
                  className="btn-primary w-full text-xs justify-center"
                  onClick={() => setShowDetailModal(true)}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>查看完整详情</span>
                </button>
              </div>
            </div>
          )}

          <div className="dashboard-card p-3 flex-1 overflow-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white">车辆列表</h3>
              <span className="text-xs text-slate-500">{filteredVehicles.length} 辆</span>
            </div>
            <div className="space-y-1.5">
              {filteredVehicles.map((v) => {
                const isAbnormal = v.currentTemp > 8 || v.currentTemp < 2;
                const isWarning = v.currentTemp > 6 && !isAbnormal;
                return (
                  <div
                    key={v.id}
                    className={`p-2 rounded border cursor-pointer transition-all duration-200 ${
                      selectedVehicleId === v.id
                        ? 'bg-primary-600/20 border-primary-500/50'
                        : 'bg-dashboard-surface border-dashboard-border hover:border-primary-500/30'
                    }`}
                    onClick={() => {
                      setSelectedVehicle(v.id);
                      setHighlightTrackSegment(null);
                      setActiveExceptionId(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Truck className={`w-3.5 h-3.5 ${isAbnormal ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span className="text-xs font-medium text-white">{v.plateNumber}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        isAbnormal ? 'bg-red-500/20 text-red-400' :
                        isWarning ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {formatTemperature(v.currentTemp)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-0.5">{v.route}</div>
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

      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div className="w-full max-w-5xl max-h-[90vh] bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">
                  {selectedVehicle.plateNumber} - 完整运输详情
                </h2>
              </div>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setShowDetailModal(false)}
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
                        <span className="text-slate-400">辖区</span>
                        <span className="text-slate-200">{selectedVehicle.district}</span>
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
