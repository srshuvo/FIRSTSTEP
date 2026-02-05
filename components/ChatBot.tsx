
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppData } from '../types';

interface ChatBotProps {
  data: AppData;
  lang: 'bn' | 'en';
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ data, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const t = {
    title: lang === 'bn' ? 'ফার্স্ট স্টেপ এআই' : 'First Step AI',
    placeholder: lang === 'bn' ? 'হিসাব বা স্টক নিয়ে কিছু জিজ্ঞেস করুন...' : 'Ask about stock or stats...',
    welcome: lang === 'bn' ? 'হ্যালো! আমি আপনার দোকানের এআই অ্যাসিস্ট্যান্ট। আমি আপনার লাভ-ক্ষতি এবং স্টক এনালাইসিস করতে প্রস্তুত। কী জানতে চান?' : 'Hello! I am your AI assistant. I can analyze your profit/loss and stock levels. What can I do for you?',
    error: lang === 'bn' ? 'দুঃখিত, এপিআই কানেকশন পাওয়া যাচ্ছে না। দয়া করে নিশ্চিত করুন আপনার হোস্টিং প্যানেলে (Netlify/Cloudflare) API_KEY সঠিকভাবে যুক্ত করা হয়েছে।' : 'Connection failed. Ensure API_KEY is correctly configured in your hosting dashboard.',
    thinking: lang === 'bn' ? 'হিসাব করছি...' : 'Thinking...'
  };

  const generateSystemInstruction = () => {
    const lowStock = data.products.filter(p => p.stock <= (p.lowStockThreshold || 10)).map(p => p.name).join(', ');
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalSales = data.stockOutLogs.reduce((acc, l) => acc + l.totalPrice, 0);

    return `You are "First Step Assistant", an expert retail business AI.
    Shop Stats:
    - Total Sales: ৳${totalSales}
    - Customer Debts (Due): ৳${totalDue}
    - Low Stock Products: ${lowStock || 'None'}.
    - "Ananya Expense" (অনন্যা ব্যায়) is used for other shop expenses.
    Rules:
    - Be professional and concise.
    - Language: ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
    - Do not show any code. Only text-based business advice and stats analysis.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Create fresh instance as per rules
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_NOT_FOUND");

      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: generateSystemInstruction(),
          temperature: 0.8,
        },
      });

      const botText = response.text || "No response.";
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (err) {
      console.error("AI connection error:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[110] no-print">
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-100 w-[340px] md:w-[420px] h-[580px] flex flex-col overflow-hidden animate-scale-in">
          {/* AI Header */}
          <div className="bg-slate-950 p-6 text-white flex justify-between items-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/30 group">
                <i className="fas fa-brain text-xl group-hover:scale-110 transition-transform"></i>
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-[0.2em]">{t.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Khata Engine</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition">
              <i className="fas fa-times text-slate-400"></i>
            </button>
          </div>

          {/* Chat Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50 custom-scrollbar">
            <div className="flex gap-3">
               <div className="bg-emerald-100 text-emerald-900 p-4 rounded-[2rem] rounded-tl-none text-xs font-bold border border-emerald-200 shadow-sm max-w-[85%] leading-relaxed">
                 {t.welcome}
               </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-[1.8rem] text-xs font-bold shadow-sm max-w-[88%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none text-slate-400 border border-slate-100 italic text-[10px] font-black uppercase flex items-center gap-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  {t.thinking}
                </div>
              </div>
            )}
          </div>

          {/* Input Panel */}
          <div className="p-5 bg-white border-t border-gray-100">
            <div className="relative flex items-center gap-3">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t.placeholder}
                className="flex-1 bg-gray-100/80 border border-gray-200 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-30 shadow-xl shadow-emerald-900/10 active:scale-95 group"
              >
                <i className="fas fa-paper-plane group-hover:rotate-12 transition-transform"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-950 text-white rounded-full shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-center text-2xl hover:bg-black transition transform active:scale-90 border-4 border-slate-800 group relative"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-wand-magic-sparkles'} transition-transform group-hover:rotate-12`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
             <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
