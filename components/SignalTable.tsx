import React from 'react';
import { SessionSignal, SignalType } from '../types';
import { Copy, CheckCircle2, AlertOctagon } from 'lucide-react';

interface SignalTableProps {
  indexName: string;
  date: string;
  hour: number;
  signals: SessionSignal[];
  onCopy: () => void;
  copied: boolean;
}

export const SignalTable: React.FC<SignalTableProps> = ({ indexName, date, hour, signals, onCopy, copied }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="w-full bg-alpha-card border border-alpha-border rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-alpha-border bg-alpha-dark flex justify-between items-center">
        <div>
           <h2 className="text-alpha-blue font-bold tracking-wider text-lg">{indexName.toUpperCase()}</h2>
           <p className="text-xs text-gray-500 font-mono">SESSION: {date} | {hour.toString().padStart(2,'0')}:00 - {hour.toString().padStart(2,'0')}:55</p>
        </div>
        <button 
          onClick={onCopy}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${
            copied 
            ? 'bg-alpha-green/20 text-alpha-green border border-alpha-green' 
            : 'bg-alpha-border text-gray-300 hover:bg-white/10 border border-transparent'
          }`}
        >
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy List'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-gray-400 font-mono uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Time</th>
              <th className="px-6 py-3 text-center">Signal</th>
              <th className="px-6 py-3">Logic / Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-alpha-border">
            {signals.map((s, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-300">
                  {s.time}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-black text-xl shadow-lg border-2 ${
                    s.signal === SignalType.BUY 
                    ? 'bg-alpha-green/10 text-alpha-green border-alpha-green/50 shadow-[0_0_15px_rgba(0,255,148,0.3)]' 
                    : s.signal === SignalType.SELL 
                    ? 'bg-alpha-red/10 text-alpha-red border-alpha-red/50 shadow-[0_0_15px_rgba(255,0,60,0.3)]'
                    : 'bg-gray-800 text-gray-500 border-gray-600'
                  }`}>
                    {s.signal === SignalType.BUY ? 'B' : s.signal === SignalType.SELL ? 'S' : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {s.signal === SignalType.NO_TRADE ? (
                       <span className="text-gray-500 italic flex items-center">
                         <AlertOctagon className="w-3 h-3 mr-1" /> Risk Too High
                       </span>
                    ) : (
                       <span className="text-gray-400 text-xs font-mono uppercase tracking-tight">
                         {s.logic_note}
                       </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
