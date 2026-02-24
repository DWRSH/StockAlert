import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, RobotIcon } from '../common/Icons';

export default function AiModal({ analyzedStockName, setAnalyzedStockName, aiAnalysisResult, isAiLoading, theme, isDarkMode }) {
    
    if (!analyzedStockName) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                
                {/* 🌌 Ultra-Deep Backdrop Blur */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.3 }}
                    onClick={() => setAnalyzedStockName(null)}
                    className={`absolute inset-0 ${isDarkMode ? 'bg-[#020617]/80' : 'bg-slate-900/40'} backdrop-blur-xl`}
                />

                {/* ✨ Ambient Background Glow (The Magic Touch) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
                />

                {/* 💎 The Glassmorphic Vault Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 20, scale: 0.95 }} 
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={`relative w-full max-w-3xl flex flex-col rounded-[2.5rem] shadow-[0_0_80px_-20px_rgba(99,102,241,0.3)] border ring-1 ring-white/5 overflow-hidden z-10 ${isDarkMode ? 'bg-[#0f172a]/70 border-white/10' : 'bg-white/90 border-slate-200'}`}
                >
                    {/* Top Shimmer Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    {/* 🏷️ Minimalist Header */}
                    <div className={`flex justify-between items-center px-8 py-6 border-b ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4">
                            {/* Glowing AI Icon */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />
                                <div className={`relative p-3 rounded-xl border ${isDarkMode ? 'bg-[#020617] border-white/10 text-indigo-400' : 'bg-white border-indigo-100 text-indigo-600'} shadow-inner`}>
                                    <RobotIcon />
                                </div>
                            </div>
                            <div>
                                <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    Market Intelligence
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                    </span>
                                    <p className={`text-[11px] font-bold tracking-[0.2em] uppercase ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        {analyzedStockName}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setAnalyzedStockName(null)} 
                            className={`p-2.5 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    
                    {/* 📄 Content Body (Scrollable & Styled) */}
                    <div className={`px-8 py-6 max-h-[65vh] overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#020617]/50' : 'bg-slate-50/50'}`}>
                        {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-6">
                                {/* 🧠 AI "Thinking" Animation */}
                                <div className="relative w-24 h-24 flex items-center justify-center">
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-t-2 border-l-2 border-indigo-500 rounded-full opacity-70"
                                    />
                                    <motion.div 
                                        animate={{ scale: [1, 0.8, 1], rotate: [360, 180, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-2 border-b-2 border-r-2 border-purple-500 rounded-full opacity-70"
                                    />
                                    <RobotIcon className={`w-8 h-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-400'} animate-pulse`} />
                                </div>
                                
                                <div className="text-center space-y-3 w-full max-w-xs">
                                    <p className={`text-sm font-bold tracking-widest uppercase ${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' : 'text-indigo-600'}`}>
                                        Synthesizing Data
                                    </p>
                                    {/* Scanning Bar */}
                                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                        <motion.div 
                                            initial={{ x: "-100%" }}
                                            animate={{ x: "200%" }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                            className="h-full w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className={`text-[15px] leading-[1.8] tracking-wide whitespace-pre-wrap font-medium p-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                                {aiAnalysisResult || "No intelligence gathered. Please initiate a new scan."}
                            </motion.div>
                        )}
                    </div>

                    {/* 🔻 Stealth Footer */}
                    {!isAiLoading && (
                        <div className={`px-8 py-5 border-t flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-black/20' : 'border-slate-100 bg-white'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                <RobotIcon className="w-3 h-3" /> AI Generated Content
                            </p>
                            <button 
                                onClick={() => setAnalyzedStockName(null)}
                                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] active:scale-95"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
