import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, RobotIcon } from '../common/Icons';

export default function AiModal({ analyzedStockName, setAnalyzedStockName, aiAnalysisResult, isAiLoading, theme, isDarkMode }) {
    
    // Close modal function
    const handleClose = () => setAnalyzedStockName(null);

    return (
        // AnimatePresence ko hamesha conditional render ke bahar rakhna chahiye
        <AnimatePresence>
            {analyzedStockName && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    
                    {/* 🌌 Backdrop with blur */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={handleClose}
                        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
                    />

                    {/* 💎 Modal Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={`relative w-full max-w-2xl flex flex-col rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border overflow-hidden z-10 ${isDarkMode ? 'bg-[#020617] border-slate-800' : 'bg-white border-slate-200'}`}
                    >
                        {/* Top Gradient Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        {/* 🏷️ Header */}
                        <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-slate-800/50 bg-[#0f172a]/30' : 'border-slate-100 bg-slate-50/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 rounded-full animate-pulse" />
                                    <div className="relative p-2.5 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                                        <RobotIcon />
                                    </div>
                                </div>
                                <div>
                                    <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        AI Market Analysis
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <p className={`text-xs font-semibold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {analyzedStockName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleClose} 
                                className={`p-2 rounded-full transition-all hover:rotate-90 ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        
                        {/* 📄 Content Body (Scrollable) */}
                        <div className={`p-6 max-h-[60vh] overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#020617]' : 'bg-white'}`}>
                            {isAiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-6">
                                    {/* High-Tech Loader */}
                                    <div className="relative flex items-center justify-center w-16 h-16">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                        <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 animate-spin animation-delay-150" />
                                        <div className="absolute inset-4 rounded-full border-l-2 border-pink-500 animate-spin animation-delay-300" />
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-semibold animate-pulse ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                            Consulting the Market Brain
                                        </p>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Analyzing real-time data for {analyzedStockName}...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={`text-sm leading-relaxed whitespace-pre-wrap font-medium p-5 rounded-2xl border ${isDarkMode ? 'bg-[#0f172a]/50 border-slate-800/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                                >
                                    {aiAnalysisResult || "No analysis available. Please try again."}
                                </motion.div>
                            )}
                        </div>

                        {/* 🔻 Footer / Action Area */}
                        {!isAiLoading && (
                            <div className={`p-4 border-t flex justify-end ${isDarkMode ? 'border-slate-800/50 bg-[#0f172a]/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                <button 
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
                                >
                                    Got it
                                </button>
                            </div>
                        )}

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
