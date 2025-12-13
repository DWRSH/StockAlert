import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../common/Icons'; 
import { API_URL } from '../../utils/helpers';

// --- ICONS ---
const SendIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackArrowIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const BoldBotIcon = ({ className }) => <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="12" cy="2" r="1.5" fill="currentColor"/><rect x="3" y="5" width="18" height="16" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none"/><circle cx="8.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="11.5" r="1.5" fill="currentColor"/><path d="M9 16C9 16 10 17 12 17C14 17 15 16 15 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;

export default function ChatAssistant({ theme, isDarkMode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ role: 'bot', text: 'Hello! 👋 I am StockBot. Ask me anything about the market!' }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // ✅ NEW: Dynamic Height State for Mobile Keyboard
    const [viewportHeight, setViewportHeight] = useState('100%');
    const messagesEndRef = useRef(null);

    // ✅ Logic: Keyboard khulne par height calculate karna
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => {
            // VisualViewport API sabse accurate hota hai mobile keyboards ke liye
            if (window.visualViewport) {
                setViewportHeight(`${window.visualViewport.height}px`);
            } else {
                setViewportHeight(`${window.innerHeight}px`);
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);
        
        // Initial set
        handleResize();

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isTyping]);

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
            setMessages(prev => [...prev, { role: 'bot', text: "⚠️ Server busy." }]);
        }
        setIsTyping(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        
                        // ✅ IMPORTANT: Style prop se height control kar rahe hain mobile ke liye
                        style={{ 
                            height: window.innerWidth < 768 ? viewportHeight : '550px',
                            top: window.innerWidth < 768 ? 0 : 'auto' 
                        }}
                        
                        className={`fixed z-[60] flex flex-col overflow-hidden shadow-2xl border-0 md:border
                            left-0 w-full rounded-none 
                            md:left-auto md:bottom-24 md:right-6 md:w-96 md:rounded-2xl
                            ${theme.card}
                        `}
                    >
                        {/* --- HEADER --- */}
                        <div className="shrink-0 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white shadow-md z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 -ml-1 active:scale-90 transition">
                                    <BackArrowIcon />
                                </button>
                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <BoldBotIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">StockBot AI</h3>
                                    <p className="text-[10px] opacity-80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsOpen(false)} className="opacity-80 hover:opacity-100 transition hidden md:block">
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* --- MESSAGES --- */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : (isDarkMode ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200')
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

                        {/* --- INPUT AREA --- */}
                        <form onSubmit={handleSend} className={`shrink-0 p-3 border-t flex gap-2 pb-safe md:pb-3 ${
                            isDarkMode ? 'bg-[#151A29] border-slate-800/50' : 'bg-white border-slate-100'
                        }`}>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about stocks..." 
                                className={`flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition shadow-sm border ${
                                    isDarkMode 
                                    ? 'bg-slate-900 border-slate-800 focus:border-indigo-500/50 text-white' 
                                    : 'bg-slate-50 border-slate-100 focus:border-indigo-200 text-slate-900' 
                                }`}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <SendIcon />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- SQUARE FLOATING BUTTON --- */}
            <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/40 border-4 border-white/20 backdrop-blur-md ring-2 ring-indigo-400 animate-pulse 
                ${isOpen ? 'hidden md:flex' : 'flex'}`} 
            >
                {isOpen ? <CloseIcon /> : <BoldBotIcon className="w-8 h-8" />}
            </motion.button>
        </>
    );
}
