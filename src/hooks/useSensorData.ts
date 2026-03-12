// ═══════════════════════════════════════════════════════════════════════════════
//  useSensorData — thin wrapper around SensorContext
// ═══════════════════════════════════════════════════════════════════════════════
//  Polling now lives in SensorContext (mounted once at app level) so readings
//  survive screen navigation.  This hook just reads from that shared state.
// ═══════════════════════════════════════════════════════════════════════════════

import { SensorReading } from '../utils/sensorData';
import { useSensorContext } from '../context/SensorContext';

export interface UseSensorDataResult {
  reading: SensorReading | null;
  isLive: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSensorData(): UseSensorDataResult {
  return useSensorContext();
}
