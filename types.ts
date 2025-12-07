export enum Trend {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  SIDEWAYS = 'sideways',
}

export enum SignalType {
  BUY = 'B',
  SELL = 'S',
  NO_TRADE = 'NO_TRADE',
}

export interface MarketIndex {
  id: number;
  name: string;
  volatilityRange: { low: number; high: number };
  activeHours: { start: number; end: number; };
  riskProfile: 'low' | 'medium' | 'high';
}

// Added Candle interface for CandleChart
export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  candle_body?: string | number;
  wick_top?: string | number;
  wick_bottom?: string | number;
}

export interface SessionContext {
  index_master: any;
  price_history: Candle[];
  market_structure: any;
  momentum_data: any;
  rejection_zone: any;
  session_risk: any;
  system_time: string;
}

export interface SessionSignal {
  time: string; // "16:00"
  signal: SignalType;
  confidence: number;
  logic_note: string; // Short reason
}

// Added SignalResult interface for AnalysisPanel and SignalCard
export interface SignalResult {
  signal: SignalType;
  timestamp: string;
  confidence: number;
  reasoning: string;
  pillars: {
    structure: boolean;
    momentum: boolean;
    rejection: boolean;
    volatility: boolean;
    validation: boolean;
  };
}

export interface BatchResponseSchema {
  session_id: string;
  index_name: string;
  signals: {
    time: string;
    signal: string;
    confidence: number;
    logic_short: string;
  }[];
}
