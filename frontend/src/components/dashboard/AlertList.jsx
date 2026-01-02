import { motion, AnimatePresence } from 'framer-motion';
import { ChartLineIcon, SparklesIcon, TrashIcon } from '../common/Icons';
import { Skeleton } from '../../utils/helpers';

export default function AlertList({ alerts, loading, isInitialLoading, handleDelete, openChart, handleAnalyze, theme, isDarkMode }) {
    
    // ✅ Logic 1: Currency Symbol ($ or ₹)
    const getCurrency = (symbol) => {
        if (!symbol) return '₹';
        return symbol.includes('.') ? '₹' : '$';
    };

    // ✅ Logic 2: Exchange Badge Name (NSE / BSE / US)
    const getExchangeName = (symbol) => {
        if (symbol.includes('.NS')) return 'NSE';
        if (symbol.includes('.BO')) return 'BSE';
        return 'US'; // Default for US stocks
    };

    // ✅ Logic 3: Clean Symbol Name (Remove .NS/.BO for display)
    const getCleanSymbol = (symbol) => {
        return symbol.replace('.NS', '').replace('.BO', '');
    };

    if (isInitialLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className={`h-40 w-full ${theme.skeleton}`} />)}</div>;
    }

    if (alerts.length === 0) {
        return (
            <div className="text-center py-20 opacity-30">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>🔭</div>
                <p>Your watchlist is empty</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
                {alerts.map((alert) => {
                    const currencySymbol = getCurrency(alert.stock_symbol);
                    const exchangeTag = getExchangeName(alert.stock_symbol);
                    const displayName = getCleanSymbol(alert.stock_symbol);

                    return (
                        <motion.div 
                            key={alert._id} layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.90}} transition={{duration:0.2}}
                            className={`group relative border rounded-2xl p-5 transition-all duration-300 ${theme.card} ${alert.status === 'triggered' ? (isDarkMode ? 'border-red-500/30 bg-red-900/10' : 'border-red-200 bg-red-50') : 'hover:border-indigo-500/50'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        {/* ✅ Display Clean Name (No .NS) */}
                                        <h3 className={`text-lg font-bold ${theme.heading}`}>{displayName}</h3>
                                        
                                        {/* ✅ Smart Exchange Badge */}
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                                            exchangeTag === 'US' 
                                            ? 'bg-blue-500/10 text-blue-500' 
                                            : (isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-slate-200')
                                        }`}>
                                            {exchangeTag}
                                        </span>
                                    </div>
                                    <p className="text-xs opacity-50 mt-1 font-mono truncate max-w-[150px]">{alert.email}</p>
                                </div>
                                
                                {/* Status Indicator */}
                                {alert.status === 'active' ? (
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
                                ) : (
                                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded uppercase">Hit</span>
                                )}
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] font-bold opacity-40 uppercase mb-0.5">Target</p>
                                    <p className="text-2xl font-mono font-bold text-indigo-500">
                                        {/* ✅ Correct Currency Symbol */}
                                        {currencySymbol}{alert.target_price}
                                    </p>
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity md:translate-y-2 md:group-hover:translate-y-0">
                                    <button onClick={() => openChart(alert.stock_symbol)} className={`p-2 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`}><ChartLineIcon /></button>
                                    <button onClick={() => handleAnalyze(alert.stock_symbol)} className={`p-2 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`} title="AI Analysis"><SparklesIcon /></button>
                                    <button onClick={() => handleDelete(alert._id)} className={`p-2 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-100'}`}><TrashIcon /></button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
