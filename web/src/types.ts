export interface Device {
  mac: string;
  status: 'active' | 'expired';
  granted_at: string;
  expires_at: string;
  duration_minutes: number;
  time_left_minutes: number;
  signal_info?: string;
}

export interface DevicesResponse {
  devices: Device[];
  count: number;
}

export interface LogEntry {
  type: 'log' | 'connected';
  message: string;
  timestamp: string;
}
