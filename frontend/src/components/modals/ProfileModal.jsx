import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 🎨 CLEAN INLINE ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TelegramIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>;
const LogOutIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const EditIcon = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;

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
    
    // Naya state jo track karega ki input box dikhana hai ya nahi
    const [isEditingTelegram, setIsEditingTelegram] = useState(false);

    useEffect(() => {
        if (telegramId) {
            setTempId(telegramId);
            setIsEditingTelegram(false); // Agar ID pehle se hai, toh edit mode band rakho
        }
    }, [telegramId, isProfileOpen]);

    const handleSave = () => {
        updateTelegramId(tempId);
        setIsEditingTelegram(false); // Save karne ke baad box wapas band kar do
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
                        
                        {/* 🧑‍🚀 Modern Squircle Avatar */}
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

                        {/* 🔌 Telegram Integration Section */}
                        <div className="w-full space-y-3">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <TelegramIcon className="text-[#0088cc]" />
                                    <label className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Telegram Connection
                                    </label>
                                </div>
                            </div>
                            
                            {/* Toggle View Logic */}
                            {!isEditingTelegram ? (
                                <div className="w-full">
                                    {telegramId ? (
                                        // Case 1: ID pehle se set hai
                                        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-[#121214] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>Connected</span>
                                                <span className={`text-sm font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{telegramId}</span>
                                            </div>
                                            <button 
                                                onClick={() => setIsEditingTelegram(true)}
                                                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border shadow-sm text-slate-600 hover:bg-slate-100'}`}
                                            >
                                                <EditIcon /> Edit
                                            </button>
                                        </div>
                                    ) : (
                                        // Case 2: ID set nahi hai (Show Add Button)
                                        <button 
                                            onClick={() => setIsEditingTelegram(true)}
                                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-colors text-sm font-medium ${isDarkMode ? 'border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 bg-slate-800/20' : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50'}`}
                                        >
                                            <PlusIcon /> Set Telegram Chat ID
                                        </button>
                                    )}
                                </div>
                            ) : (
                                // Case 3: Editing Mode (Input Box + Save/Cancel)
                                <AnimatePresence>
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: '12px' }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative flex items-center w-full">
                                            <input 
                                                type="text"
                                                autoFocus
                                                placeholder="Enter Chat ID..."
                                                value={tempId}
                                                onChange={(e) => setTempId(e.target.value)}
                                                className={`w-full pl-4 pr-24 py-3.5 rounded-xl border outline-none transition-all text-sm font-mono shadow-sm focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-[#121214] border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400'}`}
                                            />
                                            <button 
                                                onClick={handleSave}
                                                disabled={!tempId}
                                                className="absolute right-1.5 top-1.5 bottom-1.5 bg-indigo-600 text-white px-4 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                            >
                                                <SaveIcon /> Save
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2 px-1">
                                            <button 
                                                onClick={() => {
                                                    setTempId(telegramId || ''); // Reset to original
                                                    setIsEditingTelegram(false); // Close edit mode
                                                }}
                                                className={`text-[10px] font-bold uppercase tracking-widest hover:underline ${isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Cancel
                                            </button>
                                            <p className={`text-[10px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                Ask <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-medium not-italic">@userinfobot</a>
                                            </p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}
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
