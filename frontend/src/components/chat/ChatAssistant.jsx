import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../common/Icons'; 
import { API_URL } from '../../utils/helpers';

// --- ICONS ---
const SendIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

const SmartBotIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="4" y="4" width="16" height="12" rx="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 10H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 14C9 14 10.5 15 12 15C13.5 15 15 14 15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="3" r="1" fill="currentColor"/>
    <path d="M2 10L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 10L22 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BoldBotIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2V5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="12" cy="2" r="1.5" fill="currentColor"/>
    <rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"/>
    <circle cx="15.5" cy="11.5" r="1.5" fill="currentColor"/>
    <path d="M9 16C9 16 10 17 12 17C14 17 15 16 15 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ChatAssistant({ theme, isDarkMode }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Initial Message
    const initialMessage = { role: 'bot', text: 'Hello! 👋 I am StockBot. Ask me anything about the market!' };
    
    const [messages, setMessages] = useState([initialMessage]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // ✅ NEW LOGIC: RESET CHAT ON CLOSE
    useEffect(() => {
        if (!isOpen) {
            // Thoda wait karo taaki closing animation pura ho jaye, fir chat clear karo
            const timer = setTimeout(() => {
                setMessages([initialMessage]); // Reset to hello message
                setInput('');
            }, 500); // 500ms delay
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await axios.post(`${API_URL}/chat`, { message: userMsg });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Oops! My brain is offline. Try again later." }]);
        }
        setIsTyping(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={`w-80 md:w-96 h-[500px] mb-4 rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${theme.card}`}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <BoldBotIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">StockBot AI</h3>
                                    <p className="text-[10px] opacity-80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                            {/*Close Button */}
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition"><CloseIcon /></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : (isDarkMode ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700' : 'bg-white text-slate-700 rounded-bl-none border border-slate-200 shadow-sm')
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className={`p-3 rounded-2xl rounded-bl-none flex gap-1 ${isDarkMode ? 'bg-slate-800' : 'bg-white shadow-sm border border-slate-200'}`}>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef}></div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className={`p-3 border-t flex gap-2 ${isDarkMode ? 'bg-[#151A29] border-slate-800' : 'bg-white border-slate-200'}`}>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about stocks..." 
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${theme.input}`}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/20"
                            >
                                <SendIcon />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING BUTTON */}
            <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/40 border-4 border-white/20 backdrop-blur-md ring-2 ring-indigo-400 animate-pulse"
            >
                {isOpen ? <CloseIcon /> : <BoldBotIcon className="w-8 h-8" />}
            </motion.button>
        </div>
    );
}
