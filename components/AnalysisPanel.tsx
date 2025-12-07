import React from 'react';
import { SignalResult } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AnalysisPanelProps {
  data: SignalResult | null;
  loading: boolean;
}

const PillarItem = ({ label, active, loading }: { label: string, active: boolean, loading: boolean }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border ${active ? 'border-alpha-green/20 bg-alpha-green/5' : 'border-alpha-border bg-alpha-card'}`}>
    <span className="text-sm text-gray-300 font-mono">{label}</span>
    {loading ? (
       <div className="w-4 h-4 rounded-full border-2 border-alpha-dim border-t-transparent animate-spin" />
    ) : active ? (
      <CheckCircle2 className="w-5 h-5 text-alpha-green" />
    ) : (
      <XCircle className="w-5 h-5 text-alpha-dim" />
    )}
  </div>
);

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data, loading }) => {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-alpha-border">
        <ShieldCheck className="w-5 h-5 text-alpha-blue" />
        <h2 className="text-sm font-bold tracking-wider text-alpha-blue uppercase">5 Pillars Analysis</h2>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        <PillarItem label="1. Market Structure" active={data?.pillars.structure ?? false} loading={loading} />
        <PillarItem label="2. Momentum (MSI)" active={data?.pillars.momentum ?? false} loading={loading} />
        <PillarItem label="3. Rejection Zone" active={data?.pillars.rejection ?? false} loading={loading} />
        <PillarItem label="4. Volatility Check" active={data?.pillars.volatility ?? false} loading={loading} />
        <PillarItem label="5. Multi-Filter Valid" active={data?.pillars.validation ?? false} loading={loading} />
      </div>

      <div className="p-4 bg-alpha-card border border-alpha-border rounded-lg mt-auto">
        <div className="flex items-center space-x-2 mb-2 text-alpha-gold">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">AI Reasoning</span>
        </div>
        <p className="text-xs text-gray-400 font-mono leading-relaxed h-24 overflow-y-auto">
          {loading ? "Analyzing market vector patterns..." : data?.reasoning || "Waiting for signal generation..."}
        </p>
      </div>
    </div>
  );
};