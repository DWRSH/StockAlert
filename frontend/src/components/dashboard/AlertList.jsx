import { motion, AnimatePresence } from 'framer-motion';
import { ChartLineIcon, SparklesIcon, TrashIcon } from '../common/Icons';
import { Skeleton } from '../../utils/helpers';

// ✅ Clean Direction Icons
const TrendingUpIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>;
const TrendingDownIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>;

export default function AlertList({ alerts, loading, isInitialLoading, handleDelete, openChart, handleAnalyze, theme, isDarkMode }) {
    
    const getCurrency = (symbol) => (!symbol ? '₹' : symbol.includes('.') ? '₹' : '$');
    const getExchangeName = (symbol) => symbol.includes('.NS') ? 'NSE' : symbol.includes('.BO') ? 'BSE' : 'US';
    const getCleanSymbol = (symbol) => symbol.replace('.NS', '').replace('.BO', '');

    // --- Animation Variants for Staggered Load ---
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    if (isInitialLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className={`h-40 w-full rounded-2xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200/50'}`} />)}</div>;
    }

    if (alerts.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 opacity-40">
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-5 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} shadow-inner text-3xl`}>🔭</div>
                <p className="font-mono uppercase tracking-widest text-sm font-bold">Registry is empty</p>
                <p className="text-xs mt-2 opacity-60">Add a tracker to start monitoring.</p>
            </motion.div>
        );
    }

    // Dynamic Dot Grid Pattern based on theme
    const dotPattern = isDarkMode 
        ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)' 
        : 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)';

    return (
        <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"
        >
            <AnimatePresence>
                {alerts.map((alert) => {
                    const currencySymbol = getCurrency(alert.stock_symbol);
                    const exchangeTag = getExchangeName(alert.stock_symbol);
                    const displayName = getCleanSymbol(alert.stock_symbol);
                    
                    const direction = alert.direction || "UP";
                    const isUp = direction === "UP";
                    const isTriggered = alert.status === 'triggered';

                    // 🎨 Dynamic Premium Colors
                    const accentGlow = isUp ? 'group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]' : 'group-hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]';
                    const borderHover = isUp ? 'hover:border-emerald-500/40' : 'hover:border-rose-500/40';
                    const textColor = isUp ? 'text-emerald-500' : 'text-rose-500';
                    const badgeBg = isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';

                    return (
                        <motion.div 
                            variants={itemVariants}
                            layout
                            key={alert._id}
                            className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 ${isDarkMode ? 'bg-slate-900/60 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-slate-200/60'} ${isTriggered ? 'opacity-60 grayscale' : `${borderHover} ${accentGlow}`}`}
                        >
                            {/* Premium Dot Grid Background inside the card */}
                            <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: dotPattern, backgroundSize: '16px 16px' }}></div>
                            
                            {/* Card Content */}
                            <div className="relative z-10 p-6">
                                {/* Top Row: Symbol & Status */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{displayName}</h3>
                                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md tracking-widest uppercase border ${exchangeTag === 'US' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')}`}>
                                                {exchangeTag}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeBg}`}>
                                                {isUp ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                                {isUp ? "Breakout" : "Buy Dip"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Pulse Indicator */}
                                    {!isTriggered ? (
                                        <div className="relative flex h-3 w-3 mt-1.5 mr-1.5">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 border border-slate-400/30 px-2 py-1 rounded-md uppercase">Alert Hit</span>
                                    )}
                                </div>

                                {/* Bottom Row: Price & Actions */}
                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Target Price</p>
                                        <p className={`text-3xl font-mono font-black tracking-tighter ${textColor}`}>
                                            <span className="text-xl opacity-70 mr-0.5">{currencySymbol}</span>{alert.target_price}
                                        </p>
                                    </div>

                                    {/* Subtext Email */}
                                    <p className={`text-[10px] font-mono truncate max-w-[120px] transition-opacity duration-300 group-hover:opacity-0 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {alert.email}
                                    </p>
                                </div>
                            </div>

                            {/* 🚀 FLOATING ACTION DOCK (Reveals on Hover) */}
                            <div className="absolute bottom-4 right-4 left-4 flex justify-end gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                                <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-xl border shadow-xl ${isDarkMode ? 'bg-slate-800/80 border-white/10' : 'bg-white/90 border-slate-200'}`}>
                                    <button 
                                        onClick={() => openChart(alert.stock_symbol)} 
                                        className={`p-2.5 rounded-xl transition-all hover:scale-105 ${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                        title="View Chart"
                                    >
                                        <ChartLineIcon />
                                    </button>
                                    <button 
                                        onClick={() => handleAnalyze(alert.stock_symbol)} 
                                        className={`p-2.5 rounded-xl transition-all hover:scale-105 ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20' : 'text-indigo-600 hover:bg-indigo-50'}`} 
                                        title="AI Forecast"
                                    >
                                        <SparklesIcon />
                                    </button>
                                    <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                    <button 
                                        onClick={() => handleDelete(alert._id)} 
                                        className={`p-2.5 rounded-xl transition-all hover:scale-105 ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}
                                        title="Delete Alert"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
}
