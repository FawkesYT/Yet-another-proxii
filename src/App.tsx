import React, { useState, useRef } from 'react';
import { Globe, Send, Shield, Code, AlertCircle, Loader2, Copy, Search, ExternalLink, History, Star, Settings, Lock, Zap, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
}

type ViewMode = 'web' | 'api';

export default function App() {
  const [urlInput, setUrlInput] = useState('https://www.wikipedia.org');
  const [activeUrl, setActiveUrl] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('web');
  
  // API Mode State
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [apiResponse, setApiResponse] = useState<ProxyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!urlInput) return;
    
    let target = urlInput;
    if (!target.startsWith('http')) {
      target = 'https://' + target;
    }
    
    setActiveUrl(target);
    if (viewMode === 'api') {
      handleProxyRequest(target);
    }
  };

  const handleProxyRequest = async (target: string) => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        throw new Error('Invalid JSON in Headers');
      }

      let parsedBody = undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON in Body');
        }
      }

      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
          method,
          headers: parsedHeaders,
          body: parsedBody,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Request failed');
      
      setApiResponse(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { name: 'Google', url: 'https://www.google.com', color: 'bg-blue-500' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org', color: 'bg-gray-700' },
    { name: 'Reddit', url: 'https://www.reddit.com', color: 'bg-orange-500' },
    { name: 'GitHub', url: 'https://github.com', color: 'bg-black' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', color: 'bg-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E4E6EB] font-sans selection:bg-indigo-500/30">
      {/* Top Navigation / Browser Bar */}
      <header className="bg-[#1C1F26] border-b border-white/5 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => setActiveUrl('')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block">Croxy<span className="text-indigo-500">AI</span></span>
          </div>

          {/* URL Bar */}
          <form onSubmit={handleGo} className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-500 transition-colors">
                <Globe size={18} />
              </div>
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter URL or search term..."
                className="w-full pl-12 pr-4 py-2.5 bg-[#2A2E37] border border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:bg-[#323742] transition-all outline-none text-white placeholder:text-white/20"
              />
            </div>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              Go <Send size={14} />
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="flex bg-[#2A2E37] p-1 rounded-xl border border-white/5 shrink-0">
            <button 
              onClick={() => setViewMode('web')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'web' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
            >
              <Layout size={14} /> Web
            </button>
            <button 
              onClick={() => setViewMode('api')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'api' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
            >
              <Code size={14} /> API
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {!activeUrl ? (
          /* Landing Page Style */
          <div className="max-w-4xl mx-auto py-20 text-center space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter leading-tight">
                The most advanced <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">free web proxy.</span>
              </h2>
              <p className="text-white/40 text-lg max-w-2xl mx-auto">
                Access any website securely, bypass filters, and protect your privacy with our high-speed AI-powered proxy infrastructure.
              </p>
            </motion.div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {quickLinks.map((link) => (
                <motion.button
                  key={link.name}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setUrlInput(link.url);
                    setActiveUrl(link.url);
                  }}
                  className="bg-[#1C1F26] p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group flex flex-col items-center gap-4"
                >
                  <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                    <Globe size={24} />
                  </div>
                  <span className="font-bold text-sm">{link.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              {[
                { icon: <Shield />, title: 'Fully Anonymous', desc: 'Your IP address is hidden from the target website.' },
                { icon: <Lock />, title: 'SSL Encrypted', desc: 'All traffic is encrypted between you and our servers.' },
                { icon: <Zap />, title: 'Ultra Fast', desc: 'Optimized routing for the best possible browsing speed.' },
              ].map((f, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-2xl text-left border border-white/5">
                  <div className="text-indigo-400 mb-4">{f.icon}</div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/40">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Proxy View */
          <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
            {viewMode === 'web' ? (
              <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                <iframe 
                  ref={iframeRef}
                  src={`/proxy/view?url=${encodeURIComponent(activeUrl)}`}
                  className="w-full h-full border-none"
                  title="Proxy View"
                />
                {/* Floating Info */}
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 text-xs font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Browsing via CroxyAI Proxy
                  <div className="w-px h-3 bg-white/20" />
                  <span className="text-white/40 truncate max-w-[200px]">{activeUrl}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                {/* API Config */}
                <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="bg-[#1C1F26] p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Request Config</h3>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/20 mb-2">Method</label>
                      <select 
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#2A2E37] border border-white/5 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none cursor-pointer"
                      >
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/20 mb-2">Headers (JSON)</label>
                      <textarea 
                        value={headers}
                        onChange={(e) => setHeaders(e.target.value)}
                        className="w-full px-4 py-3 bg-[#2A2E37] border border-white/5 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none h-32 resize-none"
                      />
                    </div>

                    {method !== 'GET' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/20 mb-2">Body (JSON)</label>
                        <textarea 
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="w-full px-4 py-3 bg-[#2A2E37] border border-white/5 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none h-48 resize-none"
                        />
                      </motion.div>
                    )}

                    <button 
                      onClick={() => handleProxyRequest(activeUrl)}
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : 'Refetch Data'}
                    </button>
                  </div>
                </div>

                {/* API Response */}
                <div className="lg:col-span-8 bg-[#1C1F26] rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code size={16} className="text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-widest">Raw Output</span>
                    </div>
                    {apiResponse && (
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${apiResponse.status < 300 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {apiResponse.status} {apiResponse.statusText}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-6 overflow-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                          <Loader2 className="animate-spin w-10 h-10 text-indigo-500" />
                          <p className="text-xs font-bold uppercase tracking-widest">Intercepting Traffic...</p>
                        </div>
                      ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex gap-4">
                          <AlertCircle className="text-red-500 shrink-0" size={20} />
                          <div>
                            <h4 className="font-bold text-sm text-red-400 mb-1">Proxy Error</h4>
                            <p className="text-xs text-red-400/80">{error}</p>
                          </div>
                        </div>
                      ) : apiResponse ? (
                        <div className="space-y-6">
                          <pre className="text-[13px] font-mono text-indigo-300 leading-relaxed">
                            {JSON.stringify(apiResponse.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                          <Search size={48} />
                          <p className="text-xs font-bold uppercase tracking-widest">No data captured yet</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
