import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- INLINE ICONS (No import errors) ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const RobotIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h.008v.008H8.25V10.5zm5.25 0h.008v.008h-.008V10.5zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.25 15.75h4.5c.828 0 1.5-.672 1.5-1.5v-1.5h-7.5v1.5c0 .828.672 1.5 1.5 1.5z" /></svg>;
const TerminalIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 17h16a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

const loadingSteps = [
    "[SYS] Connecting to market data feeds...",
    "[API] Fetching real-time order book...",
    "[NLP] Scanning 100+ news articles for sentiment...",
    "[ALG] Calculating RSI, MACD & Moving Averages...",
    "[AI] Synthesizing final market intelligence...",
    "[SYS] Generating report..."
];

export default function AiModal({ analyzedStockName, setAnalyzedStockName, aiAnalysisResult, isAiLoading, isDarkMode }) {
    const [stepIndex, setStepIndex] = useState(0);

    // Terminal Text Logic
    useEffect(() => {
        let interval;
        if (isAiLoading) {
            setStepIndex(0);
            interval = setInterval(() => {
                setStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
            }, 1000); // Thoda fast kiya hai real-time feel ke liye
        }
        return () => clearInterval(interval);
    }, [isAiLoading]);

    if (!analyzedStockName) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Deep Dark Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setAnalyzedStockName(null)}
                    className={`absolute inset-0 ${isDarkMode ? 'bg-black/80' : 'bg-slate-900/60'} backdrop-blur-md`}
                />

                {/* 🖥️ The Terminal Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 10 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl border z-10 overflow-hidden ${isDarkMode ? 'bg-[#0a0a0a] border-[#27272a]' : 'bg-white border-slate-200'}`}
                >
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    {/* Header */}
                    <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-[#27272a] bg-[#0a0a0a]' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                <RobotIcon />
                            </div>
                            <h2 className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                AI INTELLIGENCE
                            </h2>
                            <span className={`px-2.5 py-1 rounded-[4px] text-[10px] font-bold tracking-widest uppercase ml-2 ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-800 text-white'}`}>
                                {analyzedStockName}
                            </span>
                        </div>
                        <button 
                            onClick={() => setAnalyzedStockName(null)} 
                            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-[#27272a]' : 'text-slate-400 hover:text-black hover:bg-slate-200'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    
                    {/* Content Area */}
                    <div className={`px-8 py-8 min-h-[350px] max-h-[70vh] overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                        
                        {isAiLoading ? (
                            // ⚙️ THE "TERMINAL & CHART" LOADING UI
                            <div className="flex flex-col h-full max-w-xl mx-auto space-y-8 mt-4">
                                
                                {/* 📊 Animated Chart Skeleton */}
                                <div className="flex items-end justify-center gap-2 h-24">
                                    {[40, 70, 45, 90, 60, 100, 50, 80].map((height, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ 
                                                height: [`${height}%`, `${height - 20}%`, `${height}%`],
                                                opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{ 
                                                duration: 1.5, 
                                                repeat: Infinity, 
                                                delay: i * 0.1,
                                                ease: "easeInOut"
                                            }}
                                            className={`w-4 rounded-t-sm ${isDarkMode ? 'bg-indigo-500/50' : 'bg-indigo-400/50'}`}
                                            style={{ height: `${height}%` }}
                                        />
                                    ))}
                                </div>

                                {/* 💻 Terminal Output */}
                                <div className={`w-full p-5 rounded-xl font-mono text-xs border ${isDarkMode ? 'bg-black border-[#27272a] shadow-[inset_0_0_20px_rgba(0,0,0,1)]' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                                    <div className="flex items-center gap-2 mb-3 opacity-50 pb-2 border-b border-inherit">
                                        <TerminalIcon />
                                        <span>system_process_log.sh</span>
                                    </div>
                                    <div className="space-y-2.5">
                                        {loadingSteps.map((step, index) => (
                                            <div 
                                                key={index} 
                                                className={`flex items-start gap-3 transition-all duration-150 ${index === stepIndex ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') : (index < stepIndex ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : 'hidden')}`}
                                            >
                                                <span className="shrink-0 mt-0.5">
                                                    {index < stepIndex ? '✓' : '>'}
                                                </span>
                                                <span>
                                                    {step}
                                                    {index === stepIndex && (
                                                        <motion.span 
                                                            animate={{ opacity: [0, 1, 0] }} 
                                                            transition={{ duration: 0.8, repeat: Infinity }}
                                                            className="inline-block w-1.5 h-3 bg-current ml-1 align-middle"
                                                        />
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // 📝 THE FINAL AI RESULT
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className={`text-[15px] leading-[1.8] whitespace-pre-wrap font-sans ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                                {aiAnalysisResult || "System failed to generate report. Please try again."}
                            </motion.div>
                        )}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
