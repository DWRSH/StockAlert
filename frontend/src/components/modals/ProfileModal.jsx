import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../common/Icons';
import { API_URL } from '../../utils/helpers'; 

export default function ProfileModal({ 
    isProfileOpen, 
    setIsProfileOpen, 
    userEmail, 
    telegramId, 
    updateTelegramId, 
    getAvatarLetter, 
    logout, 
    theme, 
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
            // ✅ FIX 1: URL fixed (Removed extra '/api')
            const url = `${API_URL}/users/test-telegram`; 
            
            // ✅ FIX 2: Get Token for Authentication
            const token = localStorage.getItem('token');

            console.log("Requesting:", url); 

            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // ✅ FIX 3: Authorization Header zaroori hai backend ke liye
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ telegram_id: tempId }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert("✅ Success! Test message sent.");
            } else {
                alert("❌ Error: " + (data.detail || "Failed"));
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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{opacity:0, scale:0.95}} 
                    animate={{opacity:1, scale:1}} 
                    exit={{opacity:0, scale:0.95}} 
                    className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border flex flex-col items-center ${theme.card}`}
                >
                    <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition">
                        <CloseIcon />
                    </button>
                    
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-xl shadow-indigo-500/20">
                        {getAvatarLetter()}
                    </div>
                    
                    <h2 className={`text-xl font-bold ${theme.heading}`}>User Profile</h2>
                    
                    <div className={`mt-4 w-full px-4 py-2 rounded-lg border font-mono text-center text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {userEmail || 'No email found'}
                    </div>

                    <div className="mt-8 w-full flex flex-col gap-3">
                        <label className={`block text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Telegram Chat ID
                        </label>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                placeholder="Enter Chat ID"
                                value={tempId}
                                onChange={(e) => setTempId(e.target.value)}
                                className={`flex-1 px-4 py-2 rounded-xl border outline-none transition-all text-sm font-mono ${theme.input} focus:ring-2 focus:ring-indigo-500/20`}
                            />
                            <button 
                                onClick={() => updateTelegramId(tempId)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors"
                            >
                                SAVE
                            </button>
                        </div>
                        <p className={`text-[10px] text-center italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            Get ID from <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-500 underline">@userinfobot</a>
                        </p>
                    </div>

                    <div className={`w-full h-px my-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

                    <button onClick={logout} className="w-full py-3 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20">
                        LOGOUT
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
