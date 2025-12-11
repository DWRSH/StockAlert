import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, RobotIcon } from '../common/Icons';

export default function AiModal({ analyzedStockName, setAnalyzedStockName, aiAnalysisResult, isAiLoading, theme, isDarkMode }) {
    if (!analyzedStockName) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className={`w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative border overflow-hidden ${theme.card}`}>
                    
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <RobotIcon />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold ${theme.heading}`}>AI Analysis</h2>
                                <p className="text-xs opacity-50 font-mono uppercase mt-0.5">{analyzedStockName}</p>
                            </div>
                        </div>
                        <button onClick={() => setAnalyzedStockName(null)} className="opacity-50 hover:opacity-100 transition"><CloseIcon /></button>
                    </div>
                    
                    <div className={`p-6 rounded-2xl text-sm leading-relaxed border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs opacity-50 animate-pulse font-mono">Consulting the market brain...</p>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap font-medium">
                                {aiAnalysisResult || "No analysis available."}
                            </div>
                        )}
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
}