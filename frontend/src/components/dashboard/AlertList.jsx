import { motion, AnimatePresence } from 'framer-motion';
import { ChartLineIcon, SparklesIcon, TrashIcon } from '../common/Icons';
import { Skeleton } from '../../utils/helpers';

// 🔹 Clean Micro Icons
const ArrowUpRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>;
const ArrowDownRightIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7l9.2 9.2M17 7v10H7"/></svg>;

export default function AlertList({ alerts, loading, isInitialLoading, handleDelete, openChart, handleAnalyze, theme, isDarkMode }) {
    
    const getCurrency = (symbol) => (!symbol ? '₹' : symbol.includes('.') ? '₹' : '$');
    const getExchangeName = (symbol) => symbol.includes('.NS') ? 'NSE' : symbol.includes('.BO') ? 'BSE' : 'US';
    const getCleanSymbol = (symbol) => symbol ? symbol.replace('.NS', '').replace('.BO', '') : 'UNKNOWN';

    if (isInitialLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className={`h-28 w-full rounded-xl ${isDarkMode ? 'bg-[#111]' : 'bg-gray-100'}`} />)}</div>;
    }

    if (alerts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No trackers are currently active.</p>
            </div>
        );
    }

    // Theme Variables for standard SaaS look
    const cardBg = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white';
    const cardBorder = isDarkMode ? 'border-[#222]' : 'border-gray-200';
    const textMain = isDarkMode ? 'text-white' : 'text-gray-900';
    const textDim = isDarkMode ? 'text-gray-500' : 'text-gray-400';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
                {alerts.map((alert) => {
                    const currencySymbol = getCurrency(alert.stock_symbol);
                    const exchangeTag = getExchangeName(alert.stock_symbol);
                    const displayName = getCleanSymbol(alert.stock_symbol);
                    
                    const isUp = (alert.direction || "UP") === "UP";
                    const isTriggered = alert.status === 'triggered';

                    return (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.98 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.95 }} 
                            transition={{ duration: 0.2 }}
                            key={alert._id}
                            className={`group relative flex flex-col rounded-xl border transition-colors ${cardBg} ${cardBorder} overflow-hidden ${isTriggered ? 'opacity-50 grayscale' : 'hover:border-gray-300 dark:hover:border-[#444]'}`}
                        >
                            {/* ========================================== */}
                            {/* 📊 MAIN DATA SECTION (Always Visible)      */}
                            {/* ========================================== */}
                            <div className="p-4 flex flex-col gap-4">
                                
                                {/* Top Row: Symbol & Status */}
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-base font-bold tracking-tight ${textMain}`}>
                                                {displayName}
                                            </h3>
                                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-[#222] text-[#aaa]' : 'bg-gray-100 text-gray-500'}`}>
                                                {exchangeTag}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-mono truncate max-w-[120px] ${textDim}`}>
                                            {alert.email.split('@')[0]}
                                        </span>
                                    </div>
                                    
                                    {/* Status Ping */}
                                    {!isTriggered ? (
                                        <div className="flex items-center justify-center w-5 h-5">
                                            <span className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isUp ? 'bg-emerald-500 text-emerald-500' : 'bg-rose-500 text-rose-500'}`}></span>
                                        </div>
                                    ) : (
                                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-[#222] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                            Hit
                                        </span>
                                    )}
                                </div>

                                {/* Bottom Row: Target Price */}
                                <div className="flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] uppercase font-bold tracking-widest mb-0.5 ${textDim}`}>Target</span>
                                        <div className={`text-2xl font-black tracking-tighter flex items-baseline gap-1 ${textMain}`}>
                                            <span className={`text-sm font-medium ${textDim}`}>{currencySymbol}</span>
                                            {alert.target_price}
                                        </div>
                                    </div>

                                    {/* Direction Tag */}
                                    <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                        {isUp ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                                        {isUp ? 'Breakout' : 'Buy Dip'}
                                    </div>
                                </div>
                            </div>

                            {/* ========================================== */}
                            {/* 📱 MOBILE VIEW: Fixed Bottom Action Bar    */}
                            {/* ========================================== */}
                            <div className={`flex md:hidden border-t divide-x ${isDarkMode ? 'border-[#222] divide-[#222] bg-[#0f0f0f]' : 'border-gray-100 divide-gray-100 bg-gray-50'}`}>
                                <button 
                                    onClick={() => openChart(alert.stock_symbol)} 
                                    className={`flex-1 flex justify-center py-3 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
                                >
                                    <ChartLineIcon />
                                </button>
                                <button 
                                    onClick={() => handleAnalyze(alert.stock_symbol)} 
                                    className={`flex-1 flex justify-center py-3 transition-colors ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
                                >
                                    <SparklesIcon />
                                </button>
                                <button 
                                    onClick={() => handleDelete(alert._id)} 
                                    className={`flex-1 flex justify-center py-3 transition-colors ${isDarkMode ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>

                            {/* ========================================== */}
                            {/* 💻 DESKTOP VIEW: Right-Side Hover Overlay  */}
                            {/* ========================================== */}
                            <div className={`hidden md:flex absolute inset-y-0 right-0 items-center justify-end pr-3 pl-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l ${isDarkMode ? 'from-[#0a0a0a] via-[#0a0a0a] to-transparent' : 'from-white via-white to-transparent'}`}>
                                <div className={`flex items-center gap-1 p-1 rounded-lg border shadow-sm ${isDarkMode ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-200'}`}>
                                    <button onClick={() => openChart(alert.stock_symbol)} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#222]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`} title="View Chart">
                                        <ChartLineIcon />
                                    </button>
                                    <button onClick={() => handleAnalyze(alert.stock_symbol)} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-indigo-400 hover:bg-indigo-500/20' : 'text-indigo-500 hover:bg-indigo-50'}`} title="AI Analyze">
                                        <SparklesIcon />
                                    </button>
                                    <div className={`w-px h-4 mx-0.5 ${isDarkMode ? 'bg-[#333]' : 'bg-gray-200'}`}></div>
                                    <button onClick={() => handleDelete(alert._id)} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-500 hover:bg-rose-50'}`} title="Delete Alert">
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
