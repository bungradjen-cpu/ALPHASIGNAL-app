import { MarketIndex, SessionContext, Trend } from '../types';

export const INDEXES: MarketIndex[] = [
  { id: 1, name: 'Asia Composite Index', volatilityRange: { low: 0.8, high: 2.1 }, activeHours: { start: 7, end: 17 }, riskProfile: 'medium' },
  { id: 2, name: 'Europe Composite Index', volatilityRange: { low: 0.6, high: 1.9 }, activeHours: { start: 13, end: 23 }, riskProfile: 'low' },
  { id: 3, name: 'Nusantara Halal Index', volatilityRange: { low: 0.4, high: 1.2 }, activeHours: { start: 9, end: 21 }, riskProfile: 'low' },
  { id: 4, name: 'Crypto Composite Index', volatilityRange: { low: 1.5, high: 5.8 }, activeHours: { start: 0, end: 24 }, riskProfile: 'high' },
];

// 1. Deterministic Random Number Generator (Seeded)
// This ensures that for the same Index + Date + Hour, the "Market Data" is identical.
const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

export const generateSessionContext = (indexName: string, dateStr: string, hour: number): SessionContext => {
  const seedKey = `${indexName}-${dateStr}-${hour}`;
  const seed = hashCode(seedKey);
  const rng = seededRandom(seed); // Initialize deterministic RNG

  const index = INDEXES.find(i => i.name === indexName) || INDEXES[0];

  // 2. Generate Simulated Price History (Last 20 candles context)
  // We simulate the "End" of the previous hour to give context for the new hour.
  const priceHistory = [];
  let lastClose = 10000 + (rng() * 2000 - 1000);
  
  // Establish a base trend for this specific hour context
  const hourTrendBias = (rng() - 0.5) * 1.5; // -0.75 to +0.75

  for (let i = 0; i < 12; i++) { // 12 candles * 5 min = 1 hour context
    const volatility = index.volatilityRange.low + rng() * (index.volatilityRange.high - index.volatilityRange.low);
    const change = lastClose * (volatility / 100) * (rng() - 0.5 + (hourTrendBias * 0.2));
    
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) + rng() * 10;
    const low = Math.min(open, close) - rng() * 10;
    
    lastClose = close;

    priceHistory.push({
      timestamp: `${hour - 1}:${(i * 5).toString().padStart(2, '0')}`, // Previous hour context
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      candle_body: Math.abs(close - open).toFixed(2),
      wick_top: (high - Math.max(open, close)).toFixed(2),
      wick_bottom: (Math.min(open, close) - low).toFixed(2)
    });
  }

  // 3. Generate Market Structure Data
  const trendEnum = hourTrendBias > 0.2 ? 'bullish' : hourTrendBias < -0.2 ? 'bearish' : 'sideways';
  const structureValid = Math.floor(70 + rng() * 30); // 70-100

  // 4. Generate Rejection Zones
  const support = Math.min(...priceHistory.map(p => p.low)) - (rng() * 50);
  const resistance = Math.max(...priceHistory.map(p => p.high)) + (rng() * 50);

  // 5. Construct the "Database" Object
  return {
    index_master: {
      index_id: index.id,
      index_name: index.name,
      volatility_range: index.volatilityRange,
      active_session: { start: `${index.activeHours.start}:00`, end: `${index.activeHours.end}:00` },
      risk_profile: index.riskProfile
    },
    price_history: priceHistory, // Context data
    market_structure: {
      trend: trendEnum,
      bos: rng() > 0.6 ? (hourTrendBias > 0 ? 'up' : 'down') : 'none',
      choch: rng() > 0.8 ? (hourTrendBias > 0 ? 'down' : 'up') : 'none',
      structure_validity: structureValid
    },
    momentum_data: {
      momentum_score: Math.floor(rng() * 100),
      dominant_direction: trendEnum,
      volatility: (rng() * 10).toFixed(2)
    },
    rejection_zone: {
      support_level: parseFloat(support.toFixed(2)),
      resistance_level: parseFloat(resistance.toFixed(2)),
      touch_count: Math.floor(rng() * 5),
      confidence: Math.floor(rng() * 100)
    },
    session_risk: {
      risk_level: rng() > 0.8 ? 'high' : 'low', // Occasional high risk
      cause: rng() > 0.8 ? 'News Event / Spike' : 'Normal Market'
    },
    system_time: `${dateStr} ${hour.toString().padStart(2, '0')}:00:00`
  };
};
