export type VehicleStatus = 'in-transit' | 'stopped' | 'loading' | 'arrived';
export type RiskLevel = 'high' | 'medium' | 'low';
export type ExceptionType = 'over-temperature' | 'long-stop' | 'route-deviation' | 'door-open';
export type ExceptionStatus = 'pending' | 'handling' | 'resolved';
export type EventType = 'normal' | 'loading' | 'unloading' | 'stop' | 'door-open' | 'door-close';
export type NodeType = 'warehouse' | 'vehicle' | 'station';

export interface Vehicle {
  id: string;
  plateNumber: string;
  carrier: string;
  driver: string;
  phone: string;
  currentTemp: number;
  targetTemp: number;
  status: VehicleStatus;
  route: string;
  vaccineType: string;
  destination: string;
  eta: string;
  lng: number;
  lat: number;
  batchNumbers: string[];
}

export interface TrackPoint {
  id: string;
  vehicleId: string;
  lng: number;
  lat: number;
  temp: number;
  timestamp: string;
  eventType: EventType;
  eventDesc: string;
}

export interface ExceptionEvent {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: ExceptionType;
  level: RiskLevel;
  description: string;
  timestamp: string;
  status: ExceptionStatus;
  handler?: string;
  handleOpinion?: string;
  handleTime?: string;
  temperature?: number;
  location?: string;
  carrier?: string;
  vaccineType?: string;
}

export interface TemperatureRecord {
  timestamp: string;
  temp: number;
}

export interface TransportNode {
  type: NodeType;
  name: string;
  person: string;
  time: string;
  description: string;
}

export interface VaccineBatch {
  id: string;
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  warehouse: string;
  status: 'normal' | 'warning' | 'recalled';
  temperatureRecords: TemperatureRecord[];
  transportChain: TransportNode[];
}

export interface VehicleFilters {
  route: string;
  carrier: string;
  vaccineType: string;
  status: string;
}

export interface BatchFilters {
  keyword: string;
  vaccineName: string;
  dateRange: [string, string] | null;
  status: string;
}
