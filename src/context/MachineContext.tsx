import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import { useAuth } from './AuthContext';

export interface Machine {
  id: string;
  name: string;
  model: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'IDLE';
  statusColor: string;
  hours: string;
  acres: string;
  operator: string;
  operatorColor: string;
  image: string;
  serial?: string;
  advanceAmount?: string;
  advanceDate?: string;
  owner_name?: string;
  owner_mobile?: string;
  per_hour_rate?: number;
  todayAdvanceCount?: number;
  totalAdvanceAmount?: number;
  registration_date?: string;
  totalHours?: number;
  totalAcres?: number;
  dailyHours?: number;
  dailyAcres?: number;
  dailyAdvanceAmount?: number;
  is_settled?: number;
}

interface MachineContextType {
  machines: Machine[];
  addMachine: (machine: Machine) => void;
  updateMachineStatus: (id: string, status: string) => Promise<void>;
  updateMachineRate: (id: string, rate: number) => Promise<void>;
  refreshMachines: (date?: string) => void;
  loading: boolean;
}


export const formatDateToLocalISO = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export function MachineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = async (date?: string) => {
    try {
      let url = date ? `${API_BASE_URL}/machines?date=${date}` : `${API_BASE_URL}/machines`;
      
      const tId = user?.trader_id || user?.id;
      if (tId) {
        url += url.includes('?') ? `&traderId=${tId}` : `?traderId=${tId}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setMachines(data.map((m: any) => ({
          ...m,
          statusColor: m.status === 'ACTIVE' ? 'bg-[#e0ffe4] text-[#00c853]' : 
                       m.status === 'MAINTENANCE' ? 'bg-orange-50 text-orange-600' : 
                       m.status === 'WORKING' ? 'bg-emerald-100 text-emerald-700' :
                       'bg-blue-50 text-blue-600',
          operatorColor: 'text-[#00c853]'
        })));
      } else {
        setMachines([]);
      }
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMachines();
    } else {
      setMachines([]);
      setLoading(false);
    }
  }, [user]);

  const addMachine = async (newMachine: Machine) => {
    try {
      const tId = user?.trader_id || user?.id;
      const res = await fetch(`${API_BASE_URL}/machines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMachine, traderId: tId })
      });
      if (res.ok) {
        fetchMachines();
      }
    } catch (err) {
      console.error("Failed to add machine:", err);
    }
  };

  const updateMachineStatus = async (id: string, status: string) => {
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machines/${encodeURIComponent(id)}/status`;
      if (tId) url += `?traderId=${tId}`;
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, traderId: tId })
      });
      if (res.ok) {
        fetchMachines();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const updateMachineRate = async (id: string, rate: number) => {
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machines/${encodeURIComponent(id)}/rate`;
      if (tId) url += `?traderId=${tId}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate, traderId: tId })
      });
      if (res.ok) {
        fetchMachines();
      }
    } catch (err) {
      console.error("Failed to update rate:", err);
    }
  };

  return (
    <MachineContext.Provider value={{
      machines,
      addMachine,
      updateMachineStatus,
      updateMachineRate,
      refreshMachines: (date?: string) => fetchMachines(date),
      loading
    }}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachines() {
  const context = useContext(MachineContext);
  if (context === undefined) {
    throw new Error('useMachines must be used within a MachineProvider');
  }
  return context;
}
