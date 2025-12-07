import { SignalType } from '../types';

export interface ScheduledSignal {
  hour: number;
  minute: number;
  signal: SignalType;
  indexName: string;
}

// Helper to expand pattern (5 minute intervals)
const expand = (hour: number, signals: string[], indexName: string): ScheduledSignal[] => {
  return signals.map((s, i) => ({
    hour,
    minute: i * 5,
    signal: s === 'B' ? SignalType.BUY : SignalType.SELL,
    indexName
  }));
}

// Data from user prompt - Updated with new Index Names
export const STATIC_SCHEDULE: ScheduledSignal[] = [
  // ASIA COMPOSITE (16:00 - 16:55)
  ...expand(16, ['B','B','B','S','S','S','B','B','S','S','B','B'], 'Asia Composite Index'),
  
  // CRYPTO COMPOSITE (17:00 - 17:55)
  ...expand(17, ['S','S','B','B','B','S','S','B','B','S','S','B'], 'Crypto Composite Index'),
  
  // EUROPE COMPOSITE (18:00 - 18:55) -> Eropa Composite Index
  ...expand(18, ['B','B','S','S','B','B','B','S','S','S','B','B'], 'Eropa Composite Index'),
  
  // NUSANTARA HALAL (19:00 - 19:55)
  ...expand(19, ['S','S','B','B','S','S','B','B','S','S','B','B'], 'Nusantara Halal Index'),
  
  // ASIA COMPOSITE (20:00 - 20:55)
  ...expand(20, ['B','B','B','S','S','S','B','B','S','S','B','B'], 'Asia Composite Index'),
  
  // CRYPTO COMPOSITE (21:00 - 21:55)
  ...expand(21, ['S','S','S','B','B','B','S','S','B','B','S','S'], 'Crypto Composite Index'),
  
  // EUROPE COMPOSITE (22:00 - 22:55) -> Eropa Composite Index
  ...expand(22, ['B','B','S','S','S','B','B','S','S','B','B','B'], 'Eropa Composite Index'),
  
  // NUSANTARA HALAL (23:00 - 23:55)
  ...expand(23, ['B','B','B','S','S','S','B','B','S','S','B','B'], 'Nusantara Halal Index'),
];

export const getScheduledSignal = (date: Date): ScheduledSignal | null => {
  const h = date.getHours();
  const m = date.getMinutes();
  
  // Find matching 5-minute slot
  const slotMinute = Math.floor(m / 5) * 5;
  
  return STATIC_SCHEDULE.find(s => s.hour === h && s.minute === slotMinute) || null;
};

export const getNextSignal = (date: Date): ScheduledSignal | null => {
  const h = date.getHours();
  const m = date.getMinutes();
  const currentSlotMinute = Math.floor(m / 5) * 5;
  
  // Find the first signal that is strictly after current slot
  for (const s of STATIC_SCHEDULE) {
    if (s.hour > h || (s.hour === h && s.minute > currentSlotMinute)) {
      return s;
    }
  }
  if (STATIC_SCHEDULE.length > 0) return STATIC_SCHEDULE[0];
  return null;
};