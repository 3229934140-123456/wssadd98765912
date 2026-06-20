import React from 'react';
import { Warehouse, Truck, MapPin, Package, Thermometer, DoorOpen, DoorClosed, Pause } from 'lucide-react';
import type { EventType, NodeType } from '@/types';
import { getEventTypeText, formatDateTime } from '@/utils/format';

interface TimelineItem {
  type: EventType | NodeType;
  title: string;
  time: string;
  description: string;
  person?: string;
  temp?: number;
}

const eventIcons: Record<string, any> = {
  warehouse: Warehouse,
  vehicle: Truck,
  station: MapPin,
  loading: Package,
  unloading: Package,
  normal: Truck,
  stop: Pause,
  'door-open': DoorOpen,
  'door-close': DoorClosed,
};

const eventColors: Record<string, string> = {
  warehouse: 'bg-blue-500 border-blue-500',
  vehicle: 'bg-primary-500 border-primary-500',
  station: 'bg-emerald-500 border-emerald-500',
  loading: 'bg-purple-500 border-purple-500',
  unloading: 'bg-purple-500 border-purple-500',
  normal: 'bg-blue-500 border-blue-500',
  stop: 'bg-amber-500 border-amber-500',
  'door-open': 'bg-red-500 border-red-500',
  'door-close': 'bg-slate-500 border-slate-500',
};

interface TimelineProps {
  items: TimelineItem[];
  compact?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ items, compact = false }) => {
  return (
    <div className="relative">
      {items.map((item, index) => {
        const Icon = eventIcons[item.type] || MapPin;
        const colorCls = eventColors[item.type] || 'bg-slate-500 border-slate-500';
        const isLast = index === items.length - 1;

        return (
          <div
            key={index}
            className={`relative flex gap-3 animate-slide-up ${compact ? 'pb-3' : 'pb-5'}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col items-center">
              <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full flex items-center justify-center border-2 ${colorCls} flex-shrink-0 z-10`}>
                <Icon className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 bg-dashboard-border ${compact ? 'mt-0.5' : 'mt-1'}`} />
              )}
            </div>
            <div className={`flex-1 min-w-0 ${compact ? 'pb-1' : 'pb-2'}`}>
              <div className={`flex items-center gap-2 ${compact ? 'mb-0.5' : 'mb-1'} flex-wrap`}>
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white`}>{item.title}</span>
                <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-slate-500 data-number`}>{formatDateTime(item.time)}</span>
                {item.temp !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${compact ? 'text-[10px]' : 'text-xs'} ${
                    item.temp > 8 || item.temp < 2 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Thermometer className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                    <span className="data-number">{item.temp.toFixed(1)}°C</span>
                  </span>
                )}
              </div>
              <div className={`${compact ? 'text-xs' : 'text-sm'} text-slate-400 ${compact ? 'mb-0.5' : 'mb-1'}`}>{item.description}</div>
              {item.person && !compact && (
                <div className="text-xs text-slate-500">责任人: {item.person}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { Timeline };
export type { TimelineItem };
