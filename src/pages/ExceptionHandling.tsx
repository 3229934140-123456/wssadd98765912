import React, { useState } from 'react';
import { AlertTriangle, Thermometer, MapPin, Clock, User, Send, CheckCircle, AlertCircle, Navigation, DoorOpen, PauseCircle, X, MessageSquare, Crosshair, FileText, Camera, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '@/components/StatsCard';
import RiskBadge from '@/components/RiskBadge';
import JurisdictionSelector from '@/components/JurisdictionSelector';
import { useExceptionStore } from '@/store/exceptionStore';
import { useVehicleStore } from '@/store/vehicleStore';
import type { ExceptionEvent, RiskLevel } from '@/types';
import { formatTemperature, formatRelativeTime, formatDateTime, getExceptionTypeText, getExceptionStatusText, getRelevantPointIdsForException } from '@/utils/format';

const typeIcons: Record<string, any> = {
  'over-temperature': Thermometer,
  'long-stop': PauseCircle,
  'route-deviation': Navigation,
  'door-open': DoorOpen,
};

const handleOptions = [
  { value: '立即复测温度', label: '立即复测温度', type: 'warning' },
  { value: '就近回仓', label: '就近回仓', type: 'danger' },
  { value: '继续观察', label: '继续观察', type: 'success' },
  { value: '联系司机确认', label: '联系司机确认', type: 'primary' },
];

type FeedbackModal = null | 'carrier' | 'resolve';

const ExceptionHandling: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeLevel,
    setActiveLevel,
    getExceptionsByLevel,
    handleException,
    addCarrierFeedback,
    resolveException,
    getStats,
    selectedExceptionId,
    setSelectedException,
    setLocateVehicleId,
  } = useExceptionStore();
  const { setHighlightTrackSegment, setSelectedVehicle, setActiveExceptionId } = useVehicleStore();
  const [selectedOpinion, setSelectedOpinion] = useState('');
  const [customOpinion, setCustomOpinion] = useState('');
  const [handlerName, setHandlerName] = useState('市级管理员');
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModal>(null);
  const [carrierFeedbackText, setCarrierFeedbackText] = useState('');
  const [resolverName, setResolverName] = useState('市级管理员');

  const stats = getStats();
  const exceptions = getExceptionsByLevel(activeLevel);
  const selectedException = exceptions.find((e) => e.id === selectedExceptionId);

  const tabs: { key: RiskLevel | 'all'; label: string; count: number; color: string }[] = [
    { key: 'all', label: '全部', count: stats.total, color: 'blue' },
    { key: 'high', label: '高风险', count: stats.high, color: 'red' },
    { key: 'medium', label: '中风险', count: stats.medium, color: 'yellow' },
    { key: 'low', label: '低风险', count: stats.low, color: 'blue' },
  ];

  const handleSubmit = () => {
    if (!selectedExceptionId) return;
    const opinion = customOpinion || selectedOpinion;
    if (!opinion) return;
    handleException(selectedExceptionId, opinion, handlerName);
    setSelectedOpinion('');
    setCustomOpinion('');
  };

  const handleCarrierFeedbackSubmit = () => {
    if (!selectedExceptionId || !carrierFeedbackText.trim()) return;
    addCarrierFeedback(selectedExceptionId, carrierFeedbackText.trim(), []);
    setCarrierFeedbackText('');
    setFeedbackModal(null);
  };

  const handleResolveSubmit = () => {
    if (!selectedExceptionId || !resolverName.trim()) return;
    resolveException(selectedExceptionId, resolverName.trim());
    setFeedbackModal(null);
  };

  const handleLocateOnMap = (exception: ExceptionEvent) => {
    if (!exception.vehicleId) return;
    setLocateVehicleId(exception.vehicleId);
    setSelectedVehicle(exception.vehicleId);
    setActiveExceptionId(exception.id);
    const tps = useVehicleStore.getState().trackPoints[exception.vehicleId] || [];
    const relevantIds = getRelevantPointIdsForException(exception, tps);
    if (relevantIds.length > 0) {
      setHighlightTrackSegment({ vehicleId: exception.vehicleId, pointIds: relevantIds });
    }
    navigate('/map-overview');
  };

  return (
    <div className="h-full flex flex-col gap-5 -m-6 p-6">
      <JurisdictionSelector />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="待处理"
          value={stats.pending}
          subtitle="需立即处置"
          icon={AlertCircle}
          color="red"
        />
        <StatsCard
          title="处理中"
          value={stats.handling}
          subtitle="正在跟进"
          icon={MessageSquare}
          color="yellow"
        />
        <StatsCard
          title="已解决"
          value={stats.resolved}
          subtitle="闭环完成"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="异常总数"
          value={stats.total}
          subtitle="今日累计"
          icon={AlertTriangle}
          color="blue"
        />
      </div>

      <div className="dashboard-card">
        <div className="border-b border-dashboard-border px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-item flex items-center gap-2 ${activeLevel === tab.key ? 'active' : ''}`}
                onClick={() => setActiveLevel(tab.key as RiskLevel | 'all')}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  tab.color === 'red' ? 'bg-red-500/20 text-red-400' :
                  tab.color === 'yellow' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exceptions.map((ex, idx) => (
              <ExceptionCard
                key={ex.id}
                exception={ex}
                index={idx}
                isSelected={selectedExceptionId === ex.id}
                onClick={() => setSelectedException(selectedExceptionId === ex.id ? null : ex.id)}
                onLocateOnMap={() => handleLocateOnMap(ex)}
              />
            ))}
            {exceptions.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                <div>暂无异常事件</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedException && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedException(null)}>
          <div className="w-full max-w-2xl bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">异常处置</h2>
              </div>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setSelectedException(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="dashboard-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {React.createElement(typeIcons[selectedException.type] || AlertTriangle, {
                      className: 'w-5 h-5 text-slate-400',
                    })}
                    <div>
                      <div className="text-white font-medium">{getExceptionTypeText(selectedException.type)}</div>
                      <div className="text-xs text-slate-500">{selectedException.plateNumber} · {selectedException.carrier}</div>
                    </div>
                  </div>
                  <RiskBadge level={selectedException.level} />
                </div>
                <p className="text-sm text-slate-300 mb-3">{selectedException.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>温度: </span>
                    <span className={`data-number ${selectedException.temperature && selectedException.temperature > 8 ? 'text-red-400' : 'text-slate-200'}`}>
                      {selectedException.temperature !== undefined ? formatTemperature(selectedException.temperature) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>位置: </span>
                    <span className="text-slate-200">{selectedException.location || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-slate-200">{formatRelativeTime(selectedException.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-slate-200">{getExceptionStatusText(selectedException.status)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-dashboard-border">
                  <button
                    className="btn-secondary text-xs"
                    onClick={() => handleLocateOnMap(selectedException)}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>定位到地图复盘</span>
                  </button>
                </div>
              </div>

              <div className="dashboard-card p-4">
                <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary-400" />
                  处置闭环进度
                </div>
                <div className="flex items-start gap-2">
                  {[
                    { key: 'opinion', label: '下发处置意见', done: !!selectedException.handleOpinion, icon: Send },
                    { key: 'feedback', label: '承运方反馈', done: !!selectedException.carrierFeedback, icon: FileText },
                    { key: 'resolve', label: '闭环确认', done: selectedException.status === 'resolved', icon: CheckCircle },
                  ].map((step, idx, arr) => (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dashboard-hover text-slate-500'
                        }`}>
                          {React.createElement(step.icon, { className: 'w-4 h-4' })}
                        </div>
                        <div className={`mt-2 text-xs text-center ${step.done ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {step.label}
                        </div>
                        {step.done && (
                          <div className="mt-1 text-[10px] text-slate-500">
                            {step.key === 'opinion' && selectedException.handleTime}
                            {step.key === 'feedback' && selectedException.carrierFeedbackTime}
                            {step.key === 'resolve' && selectedException.resolveTime}
                          </div>
                        )}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className={`flex-1 h-0.5 mt-4.5 ${
                          step.done ? 'bg-emerald-500/50' : 'bg-dashboard-border'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {selectedException.handleOpinion && (
                <div className="dashboard-card p-4">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>处置意见 · {selectedException.handler} · {formatDateTime(selectedException.handleTime!)}</span>
                  </div>
                  <div className="text-sm text-slate-200 bg-primary-500/10 border border-primary-500/20 p-3 rounded">
                    {selectedException.handleOpinion}
                  </div>
                </div>
              )}

              {selectedException.carrierFeedback && (
                <div className="dashboard-card p-4">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>承运方执行结果 · {formatDateTime(selectedException.carrierFeedbackTime!)}</span>
                  </div>
                  <div className="text-sm text-slate-200 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded mb-3">
                    {selectedException.carrierFeedback}
                  </div>
                  {(selectedException.carrierPhotos?.length || 0) > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedException.carrierPhotos?.map((p, i) => (
                        <div key={i} className="aspect-video rounded bg-dashboard-hover border border-dashboard-border flex items-center justify-center overflow-hidden">
                          <Camera className="w-6 h-6 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      暂未上传现场照片
                    </div>
                  )}
                </div>
              )}

              {selectedException.status === 'resolved' && selectedException.resolver && (
                <div className="dashboard-card p-4 bg-emerald-500/5 border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">已闭环确认</span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {selectedException.resolver} · {formatDateTime(selectedException.resolveTime!)}
                    </span>
                  </div>
                </div>
              )}

              {selectedException.status !== 'resolved' && (
                <>
                  {!selectedException.handleOpinion && (
                    <>
                      <div>
                        <div className="text-sm text-slate-400 mb-2">快捷处置意见</div>
                        <div className="flex flex-wrap gap-2">
                          {handleOptions.map((opt) => (
                            <button
                              key={opt.value}
                              className={`px-3 py-1.5 rounded text-sm border transition-all duration-200 ${
                                selectedOpinion === opt.value
                                  ? opt.type === 'danger' ? 'bg-red-500/30 border-red-500 text-red-300' :
                                    opt.type === 'warning' ? 'bg-amber-500/30 border-amber-500 text-amber-300' :
                                    opt.type === 'success' ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300' :
                                    'bg-primary-500/30 border-primary-500 text-primary-300'
                                  : 'bg-dashboard-surface border-dashboard-border text-slate-300 hover:border-primary-500/50'
                              }`}
                              onClick={() => {
                                setSelectedOpinion(opt.value);
                                setCustomOpinion('');
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-2">或输入自定义意见</div>
                        <textarea
                          className="input-field w-full h-24 resize-none"
                          placeholder="请输入处置意见..."
                          value={customOpinion}
                          onChange={(e) => {
                            setCustomOpinion(e.target.value);
                            setSelectedOpinion('');
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-400">处置人:</span>
                          <input
                            className="input-field py-1 text-sm w-32"
                            value={handlerName}
                            onChange={(e) => setHandlerName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button className="btn-secondary" onClick={() => setSelectedException(null)}>
                            取消
                          </button>
                          <button
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={!selectedOpinion && !customOpinion}
                          >
                            <Send className="w-4 h-4" />
                            <span>下发处置意见</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedException.handleOpinion && (selectedException.status as string) !== 'resolved' && (
                    <div className="flex gap-2 justify-end pt-2 border-t border-dashboard-border">
                      <button className="btn-secondary" onClick={() => setSelectedException(null)}>
                        关闭
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setCarrierFeedbackText(selectedException.carrierFeedback || '');
                          setFeedbackModal('carrier');
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        <span>{selectedException.carrierFeedback ? '修改承运反馈' : '承运方回填'}</span>
                      </button>
                      {selectedException.carrierFeedback && (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setResolverName(selectedException.resolver || handlerName);
                            setFeedbackModal('resolve');
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>标记已闭环</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {selectedException.status === 'resolved' && (
                <div className="flex gap-2 justify-end pt-2 border-t border-dashboard-border">
                  <button className="btn-secondary" onClick={() => setSelectedException(null)}>
                    关闭
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {feedbackModal === 'carrier' && selectedException && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setFeedbackModal(null)}>
          <div className="w-full max-w-lg bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">承运方回填执行结果</h2>
              </div>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setFeedbackModal(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-400">
                车辆 <span className="text-white">{selectedException.plateNumber}</span> · {getExceptionTypeText(selectedException.type)}
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">执行结果描述</div>
                <textarea
                  className="input-field w-full h-32 resize-none"
                  placeholder="请描述处置措施、现场情况、复测温度等执行结果..."
                  value={carrierFeedbackText}
                  onChange={(e) => setCarrierFeedbackText(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">现场照片（占位）</div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-video rounded bg-dashboard-hover border border-dashed border-dashboard-border flex flex-col items-center justify-center text-slate-500 hover:border-primary-500/50 hover:text-primary-400 cursor-pointer transition-colors"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px]">添加照片</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button className="btn-secondary" onClick={() => setFeedbackModal(null)}>取消</button>
                <button
                  className="btn-primary"
                  onClick={handleCarrierFeedbackSubmit}
                  disabled={!carrierFeedbackText.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span>提交反馈</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {feedbackModal === 'resolve' && selectedException && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-6 animate-fade-in" onClick={() => setFeedbackModal(null)}>
          <div className="w-full max-w-md bg-dashboard-surface rounded-lg border border-dashboard-border overflow-hidden animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard-border">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">确认闭环</h2>
              </div>
              <button
                className="p-2 rounded-md hover:bg-dashboard-hover text-slate-400 hover:text-white transition-colors"
                onClick={() => setFeedbackModal(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="dashboard-card p-3 bg-emerald-500/5 border-emerald-500/20">
                <div className="text-sm text-slate-300 mb-1">
                  即将标记以下异常为已闭环：
                </div>
                <div className="text-white font-medium">
                  {selectedException.plateNumber} · {getExceptionTypeText(selectedException.type)}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  闭环确认人
                </div>
                <input
                  className="input-field w-full"
                  placeholder="请输入确认人姓名"
                  value={resolverName}
                  onChange={(e) => setResolverName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button className="btn-secondary" onClick={() => setFeedbackModal(null)}>取消</button>
                <button
                  className="btn-primary"
                  onClick={handleResolveSubmit}
                  disabled={!resolverName.trim()}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>确认闭环</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExceptionCard: React.FC<{
  exception: ExceptionEvent;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onLocateOnMap: () => void;
}> = ({ exception, index, isSelected, onClick, onLocateOnMap }) => {
  const TypeIcon = typeIcons[exception.type] || AlertTriangle;
  const levelBgColors = {
    high: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
    medium: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50',
    low: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50',
  };

  const statusColors = {
    pending: 'bg-red-500/20 text-red-400',
    handling: 'bg-amber-500/20 text-amber-400',
    resolved: 'bg-emerald-500/20 text-emerald-400',
  };

  return (
    <div
      className={`dashboard-card p-4 cursor-pointer transition-all duration-300 border animate-slide-up ${levelBgColors[exception.level]} ${
        isSelected ? 'ring-2 ring-primary-500 scale-[1.01]' : ''
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            exception.level === 'high' ? 'bg-red-500/20 text-red-400' :
            exception.level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-medium">{exception.plateNumber}</span>
              <RiskBadge level={exception.level} size="sm" />
            </div>
            <div className="text-xs text-slate-400">{getExceptionTypeText(exception.type)}</div>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[exception.status]}`}>
          {getExceptionStatusText(exception.status)}
        </span>
      </div>

      <p className="text-sm text-slate-300 mb-3 line-clamp-2" onClick={onClick}>{exception.description}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {exception.location || '-'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(exception.timestamp)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {exception.temperature !== undefined && (
            <span className={`data-number font-medium ${
              exception.temperature > 8 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {formatTemperature(exception.temperature)}
            </span>
          )}
          <button
            className="p-1.5 rounded hover:bg-primary-500/20 text-slate-500 hover:text-primary-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onLocateOnMap();
            }}
            title="定位到地图"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExceptionHandling;
