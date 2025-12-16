import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

// --- API URL SETUP ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- ICONS (Simple & Clean) ---
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

    // Neutral Professional Colors for charts/bars
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];

    // --- FETCH LOGIC (SAME AS BEFORE) ---
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

    // --- SEARCH & TRADE LOGIC ---
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

    // Calculations
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
        // Changed Background: Using 'bg-gray-50' (Light) and 'bg-zinc-950' (Dark) instead of Slate/Blue
        <div className={`min-h-screen w-full font-sans ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900'}`}>
            <Toaster position="bottom-right" />
            
            {/* Header Area - Clean & Minimal */}
            <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-white'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Manage your holdings and track performance.</p>
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search assets..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`pl-9 pr-4 py-2 rounded-lg text-sm border focus:ring-1 focus:ring-indigo-500 outline-none w-64 transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-white border-gray-300 focus:border-indigo-500'}`}
                            />
                            <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                        </div>
                    </div>

                    {/* Mobile Action */}
                    <button onClick={() => setShowBottomSheet(true)} className="md:hidden flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm">
                        <Icons.Plus className="w-4 h-4" /> Add Transaction
                    </button>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN (2/3 width on large screens) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Summary Card - Clean Design */}
                        <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Current Value</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h2 className="text-3xl font-bold">₹{formatPrice(currentValue)}</h2>
                                    </div>
                                    <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${totalPnL >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'}`}>
                                        {totalPnL >= 0 ? '+' : ''}₹{formatPrice(Math.abs(totalPnL))} ({pnlPercentage}%)
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={isDarkMode ? 'text-zinc-400' : 'text-gray-500'}>Invested</span>
                                        <span className="font-semibold">₹{formatPrice(totalInvested)}</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100 dark:bg-zinc-800">
                                        {holdings.map((h, i) => {
                                            const width = totalInvested > 0 ? (h.quantity * h.avg_price / totalInvested) * 100 : 0;
                                            return <div key={i} style={{ width: `${width}%` }} className={colors[i % colors.length]} />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Holdings Table - Improved for Laptop */}
                        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="p-4 border-b dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="font-semibold text-base">Holdings</h3>
                                {/* Mobile Search inside Card */}
                                <div className="md:hidden relative w-40">
                                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1 text-xs rounded border bg-transparent dark:border-zinc-700" />
                                    <Icons.Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                                </div>
                            </div>
                            
                            {/* Desktop Table - Compact & Scroll Fixed */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className={`text-xs uppercase font-medium ${isDarkMode ? 'bg-zinc-950/50 text-zinc-500' : 'bg-gray-50 text-gray-500'}`}>
                                        <tr>
                                            <th className="px-4 py-3 pl-6">Symbol</th>
                                            <th className="px-4 py-3 text-right">Qty</th>
                                            <th className="px-4 py-3 text-right">Avg</th>
                                            <th className="px-4 py-3 text-right">LTP</th>
                                            <th className="px-4 py-3 text-right pr-6">Value (P&L)</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-gray-100'}`}>
                                        {filteredHoldings.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center opacity-50 text-sm">No assets found.</td></tr>
                                        ) : (
                                            filteredHoldings.map((h, i) => (
                                                <tr key={i} className={`group ${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}>
                                                    <td className="px-4 py-3 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-1 h-8 rounded-full ${colors[i % colors.length]}`}></div>
                                                            <div>
                                                                <span className="font-semibold block">{h.symbol}</span>
                                                                <span className="text-xs opacity-50 truncate max-w-[150px] block">{h.name || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums opacity-80">{h.quantity}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums opacity-80">₹{formatPrice(h.avg_price)}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums font-medium">₹{formatPrice(h.current_price || h.avg_price)}</td>
                                                    <td className="px-4 py-3 text-right pr-6">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-medium tabular-nums">₹{formatPrice(h.quantity * (h.current_price || h.avg_price))}</span>
                                                            <span className={`text-xs ${(h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
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
                                    <div key={i} className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm">{h.symbol}</h4>
                                                <p className="text-xs opacity-50">{h.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-sm">₹{formatPrice(h.quantity * (h.current_price || h.avg_price))}</div>
                                                <div className={`text-xs ${(h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) >= 0 ? '+' : ''}
                                                    {(((h.quantity * (h.current_price || h.avg_price)) - (h.quantity * h.avg_price)) / (h.quantity * h.avg_price) * 100).toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs opacity-60 bg-gray-50 dark:bg-zinc-950 p-2 rounded">
                                            <span>Qty: {h.quantity}</span>
                                            <span>Avg: {formatPrice(h.avg_price)}</span>
                                            <span>LTP: {formatPrice(h.current_price || h.avg_price)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3 width) - Actions/Forms */}
                    <div className="hidden lg:block space-y-6">
                        <div className={`sticky top-8 rounded-xl border p-5 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-md"><Icons.Plus className="w-4 h-4" /></span>
                                Quick Transaction
                            </h3>
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

            {/* Mobile Bottom Sheet */}
            <AnimatePresence>
                {showBottomSheet && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowBottomSheet(false)} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                        <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring", damping:25}} className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6 ${isDarkMode ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white'}`}>
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                            <h3 className="font-bold text-lg mb-4">New Transaction</h3>
                            <TradeForm txn={txn} setTxn={setTxn} handleTransaction={handleTransaction} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestions={suggestions} isDarkMode={isDarkMode} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- REUSABLE FORM COMPONENT ---
function TradeForm({ txn, setTxn, handleTransaction, showSuggestions, setShowSuggestions, suggestions, isDarkMode }) {
    const selectStock = (stock) => {
        setTxn({ ...txn, symbol: stock.symbol, price: stock.current_price || txn.price });
        setShowSuggestions(false);
    };

    return (
        <form onSubmit={handleTransaction} className="flex flex-col gap-3">
            <div className="relative">
                <label className="text-xs font-medium opacity-70 mb-1 block">Stock Symbol</label>
                <input 
                    type="text" placeholder="e.g. RELIANCE" value={txn.symbol}
                    onChange={e => { setTxn({...txn, symbol: e.target.value.toUpperCase()}); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all uppercase ${isDarkMode ? 'bg-zinc-950 border-zinc-700 focus:border-indigo-500' : 'bg-white border-gray-300 focus:border-indigo-500'}`} 
                />
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`absolute left-0 right-0 top-[105%] rounded-lg border shadow-lg max-h-48 overflow-y-auto z-50 ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                            {suggestions.map((s, idx) => (
                                <div key={idx} onClick={() => selectStock(s)} className={`px-3 py-2 cursor-pointer flex justify-between items-center border-b last:border-0 text-sm ${isDarkMode ? 'hover:bg-zinc-700 border-zinc-700' : 'hover:bg-gray-50 border-gray-100'}`}>
                                    <span>{s.symbol}</span>
                                    <span className="font-mono text-xs opacity-70">₹{s.current_price}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Quantity</label>
                    <input type="number" placeholder="0" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">Price</label>
                    <input type="number" placeholder="0.00" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none ${isDarkMode ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-gray-300'}`} />
                </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 p-1 rounded-lg ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-100'}`}>
                {['BUY', 'SELL'].map(type => (
                    <button key={type} type="button" onClick={() => setTxn({...txn, type})} className={`py-2 rounded-md text-xs font-bold transition-all ${txn.type === type ? (type === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-600 text-white shadow-sm') : 'opacity-60 hover:opacity-100'}`}>{type}</button>
                ))}
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition-colors mt-2">Submit Order</button>
        </form>
    );
}

function PortfolioSkeleton({ isDarkMode }) {
    return (
        <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
                <div className="h-12 bg-gray-200 dark:bg-zinc-800 rounded-lg w-full"></div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        <div className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                        <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                    </div>
                    <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
}
