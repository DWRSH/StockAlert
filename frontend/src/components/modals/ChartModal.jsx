import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- 🎨 MINIMAL ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrendingUp = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;
const TrendingDown = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941" /></svg>;

// --- 🎯 CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label, isDarkMode, currencySymbol, themeColor }) => {
    if (active && payload && payload.length) {
        return (
            <div className={`px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${isDarkMode ? 'bg-[#18181b]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono" style={{ color: themeColor }}>
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

    // 🧠 SMART MATH: Calculate Trends & Colors
    const { isBullish, themeColor, priceDiff, percentChange, lastPrice } = useMemo(() => {
        if (!chartData || chartData.length === 0) return { isBullish: true, themeColor: '#6366f1', priceDiff: 0, percentChange: 0, lastPrice: 0 };
        
        const first = chartData[0].price;
        const last = chartData[chartData.length - 1].price;
        const diff = last - first;
        const percent = ((diff / first) * 100);
        const bullish = diff >= 0;

        return {
            isBullish: bullish,
            themeColor: bullish ? '#10b981' : '#f43f5e', // Emerald for Up, Rose for Down
            priceDiff: diff,
            percentChange: percent,
            lastPrice: last
        };
    }, [chartData]);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                
                {/* 🌑 Premium Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setSelectedStock(null)}
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-black/80' : 'bg-slate-900/40'}`}
                />

                {/* 💳 The Robinhood-Style Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.98, y: 15 }} 
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`relative w-full max-w-4xl flex flex-col rounded-3xl shadow-2xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-200'}`}
                >
                    
                    {/* 1. Header & Live Price Section */}
                    <div className="px-6 pt-6 pb-2 flex justify-between items-start">
                        <div className="flex flex-col">
                            <h2 className={`text-sm font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {selectedStock}
                            </h2>
                            
                            {isChartLoading ? (
                                <div className={`h-10 w-48 mt-2 rounded-lg animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                            ) : chartData.length > 0 ? (
                                <div className="mt-1 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                                    <span className={`text-4xl font-bold tracking-tight font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                        {currencySymbol}{lastPrice.toFixed(2)}
                                    </span>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-bold tracking-wide ${isBullish ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600')}`}>
                                        {isBullish ? <TrendingUp /> : <TrendingDown />}
                                        {isBullish ? '+' : ''}{currencySymbol}{Math.abs(priceDiff).toFixed(2)} ({isBullish ? '+' : ''}{percentChange.toFixed(2)}%)
                                    </div>
                                </div>
                            ) : (
                                <span className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Data Unavailable
                                </span>
                            )}
                        </div>

                        <button 
                            onClick={() => setSelectedStock(null)} 
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-[#18181b] text-slate-400 hover:text-white border border-[#27272a]' : 'bg-slate-50 text-slate-500 hover:text-black border border-slate-200'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* 2. Timeframe Filters (Visual UI) */}
                    <div className="px-6 flex items-center gap-2 mt-4 mb-2">
                        {['1D', '1W', '1M', '3M', '1Y'].map((time) => (
                            <div 
                                key={time} 
                                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-default transition-colors ${time === '1M' ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-800 text-white') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}
                            >
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* 3. The Chart Container */}
                    <div className="w-full h-[360px] relative">
                        {isChartLoading ? (
                            // High-End Skeleton Loading
                            <div className="w-full h-full flex items-end px-6 pb-8 gap-2 opacity-40">
                                {[30, 45, 40, 60, 50, 80, 70, 95, 85, 100].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        animate={{ height: [`${h}%`, `${h - 15}%`, `${h}%`] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                        className={`flex-1 rounded-t-sm ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        ) : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                    
                                    {/* Dynamic Gradient based on Trend */}
                                    <defs>
                                        <linearGradient id="colorDynamic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={themeColor} stopOpacity={isDarkMode ? 0.3 : 0.2} />
                                            <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    {/* Very subtle grid lines */}
                                    <CartesianGrid 
                                        strokeDasharray="4 4" 
                                        vertical={false} 
                                        stroke={isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 
                                    />

                                    {/* X-Axis: Hidden lines, clean text */}
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 600, fill: isDarkMode ? '#52525b' : '#94a3b8' }} 
                                        dy={10} 
                                        minTickGap={40}
                                    />
                                    
                                    {/* Y-Axis: Moved to Right (Like real trading apps) */}
                                    <YAxis 
                                        orientation="right"
                                        domain={['dataMin - 5', 'dataMax + 5']} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 10, fontWeight: 600, fill: isDarkMode ? '#52525b' : '#94a3b8', fontFamily: 'monospace' }} 
                                        tickFormatter={(val) => `${val.toFixed(0)}`} 
                                        dx={10}
                                    />
                                    
                                    {/* Crosshair & Tooltip */}
                                    <Tooltip 
                                        content={<CustomTooltip isDarkMode={isDarkMode} currencySymbol={currencySymbol} themeColor={themeColor} />} 
                                        cursor={{ stroke: themeColor, strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                                    />
                                    
                                    {/* The Line */}
                                    <Area 
                                        type="monotone" 
                                        dataKey="price" 
                                        stroke={themeColor} 
                                        strokeWidth={3} 
                                        fill="url(#colorDynamic)" 
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: isDarkMode ? '#09090b' : '#ffffff', fill: themeColor }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className={`text-sm font-bold tracking-widest uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                    No Historical Data
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
