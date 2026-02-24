import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 🎨 PREMIUM DASHBOARD ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TelegramIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>;
const LogOutIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
const CheckCircle = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SettingsIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>;

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
    const [isEditingTelegram, setIsEditingTelegram] = useState(false);

    // Modal khulte hi states ko properly reset karna
    useEffect(() => {
        if (isProfileOpen) {
            setTempId(telegramId || '');
            setIsEditingTelegram(false);
        }
    }, [isProfileOpen, telegramId]);

    const handleSave = () => {
        if (tempId.trim() !== '') {
            updateTelegramId(tempId.trim());
            setIsEditingTelegram(false); // Save hone ke baad drawer band karein
        }
    };

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
                    className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-slate-900/40'} backdrop-blur-sm`}
                />

                {/* 💳 The Dashboard Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.96, y: 15 }} 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`relative w-full max-w-[380px] flex flex-col rounded-3xl shadow-2xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#09090b] border-slate-800' : 'bg-white border-slate-200'}`}
                >
                    {/* Header Strip */}
                    <div className={`h-24 w-full ${isDarkMode ? 'bg-[#121214] border-b border-slate-800' : 'bg-slate-50 border-b border-slate-100'}`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={() => setIsProfileOpen(false)} 
                        className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 hover:rotate-90 ${isDarkMode ? 'bg-black/40 text-slate-400 hover:text-white hover:bg-black/60' : 'bg-white/80 text-slate-500 hover:text-black hover:bg-white shadow-sm'}`}
                    >
                        <CloseIcon />
                    </button>
                    
                    <div className="px-6 pb-6 relative -mt-12 flex flex-col">
                        
                        {/* 🧑‍🚀 Profile Info */}
                        <div className="flex flex-col items-center mb-6">
                            <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-4xl shadow-lg ring-4 mb-3 ${isDarkMode ? 'ring-[#09090b]' : 'ring-white'}`}>
                                {getAvatarLetter()}
                            </div>
                            <h2 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                My Account
                            </h2>
                            <div className={`mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {userEmail || 'Guest'}
                            </div>
                        </div>

                        {/* 🔌 Integrations Module (Fixed & Improved) */}
                        <div className="w-full">
                            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Integrations
                            </h3>
                            
                            <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#121214] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                {/* Card Header (Always Visible) */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#0088cc]/10 rounded-lg text-[#0088cc]">
                                            <TelegramIcon />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Telegram</span>
                                            {telegramId ? (
                                                <span className={`text-[10px] font-bold uppercase flex items-center gap-1 mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}><CheckCircle /> Connected</span>
                                            ) : (
                                                <span className={`text-[10px] font-medium uppercase mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Not Connected</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* 🔘 The Fixed Toggle Button */}
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingTelegram(!isEditingTelegram)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border ${isDarkMode ? (isEditingTelegram ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white') : (isEditingTelegram ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 shadow-sm')}`}
                                    >
                                        <SettingsIcon />
                                        {isEditingTelegram ? 'Close' : (telegramId ? 'Manage' : 'Connect')}
                                    </button>
                                </div>

                                {/* Expandable Drawer for Input */}
                                <AnimatePresence>
                                    {isEditingTelegram && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className={`border-t ${isDarkMode ? 'border-slate-800 bg-[#0a0a0c]' : 'border-slate-200 bg-white'}`}
                                        >
                                            <div className="p-4">
                                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                                    Chat ID
                                                </label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter ID..."
                                                        value={tempId}
                                                        onChange={(e) => setTempId(e.target.value)}
                                                        className={`flex-1 px-3 py-2 rounded-xl border outline-none text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 transition-all ${isDarkMode ? 'bg-[#121214] border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400'}`}
                                                    />
                                                    <button 
                                                        onClick={handleSave}
                                                        disabled={!tempId || tempId === telegramId}
                                                        className="bg-indigo-600 text-white px-4 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                                <p className={`text-[10px] mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                    Find your ID using <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">@userinfobot</a>
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 🛑 Logout Area */}
                        <div className="mt-8">
                            <button 
                                onClick={logout} 
                                className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] ${isDarkMode ? 'bg-[#121214] border border-slate-800 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30' : 'bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm'}`}
                            >
                                <LogOutIcon /> Sign Out
                            </button>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
