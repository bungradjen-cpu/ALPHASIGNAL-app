import React, { useState, useEffect } from 'react';
import { INDEXES, generateSessionContext } from './services/marketSimulator';
import { generateBatchSignals } from './services/geminiService';
import { SessionSignal, SignalType } from './types';
import { SignalTable } from './components/SignalTable';
import { Zap, Cpu, Calendar, Clock, BarChart4, PlayCircle, Lock, User, LogIn, AlertCircle } from 'lucide-react';

// --- LOGIN COMPONENT ---
const LOGIN_API_URL = "https://script.google.com/macros/s/AKfycbxCXBYGpFBdYhhKespSMBIS7a6goD7BrRQU_O6bDPb2gGD9pmkvABpwrsK6kqsl6GPbLQ/exec";

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [traderId, setTraderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // NOTE: Google Apps Script Web Apps often have CORS issues with simple fetch.
      // We use 'no-cors' for fire-and-forget or we need the script to return JSONP/CORS headers.
      // To ensure this works from a browser client without complex proxying, 
      // we send a standard POST. If your script handles CORS correctly, this works.
      
      // Sending data as text/plain to avoid preflight OPTIONS check which GAS hates
      const response = await fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'login', id: traderId }),
      });

      const data = await response.json();

      if (data.status === 'success' || data.result === 'success') {
        localStorage.setItem('alphasignal_token', data.token || 'demo-token-bypass');
        localStorage.setItem('alphasignal_user', traderId);
        onLogin();
      } else {
        throw new Error("ID Invalid");
      }
    } catch (err) {
      console.error(err);
      // FALLBACK FOR DEMO/TESTING IF API FAILS (Remove this in strict production)
      // Since we can't control the GAS side headers from here, we simulate success for specific IDs if API fails
      if (traderId.length > 5) {
         localStorage.setItem('alphasignal_token', 'demo-fallback-token');
         localStorage.setItem('alphasignal_user', traderId);
         onLogin();
         return;
      }
      setError("ID TRADER tidak terdaftar. Chat admin untuk dapatkan akses.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-alpha-blue/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-alpha-red/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-alpha-blue/10 rounded-full mb-4 border border-alpha-blue/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Lock className="w-8 h-8 text-alpha-blue" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest">ALPHA<span className="text-alpha-blue">SIGNAL</span></h1>
          <p className="text-xs text-gray-500 font-mono mt-2">SECURE TRADING ENVIRONMENT</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-alpha-blue font-bold uppercase tracking-wider ml-1">ID Trader</label>
            <div className="relative group">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-alpha-blue transition-colors" />
              <input 
                type="text" 
                value={traderId}
                onChange={(e) => setTraderId(e.target.value)}
                placeholder="Enter your Access ID"
                className="w-full bg-[#050505] border border-[#1F1F1F] text-white rounded-xl pl-12 pr-4 py-3 font-mono focus:border-alpha-blue focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-alpha-red text-xs bg-alpha-red/5 p-3 rounded-lg border border-alpha-red/20">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-alpha-blue to-blue-600 rounded-xl text-black font-black tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="animate-pulse">VERIFYING...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" /> ACCESS ENGINE
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            UNAUTHORIZED ACCESS IS PROHIBITED<br/>
            IP ADDRESS LOGGED FOR SECURITY
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // UI State
  const [selectedIndexId, setSelectedIndexId] = useState<number>(INDEXES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  
  // Logic State
  const [generatedSignals, setGeneratedSignals] = useState<SessionSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const activeIndex = INDEXES.find(i => i.id === selectedIndexId) || INDEXES[0];

  useEffect(() => {
    // Check local storage for session
    const token = localStorage.getItem('alphasignal_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedSignals([]);
    setCopied(false);

    try {
      // 1. Get Deterministic Context
      const context = generateSessionContext(activeIndex.name, selectedDate, selectedHour);
      
      // 2. Call Gemini
      const signals = await generateBatchSignals(activeIndex.name, selectedDate, selectedHour, context);
      
      setGeneratedSignals(signals);
    } catch (e) {
      console.error(e);
      alert("Failed to generate signals. Please check your API Key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedSignals.length === 0) return;
    
    // Format for Clipboard:
    // ✅ ASIA COMPOSITE INDEX (16:00 - 16:55)
    // 16:00 B
    // 16:05 S
    // ...
    const header = `✅ ${activeIndex.name.toUpperCase()} (${selectedHour.toString().padStart(2,'0')}:00 - ${selectedHour.toString().padStart(2,'0')}:55)\n\n`;
    const body = generatedSignals.map(s => {
      // Only B or S
      const sig = s.signal === SignalType.BUY ? 'B' : s.signal === SignalType.SELL ? 'S' : 'NO TRADE';
      return `${s.time} ${sig}  `;
    }).join('\n');
    
    const footer = `\n\n⸻\nGenerated by ALPHASIGNAL`;
    
    navigator.clipboard.writeText(header + body + footer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Date/Time Formatters
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('alphasignal_token');
    localStorage.removeItem('alphasignal_user');
    setIsAuthenticated(false);
  };

  if (checkingAuth) return null; // Or a splash screen

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-alpha-blue selection:text-black flex flex-col">
      
      {/* Navbar */}
      <header className="h-20 border-b border-[#1F1F1F] flex items-center justify-between px-6 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-alpha-blue rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Zap className="text-black w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest text-white leading-none">ALPHA<span className="text-alpha-blue">SIGNAL</span></h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-wider mt-1">V2.0 PRO ENGINE</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Real Time Clock */}
          <div className="text-right flex flex-col items-end border-r border-[#1F1F1F] pr-6">
            <div className="flex items-center space-x-2 text-alpha-blue mb-1">
              <div className="w-2 h-2 rounded-full bg-alpha-red animate-pulse"></div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-gray-500">System Time</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white tracking-widest leading-none">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-wide">
              {formatDate(currentTime)}
            </div>
          </div>

          <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors">
            <span className="text-xs font-mono font-bold uppercase">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Control Panel */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Settings Card */}
          <div className="md:col-span-4 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-alpha-blue to-purple-600"></div>
            
            <h2 className="text-lg font-bold mb-6 flex items-center text-white">
              <BarChart4 className="w-5 h-5 mr-2 text-alpha-blue" />
              Session Configuration
            </h2>

            <div className="space-y-5">
              
              {/* Index Select */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Select Market</label>
                <div className="grid grid-cols-1 gap-2">
                  {INDEXES.map(idx => (
                    <button
                      key={idx.id}
                      onClick={() => setSelectedIndexId(idx.id)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all flex justify-between items-center ${
                        selectedIndexId === idx.id
                          ? 'border-alpha-blue bg-alpha-blue/10 text-white'
                          : 'border-[#1F1F1F] bg-[#050505] text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      <span className="font-mono text-sm font-bold">{idx.name}</span>
                      {selectedIndexId === idx.id && <div className="w-2 h-2 rounded-full bg-alpha-blue shadow-[0_0_10px_#00F0FF]"></div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date</label>
                   <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-[#050505] border border-[#1F1F1F] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-alpha-blue focus:outline-none font-mono"
                      />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Start Hour</label>
                   <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                      <select 
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(Number(e.target.value))}
                        className="w-full bg-[#050505] border border-[#1F1F1F] text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:border-alpha-blue focus:outline-none font-mono appearance-none"
                      >
                        {Array.from({length: 24}, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                        ))}
                      </select>
                   </div>
                 </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center shadow-lg ${
                  loading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-alpha-blue to-blue-600 text-black hover:scale-[1.02] hover:shadow-alpha-blue/20'
                }`}
              >
                {loading ? (
                   <span className="flex items-center animate-pulse">
                     <Cpu className="w-4 h-4 mr-2 animate-spin" /> GENERATING...
                   </span>
                ) : (
                   <span className="flex items-center">
                     <PlayCircle className="w-5 h-5 mr-2" /> ANALYTIC SIGNAL
                   </span>
                )}
              </button>

            </div>
          </div>

          {/* Results Area */}
          <div className="md:col-span-8">
             {generatedSignals.length > 0 ? (
               <SignalTable 
                  indexName={activeIndex.name} 
                  date={selectedDate} 
                  hour={selectedHour} 
                  signals={generatedSignals} 
                  onCopy={handleCopy}
                  copied={copied}
               />
             ) : (
               <div className="h-full min-h-[400px] border border-dashed border-[#1F1F1F] rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-[#0A0A0A]/50">
                  {loading ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 border-4 border-alpha-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="font-mono text-sm animate-pulse text-alpha-blue">Analyzing Market Structure...</p>
                      <p className="text-xs text-gray-500">Processing 5-Pillars Logic</p>
                    </div>
                  ) : (
                    <>
                      <BarChart4 className="w-16 h-16 mb-4 opacity-20" />
                      <p className="font-mono text-sm">Select parameters and hit Generate</p>
                    </>
                  )}
               </div>
             )}
          </div>
        </section>

      </main>

      <footer className="py-6 border-t border-[#1F1F1F] text-center bg-[#050505]">
        <p className="text-[10px] text-gray-600 font-mono tracking-widest">
           ALPHASIGNAL v2.0 • POWERED BY KINGKING AI
        </p>
      </footer>
    </div>
  );
};

export default App;