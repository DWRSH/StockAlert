import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../common/Icons';

export default function ProfileModal({ isProfileOpen, setIsProfileOpen, userEmail, getAvatarLetter, logout, theme, isDarkMode }) {
    if (!isProfileOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border flex flex-col items-center ${theme.card}`}>
                    <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition"><CloseIcon /></button>
                        
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-xl shadow-indigo-500/20">
                        {getAvatarLetter()}
                    </div>
                        
                    <h2 className={`text-xl font-bold ${theme.heading}`}>User Profile</h2>
                    <div className={`mt-4 px-4 py-2 rounded-lg border font-mono text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {userEmail || 'No email found'}
                    </div>
                        
                    <p className="text-center text-xs opacity-50 mt-4 leading-relaxed">
                        You are currently logged in. <br/>Managing alerts for this email address.
                    </p>

                    <button onClick={logout} className="mt-8 w-full py-3 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/20">
                        LOGOUT
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}