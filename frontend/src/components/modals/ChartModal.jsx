import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- 🎨 PREMIUM ICONS ---
const CloseIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrendingIcon = () => <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>;

// --- 🎯 CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label, isDarkMode, currencySymbol }) => {
    if (active && payload && payload.length) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl shadow-2xl border backdrop-blur-md ${isDarkMode ? 'bg-[#18181b]/90 border-white/10 text-white' : 'bg-white/90 border-slate-200 text-slate-900'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {label}
                </p>
                <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {currencySymbol}{payload[0].value}
                    </span>
                </div>
            </motion.div>
        );
    }
    return null;
};

// --- ⚙️ SKELETON LOADER ---
const ChartSkeleton = ({ isDarkMode }) => (
    <div className="w-full h-full flex flex-col justify-end gap-1 p-4 pb-8">
        <div className="w-full flex items-end justify-between h-full gap-2 opacity-50">
            {[40, 60, 45, 80, 50, 90, 70, 100, 60, 85].map((h, i) => (
                <motion.div 
                    key={i}
                    animate={{ height: [`${h}%`, `${h - 10}%`, `${h}%`] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                    className={`flex-1 rounded-t-sm ${isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}
                    style={{ height: `${h}%` }}
                />
            ))}
        </div>
        {/* Fake X-Axis Line */}
        <div className={`w-full h-px mt-2 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
    </div>
);

export default function ChartModal({ selectedStock, setSelectedStock, chartData, isChartLoading, isDarkMode }) {
    
    // Safety check
    if (!selectedStock) return null;

    // Currency Logic
    const currencySymbol = selectedStock.includes('.') ? '₹' : '$';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                
                {/* 🌑 Premium Overlay */}
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={() => setSelectedStock(null)}
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-black/70' : 'bg-slate-900/40'}`}
                />

                {/* 💳 The Chart Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.96, y: 15 }} 
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className={`relative w-full max-w-4xl flex flex-col rounded-[24px] shadow-2xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#09090b] border-white/10' : 'bg-white border-slate-200'}`}
                >
                    {/* Header Section */}
                    <div className={`px-6 py-5 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-[#121214]' : 'border-slate-100 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-indigo-500/10' : 'bg-indigo-50'}`}>
                                <TrendingIcon />
                            </div>
                            <div className="flex flex-col">
                                <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {selectedStock}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex h-1.5 w-1.5 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                    </span>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Historical Performance (30 Days)
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setSelectedStock(null)} 
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-black hover:bg-slate-100'}`}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Chart Container */}
                    <div className={`w-full p-4 sm:p-6 ${isDarkMode ? 'bg-[#09090b]' : 'bg-white'}`}>
                        <div className="w-full h-[350px] relative">
                            {isChartLoading ? (
                                <ChartSkeleton isDarkMode={isDarkMode} />
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        
                                        {/* Beautiful Gradient Fill */}
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={isDarkMode ? 0.4 : 0.2} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        {/* Subtle Grid Lines */}
                                        <CartesianGrid 
                                            strokeDasharray="4 4" 
                                            vertical={false} 
                                            stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                                        />

                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fontWeight: 500, fill: isDarkMode ? '#71717a' : '#94a3b8' }} 
                                            dy={15} 
                                            minTickGap={30}
                                        />
                                        
                                        <YAxis 
                                            domain={['auto', 'auto']} 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 11, fontWeight: 500, fill: isDarkMode ? '#71717a' : '#94a3b8' }} 
                                            tickFormatter={(val) => `${currencySymbol}${val}`} 
                                            dx={-10}
                                        />
                                        
                                        {/* Custom Interactive Tooltip */}
                                        <Tooltip 
                                            content={<CustomTooltip isDarkMode={isDarkMode} currencySymbol={currencySymbol} />} 
                                            cursor={{ stroke: isDarkMode ? '#6366f1' : '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }} 
                                        />
                                        
                                        {/* The Main Line & Area */}
                                        <Area 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke="#6366f1" 
                                            strokeWidth={3} 
                                            fill="url(#colorPrice)" 
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                        <svg className={`w-8 h-8 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>
                                    </div>
                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No Market Data Available</p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>The market might be closed or data is missing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
