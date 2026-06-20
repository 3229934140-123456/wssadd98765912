import { create } from 'zustand';
import type { ExceptionEvent, RiskLevel, ExceptionStatus } from '@/types';
import { mockExceptions } from '@/mock/exceptions';

interface ExceptionState {
  exceptions: ExceptionEvent[];
  activeLevel: RiskLevel | 'all';
  selectedExceptionId: string | null;
  setActiveLevel: (level: RiskLevel | 'all') => void;
  setSelectedException: (id: string | null) => void;
  getExceptionsByLevel: (level: RiskLevel | 'all') => ExceptionEvent[];
  getExceptionsByStatus: (status: ExceptionStatus) => ExceptionEvent[];
  handleException: (id: string, opinion: string, handler: string) => void;
  getStats: () => {
    total: number;
    high: number;
    medium: number;
    low: number;
    pending: number;
    handling: number;
    resolved: number;
  };
}

const sortByLevelAndTime = (list: ExceptionEvent[]) => {
  const levelOrder = { high: 0, medium: 1, low: 2 };
  return [...list].sort((a, b) => {
    if (levelOrder[a.level] !== levelOrder[b.level]) {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

export const useExceptionStore = create<ExceptionState>((set, get) => ({
  exceptions: mockExceptions,
  activeLevel: 'all',
  selectedExceptionId: null,

  setActiveLevel: (level) => set({ activeLevel: level }),

  setSelectedException: (id) => set({ selectedExceptionId: id }),

  getExceptionsByLevel: (level) => {
    const { exceptions } = get();
    const list = level === 'all' ? exceptions : exceptions.filter((e) => e.level === level);
    return sortByLevelAndTime(list);
  },

  getExceptionsByStatus: (status) => {
    return get().exceptions.filter((e) => e.status === status);
  },

  handleException: (id, opinion, handler) => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'handling' as ExceptionStatus,
              handleOpinion: opinion,
              handler,
              handleTime: timeStr,
            }
          : e
      ),
    }));
  },

  getStats: () => {
    const { exceptions } = get();
    return {
      total: exceptions.length,
      high: exceptions.filter((e) => e.level === 'high').length,
      medium: exceptions.filter((e) => e.level === 'medium').length,
      low: exceptions.filter((e) => e.level === 'low').length,
      pending: exceptions.filter((e) => e.status === 'pending').length,
      handling: exceptions.filter((e) => e.status === 'handling').length,
      resolved: exceptions.filter((e) => e.status === 'resolved').length,
    };
  },
}));
