
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
    title: lang === 'bn' ? 'এআই খাতা সহকারী' : 'AI Assistant',
    placeholder: lang === 'bn' ? 'হিসাব বা স্টক নিয়ে কিছু জিজ্ঞেস করুন...' : 'Ask about stock or stats...',
    welcome: lang === 'bn' ? 'হ্যালো! আমি আপনার ডিজিটাল খাতা এআই। আমি আপনার দোকানের হিসাব এবং স্টক এনালাইসিস করতে পারি। আপনি কি জানতে চান?' : 'Hello! I am your Digital Khata AI. I can analyze your shop stats and stock. What do you want to know?',
    error: lang === 'bn' ? 'দুঃখিত, এআই সার্ভারের সাথে সংযোগ করা যাচ্ছে না। দয়া করে আপনার হোস্টিং (Netlify/Cloudflare) সেটিংসে API_KEY ভেরিয়েবলটি চেক করুন।' : 'Connection failed. Please check your API_KEY in hosting (Netlify/Cloudflare) settings.',
    thinking: lang === 'bn' ? 'এআই হিসাব করছে...' : 'AI is thinking...'
  };

  const generateSystemInstruction = () => {
    const lowStock = data.products.filter(p => p.stock <= (p.lowStockThreshold || 10)).map(p => p.name).join(', ');
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalSales = data.stockOutLogs.reduce((acc, l) => acc + l.totalPrice, 0);

    return `You are "First Step Business AI", an expert shop management assistant.
    Context Data:
    - Shop Name: FIRST STEP
    - Total Sales to date: ৳${totalSales}
    - Total Customer Dues: ৳${totalDue}
    - Critical Low Stock: ${lowStock || 'All items are well stocked'}.
    - Expenses: Referred to as "Ananya Expense" (অনন্যা ব্যায়).
    - Task: Answer business questions concisely. 
    - Response Language: ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("Missing API Key");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: generateSystemInstruction(),
          temperature: 0.7,
        },
      });

      const botText = response.text || (lang === 'bn' ? 'আমি উত্তর দিতে পারছি না।' : 'I cannot provide an answer right now.');
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 w-[330px] md:w-[400px] h-[550px] flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-slate-950 p-5 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/30">
                <i className="fas fa-robot text-lg"></i>
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">{t.title}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Powered by Gemini 3</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">
              <i className="fas fa-times text-slate-400"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80 custom-scrollbar">
            <div className="flex gap-2">
               <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl rounded-tl-none text-xs font-bold border border-emerald-200 shadow-sm max-w-[90%]">
                 {t.welcome}
               </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl text-xs font-bold shadow-sm max-w-[85%] leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none text-slate-400 border border-slate-100 italic text-[9px] font-black uppercase flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  {t.thinking}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="relative flex items-center gap-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t.placeholder}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-30 shadow-xl shadow-emerald-900/20 active:scale-95"
              >
                <i className="fas fa-paper-plane text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-950 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-black transition transform active:scale-90 border-4 border-slate-800 group relative"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} transition-transform group-hover:rotate-12`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse flex items-center justify-center">
             <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
