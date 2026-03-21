export type UserRole = 'farmer' | 'miller' | 'trader' | 'machine_harvest' | 'paddy_harvest';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'processing';
  lotNumber: string;
  type: 'earnings' | 'cost';
}

export interface MachineLog {
  id: string;
  field: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  acres: number;
  fuel: number;
  rate: number;
  totalAmount: number;
  status: 'completed' | 'ongoing';
  date: string;
}

export interface MaintenanceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'critical' | 'normal';
}

export interface MarketRate {
  id: string;
  variety: string;
  mandi: string;
  price: number;
  change: number;
  unit: string;
}
