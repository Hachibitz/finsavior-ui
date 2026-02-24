import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface MonthContextValue {
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (m: string) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  displayLabel: string;
}

const MonthContext = createContext<MonthContextValue | undefined>(undefined);

export const MonthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initial = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const initialMonth = `${initial.getFullYear()}-${pad(initial.getMonth() + 1)}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);

  const changeMonth = useCallback((delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    setSelectedMonth(newMonth);
  }, [selectedMonth]);

  const prevMonth = useCallback(() => changeMonth(-1), [changeMonth]);
  const nextMonth = useCallback(() => changeMonth(1), [changeMonth]);

  const displayLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <MonthContext.Provider value={{ selectedMonth, setSelectedMonth, prevMonth, nextMonth, displayLabel }}>
      {children}
    </MonthContext.Provider>
  );
};

export const useMonth = () => {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
};

export default MonthContext;
