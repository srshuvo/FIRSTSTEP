
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
    welcome: lang === 'bn' ? 'হ্যালো! আমি আপনার ডিজিটাল খাতা সহকারী। আমি কীভাবে আপনাকে সাহায্য করতে পারি?' : 'Hello! I am your Digital Khata assistant. How can I help you today?',
    error: lang === 'bn' ? 'দুঃখিত, কোনো সমস্যা হয়েছে।' : 'Sorry, something went wrong.'
  };

  const generateSystemInstruction = () => {
    const lowStock = data.products.filter(p => p.stock <= (p.lowStockThreshold || 10)).map(p => p.name).join(', ');
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalSales = data.stockOutLogs.reduce((acc, l) => acc + l.totalPrice, 0);

    return `You are a helpful business assistant for a shop called "FIRST STEP". 
    Context:
    - Current Language: ${lang === 'bn' ? 'Bengali' : 'English'}. Respond strictly in this language.
    - Shop Stats: Total Sales is ৳${totalSales}, Total Customer Due is ৳${totalDue}.
    - Inventory: Items low on stock are: ${lowStock || 'None'}.
    - Data: You have access to products, customers, and transaction logs.
    Answer concisely and professionally. Focus on helping the owner manage their inventory and sales better.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: generateSystemInstruction(),
        },
        history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }))
      });

      const response = await chat.sendMessage({ message: userMsg });
      const botText = response.text || t.error;
      
      setMessages(prev => [...prev, { role: 'model', text: botText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] no-print">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-3xl shadow-2xl border border-gray-100 w-[320px] md:w-[380px] h-[500px] flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-emerald-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center animate-pulse">
                <i className="fas fa-robot text-xs"></i>
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tighter">{t.title}</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[8px] font-bold text-emerald-300 uppercase">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-emerald-300 hover:text-white transition">
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
            <div className="flex gap-2">
               <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl rounded-tl-none text-xs font-bold shadow-sm max-w-[85%]">
                 {t.welcome}
               </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl text-xs font-bold shadow-sm max-w-[85%] ${
                  m.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none text-gray-400 border border-gray-100 italic text-[10px] font-black uppercase flex items-center gap-2">
                  <i className="fas fa-circle-notch fa-spin"></i> {lang === 'bn' ? 'এআই চিন্তা করছে...' : 'AI is thinking...'}
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
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-900 text-white rounded-full shadow-2xl flex items-center justify-center text-xl hover:bg-black transition transform active:scale-90 border-4 border-emerald-800/20 group relative"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} group-hover:rotate-12 transition-transform`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
