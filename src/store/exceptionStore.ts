import { create } from 'zustand';
import type { ExceptionEvent, RiskLevel, ExceptionStatus } from '@/types';
import { mockExceptions } from '@/mock/exceptions';
import { useJurisdictionStore } from '@/store/jurisdictionStore';
import { useVehicleStore } from '@/store/vehicleStore';

interface ExceptionState {
  exceptions: ExceptionEvent[];
  activeLevel: RiskLevel | 'all';
  selectedExceptionId: string | null;
  locateVehicleId: string | null;
  setActiveLevel: (level: RiskLevel | 'all') => void;
  setSelectedException: (id: string | null) => void;
  setLocateVehicleId: (id: string | null) => void;
  getExceptionsByLevel: (level: RiskLevel | 'all') => ExceptionEvent[];
  getExceptionsByStatus: (status: ExceptionStatus) => ExceptionEvent[];
  getExceptionsByBatchNumbers: (batchNumbers: string[]) => ExceptionEvent[];
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

const filterByJurisdiction = (list: ExceptionEvent[]) => {
  const { district } = useJurisdictionStore.getState().getFilter();
  if (!district) return list;
  const { vehicles } = useVehicleStore.getState();
  const districtVehicleIds = new Set(
    vehicles.filter((v) => v.district === district).map((v) => v.id)
  );
  return list.filter((e) => districtVehicleIds.has(e.vehicleId));
};

export const useExceptionStore = create<ExceptionState>((set, get) => ({
  exceptions: mockExceptions,
  activeLevel: 'all',
  selectedExceptionId: null,
  locateVehicleId: null,

  setActiveLevel: (level) => set({ activeLevel: level }),

  setSelectedException: (id) => set({ selectedExceptionId: id }),

  setLocateVehicleId: (id) => set({ locateVehicleId: id }),

  getExceptionsByLevel: (level) => {
    const { exceptions } = get();
    let list = level === 'all' ? exceptions : exceptions.filter((e) => e.level === level);
    list = filterByJurisdiction(list);
    return sortByLevelAndTime(list);
  },

  getExceptionsByStatus: (status) => {
    let list = get().exceptions.filter((e) => e.status === status);
    return filterByJurisdiction(list);
  },

  getExceptionsByBatchNumbers: (batchNumbers) => {
    return get().exceptions.filter((e) => {
      const vehicle = useVehicleStore.getState().vehicles.find((v) => v.id === e.vehicleId);
      return vehicle && vehicle.batchNumbers.some((bn) => batchNumbers.includes(bn));
    });
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
    const list = filterByJurisdiction(get().exceptions);
    return {
      total: list.length,
      high: list.filter((e) => e.level === 'high').length,
      medium: list.filter((e) => e.level === 'medium').length,
      low: list.filter((e) => e.level === 'low').length,
      pending: list.filter((e) => e.status === 'pending').length,
      handling: list.filter((e) => e.status === 'handling').length,
      resolved: list.filter((e) => e.status === 'resolved').length,
    };
  },
}));
