import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, RobotIcon } from '../common/Icons';

const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

// Loading ke time jo text change hoga (Background processing feel dene ke liye)
const loadingSteps = [
    "Initializing AI engine...",
    "Fetching real-time market data...",
    "Scanning recent news & sentiment...",
    "Calculating technical indicators (RSI, MACD)...",
    "Identifying support and resistance levels...",
    "Synthesizing final market intelligence..."
];

export default function AiModal({ analyzedStockName, setAnalyzedStockName, aiAnalysisResult, isAiLoading, isDarkMode }) {
    const [stepIndex, setStepIndex] = useState(0);

    // Ye effect loading ke waqt text ko har 1.5 second mein change karega
    useEffect(() => {
        let interval;
        if (isAiLoading) {
            setStepIndex(0); // Reset on start
            interval = setInterval(() => {
                setStepIndex((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
            }, 1200); // Har 1.2s mein text change hoga
        }
        return () => clearInterval(interval);
    }, [isAiLoading]);

    if (!analyzedStockName) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Deep Dark Backdrop (Matte finish) */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setAnalyzedStockName(null)}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* 🖥️ Clean Minimalist Terminal Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.98 }} 
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`relative w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl border z-10 overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-slate-800' : 'bg-white border-slate-200'}`}
                >
                    {/* Header */}
                    <div className={`flex justify-between items-center px-6 py-4 border-b ${isDarkMode ? 'border-slate-800 bg-[#09090b]' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                            <RobotIcon className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                            <h2 className={`text-base font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                StockWatcher Intelligence
                            </h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                {analyzedStockName}
                            </span>
                        </div>
                        <button 
                            onClick={() => setAnalyzedStockName(null)} 
                            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-black hover:bg-slate-200'}`}
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Content Area */}
                    <div className={`px-6 py-6 min-h-[300px] max-h-[70vh] overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#09090b]' : 'bg-white'}`}>
                        
                        {isAiLoading ? (
                            // ⚙️ THE "BACKGROUND PROCESSING" UI
                            <div className="flex flex-col items-start justify-center h-full pt-10 pb-16 max-w-lg mx-auto">
                                <div className="flex items-center gap-4 mb-6">
                                    {/* Minimal radar/spinner */}
                                    <div className="relative w-8 h-8">
                                        <div className={`absolute inset-0 rounded-full border-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}></div>
                                        <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                                    </div>
                                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        Analyzing {analyzedStockName}
                                    </h3>
                                </div>
                                
                                {/* Dynamic Terminal Text */}
                                <div className={`w-full p-4 rounded-lg font-mono text-xs space-y-2 border ${isDarkMode ? 'bg-black border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
                                    {loadingSteps.map((step, index) => (
                                        <div 
                                            key={index} 
                                            className={`flex items-center gap-3 transition-all duration-300 ${index === stepIndex ? (isDarkMode ? 'text-indigo-400 opacity-100' : 'text-indigo-600 opacity-100') : (index < stepIndex ? (isDarkMode ? 'text-slate-500 opacity-70' : 'text-slate-400 opacity-70') : 'hidden')}`}
                                        >
                                            {index < stepIndex ? (
                                                <CheckIcon className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <span className="w-3 h-3 block rounded-full bg-indigo-500 animate-pulse"></span>
                                            )}
                                            {step}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // 📊 THE RESULT UI
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className={`text-[14px] leading-relaxed whitespace-pre-wrap font-sans ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                            >
                                {aiAnalysisResult || "Analysis failed to load. Please try again."}
                            </motion.div>
                        )}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}
