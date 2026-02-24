import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// --- 🎨 ULTRA-MINIMAL ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ArrowUp = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>;
const ArrowDown = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" /></svg>;

// --- 🎯 INVISIBLE TOOLTIP (Pure Data Focus) ---
const CustomTooltip = ({ active, payload, label, isDarkMode, currencySymbol }) => {
    if (active && payload && payload.length) {
        return (
            <div className={`px-3 py-2 rounded-lg shadow-xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {label}
                </p>
                <p className="text-sm font-semibold font-mono">
                    {currencySymbol}{payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export default function ChartModal({ selectedStock, setSelectedStock, chartData, isChartLoading, isDarkMode }) {
    
    if (!selectedStock) return null;

    const currencySymbol = selectedStock.includes('.') ? '₹' : '$';

    // 🧠 Pure Data Math
    const { isBullish, priceDiff, percentChange, lastPrice, firstPrice } = useMemo(() => {
        if (!chartData || chartData.length === 0) return { isBullish: true, priceDiff: 0, percentChange: 0, lastPrice: 0, firstPrice: 0 };
        
        const first = chartData[0].price;
        const last = chartData[chartData.length - 1].price;
        const diff = last - first;
        const percent = ((diff / first) * 100);

        return {
            isBullish: diff >= 0,
            priceDiff: diff,
            percentChange: percent,
            lastPrice: last,
            firstPrice: first
        };
    }, [chartData]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Pure Dim Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setSelectedStock(null)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* 💳 The Minimalist Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 10 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 10 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative w-full max-w-4xl flex flex-col rounded-2xl shadow-2xl border z-10 overflow-hidden ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}
                >
                    
                    {/* 1. Clean Typography Header */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                        <div className="flex flex-col">
                            <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                {selectedStock}
                            </h2>
                            
                            {isChartLoading ? (
                                <div className={`h-8 w-32 mt-2 rounded-md animate-pulse ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
                            ) : chartData.length > 0 ? (
                                <div className="mt-1 flex items-baseline gap-3">
                                    <span className={`text-2xl font-medium font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {currencySymbol}{lastPrice.toFixed(2)}
                                    </span>
                                    {/* Subtle Profit/Loss Text (No heavy background pills) */}
                                    <span className={`flex items-center text-sm font-medium ${isBullish ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isBullish ? <ArrowUp /> : <ArrowDown />}
                                        {Math.abs(priceDiff).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        <button 
                            onClick={() => setSelectedStock(null)} 
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-[#27272a]' : 'text-slate-400 hover:text-black hover:bg-slate-100'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* 2. The Naked Chart Container (Zero Distractions) */}
                    <div className="w-full h-[340px] px-2 pb-6">
                        {isChartLoading ? (
                            // Clean Line Skeleton
                            <div className="w-full h-full flex items-center justify-center">
                                <motion.div 
                                    animate={{ opacity: [0.2, 0.7, 0.2] }} 
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={`w-3/4 h-[2px] rounded-full ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`}
                                />
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                    
                                    {/* Baseline Reference (Shows where the stock started 30 days ago) */}
                                    <ReferenceLine 
                                        y={firstPrice} 
                                        stroke={isDarkMode ? '#27272a' : '#e2e8f0'} 
                                        strokeDasharray="3 3" 
                                    />

                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fill: isDarkMode ? '#52525b' : '#94a3b8' }} 
                                        dy={15} 
                                        minTickGap={50}
                                    />
                                    
                                    <YAxis 
                                        domain={['dataMin', 'dataMax']} 
                                        hide={true} // Axes hidden for ultra-clean look
                                    />
                                    
                                    <Tooltip 
                                        content={<CustomTooltip isDarkMode={isDarkMode} currencySymbol={currencySymbol} />} 
                                        cursor={{ stroke: isDarkMode ? '#52525b' : '#cbd5e1', strokeWidth: 1 }} 
                                    />
                                    
                                    {/* Crisp, single-color elegant line */}
                                    <Line 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke={isDarkMode ? '#e4e4e7' : '#0f172a'} 
                                        strokeWidth={2} 
                                        dot={false} // No dots, just a smooth line
                                        activeDot={{ r: 4, fill: isDarkMode ? '#e4e4e7' : '#0f172a', strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className={`text-sm ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                    No data available
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
