import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/helpers'; 

// --- 🎨 PREMIUM INLINE ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TelegramIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>;
const LogOutIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>;
const Spinner = () => <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

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
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        if (telegramId) setTempId(telegramId);
    }, [telegramId]);

    const handleTestNotification = async () => {
        if (!tempId) return alert("Please enter a Chat ID first!");
        
        setTestLoading(true);
        try {
            const url = `${API_URL}/users/test-telegram`; 
            const token = localStorage.getItem('token');

            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ telegram_id: tempId }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert("✅ Success! Test message sent to your Telegram.");
            } else {
                alert("❌ Error: " + (data.detail || "Failed to send message"));
            }
        } catch (error) {
            console.error(error);
            alert("⚠️ Network Error. Check if backend is running.");
        } finally {
            setTestLoading(false);
        }
    };

    if (!isProfileOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Deep Glass Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setIsProfileOpen(false)}
                    className={`absolute inset-0 ${isDarkMode ? 'bg-[#020617]/80' : 'bg-slate-900/40'} backdrop-blur-xl`}
                />

                {/* 💳 The Profile Vault Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative w-full max-w-sm flex flex-col rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border overflow-hidden z-10 ${isDarkMode ? 'bg-[#0f172a]/90 border-slate-800' : 'bg-white border-slate-200'}`}
                >
                    {/* 🎨 Header Cover Banner */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-20 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

                    {/* Close Button */}
                    <button 
                        onClick={() => setIsProfileOpen(false)} 
                        className={`absolute top-4 right-4 p-2 rounded-full z-20 transition-all duration-300 hover:rotate-90 ${isDarkMode ? 'bg-black/20 text-slate-300 hover:text-white hover:bg-black/40' : 'bg-white/50 text-slate-500 hover:bg-white'}`}
                    >
                        <CloseIcon />
                    </button>
                    
                    <div className="px-8 pt-10 pb-8 flex flex-col items-center relative z-10">
                        
                        {/* 🧑‍🚀 iOS Style Squircle Avatar */}
                        <div className="relative group mb-4">
                            <div className="absolute inset-0 bg-indigo-500 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
                            <div className={`relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-4xl shadow-2xl border-4 ${isDarkMode ? 'border-[#0f172a]' : 'border-white'}`}>
                                {getAvatarLetter()}
                            </div>
                        </div>
                        
                        {/* User Identity */}
                        <h2 className={`text-xl font-bold tracking-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            Account Settings
                        </h2>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider font-semibold border ${isDarkMode ? 'bg-[#020617]/50 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                            {userEmail || 'No email found'}
                        </div>

                        {/* 🔌 Integration Module (Telegram) */}
                        <div className={`mt-8 w-full p-5 rounded-2xl border ${isDarkMode ? 'bg-[#020617]/40 border-slate-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="text-[#0088cc]">
                                    <TelegramIcon />
                                </div>
                                <h3 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Telegram Alerts
                                </h3>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Input Group */}
                                <div className={`flex items-center p-1.5 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-indigo-500/30 ${isDarkMode ? 'bg-black border-slate-700 focus-within:border-indigo-500' : 'bg-white border-slate-300 focus-within:border-indigo-400'}`}>
                                    <input 
                                        type="text"
                                        placeholder="Chat ID (e.g. 12345678)"
                                        value={tempId}
                                        onChange={(e) => setTempId(e.target.value)}
                                        className={`flex-1 px-3 py-1.5 bg-transparent border-none outline-none text-sm font-mono w-full ${isDarkMode ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`}
                                    />
                                    <button 
                                        onClick={() => updateTelegramId(tempId)}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors shadow-md active:scale-95"
                                    >
                                        Save
                                    </button>
                                </div>

                                {/* Action Info & Test Button */}
                                <div className="flex items-center justify-between mt-2">
                                    <p className={`text-[10px] italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Get ID from <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium not-italic">@userinfobot</a>
                                    </p>
                                    
                                    {/* ✅ Naya Test Button Add Kiya Hai */}
                                    <button 
                                        onClick={handleTestNotification}
                                        disabled={testLoading || !tempId}
                                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50' : 'border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50'}`}
                                    >
                                        {testLoading ? <Spinner /> : "Ping Test"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 🛑 Danger Zone (Logout) */}
                        <div className="mt-6 w-full">
                            <button 
                                onClick={logout} 
                                className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-widest rounded-xl border transition-all active:scale-[0.98] ${isDarkMode ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50' : 'border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:border-rose-300'}`}
                            >
                                <LogOutIcon /> Secure Logout
                            </button>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
