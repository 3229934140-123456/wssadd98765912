import React from 'react';
import type { RiskLevel } from '@/types';
import { getRiskLevelText } from '@/utils/format';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

const levelClasses: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  high: {
    bg: 'bg-red-500/20 border-red-500/40',
    text: 'text-red-400',
    dot: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-500/20 border-amber-500/40',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-blue-500/20 border-blue-500/40',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const cls = levelClasses[level];
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border ${cls.bg} ${cls.text} ${sizeClass} font-medium`}
    >
      <span className={`status-dot ${cls.dot} ${level === 'high' ? 'animate-blink' : ''}`} />
      {getRiskLevelText(level)}
    </span>
  );
};

export default RiskBadge;
