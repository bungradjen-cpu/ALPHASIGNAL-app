import React from 'react';
import { SignalType, SignalResult } from '../types';
import { ScheduledSignal } from '../services/staticSchedule';
import { ArrowUp, ArrowDown, Ban, Activity, Timer, Radio } from 'lucide-react';
import clsx from 'clsx';

interface SignalCardProps {
  result: SignalResult | null;
  loading: boolean;
  nextSignal?: ScheduledSignal | null;
  timeRemaining?: string;
  isAuto?: boolean;
}

export const SignalCard: React.FC<SignalCardProps> = ({ result, loading, nextSignal, timeRemaining, isAuto }) => {
  const isBuy = result?.signal === SignalType.BUY;
  const isSell = result?.signal === SignalType.SELL;
  const isNoTrade = result?.signal === SignalType.NO_TRADE;

  const borderColor = isBuy ? 'border-alpha-green' : isSell ? 'border-alpha-red' : 'border-alpha-border';
  const glowColor = isBuy ? 'shadow-[0_0_30px_rgba(0,255,148,0.2)]' : isSell ? 'shadow-[0_0_30px_rgba(255,0,60,0.2)]' : '';
  const textColor = isBuy ? 'text-alpha-green' : isSell ? 'text-alpha-red' : 'text-gray-500';

  return (
    <div className={clsx(
      "relative w-full h-full flex flex-col items-center justify-between p-6 rounded-xl border bg-[#080808] transition-all duration-500 overflow-hidden",
      borderColor,
      glowColor
    )}>
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      
      {/* Status Header */}
      <div className="w-full flex justify-between items-center z-10 border-b border-white/5 pb-2">
         <div className="flex items-center space-x-2">
            <Radio className={clsx("w-4 h-4 animate-pulse", isAuto ? "text-alpha-green" : "text-alpha-dim")} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
               {isAuto ? 'TRACKER ACTIVE' : 'MANUAL MODE'}
            </span>
         </div>
         <div className="flex items-center space-x-2 font-mono text-xs text-alpha-gold">
            <Timer className="w-4 h-4" />
            <span>NEXT: {timeRemaining || '--:--'}</span>
         </div>
      </div>

      {/* Main Signal Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
             <div className="relative w-20 h-20">
               <div className="absolute inset-0 border-4 border-alpha-blue/30 rounded-full animate-pulse"></div>
               <div className="absolute inset-0 border-t-4 border-alpha-blue rounded-full animate-spin"></div>
               <Activity className="absolute inset-0 m-auto w-8 h-8 text-alpha-blue animate-pulse" />
             </div>
             <span className="text-alpha-blue font-mono text-sm animate-pulse">PROCESSING DATA...</span>
          </div>
        ) : !result ? (
            <div className="flex flex-col items-center space-y-2 text-gray-600">
                <Ban className="w-16 h-16 opacity-20" />
                <span className="text-sm font-mono uppercase tracking-wider">No Active Signal</span>
                {isAuto && <span className="text-xs text-gray-700">Waiting for scheduled session...</span>}
            </div>
        ) : (
          <>
             <div className="text-6xl font-black mb-2 tracking-tighter flex items-center space-x-4">
               {isBuy && <ArrowUp className="w-16 h-16 text-alpha-green animate-bounce" />}
               {isSell && <ArrowDown className="w-16 h-16 text-alpha-red animate-bounce" />}
               {isNoTrade && <Ban className="w-16 h-16 text-gray-500" />}
               
               <span className={clsx("font-mono", textColor)}>
                 {isBuy ? 'BUY' : isSell ? 'SELL' : 'HOLD'}
               </span>
             </div>
             
             <div className="flex flex-col items-center space-y-1">
               <div className="text-2xl font-mono text-white tracking-widest">
                 {result.timestamp}
               </div>
               {result.confidence && (
                 <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gray-400 border border-white/10 uppercase tracking-widest">
                   Probability: {result.confidence}%
                 </div>
               )}
             </div>
          </>
        )}
      </div>

      {/* Footer: Next Up */}
      {isAuto && nextSignal && (
        <div className="w-full pt-4 border-t border-white/5 z-10">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="uppercase tracking-wider">UP NEXT ({nextSignal.hour.toString().padStart(2,'0')}:{nextSignal.minute.toString().padStart(2,'0')})</span>
            <span className="font-mono text-gray-400">{nextSignal.indexName}</span>
          </div>
        </div>
      )}
    </div>
  );
};
