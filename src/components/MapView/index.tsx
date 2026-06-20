import React, { useMemo } from 'react';
import { Truck, MapPin, Clock, Thermometer } from 'lucide-react';
import type { Vehicle, TrackPoint } from '@/types';
import { formatTemperature, formatTime, getVehicleStatusText, getEventTypeText } from '@/utils/format';

interface MapViewProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  trackPoints: TrackPoint[];
  highlightPointIds?: string[];
  onVehicleClick: (id: string) => void;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;
const MIN_LNG = 116.15;
const MAX_LNG = 116.55;
const MIN_LAT = 39.7;
const MAX_LAT = 40.3;

const lngToX = (lng: number) => ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * MAP_WIDTH;
const latToY = (lat: number) => MAP_HEIGHT - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * MAP_HEIGHT;

const districts = [
  { name: '朝阳区', cx: 520, cy: 280, rx: 120, ry: 90 },
  { name: '海淀区', cx: 280, cy: 220, rx: 130, ry: 80 },
  { name: '丰台区', cx: 300, cy: 380, rx: 110, ry: 70 },
  { name: '通州区', cx: 650, cy: 260, rx: 80, ry: 70 },
  { name: '大兴区', cx: 380, cy: 450, rx: 100, ry: 50 },
  { name: '昌平区', cx: 200, cy: 100, rx: 140, ry: 60 },
];

const cityCenter = { lng: 116.40, lat: 39.90, name: '市疾控中心' };

const eventIconMap: Record<string, string> = {
  loading: '📦',
  unloading: '📤',
  stop: '🛑',
  'door-open': '🚪',
  'door-close': '🔒',
};

const MapView: React.FC<MapViewProps> = ({ vehicles, selectedVehicleId, trackPoints, highlightPointIds = [], onVehicleClick }) => {
  const centerX = lngToX(cityCenter.lng);
  const centerY = latToY(cityCenter.lat);

  const trackPath = useMemo(() => {
    if (trackPoints.length < 2) return '';
    return trackPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${lngToX(p.lng)} ${latToY(p.lat)}`)
      .join(' ');
  }, [trackPoints]);

  const highlightPath = useMemo(() => {
    if (highlightPointIds.length < 2 || trackPoints.length === 0) return '';
    const highlighted = trackPoints.filter((p) => highlightPointIds.includes(p.id));
    if (highlighted.length < 2) return '';
    return highlighted
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${lngToX(p.lng)} ${latToY(p.lat)}`)
      .join(' ');
  }, [trackPoints, highlightPointIds]);

  const getVehicleColor = (v: Vehicle) => {
    if (v.currentTemp > 8 || v.currentTemp < 2) return 'danger';
    if (v.currentTemp > 6) return 'warning';
    return 'success';
  };

  const colorMap = {
    success: { fill: '#10B981', text: 'text-emerald-400' },
    warning: { fill: '#F59E0B', text: 'text-amber-400' },
    danger: { fill: '#EF4444', text: 'text-red-400' },
  };

  const eventPoints = trackPoints.filter((p) => p.eventType !== 'normal');

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-dashboard-surface to-dashboard-card rounded-lg overflow-hidden border border-dashboard-border">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E3354" strokeWidth="0.5" opacity="0.5" />
          </pattern>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grid)" />
        <circle cx={centerX} cy={centerY} r="200" fill="url(#glow)" />

        {districts.map((d) => (
          <g key={d.name}>
            <ellipse
              cx={d.cx}
              cy={d.cy}
              rx={d.rx}
              ry={d.ry}
              fill="rgba(37, 99, 235, 0.05)"
              stroke="#1E3354"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <text
              x={d.cx}
              y={d.cy}
              textAnchor="middle"
              fill="#475569"
              fontSize="12"
              fontFamily="sans-serif"
            >
              {d.name}
            </text>
          </g>
        ))}

        {trackPath && (
          <>
            <path
              d={trackPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="8"
              strokeOpacity="0.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={trackPath}
              fill="none"
              stroke="url(#trackGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="24"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {highlightPath && (
          <path
            d={highlightPath}
            fill="none"
            stroke="#EF4444"
            strokeWidth="6"
            strokeOpacity="0.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glowFilter)"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.4;0.8;0.4"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </path>
        )}

        {trackPoints.map((p, i) => {
          const isEvent = p.eventType !== 'normal';
          const isHighlighted = highlightPointIds.includes(p.id);
          return (
            <g key={p.id}>
              <circle
                cx={lngToX(p.lng)}
                cy={latToY(p.lat)}
                r={isEvent ? 5 : 3}
                fill={isHighlighted ? '#EF4444' : isEvent ? '#F59E0B' : '#2563EB'}
                stroke="#0A1628"
                strokeWidth="2"
                opacity={i === trackPoints.length - 1 ? 1 : 0.6}
              />
              {isEvent && (
                <text
                  x={lngToX(p.lng)}
                  y={latToY(p.lat) - 12}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="sans-serif"
                >
                  {eventIconMap[p.eventType] || '📍'}
                </text>
              )}
              {isEvent && (
                <text
                  x={lngToX(p.lng) + 10}
                  y={latToY(p.lat) + 4}
                  textAnchor="start"
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="sans-serif"
                >
                  {getEventTypeText(p.eventType)}
                </text>
              )}
            </g>
          );
        })}

        <g>
          <circle cx={centerX} cy={centerY} r="12" fill="#2563EB" opacity="0.3">
            <animate attributeName="r" from="12" to="24" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={centerX} cy={centerY} r="8" fill="#2563EB" stroke="#fff" strokeWidth="2" />
        </g>

        {vehicles.map((v) => {
          const x = lngToX(v.lng);
          const y = latToY(v.lat);
          const color = colorMap[getVehicleColor(v)];
          const isSelected = v.id === selectedVehicleId;
          const hasAlarm = getVehicleColor(v) !== 'success';

          return (
            <g
              key={v.id}
              transform={`translate(${x}, ${y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onVehicleClick(v.id)}
              className="vehicle-marker"
            >
              {hasAlarm && (
                <circle r="18" fill={color.fill} opacity="0.3">
                  <animate attributeName="r" from="14" to="24" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r={isSelected ? 14 : 11}
                fill={color.fill}
                stroke={isSelected ? '#fff' : '#0A1628'}
                strokeWidth={isSelected ? 3 : 2}
              />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                🚚
              </text>
            </g>
          );
        })}
      </svg>

      {selectedVehicleId && (() => {
        const v = vehicles.find((x) => x.id === selectedVehicleId);
        if (!v) return null;
        const color = colorMap[getVehicleColor(v)];
        return (
          <div className="absolute bottom-4 left-4 dashboard-card p-3 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Truck className={`w-4 h-4 ${color.text}`} />
                <span className="text-sm font-semibold text-white">{v.plateNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Thermometer className={`w-3.5 h-3.5 ${color.text}`} />
                <span className={`data-number ${color.text}`}>{formatTemperature(v.currentTemp)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300">{v.destination}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300 data-number">ETA {formatTime(v.eta)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="dashboard-card px-3 py-2 text-xs flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="status-dot bg-emerald-500" />
            <span className="text-slate-400">正常</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot bg-amber-500" />
            <span className="text-slate-400">预警</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot bg-red-500" />
            <span className="text-slate-400">异常</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 dashboard-card px-3 py-2 text-xs text-slate-400">
        <span>📍 市疾控中心 - 实时监控</span>
      </div>
    </div>
  );
};

export default MapView;
