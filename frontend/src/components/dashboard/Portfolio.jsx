import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/helpers';
import toast from 'react-hot-toast';

// --- Icons ---
import { SearchIcon, PlusIcon, TrendUp } from '../common/Icons'; 

// Local SVG Icons
const WalletIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PieChartIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;

export default function Portfolio({ token, isDarkMode }) {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [showForm, setShowForm] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });

    // Search States
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHoldings(res.data);
        } catch (error) {
            console.error("Error fetching portfolio");
        }
        setLoading(false);
    };

    useEffect(() => { fetchPortfolio(); }, []);

    // Search Logic
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (txn.symbol.length > 1 && showSuggestions) {
                setIsSearching(true); 
                try {
                    const res = await axios.get(`${API_URL}/search-stock?query=${txn.symbol}`);
                    setSuggestions(res.data);
                } catch (err) {
                    console.error("Search failed");
                }
                setIsSearching(false); 
            } else {
                setSuggestions([]);
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [txn.symbol, showSuggestions]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        const tId = toast.loading("Processing...");
        try {
            await axios.post(`${API_URL}/portfolio/transaction`, {
                ...txn,
                quantity: Number(txn.quantity),
                price: Number(txn.price)
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Saved!", { id: tId });
            setShowForm(false);
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' });
            fetchPortfolio();
        } catch (error) {
            toast.error("Failed", { id: tId });
        }
    };

    const selectStock = (symbol) => {
        setTxn({ ...txn, symbol: symbol });
        setShowSuggestions(false);
    };

    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    // 🔥 SKELETON LOADING STATE (Replaces simple text)
    if (loading && holdings.length === 0) {
        return <PortfolioSkeleton isDarkMode={isDarkMode} />;
    }

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                <div className={`col-span-2 relative overflow-hidden rounded-[2rem] p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[180px] md:min-h-[200px] ${
                    isDarkMode ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black border border-white/10' : 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-200'
                }`}>
                    <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 opacity-90 mb-1">
                            
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Net Worth</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
                            ₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 backdrop-blur-md border border-white/10 ${totalPnL >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
                                {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                {totalPnL >= 0 && <TrendUp />}
                            </span>
                            <span className={`px-2 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border border-white/10 ${totalPnL >= 0 ? 'bg-emerald-400/10 text-emerald-200' : 'bg-red-400/10 text-red-200'}`}>
                                {pnlPercentage}% Returns
                            </span>
                        </div>
                    </div>
                    <div className="mt-6 relative z-10">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-70 mb-2">
                            <span>Allocation</span>
                            <span>{holdings.length} Assets</span>
                        </div>
                        <div className="flex h-2 md:h-3 w-full rounded-full overflow-hidden bg-black/20 backdrop-blur-sm">
                            {holdings.length > 0 ? holdings.map((h, i) => {
                                const percent = ((h.quantity * h.current_price) / currentValue) * 100;
                                return <div key={i} style={{ width: `${percent}%` }} className={colors[i % colors.length]} />;
                            }) : <div className="w-full h-full bg-white/10" />}
                        </div>
                    </div>
                </div>

                <div className={`rounded-[2rem] p-6 border flex flex-col justify-center gap-4 ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><PieChartIcon /></div>
                        <div>
                            <p className="text-[10px] font-bold opacity-50 uppercase">Invested</p>
                            <p className={`text-xl md:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{totalInvested.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 w-full lg:my-1"></div>
                    <button onClick={() => setShowForm(!showForm)} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${showForm ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'}`}>
                        {showForm ? 'Cancel' : 'Add Transaction'}
                        {!showForm && <PlusIcon />}
                    </button>
                </div>
            </div>

            {/* TRANSACTION FORM */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-visible z-30 relative">
                        <form onSubmit={handleTransaction} className={`p-6 rounded-[24px] border mb-2 shadow-2xl ${
                            isDarkMode ? 'bg-[#1e2433] border-slate-700 shadow-black/40' : 'bg-white border-slate-100 shadow-indigo-100'
                        }`}>
                            <div className="flex flex-col gap-6">
                                <div className="relative z-50">
                                    <label className="text-[10px] uppercase font-bold opacity-50 mb-1.5 block tracking-widest">Select Stock</label>
                                    <div className={`relative flex items-center border rounded-2xl transition-all duration-300 ${
                                        isDarkMode ? 'bg-[#151a25] border-slate-700 focus-within:border-indigo-500 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-50 border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                                    }`}>
                                        <div className="pl-4 text-indigo-500"><SearchIcon /></div>
                                        <input 
                                            required type="text" placeholder="Search Symbol (e.g. TATA)" 
                                            className="w-full px-4 py-4 bg-transparent border-none outline-none font-bold text-lg uppercase placeholder-opacity-50"
                                            value={txn.symbol} 
                                            onChange={e => {
                                                setTxn({...txn, symbol: e.target.value.toUpperCase()});
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                        />
                                        {isSearching && (
                                            <div className="pr-4"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                className={`absolute left-0 right-0 top-[110%] rounded-2xl shadow-2xl border overflow-hidden z-50 max-h-60 overflow-y-auto ${
                                                    isDarkMode ? 'bg-[#0B0F19] border-slate-700 shadow-black/80' : 'bg-white border-slate-200 shadow-slate-300'
                                                }`}
                                            >
                                                {suggestions.map((stock, idx) => (
                                                    <div key={idx} onClick={() => selectStock(stock.symbol)} className={`px-5 py-3.5 cursor-pointer flex justify-between items-center transition border-b last:border-0 ${
                                                        isDarkMode ? 'hover:bg-slate-800/80 text-slate-200 border-slate-800' : 'hover:bg-indigo-50 text-slate-700 border-slate-100'
                                                    }`}>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-indigo-500">{stock.symbol}</span>
                                                            <span className="text-[10px] opacity-60 uppercase tracking-wide font-medium">{stock.name}</span>
                                                        </div>
                                                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}><PlusIcon /></div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <InputGroup label="Quantity" type="number" placeholder="10" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} isDarkMode={isDarkMode} />
                                    <InputGroup label="Avg. Price" type="number" placeholder="0.00" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} isDarkMode={isDarkMode} />
                                    <div className="col-span-2 flex gap-3 h-full items-end">
                                        <div className={`flex-1 flex p-1 rounded-xl h-[52px] ${isDarkMode ? 'bg-[#151a25]' : 'bg-slate-100'}`}>
                                            <TypeButton type="BUY" current={txn.type} onClick={() => setTxn({...txn, type: 'BUY'})} isDarkMode={isDarkMode} />
                                            <TypeButton type="SELL" current={txn.type} onClick={() => setTxn({...txn, type: 'SELL'})} isDarkMode={isDarkMode} />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98]">Save Transaction</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HOLDINGS LIST */}
            <div className={`rounded-[2rem] border overflow-hidden ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`}>
                <div className={`p-5 md:p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Your Assets</h3>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            <tr>
                                <th className="p-6">Asset Name</th>
                                <th className="p-6 text-center">Qty</th>
                                <th className="p-6 text-right">Avg. Price</th>
                                <th className="p-6 text-right">LTP (Live)</th>
                                <th className="p-6 text-right">Returns</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={container} initial="hidden" animate="show" className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {holdings.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center opacity-50">Portfolio is empty.</td></tr>
                            ) : (
                                holdings.map((h, i) => (
                                    <DesktopRow key={h._id} h={h} i={i} colors={colors} isDarkMode={isDarkMode} itemVariant={item} />
                                ))
                            )}
                        </motion.tbody>
                    </table>
                </div>
                <div className="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                    {holdings.length === 0 ? (
                        <div className="p-10 text-center opacity-50 text-sm">Portfolio is empty.</div>
                    ) : (
                        holdings.map((h, i) => (
                            <MobileCard key={h._id} h={h} i={i} colors={colors} isDarkMode={isDarkMode} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// 🔥 PREMIUM SKELETON LOADER
const PortfolioSkeleton = ({ isDarkMode }) => (
    <div className="space-y-6 pb-24 md:pb-0 animate-pulse">
        {/* Top Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className={`col-span-2 rounded-[2rem] h-[200px] ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200'}`}></div>
            <div className={`rounded-[2rem] h-[200px] ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200'}`}></div>
        </div>
        {/* Table/List Skeleton */}
        <div className={`rounded-[2rem] h-[400px] ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200'} p-6`}>
            <div className={`h-8 w-1/4 rounded-lg mb-8 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center mb-6 last:mb-0">
                    <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                        <div className={`w-32 h-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    </div>
                    <div className={`hidden md:block w-24 h-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                    <div className={`w-20 h-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                </div>
            ))}
        </div>
    </div>
);

// --- SUB COMPONENTS ---

const DesktopRow = ({ h, i, colors, isDarkMode, itemVariant }) => {
    const investVal = h.quantity * h.avg_price;
    const curVal = h.quantity * h.current_price; 
    const rowPnL = curVal - investVal;
    const rowPnLPercent = ((rowPnL / investVal) * 100).toFixed(2);
    const colorClass = colors[i % colors.length].replace('bg-', 'text-');

    return (
        <motion.tr variants={itemVariant} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-indigo-50/40'}`}>
            <td className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} ${colorClass}`}>
                        {h.symbol.substring(0, 2)}
                    </div>
                    <div>
                        <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{h.symbol}</div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit mt-1 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>EQUITY</div>
                    </div>
                </div>
            </td>
            <td className="p-6 text-center font-medium opacity-70">{h.quantity}</td>
            <td className="p-6 text-right opacity-70">₹{h.avg_price.toLocaleString()}</td>
            <td className="p-6 text-right font-black">₹{h.current_price.toFixed(2)}</td>
            <td className="p-6 text-right">
                <div className={`flex flex-col items-end`}>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${rowPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {rowPnL >= 0 ? '+' : ''}₹{Math.abs(rowPnL).toFixed(0)}
                    </span>
                    <span className={`text-[10px] mt-1 font-bold ${rowPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{rowPnLPercent}%</span>
                </div>
            </td>
        </motion.tr>
    );
};

const MobileCard = ({ h, i, colors, isDarkMode }) => {
    const investVal = h.quantity * h.avg_price;
    const curVal = h.quantity * h.current_price; 
    const rowPnL = curVal - investVal;
    const rowPnLPercent = ((rowPnL / investVal) * 100).toFixed(2);
    const colorClass = colors[i % colors.length].replace('bg-', 'text-');

    return (
        <div className={`p-5 flex justify-between items-center active:bg-slate-50 dark:active:bg-slate-800 transition`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} ${colorClass}`}>
                    {h.symbol.substring(0, 2)}
                </div>
                <div>
                    <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{h.symbol}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>EQUITY</span>
                        <span className="text-[11px] opacity-60 font-medium">{h.quantity} Qty</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{h.current_price.toFixed(2)}</div>
                <div className={`text-[11px] font-bold mt-0.5 ${rowPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {rowPnL >= 0 ? '+' : ''}₹{Math.abs(rowPnL).toFixed(0)} ({rowPnLPercent}%)
                </div>
            </div>
        </div>
    );
}

const InputGroup = ({ label, type="text", placeholder, value, onChange, isDarkMode }) => (
    <div className="w-full">
        <label className="text-[10px] uppercase font-bold opacity-50 ml-1 mb-1.5 block tracking-widest">{label}</label>
        <input required type={type} placeholder={placeholder} className={`w-full px-4 py-3.5 rounded-2xl text-sm border font-bold outline-none transition-all ${isDarkMode ? 'bg-[#151a25] border-slate-700 text-white focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] focus:border-indigo-500'}`} value={value} onChange={onChange} />
    </div>
);

const TypeButton = ({ type, current, onClick, isDarkMode }) => (
    <button type="button" onClick={onClick} className={`flex-1 rounded-lg font-bold text-xs transition-all duration-300 ${current === type ? (type === 'BUY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' : 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105') : (isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-800')}`}>{type}</button>
);
