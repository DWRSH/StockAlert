import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 🎨 CLEAN INLINE ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TelegramIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>;
const LogOutIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

export default function ProfileModal({ 
    isProfileOpen, 
    setIsProfileOpen, 
    userEmail, 
    telegramId, 
    updateTelegramId, 
    getAvatarLetter, 
    logout, 
    isDarkMode 
}) {
    const [tempId, setTempId] = useState('');

    // Initialize local state with prop data
    useEffect(() => {
        if (telegramId) setTempId(telegramId);
    }, [telegramId]);

    if (!isProfileOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Smooth Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsProfileOpen(false)}
                    className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-slate-500/30'} backdrop-blur-sm`}
                />

                {/* 💳 The Clean Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`relative w-full max-w-[360px] flex flex-col rounded-3xl shadow-2xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#09090b] border-slate-800' : 'bg-white border-slate-100'}`}
                >
                    {/* Subtle Top Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                    {/* Close Button */}
                    <button 
                        onClick={() => setIsProfileOpen(false)} 
                        className={`absolute top-5 right-5 p-1.5 rounded-full transition-all duration-200 hover:rotate-90 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-black hover:bg-slate-100'}`}
                    >
                        <CloseIcon />
                    </button>
                    
                    <div className="px-8 pt-12 pb-8 flex flex-col items-center relative z-10">
                        
                        {/* 🧑‍🚀 Modern Squircle Avatar with Ring */}
                        <div className="relative mb-5 group">
                            <div className={`absolute -inset-1 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 opacity-30 blur-md transition-opacity group-hover:opacity-50`} />
                            <div className={`relative w-24 h-24 rounded-[22px] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-4xl shadow-xl ring-4 ${isDarkMode ? 'ring-[#09090b]' : 'ring-white'}`}>
                                {getAvatarLetter()}
                            </div>
                        </div>
                        
                        {/* User Email Badge */}
                        <div className={`px-5 py-2 rounded-full text-xs font-medium tracking-wide border mb-8 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            {userEmail || 'Guest User'}
                        </div>

                        {/* 🔌 Telegram Integration Section (Cleaned Up) */}
                        <div className="w-full space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <TelegramIcon className="text-[#0088cc]" />
                                <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Telegram Connection
                                </label>
                            </div>
                            
                            {/* Unified Input Group */}
                            <div className="relative flex items-center w-full">
                                <input 
                                    type="text"
                                    placeholder="Enter Chat ID..."
                                    value={tempId}
                                    onChange={(e) => setTempId(e.target.value)}
                                    className={`w-full pl-4 pr-24 py-3.5 rounded-xl border outline-none transition-all text-sm font-mono shadow-sm focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-[#121214] border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400'}`}
                                />
                                <button 
                                    onClick={() => updateTelegramId(tempId)}
                                    disabled={!tempId || tempId === telegramId}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                    <SaveIcon /> Save
                                </button>
                            </div>

                            {/* Helper Link */}
                            <p className={`text-[10px] text-right italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Need ID? Ask <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-medium not-italic">@userinfobot</a>
                            </p>
                        </div>

                        {/* 🛑 Distinct Logout Area */}
                        <div className={`w-full h-px my-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                        <button 
                            onClick={logout} 
                            className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border transition-all active:scale-[0.98] ${isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/50 hover:text-rose-500' : 'border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600'}`}
                        >
                            <LogOutIcon /> Sign Out
                        </button>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
