import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  SensorReading,
  fetchLatestReading,
  isLiveDataConfigured,
  POLL_INTERVAL_MS,
} from '../utils/sensorData';

// ═══════════════════════════════════════════════════════════════════════════════
//  SensorContext — single polling source shared across all screens
// ═══════════════════════════════════════════════════════════════════════════════
//  Mounted once at app level so readings survive navigation.
//  useSensorData() is now just a thin hook that reads from this context.
// ═══════════════════════════════════════════════════════════════════════════════

interface SensorContextValue {
  reading: SensorReading | null;
  isLive: boolean;
  error: string | null;
  refresh: () => void;
}

const SensorContext = createContext<SensorContextValue>({
  reading: null,
  isLive: false,
  error: null,
  refresh: () => {},
});

export const useSensorContext = () => useContext(SensorContext);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!isLiveDataConfigured()) {
      setIsLive(false);
      return;
    }

    const response = await fetchLatestReading();

    if (response.status === 'ok' && response.data) {
      setReading(response.data);
      setIsLive(true);
      setError(null);
    } else {
      setError(response.message ?? 'Unknown error');
      // Preserve last good reading — do not reset to null
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (isLiveDataConfigured()) {
      intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return (
    <SensorContext.Provider value={{ reading, isLive, error, refresh: fetchData }}>
      {children}
    </SensorContext.Provider>
  );
};
