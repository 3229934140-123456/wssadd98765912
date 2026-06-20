import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Thermometer, AlertTriangle, CheckCircle, Route, Filter, RotateCcw, User, Phone, ChevronRight, X, Maximize2, MapPin, Clock, Crosshair, MessageSquare, Shield, Package, FileImage, Send, CheckCheck, FileText, Camera, Building2, Calendar, Warehouse } from 'lucide-react';
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
import { formatTemperature, getEventTypeText, getVehicleStatusText, getExceptionTypeText, formatRelativeTime, getExceptionStatusText, formatDateTime, getRelevantPointIdsForException, getBatchStatusText } from '@/utils/format';
import type { TrackPoint, ExceptionEvent, VaccineBatch } from '@/types';

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
    vehicles: allVehicles,
  } = useVehicleStore();

  const { getBatchesByVehicleId, getBatchesByBatchNumber, setSelectedBatch } = useBatchStore();
  const { exceptions, locateVehicleId, setLocateVehicleId, setSelectedException, addCarrierFeedback, resolveException } = useExceptionStore();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [resolveName, setResolveName] = useState('市级管理员');
  const [activeView, setActiveView] = useState<'summary' | 'timeline'>('summary');
  const [batchDetailOpen, setBatchDetailOpen] = useState(false);
  const [batchDetailBatch, setBatchDetailBatch] = useState<VaccineBatch | null>(null);
  const [batchDetailSourceExceptionId, setBatchDetailSourceExceptionId] = useState<string | null>(null);
  const { level: jurisdictionLevel, county: countyDistrict } = useJurisdictionStore();

  const stats = getVehicleStats();
  const filteredVehicles = getFilteredVehicles();
  const selectedVehicle = allVehicles.find((v) => v.id === selectedVehicleId);
  const trackPoints = selectedVehicle ? getTrackPointsByVehicleId(selectedVehicleId!) : [];
  const relatedBatches = selectedVehicle ? getBatchesByVehicleId(selectedVehicle.id, selectedVehicle.batchNumbers) : [];
  const activeException = activeExceptionId ? exceptions.find((e) => e.id === activeExceptionId) : null;

  const isReviewMode = !!activeException;

  const mapVehicles = useMemo(() => {
    if (isReviewMode && selectedVehicle) {
      return [selectedVehicle];
    }
    return filteredVehicles;
  }, [isReviewMode, selectedVehicle, filteredVehicles]);

  const highlightPointIds = useMemo(() => {
    if (highlightTrackSegment && highlightTrackSegment.vehicleId === selectedVehicleId) {
      return highlightTrackSegment.pointIds;
    }
    if (activeException && selectedVehicle && activeException.vehicleId === selectedVehicleId) {
      return getRelevantPointIdsForException(activeException, trackPoints);
    }
    return [];
  }, [highlightTrackSegment, selectedVehicleId, activeException, trackPoints]);

  const mapTrackPoints = useMemo(() => {
    if (!isReviewMode) return trackPoints;
    return trackPoints.filter((p) => highlightPointIds.includes(p.id));
  }, [trackPoints, isReviewMode, highlightPointIds]);

  const vehicleExceptions = selectedVehicle
    ? exceptions.filter((e) => e.vehicleId === selectedVehicle.id)
    : [];

  const reviewTimelineItems = useMemo(() => {
    if (!activeException) return [];
    const exTime = new Date(activeException.timestamp).getTime();
    const timeRange = 45 * 60 * 1000;
    const relevantTps = trackPoints.filter((tp) => {
      const tpTime = new Date(tp.timestamp).getTime();
      return Math.abs(tpTime - exTime) <= timeRange || highlightPointIds.includes(tp.id);
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const items: TimelineItem[] = relevantTps.map((tp) => ({
      type: tp.eventType,
      title: getEventTypeText(tp.eventType),
      time: tp.timestamp,
      description: tp.eventDesc,
      temp: tp.temp,
    }));

    if (activeException.handleOpinion) {
      items.push({
        type: 'station',
        title: `监管员 ${activeException.handler} 下发处置意见`,
        time: activeException.handleTime || '',
        description: activeException.handleOpinion,
      });
    }

    if (activeException.carrierFeedback) {
      items.push({
        type: 'station',
        title: `承运方回填执行结果`,
        time: activeException.carrierFeedbackTime || '',
        description: activeException.carrierFeedback,
      });
    }

    if (activeException.status === 'resolved') {
      items.push({
        type: 'warehouse',
        title: `${activeException.resolver || '监管员'} 闭环确认`,
        time: activeException.resolveTime || '',
        description: '该异常已完成闭环处理',
      });
    }

    return items;
  }, [activeException, trackPoints, highlightPointIds]);

  const reviewTempRecords = useMemo(() => {
    if (!activeException) return [];
    const exTime = new Date(activeException.timestamp).getTime();
    const timeRange = 45 * 60 * 1000;
    return trackPoints
      .filter((tp) => {
        const tpTime = new Date(tp.timestamp).getTime();
        return Math.abs(tpTime - exTime) <= timeRange || highlightPointIds.includes(tp.id);
      })
      .map((tp) => ({ timestamp: tp.timestamp, temp: tp.temp }));
  }, [activeException, trackPoints, highlightPointIds]);

  useEffect(() => {
    const { locateExceptionId, setLocateExceptionId } = (useExceptionStore.getState() as any);
    if (locateExceptionId) {
      const ex = exceptions.find((e) => e.id === locateExceptionId) || useExceptionStore.getState().exceptions.find((e) => e.id === locateExceptionId);
      if (ex) {
        setSelectedVehicle(ex.vehicleId);
        setActiveExceptionId(ex.id);
        const tps = useVehicleStore.getState().trackPoints[ex.vehicleId] || [];
        const relevantIds = getRelevantPointIdsForException(ex, tps);
        setHighlightTrackSegment({ vehicleId: ex.vehicleId, pointIds: relevantIds });
        (useExceptionStore.getState() as any).setLocateExceptionId?.(null);
      }
    }

    const state = useExceptionStore.getState();
    if ((state as any).locateVehicleId) {
      const lid = (state as any).locateVehicleId;
      setSelectedVehicle(lid);
      const currentActiveExId = useVehicleStore.getState().activeExceptionId;
      if (currentActiveExId) {
        const ex = useExceptionStore.getState().exceptions.find((e) => e.id === currentActiveExId);
        if (ex) {
          setActiveExceptionId(ex.id);
          const tps = useVehicleStore.getState().trackPoints[lid] || [];
          const relevantIds = getRelevantPointIdsForException(ex, tps);
          setHighlightTrackSegment({ vehicleId: lid, pointIds: relevantIds });
        }
      } else {
        const vehicle = useVehicleStore.getState().vehicles.find((v) => v.id === lid);
        if (vehicle) {
          const tps = useVehicleStore.getState().trackPoints[lid] || [];
          const recentEx = useExceptionStore.getState().exceptions
            .filter((e) => e.vehicleId === lid)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          if (recentEx) {
            setActiveExceptionId(recentEx.id);
            const relevantIds = getRelevantPointIdsForException(recentEx, tps);
            setHighlightTrackSegment({ vehicleId: lid, pointIds: relevantIds });
          }
        }
      }
      useExceptionStore.setState({ locateVehicleId: null });
    }
  }, []);

  const jurisdictionLabel = jurisdictionLevel === 'city' ? '市级' : `县级·${countyDistrict || '未选择'}`;

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

  const handleClearActiveException = () => {
    setActiveExceptionId(null);
    setHighlightTrackSegment(null);
    setActiveView('summary');
  };

  const handleFeedbackSubmit = () => {
    if (!activeException || !feedbackText.trim()) return;
    addCarrierFeedback(activeException.id, feedbackText.trim());
    setFeedbackText('');
    setFeedbackModalOpen(false);
  };

  const handleResolveSubmit = () => {
    if (!activeException) return;
    resolveException(activeException.id, resolveName || '监管员');
    setResolveModalOpen(false);
  };

  const handleJumpToBatch = (batchNumber: string) => {
    const batch = getBatchesByBatchNumber(batchNumber);
    if (batch) {
      setBatchDetailBatch(batch);
      setBatchDetailSourceExceptionId(activeExceptionId);
      setBatchDetailOpen(true);
    }
  };

  const handleCloseBatchDetail = () => {
    setBatchDetailOpen(false);
    setTimeout(() => {
      setBatchDetailBatch(null);
      setBatchDetailSourceExceptionId(null);
    }, 300);
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
        {isReviewMode && (
          <div className="ml-2 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-1.5 animate-pulse">
            <Shield className="w-3.5 h-3.5" />
            复盘模式 · 地图仅显示{activeException && `${getExceptionTypeText(activeException.type)}相关路段`}
          </div>
        )}
        <button className="btn-secondary ml-auto text-sm" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 min-h-[400px]">
          <MapView
            vehicles={mapVehicles}
            selectedVehicleId={selectedVehicleId}
            trackPoints={mapTrackPoints}
            highlightPointIds={highlightPointIds}
            onVehicleClick={(id) => {
              setSelectedVehicle(id === selectedVehicleId ? null : id);
              setHighlightTrackSegment(null);
              setActiveExceptionId(null);
              setActiveView('summary');
            }}
          />
        </div>

        <div className="w-80 flex flex-col gap-3 overflow-hidden">
          {isReviewMode && selectedVehicle && activeException && (
            <div className="dashboard-card border-red-500/40 animate-slide-up flex flex-col overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-dashboard-border flex-shrink-0 bg-red-500/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-white">异常复盘 · {getExceptionTypeText(activeException.type)}</span>
                  </div>
                  <RiskBadge level={activeException.level} />
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

              <div className="flex border-b border-dashboard-border">
                <button
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    activeView === 'summary'
                      ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-dashboard-hover'
                  }`}
                  onClick={() => setActiveView('summary')}
                >
                  闭环摘要
                </button>
                <button
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    activeView === 'timeline'
                      ? 'text-primary-400 border-b-2 border-primary-400 bg-primary-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-dashboard-hover'
                  }`}
                  onClick={() => setActiveView('timeline')}
                >
                  时间轴
                </button>
              </div>

              {activeView === 'summary' && (
                <div className="p-3 space-y-3 overflow-auto flex-1">
                  <div>
                    <div className="text-xs text-slate-500 mb-1.5">异常描述</div>
                    <p className="text-xs text-slate-300">{activeException.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-500">处置闭环进度</div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        activeException.handleOpinion ? 'bg-primary-500/20 text-primary-300' : 'bg-dashboard-surface text-slate-500'
                      }`}>
                        {activeException.handleOpinion ? <CheckCheck className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                        下发意见
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        activeException.carrierFeedback ? 'bg-primary-500/20 text-primary-300' : 'bg-dashboard-surface text-slate-500'
                      }`}>
                        {activeException.carrierFeedback ? <CheckCheck className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        承运反馈
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        activeException.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-dashboard-surface text-slate-500'
                      }`}>
                        {activeException.status === 'resolved' ? <CheckCheck className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        闭环确认
                      </div>
                    </div>
                  </div>

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
                        setSelectedException(activeException.id);
                        navigate('/exception-handling');
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>去下发处置意见</span>
                    </button>
                  )}

                  {activeException.handleOpinion && !activeException.carrierFeedback && (
                    <button
                      className="btn-secondary w-full text-xs justify-center"
                      onClick={() => setFeedbackModalOpen(true)}
                    >
                      <FileImage className="w-3.5 h-3.5" />
                      <span>承运方回填执行结果</span>
                    </button>
                  )}

                  {activeException.carrierFeedback && (
                    <div className="bg-dashboard-surface rounded p-2">
                      <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                        <FileImage className="w-3 h-3" />
                        承运方反馈 · {formatDateTime(activeException.carrierFeedbackTime!)}
                      </div>
                      <div className="text-xs text-slate-300 mb-2">{activeException.carrierFeedback}</div>
                      <div className="flex gap-1.5">
                        <div className="w-12 h-12 rounded bg-dashboard-card border border-dashed border-dashboard-border flex items-center justify-center text-slate-600 text-[10px]">
                          📷 现场照片
                        </div>
                        <div className="w-12 h-12 rounded bg-dashboard-card border border-dashed border-dashboard-border flex items-center justify-center text-slate-600 text-[10px]">
                          📷 现场照片
                        </div>
                      </div>
                    </div>
                  )}

                  {activeException.handleOpinion && activeException.status !== 'resolved' && (
                    <button
                      className="btn-success w-full text-xs justify-center"
                      onClick={() => setResolveModalOpen(true)}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>标记异常已闭环</span>
                    </button>
                  )}

                  {activeException.status === 'resolved' && (
                    <div className="bg-emerald-500/10 rounded p-2 border border-emerald-500/20">
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        已于 {formatDateTime(activeException.resolveTime!)} 由 {activeException.resolver} 完成闭环
                      </div>
                    </div>
                  )}

                  {relatedBatches.length > 0 && (
                    <div className="pt-2 border-t border-dashboard-border">
                      <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5" />
                        关联疫苗批次（{relatedBatches.length}）
                      </div>
                      <div className="space-y-1.5">
                        {relatedBatches.map((b) => (
                          <div
                            key={b.id}
                            className="p-2 rounded bg-dashboard-surface hover:bg-dashboard-hover cursor-pointer transition-colors"
                            onClick={() => handleJumpToBatch(b.batchNumber)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-white">{b.batchNumber}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500" />
                            </div>
                            <div className="text-xs text-slate-500">{b.vaccineName} · {b.quantity}剂</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reviewTempRecords.length > 1 && (
                    <div className="pt-2 border-t border-dashboard-border">
                      <div className="text-xs text-slate-500 mb-2">异常前后温度曲线</div>
                      <TempChart records={reviewTempRecords} height={100} compact />
                    </div>
                  )}
                </div>
              )}

              {activeView === 'timeline' && (
                <div className="p-3 overflow-auto flex-1">
                  {reviewTimelineItems.length > 0 ? (
                    <div className="pl-2">
                      <Timeline items={reviewTimelineItems} compact />
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">
                      暂无复盘数据
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 border-t border-dashboard-border flex-shrink-0 flex items-center justify-between">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{selectedVehicle.plateNumber} · {selectedVehicle.driver}</span>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  onClick={handleClearActiveException}
                >
                  退出复盘 <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {selectedVehicle && (
            <div className={`dashboard-card border-primary-500/30 animate-slide-up flex flex-col overflow-hidden ${isReviewMode ? '' : 'flex-shrink-0'}`}>
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
                {!isReviewMode && vehicleExceptions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashboard-border">
                    <div className="text-xs text-amber-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      {vehicleExceptions.length} 条关联异常（点击复盘）
                    </div>
                    {vehicleExceptions.map((ex) => (
                      <div
                        key={ex.id}
                        className={`text-xs flex items-center gap-1 mb-0.5 p-1 rounded cursor-pointer transition-colors ${
                          activeExceptionId === ex.id ? 'bg-primary-500/20 text-white' : 'text-slate-400 hover:bg-dashboard-hover'
                        }`}
                        onClick={() => {
                          const newExId = ex.id === activeExceptionId ? null : ex.id;
                          setActiveExceptionId(newExId);
                          if (newExId) {
                            const relevantIds = getRelevantPointIdsForException(ex, trackPoints);
                            setHighlightTrackSegment({ vehicleId: selectedVehicle.id, pointIds: relevantIds });
                            setActiveView('summary');
                          } else {
                            setHighlightTrackSegment(null);
                          }
                        }}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          ex.level === 'high' ? 'bg-red-500 animate-pulse' : ex.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="truncate flex-1">{getExceptionTypeText(ex.type)}</span>
                        <span className="flex-shrink-0">{formatRelativeTime(ex.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 flex-1 overflow-auto">
                <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5" />
                  轨迹与事件
                </div>
                {timelineItems.length > 0 ? (
                  <div className="space-y-1.5">
                    {timelineItems.map((item, idx) => {
                      const tp = trackPoints[idx];
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
                      setActiveView('summary');
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
                          onClick={() => handleJumpToBatch(b.batchNumber)}
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

      {feedbackModalOpen && activeException && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setFeedbackModalOpen(false)}>
          <div className="w-full max-w-lg bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-border">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-primary-400" />
                承运方回填执行结果
              </h2>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setFeedbackModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm text-slate-300 mb-2">执行结果描述</div>
                <textarea
                  className="input-field w-full h-32 resize-none text-sm"
                  placeholder="请描述问题处理过程、温度复测结果、现场情况等..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm text-slate-300 mb-2">上传现场照片（占位）</div>
                <div className="flex gap-2">
                  <div className="w-20 h-20 rounded bg-dashboard-card border border-dashed border-dashboard-border flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:border-primary-500/50 hover:text-primary-400 transition-colors">
                    <FileImage className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">添加照片</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-secondary" onClick={() => setFeedbackModalOpen(false)}>取消</button>
                <button
                  className="btn-primary"
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span>提交反馈</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resolveModalOpen && activeException && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setResolveModalOpen(false)}>
          <div className="w-full max-w-md bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-border">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                标记异常已闭环
              </h2>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setResolveModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 text-sm text-emerald-300">
                确认此异常已完成处置闭环，处置意见已执行，承运方已反馈，疫苗安全风险已排除。
              </div>
              <div>
                <div className="text-sm text-slate-300 mb-2">闭环确认人</div>
                <input
                  className="input-field w-full"
                  value={resolveName}
                  onChange={(e) => setResolveName(e.target.value)}
                  placeholder="请输入您的姓名"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn-secondary" onClick={() => setResolveModalOpen(false)}>取消</button>
                <button className="btn-success" onClick={handleResolveSubmit}>
                  <CheckCircle className="w-4 h-4" />
                  <span>确认闭环</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {batchDetailOpen && batchDetailBatch && (
        <BatchDetailInReview
          batch={batchDetailBatch}
          sourceExceptionId={batchDetailSourceExceptionId}
          onClose={handleCloseBatchDetail}
          exceptions={exceptions}
          vehicles={allVehicles}
        />
      )}
    </div>
  );
};

const BatchDetailInReview: React.FC<{
  batch: VaccineBatch;
  sourceExceptionId: string | null;
  onClose: () => void;
  exceptions: ExceptionEvent[];
  vehicles: any[];
}> = ({ batch, sourceExceptionId, onClose, exceptions, vehicles }) => {
  const relatedExceptions = exceptions.filter((e) => {
    const vehicle = vehicles.find((v: any) => v.id === e.vehicleId);
    return vehicle && vehicle.batchNumbers.includes(batch.batchNumber);
  });
  const relatedVehicles = vehicles.filter((v: any) => v.batchNumbers.includes(batch.batchNumber));
  const sourceException = sourceExceptionId ? exceptions.find((e) => e.id === sourceExceptionId) : null;

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
    <div className="fixed inset-0 z-[55] flex animate-fade-in" onClick={onClose}>
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
              <p className="text-xs text-slate-400">{batch.vaccineName} · 倒查视图</p>
            </div>
            {sourceException && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ml-2 bg-red-500/10 border border-red-500/20 text-red-300">
                <Shield className="w-3 h-3" />
                来自: {getExceptionTypeText(sourceException.type)} - {sourceException.plateNumber}
              </span>
            )}
          </div>
          <button
            className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Building2 className="w-3.5 h-3.5" />
                生产厂家
              </div>
              <div className="text-sm text-white">{batch.manufacturer}</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Package className="w-3.5 h-3.5" />
                批次数量
              </div>
              <div className="text-sm text-white data-number">{batch.quantity.toLocaleString()} 剂</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                生产日期
              </div>
              <div className="text-sm text-white data-number">{batch.productionDate}</div>
            </div>
            <div className="dashboard-card p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                <Calendar className="w-3.5 h-3.5" />
                有效期至
              </div>
              <div className="text-sm text-white data-number">{batch.expiryDate}</div>
            </div>
          </div>

          {relatedExceptions.length > 0 && (
            <div className="dashboard-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" />
                关联异常事件
                <span className="text-xs text-slate-500 font-normal">({relatedExceptions.length})</span>
              </h3>
              <div className="space-y-3">
                {relatedExceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className={`p-3 rounded bg-dashboard-surface border ${
                      ex.id === sourceExceptionId ? 'border-red-500/50 bg-red-500/5' : 'border-dashboard-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          ex.level === 'high' ? 'bg-red-500' : ex.level === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm text-white font-medium">{getExceptionTypeText(ex.type)}</span>
                        <RiskBadge level={ex.level} size="sm" />
                        {ex.id === sourceExceptionId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">来源异常</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        ex.status === 'pending' ? 'bg-red-500/20 text-red-400' :
                        ex.status === 'handling' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {getExceptionStatusText(ex.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{ex.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{ex.plateNumber}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(ex.timestamp)}</span>
                      {ex.temperature !== undefined && (
                        <span className={`data-number ${ex.temperature > 8 ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatTemperature(ex.temperature)}
                        </span>
                      )}
                    </div>
                    {ex.handleOpinion && (
                      <div className="mt-2 pt-2 border-t border-dashboard-border">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <User className="w-3 h-3" />
                          <span>处置意见 · {ex.handler} · {formatDateTime(ex.handleTime!)}</span>
                        </div>
                        <div className="text-xs text-primary-300 bg-primary-500/10 p-2 rounded">{ex.handleOpinion}</div>
                      </div>
                    )}
                    {ex.carrierFeedback && (
                      <div className="mt-2 pt-2 border-t border-dashboard-border">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                          <FileText className="w-3 h-3" />
                          <span>承运方执行结果 · {formatDateTime(ex.carrierFeedbackTime!)}</span>
                        </div>
                        <div className="text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded mb-2">{ex.carrierFeedback}</div>
                        {(ex.carrierPhotos?.length || 0) > 0 ? (
                          <div className="flex gap-1.5">
                            {ex.carrierPhotos?.map((_, i) => (
                              <div key={i} className="w-12 h-12 rounded bg-dashboard-hover border border-dashboard-border flex items-center justify-center">
                                <Camera className="w-5 h-5 text-slate-500" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 flex items-center gap-1"><Camera className="w-3 h-3" />暂未上传现场照片</div>
                        )}
                      </div>
                    )}
                    {ex.status === 'resolved' && ex.resolver && (
                      <div className="mt-2 pt-2 border-t border-dashboard-border">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          闭环确认: {ex.resolver} · {formatDateTime(ex.resolveTime!)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                <span>该批次存在温度异常记录，部分时段温度超出 2-8°C 安全范围。</span>
              </div>
            )}
          </div>

          <div className="dashboard-card p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary-400" />
              全链路追溯
            </h3>
            <div className="pl-2">
              <Timeline items={timelineItems} compact />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-dashboard-border flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500">
            <Warehouse className="w-3.5 h-3.5 inline mr-1" />
            起始仓: {batch.warehouse}
          </div>
          <button className="btn-secondary" onClick={onClose}>
            返回地图复盘
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapOverview;
