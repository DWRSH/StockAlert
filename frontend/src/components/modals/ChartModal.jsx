import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// --- 🎨 MODERN ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ArrowUp = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>;
const ArrowDown = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" /></svg>;

// --- 🎯 PREMIUM TOOLTIP ---
const CustomTooltip = ({ active, payload, label, isDarkMode, currencySymbol, themeColor }) => {
    if (active && payload && payload.length) {
        return (
            <div className={`px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md ${isDarkMode ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-slate-200'}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold font-mono" style={{ color: themeColor }}>
                        {currencySymbol}{payload[0].value.toFixed(2)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function ChartModal({ selectedStock, setSelectedStock, chartData, isChartLoading, isDarkMode }) {
    
    if (!selectedStock) return null;

    const currencySymbol = selectedStock.includes('.') ? '₹' : '$';

    // 🧠 SMART CALCULATION
    const { isBullish, themeColor, priceDiff, percentChange, lastPrice, firstPrice } = useMemo(() => {
        if (!chartData || chartData.length === 0) return { isBullish: true, themeColor: '#6366f1', priceDiff: 0, percentChange: 0, lastPrice: 0, firstPrice: 0 };
        
        const first = chartData[0].price;
        const last = chartData[chartData.length - 1].price;
        const diff = last - first;
        const percent = ((diff / first) * 100);
        const bullish = diff >= 0;

        return {
            isBullish: bullish,
            themeColor: bullish ? '#10b981' : '#f43f5e', // Emerald (Green) / Rose (Red)
            priceDiff: diff,
            percentChange: percent,
            lastPrice: last,
            firstPrice: first
        };
    }, [chartData]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setSelectedStock(null)}
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-black/70' : 'bg-slate-900/40'}`}
                />

                {/* 💳 The FinTech Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 15 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative w-full max-w-4xl flex flex-col rounded-[24px] shadow-2xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}
                >
                    
                    {/* 1. Clear & Beautiful Header */}
                    <div className="px-6 pt-6 pb-2 flex justify-between items-start">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm`} style={{ backgroundColor: themeColor }}>
                                    {selectedStock.charAt(0)}
                                </div>
                                <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {selectedStock}
                                </h2>
                            </div>
                            
                            {isChartLoading ? (
                                <div className={`h-10 w-48 mt-3 rounded-lg animate-pulse ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`} />
                            ) : chartData.length > 0 ? (
                                <div className="mt-3 flex flex-col">
                                    <span className={`text-4xl font-extrabold tracking-tight font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {currencySymbol}{lastPrice.toFixed(2)}
                                    </span>
                                    {/* Clarified 30-Day Return Text */}
                                    <div className={`mt-1 flex items-center gap-1.5 text-sm font-semibold`} style={{ color: themeColor }}>
                                        {isBullish ? <ArrowUp /> : <ArrowDown />}
                                        {currencySymbol}{Math.abs(priceDiff).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
                                        <span className={`ml-1 text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                            Past 30 Days
                                        </span>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <button 
                            onClick={() => setSelectedStock(null)} 
                            className={`p-2.5 rounded-full transition-colors ${isDarkMode ? 'bg-[#18181b] text-slate-400 hover:text-white hover:bg-[#27272a]' : 'bg-slate-50 text-slate-500 hover:text-black hover:bg-slate-100'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* 2. The Chart with Baseline Reference */}
                    <div className="w-full h-[360px] relative px-4 pb-4">
                        {isChartLoading ? (
                            // Animated Skeleton
                            <div className="w-full h-full flex items-end px-4 gap-2 opacity-50">
                                {[30, 45, 40, 60, 50, 80, 70, 95, 85, 100].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        animate={{ height: [`${h}%`, `${h - 15}%`, `${h}%`] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                        className={`flex-1 rounded-t-sm ${isDarkMode ? 'bg-[#27272a]' : 'bg-slate-200'}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                    
                                    {/* Gradient matching the trend (Green/Red) */}
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={themeColor} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    {/* Baseline Reference Line (Where it started 30 days ago) */}
                                    <ReferenceLine 
                                        y={firstPrice} 
                                        stroke={isDarkMode ? '#52525b' : '#94a3b8'} 
                                        strokeDasharray="4 4" 
                                        strokeWidth={1.5}
                                    />

                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        vertical={false} 
                                        stroke={isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} 
                                    />

                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fontWeight: 500, fill: isDarkMode ? '#71717a' : '#94a3b8' }} 
                                        dy={15} 
                                        minTickGap={40}
                                    />
                                    
                                    <YAxis 
                                        orientation="right"
                                        domain={['auto', 'auto']} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fontWeight: 500, fill: isDarkMode ? '#71717a' : '#94a3b8', fontFamily: 'monospace' }} 
                                        tickFormatter={(val) => `${val.toFixed(0)}`} 
                                        dx={10}
                                    />
                                    
                                    <Tooltip 
                                        content={<CustomTooltip isDarkMode={isDarkMode} currencySymbol={currencySymbol} themeColor={themeColor} />} 
                                        cursor={{ stroke: themeColor, strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                                    />
                                    
                                    {/* The Line & Filled Area */}
                                    <Area 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke={themeColor} 
                                        strokeWidth={2.5} 
                                        fill="url(#chartGradient)" 
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: isDarkMode ? '#09090b' : '#ffffff', fill: themeColor }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Data completely unavailable.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
