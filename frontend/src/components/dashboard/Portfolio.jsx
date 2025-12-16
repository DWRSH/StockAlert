import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

// --- API URL SETUP ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- ICONS ---
const Icons = {
    Plus: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    ),
    Search: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
    ),
    Wallet: ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0zM1.75 14.5a.75.75 0 000 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 00-1.5 0v.784a6.658 6.658 0 01-1.65-.22c-4.186-1.111-8.528-1.714-12.986-1.714a.75.75 0 00-1.75.25z" clipRule="evenodd" />
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

    // Chart Colors
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];

    // --- FETCH LOGIC ---
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
        } catch (error) { console.error("Error fetching portfolio:", error); } 
        finally { if (!isBackground) setLoading(false); }
    };

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
                    if (match && match.name) { nameMap[stock.symbol] = match.name; updatesFound = true; }
                }
            } catch (err) { }
        }));
        if (updatesFound) setHoldings(prev => prev.map(h => nameMap[h.symbol] ? { ...h, name: nameMap[h.symbol] } : h));
        fetchingNamesRef.current = false;
    };

    useEffect(() => { 
        if(token) { fetchPortfolio(false); const interval = setInterval(() => fetchPortfolio(true), 5000); return () => clearInterval(interval); }
    }, [token]);

    // --- SEARCH & TRADE ---
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (txn.symbol.length > 1 && showSuggestions) {
                try { const res = await axios.get(`${API_URL}/search-stock?query=${txn.symbol}`); setSuggestions(res.data); } catch (err) { }
            } else { setSuggestions([]); }
        }, 300);
        return () => clearTimeout(delay);
    }, [txn.symbol, showSuggestions]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!txn.symbol || txn.quantity <= 0 || txn.price <= 0) { toast.error("Invalid Input"); return; }
        const tId = toast.loading("Processing...");
        try {
            await axios.post(`${API_URL}/portfolio/transaction`, {
                symbol: txn.symbol.toUpperCase(), quantity: Number(txn.quantity), price: Number(txn.price), type: txn.type
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Done!", { id: tId }); setShowBottomSheet(false); setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' }); fetchPortfolio(false);
        } catch (error) { toast.error("Failed", { id: tId }); }
    };

    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * (curr.current_price || curr.avg_price)), 0); 
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
    
    // Improved Filter Logic for searching by Name or Symbol
    const filteredHoldings = holdings.filter(h => {
        if (!h) return false; 
        const lowerSearch = searchTerm.toLowerCase();
        const symbolMatch = (h.symbol || '').toLowerCase().includes(lowerSearch);
        const nameMatch = (h.name && h.name !== 'N/A') ? h.name.toLowerCase().includes(lowerSearch) : false;
        return symbolMatch || nameMatch;
    });

    if (loading) return <PortfolioSkeleton isDarkMode={isDarkMode} />;

    return (
        // BG-GRAY-100 instead of 50 for better contrast in light mode
        <div className={`min-h-screen w-full font-sans ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-100 text-gray-900'}`}>
            <Toaster position="bottom-right" />
            
            {/* --- HEADER --- */}
            <div className={`w-full px-4 sm:px-6 lg:px-8 py-5 border-b sticky top-0 z-30 backdrop-blur-md ${isDarkMode ? 'border-zinc-800 bg-zinc-950/80' : 'border-gray-200 bg-white/80'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
                        <p className={`text-sm mt-0.5 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Track your investments</p>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-3">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search holdings..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`pl-9 pr-4 py-2.5 rounded-lg text-sm border font-medium outline-none w-64 transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white placeholder-zinc-500' : 'bg-white border-gray-300 focus:border-indigo-500 text-gray-900 placeholder-gray-400'}`}
                            />
                            <Icons.Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} />
                        </div>
                    </div>

                    <button onClick={() => setShowBottomSheet(true)} className="md:hidden flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform">
                        <Icons.Plus className="w-5 h-5" /> Add Transaction
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* --- LEFT COLUMN --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Summary Card */}
                        <div className={`rounded-xl border p-6 sm:p-8 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Total Valuation</p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h2 className="text-4xl font-bold tracking-tight">₹{formatPrice(currentValue)}</h2>
                                    </div>
                                    <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${totalPnL >= 0 ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-700 bg-red-100 dark:bg-red-500/10 dark:text-red-400'}`}>
                                        {totalPnL >= 0 ? '+' : ''}₹{formatPrice(Math.abs(totalPnL))} ({pnlPercentage}%)
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span className={isDarkMode ? 'text-zinc-400' : 'text-gray-600'}>Invested Amount</span>
                                        <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{formatPrice(totalInvested)}</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-zinc-800 border dark:border-zinc-700 border-gray-200">
                                        {holdings.map((h, i) => {
                                            const width = totalInvested > 0 ? (h.quantity * h.avg_price / totalInvested) * 100 : 0;
                                            return <div key={i} style={{ width: `${width}%` }} className={colors[i % colors.length]} />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Holdings Table */}
                        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}>
                                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Holdings ({filteredHoldings.length})</h3>
                                <div className="md:hidden relative w-40">
                                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-8 pr-2 py-1.5 text-xs font-medium rounded border bg-transparent ${isDarkMode ? 'border-zinc-700 text-white placeholder-zinc-600' : 'border-gray-300 text-gray-900 placeholder-gray-500'}`} />
                                    <Icons.Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`} />
                                </div>
                            </div>
                            
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className={`text-xs uppercase font-bold tracking-wider ${isDarkMode ? 'bg-zinc-950/50 text-zinc-500' : 'bg-gray-50 text-gray-600'}`}>
                                        <tr>
                                            <th className="px-5 py-4 pl-6">Instrument</th>
                                            <th className="px-5 py-4 text-right">Qty</th>
                                            <th className="px-5 py-4 text-right">Avg. Price</th>
                                            <th className="px-5 py-4 text-right">LTP</th>
                                            <th className="px-5 py-4 text-right pr-6">Value (P&L)</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-gray-100'}`}>
                                        {filteredHoldings.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center opacity-50 text-sm font-medium">No assets found matching your search.</td></tr>
                                        ) : (
                                            filteredHoldings.map((h, i) => (
                                                <tr key={i} className={`group transition-colors ${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}>
                                                    <td className="px-5 py-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1.5 h-8 rounded-full ${colors[i % colors.length]}`}></div>
                                                            <div>
                                                                <span className={`font-bold block ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>{h.symbol}</span>
                                                                <span className={`text-xs font-medium truncate max-w-[150px] block ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{h.name || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={`px-5 py-4 text-right tabular-nums font-medium ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{h.quantity}</td>
                                                    <td className={`px-5 py-4 text-right tabular-nums font-medium ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>₹{formatPrice(h.avg_price)}</td>
                                                    <td className={`px-5 py-4 text-right tabular-nums font-bold ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>₹{formatPrice(h.current_price || h.avg_price)}</td>
                                                    <td className="px-5 py-4 text-right pr-6">
                                                        <div className="flex flex-col items-end">
                                                            <span className={`font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{formatPrice(h.quantity * (h.current_price || h.avg_price))}</span>
                                                            <span className={`text-xs font-bold mt-0.5 ${(h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                                {((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) >= 0 ? '+' : ''}
                                                                {(((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) / (h.quantity * h.avg_price) * 100).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y dark:divide-zinc-800">
                                {filteredHoldings.map((h, i) => (
                                    <div key={i} className="p-4 active:bg-gray-50 dark:active:bg-zinc-800/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${colors[i % colors.length]}`}>
                                                    {h.symbol.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{h.symbol}</h4>
                                                    <p className={`text-xs font-medium truncate max-w-[120px] ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{h.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{formatPrice(h.quantity * (h.current_price || h.avg_price))}</div>
                                                <div className={`text-xs font-bold ${(h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price) >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                    {((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) >= 0 ? '+' : ''}
                                                    {(((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) / (h.quantity * h.avg_price) * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex justify-between text-xs font-medium p-2.5 rounded-lg ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-100 text-gray-600'}`}>
                                            <span>Qty: <span className={isDarkMode ? 'text-zinc-200' : 'text-gray-900'}>{h.quantity}</span></span>
                                            <span>Avg: <span className={isDarkMode ? 'text-zinc-200' : 'text-gray-900'}>{formatPrice(h.avg_price)}</span></span>
                                            <span>LTP: <span className={isDarkMode ? 'text-zinc-200' : 'text-gray-900'}>{formatPrice(h.current_price || h.avg_price)}</span></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN (Actions) --- */}
                    <div className="hidden lg:block space-y-6">
                        <div className={`sticky top-24 rounded-xl border p-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-lg shadow-gray-100'}`}>
                            <div className={`flex items-center gap-2 mb-6 pb-4 border-b ${isDarkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Icons.Wallet className="w-5 h-5" />
                                </div>
                                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quick Trade</h3>
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
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowBottomSheet(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
                        <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring", damping:25}} className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6 shadow-2xl ${isDarkMode ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white'}`}>
                            <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-zinc-700' : 'bg-gray-300'}`} />
                            <h3 className={`font-bold text-xl mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Transaction</h3>
                            <TradeForm txn={txn} setTxn={setTxn} handleTransaction={handleTransaction} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestions={suggestions} isDarkMode={isDarkMode} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- TRADE FORM COMPONENT ---
function TradeForm({ txn, setTxn, handleTransaction, showSuggestions, setShowSuggestions, suggestions, isDarkMode }) {
    const selectStock = (stock) => {
        setTxn({ ...txn, symbol: stock.symbol, price: stock.current_price || txn.price });
        setShowSuggestions(false);
    };

    return (
        <form onSubmit={handleTransaction} className="flex flex-col gap-5">
            <div className="relative">
                <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Stock Symbol</label>
                <input 
                    type="text" placeholder="e.g. RELIANCE" value={txn.symbol}
                    onChange={e => { setTxn({...txn, symbol: e.target.value.toUpperCase()}); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all uppercase focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-zinc-950 border-zinc-700 focus:border-indigo-500 text-white placeholder-zinc-600' : 'bg-white border-gray-300 focus:border-indigo-500 text-gray-900 placeholder-gray-400'}`} 
                />
                
                {/* --- SEARCH SUGGESTIONS DROPDOWN --- */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`absolute left-0 right-0 top-[110%] rounded-xl border shadow-xl max-h-56 overflow-y-auto z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                            {suggestions.map((s, idx) => (
                                <div key={idx} onClick={() => selectStock(s)} className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800' : 'hover:bg-gray-50 border-gray-100'}`}>
                                    <div>
                                        {/* Added Name Here */}
                                        <span className={`block font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{s.symbol}</span>
                                        <span className={`block text-xs truncate max-w-[200px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{s.name}</span>
                                    </div>
                                    <span className={`font-mono text-xs font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>₹{s.current_price}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Quantity</label>
                    <input type="number" placeholder="0" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Price</label>
                    <input type="number" placeholder="0.00" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
                {['BUY', 'SELL'].map(type => (
                    <button key={type} type="button" onClick={() => setTxn({...txn, type})} className={`py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${txn.type === type ? (type === 'BUY' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' : 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none') : 'opacity-60 hover:opacity-100 text-gray-500 dark:text-gray-400'}`}>{type}</button>
                ))}
            </div>

            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95">Execute Order</button>
        </form>
    );
}

function PortfolioSkeleton({ isDarkMode }) {
    return (
        <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-14 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                        <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                    </div>
                    <div className="hidden lg:block h-80 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
