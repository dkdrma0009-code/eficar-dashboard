'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { DashboardData } from './types';

interface DataContextType {
  data: DashboardData | null;
  setData: (d: DashboardData | null) => void;
  fileName: string;
  setFileName: (n: string) => void;
}

const STORAGE_KEY = 'eficar-dashboard-data';
const FILE_KEY    = 'eficar-dashboard-file';

function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

const DataContext = createContext<DataContextType>({
  data: null, setData: () => {},
  fileName: '', setFileName: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<DashboardData | null>(null);
  const [fileName, setFileNameState] = useState<string>('');

  useEffect(() => {
    const d = loadFromStorage<DashboardData>(STORAGE_KEY);
    const f = loadFromStorage<string>(FILE_KEY);
    if (d) setDataState(d);
    if (f) setFileNameState(f);
  }, []);

  const setData = (d: DashboardData | null) => {
    setDataState(d);
    try {
      if (d) localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      else    localStorage.removeItem(STORAGE_KEY);
    } catch { /* quota exceeded — silently ignore */ }
  };

  const setFileName = (n: string) => {
    setFileNameState(n);
    try {
      if (n) localStorage.setItem(FILE_KEY, JSON.stringify(n));
      else   localStorage.removeItem(FILE_KEY);
    } catch { /* quota exceeded */ }
  };

  return (
    <DataContext.Provider value={{ data, setData, fileName, setFileName }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDashboardData() { return useContext(DataContext); }
