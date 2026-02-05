
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
    title: lang === 'bn' ? 'এআই সহায়ক' : 'AI Assistant',
    placeholder: lang === 'bn' ? 'কিছু জিজ্ঞেস করুন...' : 'Ask something...',
    welcome: lang === 'bn' ? 'হ্যালো! আমি আপনার ডিজিটাল খাতা সহকারী। আপনার দোকানের হিসাব বা স্টক নিয়ে কোনো প্রশ্ন আছে?' : 'Hello! I am your Digital Khata assistant. Ask me anything about your shop stats or stock.',
    error: lang === 'bn' ? 'দুঃখিত, এআই সার্ভারের সাথে সংযোগ করা যাচ্ছে না। দয়া করে আপনার হোস্টিং (Netlify/Cloudflare) সেটিংস থেকে API_KEY যুক্ত করুন।' : 'Connection failed. Please ensure API_KEY is configured in your hosting environment variables.',
    thinking: lang === 'bn' ? 'এআই চিন্তা করছে...' : 'Thinking...'
  };

  const generateSystemInstruction = () => {
    const lowStock = data.products.filter(p => p.stock <= (p.lowStockThreshold || 10)).map(p => p.name).join(', ');
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalSales = data.stockOutLogs.reduce((acc, l) => acc + l.totalPrice, 0);

    return `You are "First Step Assistant", a specialized business AI for this shop management app.
    Current Stats:
    - Total Sales: ৳${totalSales}
    - Total Dues from Customers: ৳${totalDue}
    - Low Stock Products: ${lowStock || 'Inventory is healthy'}.
    - Language: Respond strictly in ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
    - Note: Refer to special expenses as "Ananya Expense" (অনন্যা ব্যায়).`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    const currentMessages = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(currentMessages);
    setIsLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        console.error("Missing API_KEY: Please set it in your Netlify/Cloudflare Environment Variables.");
        throw new Error("Missing API Key");
      }

      // Rule: Always create a new instance right before the call
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
          temperature: 0.8,
        },
      });

      const botText = response.text;
      if (!botText) throw new Error("No response body");
      
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 w-[320px] md:w-[380px] h-[520px] flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-slate-950 p-5 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-microchip text-lg"></i>
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-widest">{t.title}</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase">Live Engine</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
            <div className="flex gap-2">
               <div className="bg-emerald-100 text-emerald-900 p-4 rounded-2xl rounded-tl-none text-xs font-bold border border-emerald-200 shadow-sm max-w-[85%]">
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

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="relative flex items-center gap-2">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={t.placeholder}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-30 shadow-lg"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-950 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl hover:bg-black transition transform active:scale-90 border-4 border-slate-800 relative group"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-dots'} transition-transform group-hover:rotate-12`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
