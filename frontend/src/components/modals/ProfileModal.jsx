import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 🎨 MINIMAL ICONS ---
const CloseIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TelegramIcon = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>;
const ChevronDown = ({ isOpen }) => <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const LogOutIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;

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

    useEffect(() => {
        if (isProfileOpen) {
            setTempId(telegramId || '');
            setIsEditingTelegram(false);
        }
    }, [isProfileOpen, telegramId]);

    const handleSave = () => {
        if (tempId.trim()) {
            updateTelegramId(tempId.trim());
            setIsEditingTelegram(false);
        }
    };

    if (!isProfileOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Background Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute inset-0 bg-black/50 backdrop-blur-md"
                />

                {/* 💳 Naya "Apple Settings" Jaisa Profile Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative w-full max-w-[400px] flex flex-col rounded-[24px] shadow-2xl overflow-hidden z-10 ${isDarkMode ? 'bg-[#18181b] border border-white/10' : 'bg-slate-50 border border-slate-200'}`}
                >
                    
                    {/* 1. HORIZONTAL HEADER SECTION */}
                    <div className={`p-6 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-[#18181b]' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                                {getAvatarLetter()}
                            </div>
                            <div className="flex flex-col">
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Profile
                                </h2>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {userEmail || 'Guest User'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsProfileOpen(false)} 
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* 2. BODY SECTION */}
                    <div className="p-6 space-y-6">
                        
                        {/* Telegram Integration Bento Box */}
                        <div className="flex flex-col gap-2">
                            <h3 className={`text-xs font-bold uppercase tracking-widest pl-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                Notifications
                            </h3>
                            
                            <div className={`rounded-2xl overflow-hidden border transition-all ${isDarkMode ? 'bg-[#27272a]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                
                                {/* 🔘 Clickable Row (Toggle Button) */}
                                <button 
                                    onClick={() => setIsEditingTelegram(!isEditingTelegram)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <TelegramIcon className="text-[#0088cc]" />
                                        <div className="flex flex-col items-start">
                                            <span className={`text-base font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                Telegram Alerts
                                            </span>
                                            {telegramId ? (
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Connected: {telegramId}</span>
                                            ) : (
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Not configured</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`p-1 rounded-full ${isDarkMode ? 'bg-black/20 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                        <ChevronDown isOpen={isEditingTelegram} />
                                    </div>
                                </button>

                                {/* 📥 Expanding Input Box (Smooth Accordion) */}
                                <AnimatePresence>
                                    {isEditingTelegram && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`p-4 pt-0 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                                <div className="mt-4 flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter Chat ID"
                                                        value={tempId}
                                                        onChange={(e) => setTempId(e.target.value)}
                                                        className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-[#18181b] border-white/10 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'}`}
                                                    />
                                                    <button 
                                                        onClick={handleSave}
                                                        disabled={!tempId}
                                                        className="bg-indigo-600 text-white px-5 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                                <p className={`text-[11px] mt-2.5 px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                                    Message <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline font-medium">@userinfobot</a> to get your Chat ID.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>

                    </div>

                    {/* 3. LOGOUT FOOTER */}
                    <div className={`p-4 border-t ${isDarkMode ? 'border-white/5 bg-[#18181b]' : 'border-slate-200 bg-slate-50'}`}>
                        <button 
                            onClick={logout} 
                            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                            <LogOutIcon />
                            Log Out
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
