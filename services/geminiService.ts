import { GoogleGenAI, Type } from "@google/genai";
import { SessionContext, SessionSignal, BatchResponseSchema, SignalType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateBatchSignals = async (
  indexName: string,
  date: string,
  hour: number,
  contextData: SessionContext
): Promise<SessionSignal[]> => {
  if (!apiKey) throw new Error("API Key missing");

  // Format the simulated DB data into a readable string for the LLM
  const databaseDump = JSON.stringify(contextData, null, 2);

  const systemInstruction = `
ROLE: Signal Engine (ALPHASIGNAL)
TARGET ACCURACY: 99%
MODE: BATCH GENERATION (1 Hour Session)

Anda adalah Signal Engine dengan akurasi tinggi.
Gunakan instruksi ini untuk memproduksi 12 sinyal binary trading (interval 5 menit) untuk durasi 1 jam.

5 PILAR ANALISA (Core Logic):
1️⃣ Struktur Market (Trend, BOS, ChoCH). Ikuti trend kuat, entry di retest BOS, awas reversal ChoCH.
2️⃣ Momentum Strength Index (MSI). Momentum bullish -> BUY. Bearish -> SELL. Lemah -> Tunggu.
3️⃣ Area Sensitif / Rejection Zone. Support/Resistance + Rejection Wick = Sinyal Kuat.
4️⃣ Volatilitas & Agresivitas. Market agresif/spike -> NO_TRADE.
5️⃣ Validasi Multi-Filter. Minimal 3/5 filter valid untuk HIGH PROBABILITY.

OUTPUT FORMAT:
Anda harus menghasilkan array JSON berisi 12 sinyal untuk menit: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55.
Setiap sinyal harus berupa 'B' (Buy) atau 'S' (Sell). Gunakan 'NO_TRADE' jika sangat berisiko.

RULES KHUSUS:
- Tidak boleh menyalin sinyal sebelumnya (Ping-pong pattern sederhana dilarang kecuali struktur mendukung).
- Prioritaskan akurasi.
- Jika market data menunjukkan "High Risk" atau "Sideways Parah", gunakan logika defensif.
- Output harus konsisten dengan data "DATABASE MARKET" yang diberikan.
`;

  const prompt = `
TASK: Generate 12 Signals for ${indexName}
DATE: ${date}
SESSION HOUR: ${hour}:00 - ${hour}:55

INPUT DATABASE CONTEXT (Simulated Real-time Data):
${databaseDump}

INSTRUCTION:
Analyze the provided context (Trend, Momentum, Rejection Levels) for this specific hour.
Predict the price action for the next 12 intervals (5-minute candles).
Return a JSON Object containing the schedule.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            index_name: { type: Type.STRING },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "HH:MM format, e.g., 16:00" },
                  signal: { type: Type.STRING, enum: ["B", "S", "NO_TRADE"] },
                  confidence: { type: Type.NUMBER },
                  logic_short: { type: Type.STRING, description: "Alasan singkat (max 5 words)" }
                },
                required: ["time", "signal", "logic_short"]
              }
            }
          },
          required: ["signals"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const json = JSON.parse(text) as BatchResponseSchema;

    return json.signals.map(s => {
      let sig = SignalType.NO_TRADE;
      if (s.signal === 'B') sig = SignalType.BUY;
      if (s.signal === 'S') sig = SignalType.SELL;
      
      // Ensure time is formatted correctly if AI misses the hour prefix
      let timeStr = s.time;
      if (!timeStr.includes(':')) {
         timeStr = `${hour}:${timeStr}`;
      } else if (timeStr.length === 5 && !timeStr.startsWith(hour.toString().padStart(2, '0'))) {
         // Force correct hour to match request
         const minutes = timeStr.split(':')[1];
         timeStr = `${hour.toString().padStart(2, '0')}:${minutes}`;
      }

      return {
        time: timeStr,
        signal: sig,
        confidence: s.confidence || 90,
        logic_note: s.logic_short
      };
    });

  } catch (error) {
    console.error("Gemini Batch Error:", error);
    // Return empty or error state
    return [];
  }
};
