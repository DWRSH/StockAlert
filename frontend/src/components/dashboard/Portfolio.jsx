import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

// --- API URL SETUP ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- ICONS ---
const Icons = {
    Plus: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Search: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
    ),
    Wallet: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
    ),
    TrendingUp: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 01.968-.432l5.942 2.28a.75.75 0 01.431.97l-2.28 5.941a.75.75 0 11-1.4-.537l1.63-4.251-1.086.483a6 6 0 00-2.742 2.742l-.213.37a.75.75 0 01-1.238-.649l.213-.37a7.5 7.5 0 013.371-3.373l1.086-.483-4.251-1.632a.75.75 0 01-.432-.97z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M1.5 12c0-5.799 4.701-10.5 10.5-10.5 3.513 0 6.608 1.748 8.528 4.416a.75.75 0 01-.284 1.137l-1.385.733A9.006 9.006 0 0012 3C7.029 3 3 7.029 3 12s4.029 9 9 9 9-4.029 9-9a.75.75 0 111.5 0c0 5.799-4.701 10.5-10.5 10.5S1.5 17.799 1.5 12z" clipRule="evenodd" />
        </svg>
    )
};

const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) return '0.00';
    return price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Portfolio({ token, isDarkMode }) {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI State
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const fetchingNamesRef = useRef(false);

    // Modern Fintech Colors
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500'];

    // --- LOGIC: FETCH PORTFOLIO ---
    const fetchPortfolio = async (isBackground = false) => {
        if (!isBackground) setLoading(true); 
        try {
            const res = await axios.get(`${API_URL}/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
            const newData = Array.isArray(res.data) ? res.data : (res.data.holdings || []);
            
            setHoldings(prevHoldings => {
                const mergedData = newData.map(newItem => {
                    const existingItem = prevHoldings.find(p => p.symbol === newItem.symbol);
                    let finalName = newItem.name;
                    if (!finalName || finalName === 'N/A' || finalName === newItem.symbol) {
                        if (existingItem && existingItem.name && existingItem.name !== 'N/A' && existingItem.name !== existingItem.symbol) {
                            finalName = existingItem.name;
                        }
                    }
                    return { ...newItem, name: finalName };
                });
                fetchMissingNames(mergedData);
                return mergedData;
            });
        } catch (error) {
            console.error("Error fetching portfolio:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // --- LOGIC: FETCH NAMES ---
    const fetchMissingNames = async (currentHoldings) => {
        if (fetchingNamesRef.current) return;
        const stocksToFetch = currentHoldings.filter(h => !h.name || h.name === 'N/A' || h.name === h.symbol);
        if (stocksToFetch.length === 0) return;

        fetchingNamesRef.current = true;
        let updatesFound = false;
        const nameMap = {};

        await Promise.all(stocksToFetch.map(async (stock) => {
            try {
                const res = await axios.get(`${API_URL}/search-stock?query=${stock.symbol}`);
                if (res.data && res.data.length > 0) {
                    const match = res.data.find(s => s.symbol === stock.symbol);
                    if (match && match.name) {
                        nameMap[stock.symbol] = match.name;
                        updatesFound = true;
                    }
                }
            } catch (err) { console.error(`Failed name fetch: ${stock.symbol}`); }
        }));

        if (updatesFound) {
            setHoldings(prev => prev.map(h => nameMap[h.symbol] ? { ...h, name: nameMap[h.symbol] } : h));
        }
        fetchingNamesRef.current = false;
    };

    useEffect(() => { 
        if(token) {
            fetchPortfolio(false); 
            const interval = setInterval(() => fetchPortfolio(true), 5000); 
            return () => clearInterval(interval);
        }
    }, [token]);

    // --- LOGIC: SEARCH & TRADE ---
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (txn.symbol.length > 1 && showSuggestions) {
                try {
                    const res = await axios.get(`${API_URL}/search-stock?query=${txn.symbol}`);
                    setSuggestions(res.data);
                } catch (err) { }
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [txn.symbol, showSuggestions]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!txn.symbol || txn.quantity <= 0 || txn.price <= 0) {
            toast.error("Invalid Input", { position: 'bottom-right' });
            return;
        }
        const tId = toast.loading("Executing Order...", { position: 'bottom-right' });
        try {
            await axios.post(`${API_URL}/portfolio/transaction`, {
                symbol: txn.symbol.toUpperCase(),
                quantity: Number(txn.quantity),
                price: Number(txn.price),
                type: txn.type
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Order Executed!", { id: tId, position: 'bottom-right' }); 
            setShowBottomSheet(false);
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' });
            fetchPortfolio(false); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed", { id: tId, position: 'bottom-right' });
        }
    };

    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * (curr.current_price || curr.avg_price)), 0); 
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    const filteredHoldings = holdings.filter(h => {
        if (!h) return false; 
        const lowerSearch = searchTerm.toLowerCase();
        return (h.symbol || '').toLowerCase().includes(lowerSearch) || (h.name || '').toLowerCase().includes(lowerSearch);
    });

    if (loading) return <PortfolioSkeleton isDarkMode={isDarkMode} />;

    return (
        <div className={`min-h-screen font-sans selection:bg-indigo-500/30 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            <Toaster />
            
            {/* --- TOP NAVIGATION BAR --- */}
            <div className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Icons.TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Portfolio<span className="text-indigo-500">.</span></h1>
                    </div>
                    
                    {/* Search Bar (Desktop) */}
                    <div className="hidden md:block relative w-96">
                        <input 
                            type="text" 
                            placeholder="Filter your holdings..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400'}`}
                        />
                        <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    </div>

                    <button 
                        onClick={() => setShowBottomSheet(true)}
                        className="md:hidden p-2 rounded-lg bg-indigo-600 text-white shadow-lg active:scale-95"
                    >
                        <Icons.Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* --- LEFT COLUMN: STATS & TABLE (8 COLS) --- */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        
                        {/* 1. PORTFOLIO SUMMARY CARD */}
                        <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            {/* Decorative Background Blur */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Total Valuation</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl sm:text-5xl font-bold tracking-tight">₹{formatPrice(currentValue)}</span>
                                    </div>
                                    <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <span className={`px-2 py-1 rounded-md bg-opacity-10 ${totalPnL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                            {totalPnL >= 0 ? '+' : ''}₹{formatPrice(Math.abs(totalPnL))}
                                        </span>
                                        <span>({pnlPercentage}%) All Time</span>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Invested Amount</span>
                                    <span className={`text-xl font-bold font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>₹{formatPrice(totalInvested)}</span>
                                </div>
                            </div>

                            {/* Holdings Visual Bar */}
                            <div className="mt-8">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">
                                    <span>Portfolio Allocation</span>
                                    <span>{holdings.length} Assets</span>
                                </div>
                                <div className="flex w-full h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                                    {holdings.map((h, i) => {
                                        const width = totalInvested > 0 ? (h.quantity * h.avg_price / totalInvested) * 100 : 0;
                                        return <div key={i} style={{ width: `${width}%` }} className={colors[i % colors.length]} title={h.symbol} />;
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* 2. HOLDINGS LIST */}
                        <div>
                            {/* Mobile Search (Only visible on mobile) */}
                            <div className="md:hidden mb-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Search holdings..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                    />
                                    <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                </div>
                            </div>

                            <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className={`text-xs uppercase font-bold tracking-wider border-b ${isDarkMode ? 'bg-slate-950/50 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                            <tr>
                                                <th className="p-5 pl-6">Instrument</th>
                                                <th className="p-5 text-right">Qty</th>
                                                <th className="p-5 text-right">Avg. Price</th>
                                                <th className="p-5 text-right">LTP</th>
                                                <th className="p-5 text-right pr-6">Value / P&L</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                            {filteredHoldings.length === 0 ? (
                                                <tr><td colSpan="5" className="p-12 text-center opacity-50">No holdings found matching "{searchTerm}"</td></tr>
                                            ) : (
                                                filteredHoldings.map((h, i) => (
                                                    <DesktopRow key={h._id || i} h={h} i={i} colors={colors} isDarkMode={isDarkMode} />
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="md:hidden divide-y dark:divide-slate-800">
                                    {filteredHoldings.length === 0 && <p className="p-8 text-center opacity-50 text-sm">No holdings found.</p>}
                                    {filteredHoldings.map((h, i) => (
                                        <MobileRow key={h._id || i} h={h} i={i} colors={colors} isDarkMode={isDarkMode} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: TRADE FORM (STICKY) (4 COLS) --- */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className={`sticky top-24 rounded-2xl border p-6 shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-slate-800">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <Icons.Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-none">Quick Trade</h3>
                                    <p className="text-xs opacity-50 font-medium mt-1">Buy or Sell stocks instantly</p>
                                </div>
                            </div>
                            
                            <TradeForm 
                                txn={txn} setTxn={setTxn} 
                                handleTransaction={handleTransaction} 
                                showSuggestions={showSuggestions} 
                                setShowSuggestions={setShowSuggestions}
                                suggestions={suggestions}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </div>

                </div>
            </main>

            {/* --- MOBILE BOTTOM SHEET --- */}
            <AnimatePresence>
                {showBottomSheet && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            onClick={() => setShowBottomSheet(false)} 
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
                        />
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 shadow-2xl ${isDarkMode ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}
                        >
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-6" />
                            <h2 className="text-xl font-bold mb-6">New Transaction</h2>
                            <TradeForm 
                                txn={txn} setTxn={setTxn} 
                                handleTransaction={handleTransaction} 
                                showSuggestions={showSuggestions} 
                                setShowSuggestions={setShowSuggestions}
                                suggestions={suggestions}
                                isDarkMode={isDarkMode}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function TradeForm({ txn, setTxn, handleTransaction, showSuggestions, setShowSuggestions, suggestions, isDarkMode }) {
    const selectStock = (stock) => {
        setTxn({ ...txn, symbol: stock.symbol, price: stock.current_price || txn.price });
        setShowSuggestions(false);
    };

    return (
        <form onSubmit={handleTransaction} className="flex flex-col gap-4">
            <div className="relative z-20">
                <label className="text-xs font-bold uppercase opacity-50 mb-1 block ml-1">Stock Symbol</label>
                <input 
                    type="text" 
                    placeholder="e.g. RELIANCE" 
                    className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm transition-all uppercase ${isDarkMode ? 'bg-slate-950 border-slate-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'}`} 
                    value={txn.symbol} 
                    onChange={e => { setTxn({...txn, symbol: e.target.value.toUpperCase()}); setShowSuggestions(true); }} 
                    onFocus={() => setShowSuggestions(true)} 
                />
                
                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div 
                            initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0}} 
                            className={`absolute left-0 right-0 top-[110%] rounded-xl shadow-xl border overflow-hidden max-h-56 overflow-y-auto z-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                        >
                            {suggestions.map((s, idx) => (
                                <div key={idx} onClick={() => selectStock(s)} className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${isDarkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
                                    <div>
                                        <span className="font-bold text-sm block">{s.symbol}</span>
                                        <span className="text-[10px] opacity-60 uppercase truncate max-w-[150px] block">{s.name || 'N/A'}</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold">₹{formatPrice(s.current_price)}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block ml-1">Qty</label>
                    <input type="number" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block ml-1">Price</label>
                    <input type="number" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} />
                </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
                {['BUY', 'SELL'].map(type => {
                    const isActive = txn.type === type;
                    return (
                        <button
                            key={type} type="button" onClick={() => setTxn({...txn, type})}
                            className={`py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${isActive ? (type === 'BUY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20') : 'opacity-50 hover:opacity-100'}`}
                        >
                            {type}
                        </button>
                    )
                })}
            </div>

            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all mt-2">
                Execute Order
            </button>
        </form>
    )
}

function DesktopRow({ h, i, colors, isDarkMode }) {
    const ltp = h.current_price || h.avg_price || 0;
    const totalVal = h.quantity * ltp;
    const invested = h.quantity * h.avg_price;
    const pnl = totalVal - invested;
    const pnlPercentage = invested > 0 ? ((pnl/invested)*100).toFixed(2) : 0;
    const displayName = (h.name && h.name !== 'N/A' && h.name !== h.symbol) ? h.name : (h.symbol ? 'Loading Name...' : 'N/A');

    return (
        <tr className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
            <td className="p-5 pl-6">
                <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-10 rounded-full ${colors[i % colors.length]}`}></div>
                    <div>
                        <h4 className="font-bold text-sm">{h.symbol}</h4>
                        <p className="text-[11px] font-medium opacity-50 uppercase tracking-wide truncate max-w-[180px]">{displayName}</p>
                    </div>
                </div>
            </td>
            <td className="p-5 text-right font-mono font-medium opacity-80 tabular-nums">{h.quantity}</td>
            <td className="p-5 text-right font-mono font-medium opacity-80 tabular-nums">₹{formatPrice(h.avg_price)}</td>
            <td className="p-5 text-right">
                <span className="font-mono font-bold tabular-nums">₹{formatPrice(ltp)}</span>
            </td>
            <td className="p-5 text-right pr-6">
                <div className="flex flex-col items-end">
                    <span className="font-bold font-mono text-sm tabular-nums">₹{formatPrice(totalVal)}</span>
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pnl >= 0 ? '▲' : '▼'} {Math.abs(pnlPercentage)}%
                    </span>
                </div>
            </td>
        </tr>
    );
}

function MobileRow({ h, i, colors, isDarkMode }) {
    const ltp = h.current_price || h.avg_price || 0;
    const totalVal = h.quantity * ltp;
    const invested = h.quantity * h.avg_price;
    const pnl = totalVal - invested;
    const pnlPercentage = invested > 0 ? ((pnl/invested)*100).toFixed(2) : 0;
    const displayName = (h.name && h.name !== 'N/A' && h.name !== h.symbol) ? h.name : (h.symbol ? 'Loading Name...' : 'N/A');

    return (
        <div className={`p-4 flex flex-col gap-3 active:bg-slate-50 dark:active:bg-slate-800/50`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${colors[i % colors.length]}`}>
                        {h.symbol.substring(0,1)}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">{h.symbol}</h4>
                        <p className="text-[10px] font-bold uppercase opacity-50">{displayName}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block font-bold font-mono text-sm">₹{formatPrice(totalVal)}</span>
                    <span className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pnl >= 0 ? '+' : ''}{pnlPercentage}%
                    </span>
                </div>
            </div>
            <div className="flex justify-between items-center text-xs opacity-60 font-medium font-mono bg-slate-100 dark:bg-slate-950 p-2 rounded-lg">
                <span>Qty: <b className="opacity-100">{h.quantity}</b></span>
                <span>Avg: <b className="opacity-100">₹{formatPrice(h.avg_price)}</b></span>
                <span>LTP: <b className="opacity-100">₹{formatPrice(ltp)}</b></span>
            </div>
        </div>
    );
}

function PortfolioSkeleton({ isDarkMode }) {
    return (
        <div className={`min-h-screen p-4 md:p-8 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="animate-pulse space-y-8 max-w-7xl mx-auto">
                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                    </div>
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
