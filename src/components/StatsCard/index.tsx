import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
  trend?: { value: string; positive: boolean };
}

const colorClasses = {
  blue: {
    bg: 'from-blue-600/20 to-blue-900/10',
    icon: 'text-blue-400 bg-blue-500/20',
    value: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  green: {
    bg: 'from-emerald-600/20 to-emerald-900/10',
    icon: 'text-emerald-400 bg-emerald-500/20',
    value: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  yellow: {
    bg: 'from-amber-600/20 to-amber-900/10',
    icon: 'text-amber-400 bg-amber-500/20',
    value: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  red: {
    bg: 'from-red-600/20 to-red-900/10',
    icon: 'text-red-400 bg-red-500/20',
    value: 'text-red-400',
    border: 'border-red-500/30',
  },
};

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const cls = colorClasses[color];

  return (
    <div
      className={`dashboard-card p-5 bg-gradient-to-br ${cls.bg} border ${cls.border} hover:scale-[1.02] transition-transform duration-300 animate-fade-in`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-400 mb-2">{title}</div>
          <div className={`text-3xl font-bold data-number ${cls.value} mb-1`}>
            {value}
          </div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
          {trend && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${cls.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
