import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';

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
    
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const fetchingNamesRef = useRef(false);

    const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'];

    // --- FETCH LOGIC ---
    const fetchPortfolio = async (isBackground = false) => {
        if (!token) {
            console.error("❌ Token missing in Portfolio component");
            return;
        }

        if (!isBackground) setLoading(true); 
        try {
            const res = await axios.get(`${API_URL}/api/portfolio`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            const newData = Array.isArray(res.data) ? res.data : (res.data.holdings || []);
            
            // Trigger name fetch separately
            fetchMissingNames(newData);

            setHoldings(prevHoldings => {
                return newData.map(newItem => {
                    const existingItem = prevHoldings.find(p => p.symbol === newItem.symbol);
                    let finalName = newItem.name;
                    if (!finalName || finalName === 'N/A' || finalName === newItem.symbol) {
                        if (existingItem && existingItem.name && existingItem.name !== 'N/A' && existingItem.name !== existingItem.symbol) {
                            finalName = existingItem.name;
                        }
                    }
                    return { ...newItem, name: finalName };
                });
            });

        } catch (error) { 
            console.error("❌ Error fetching portfolio:", error);
        } 
        finally { if (!isBackground) setLoading(false); }
    };

    // ✅ FIXED: Name Fetching Logic for US Stocks
    const fetchMissingNames = async (currentHoldings) => {
        if (fetchingNamesRef.current) return;
        
        // Filter those needing names
        const stocksToFetch = currentHoldings.filter(h => !h.name || h.name === 'N/A' || h.name === h.symbol);
        
        if (stocksToFetch.length === 0) return;
        
        fetchingNamesRef.current = true;
        let updatesFound = false;
        const nameMap = {};
        
        await Promise.all(stocksToFetch.map(async (stock) => {
            try {
                const res = await axios.get(`${API_URL}/api/search-stock?query=${stock.symbol}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data && res.data.length > 0) {
                    // 1. Exact Match (Case Insensitive)
                    let match = res.data.find(s => s.symbol.toUpperCase() === stock.symbol.toUpperCase());
                    
                    // 2. Fallback: Take first result if exact match fails (Fixes US stock issue)
                    if (!match) {
                        match = res.data[0];
                    }

                    if (match && match.name) { 
                        nameMap[stock.symbol] = match.name; 
                        updatesFound = true; 
                    }
                }
            } catch (err) {
                // Silent fail
            }
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

    // --- SEARCH & TRADE ---
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (txn.symbol.length > 1 && showSuggestions) {
                try { 
                    const res = await axios.get(`${API_URL}/api/search-stock?query=${txn.symbol}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }); 
                    setSuggestions(res.data); 
                } catch (err) { }
            } else { setSuggestions([]); }
        }, 300);
        return () => clearTimeout(delay);
    }, [txn.symbol, showSuggestions, token]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!txn.symbol || txn.quantity <= 0 || txn.price <= 0) { toast.error("Invalid Input"); return; }
        const tId = toast.loading("Processing...");
        
        // ✅ FIXED: Trim and Uppercase Symbol
        const cleanSymbol = txn.symbol.toUpperCase().trim();

        try {
            await axios.post(`${API_URL}/api/portfolio/transaction`, {
                symbol: cleanSymbol, 
                quantity: Number(txn.quantity), 
                price: Number(txn.price), 
                type: txn.type
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Done!", { id: tId }); 
            setShowBottomSheet(false); 
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' }); 
            fetchPortfolio(false);
        } catch (error) { toast.error("Failed", { id: tId }); }
    };

    const totalInvested = holdings.reduce((acc, curr) => {
        const rate = curr.usd_rate_used || 1; 
        return acc + (curr.quantity * curr.avg_price * rate);
    }, 0);

    const currentValue = holdings.reduce((acc, curr) => acc + (curr.value_inr || 0), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
    
    const filteredHoldings = holdings.filter(h => {
        if (!h) return false; 
        const lowerSearch = searchTerm.toLowerCase();
        const symbolMatch = (h.symbol || '').toLowerCase().includes(lowerSearch);
        const nameMatch = (h.name && h.name !== 'N/A') ? h.name.toLowerCase().includes(lowerSearch) : false;
        return symbolMatch || nameMatch;
    });

    if (loading) return <PortfolioSkeleton isDarkMode={isDarkMode} />;

    return (
        <div className={`min-h-screen w-full font-sans bg-transparent ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <div className={`w-full px-4 sm:px-6 lg:px-8 py-5 border-b bg-transparent ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="max-w-7xl mx-auto flex flex-row items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
                        <p className={`text-sm mt-0.5 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track your investments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block relative">
                            <input type="text" placeholder="Filter holdings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 pr-4 py-2 rounded-lg text-sm border font-medium outline-none w-64 transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900 placeholder-slate-400'}`} />
                            <Icons.Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        </div>
                        <button onClick={() => setShowBottomSheet(true)} className="md:hidden flex items-center justify-center p-2 bg-indigo-600 text-white rounded-lg active:scale-95 transition-transform">
                            <Icons.Plus className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Valuation (INR)</p>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <h2 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{formatPrice(currentValue)}</h2>
                                    </div>
                                    <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border ${totalPnL >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                        {totalPnL >= 0 ? '+' : ''}₹{formatPrice(Math.abs(totalPnL))} ({pnlPercentage}%)
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end">
                                    <div className="flex justify-between text-sm mb-2 font-bold">
                                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Invested (INR)</span>
                                        <span className={`font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>₹{formatPrice(totalInvested)}</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
                                        {holdings.map((h, i) => {
                                            const width = totalInvested > 0 ? ((h.quantity * h.avg_price * (h.usd_rate_used || 1)) / totalInvested) * 100 : 0;
                                            return <div key={i} style={{ width: `${width}%` }} className={colors[i % colors.length]} />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                                <h3 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Holdings ({filteredHoldings.length})</h3>
                                <div className="md:hidden relative w-36">
                                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-7 pr-2 py-1 text-xs font-medium rounded border bg-transparent outline-none ${isDarkMode ? 'border-slate-700 text-white placeholder-slate-600' : 'border-slate-300 text-slate-900 placeholder-slate-500'}`} />
                                    <Icons.Search className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                                </div>
                            </div>
                            
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className={`text-xs uppercase font-bold tracking-wider ${isDarkMode ? 'bg-slate-950/50 text-slate-500' : 'bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="px-3 py-3 pl-5">Instrument</th>
                                            <th className="px-3 py-3 text-right">Qty</th>
                                            <th className="px-3 py-3 text-right">Avg</th>
                                            <th className="px-3 py-3 text-right">LTP</th>
                                            <th className="px-3 py-3 text-right pr-5">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                                        {filteredHoldings.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center opacity-50 text-sm font-medium">No assets found.</td></tr>
                                        ) : (
                                            filteredHoldings.map((h, i) => {
                                                const sym = h.currency_symbol || '₹';
                                                const currentVal = h.quantity * (h.current_price || h.avg_price);
                                                const investedVal = h.quantity * h.avg_price;
                                                const pnl = currentVal - investedVal;
                                                const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                                                return (
                                                    <tr key={i} className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                                        <td className="px-3 py-3 pl-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-1 h-6 rounded-full ${colors[i % colors.length]}`}></div>
                                                                <div>
                                                                    <span className={`font-bold block text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{h.symbol}</span>
                                                                    <span className={`text-[10px] font-medium truncate max-w-[120px] block ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{h.name || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`px-3 py-3 text-right tabular-nums font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{h.quantity}</td>
                                                        <td className={`px-3 py-3 text-right tabular-nums font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{sym}{formatPrice(h.avg_price)}</td>
                                                        <td className={`px-3 py-3 text-right tabular-nums font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{sym}{formatPrice(h.current_price || h.avg_price)}</td>
                                                        <td className="px-3 py-3 text-right pr-5">
                                                            <div className="flex flex-col items-end">
                                                                <span className={`font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sym}{formatPrice(currentVal)}</span>
                                                                <span className={`text-[10px] font-bold mt-0.5 ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="md:hidden divide-y dark:divide-slate-800">
                                {filteredHoldings.map((h, i) => {
                                    const sym = h.currency_symbol || '₹';
                                    const currentVal = h.quantity * (h.current_price || h.avg_price);
                                    const investedVal = h.quantity * h.avg_price;
                                    const pnl = currentVal - investedVal;
                                    const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;

                                    return (
                                        <div key={i} className="p-4 active:bg-slate-50 dark:active:bg-slate-800/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${colors[i % colors.length]}`}>
                                                        {h.symbol.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{h.symbol}</h4>
                                                        <p className={`text-xs font-medium truncate max-w-[120px] ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{h.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sym}{formatPrice(currentVal)}</div>
                                                    <div className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`flex justify-between text-xs font-medium p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                                                <span>Qty: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{h.quantity}</span></span>
                                                <span>Avg: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{sym}{formatPrice(h.avg_price)}</span></span>
                                                <span>LTP: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{sym}{formatPrice(h.current_price || h.avg_price)}</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block space-y-6">
                        <div className={`sticky top-24 rounded-xl border p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                            <div className={`flex items-center gap-2 mb-6 pb-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
                                    <Icons.Wallet className="w-5 h-5" />
                                </div>
                                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quick Trade</h3>
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

            <AnimatePresence>
                {showBottomSheet && (
                    <>
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowBottomSheet(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
                        <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring", damping:25}} className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-6 ${isDarkMode ? 'bg-slate-900 border-t border-slate-800' : 'bg-white'}`}>
                            <div className={`w-12 h-1.5 rounded-full mx-auto mb-6 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`} />
                            <h3 className={`font-bold text-xl mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>New Transaction</h3>
                            <TradeForm txn={txn} setTxn={setTxn} handleTransaction={handleTransaction} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} suggestions={suggestions} isDarkMode={isDarkMode} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function TradeForm({ txn, setTxn, handleTransaction, showSuggestions, setShowSuggestions, suggestions, isDarkMode }) {
    const selectStock = (stock) => {
        setTxn({ ...txn, symbol: stock.symbol, price: stock.current_price || txn.price });
        setShowSuggestions(false);
    };

    return (
        <form onSubmit={handleTransaction} className="flex flex-col gap-5">
            <div className="relative">
                <label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Stock Symbol</label>
                <input type="text" placeholder="Search Stock (e.g., AAPL, RELIANCE)" value={txn.symbol} onChange={e => { setTxn({...txn, symbol: e.target.value.toUpperCase()}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none transition-all uppercase focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-950 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-600' : 'bg-white border-slate-300 focus:border-indigo-500 text-slate-900 placeholder-slate-400'}`} />
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`absolute left-0 right-0 top-[110%] rounded-xl border shadow-xl max-h-56 overflow-y-auto z-50 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            {suggestions.map((s, idx) => (
                                <div key={idx} onClick={() => selectStock(s)} className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${isDarkMode ? 'hover:bg-slate-800 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
                                    <div><span className={`block font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{s.symbol}</span><span className={`block text-xs truncate max-w-[200px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.name}</span></div>
                                    <div className="text-right"><span className={`font-mono text-xs font-bold block ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{s.currency === 'USD' ? '$' : '₹'}{s.current_price}</span><span className={`text-[9px] uppercase font-bold px-1 rounded ${s.currency === 'USD' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{s.currency}</span></div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Quantity</label><input type="number" placeholder="10" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} /></div>
                <div><label className={`text-xs font-bold uppercase tracking-wider mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Price</label><input type="number" placeholder="1200" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`} /></div>
            </div>
            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>{['BUY', 'SELL'].map(type => (<button key={type} type="button" onClick={() => setTxn({...txn, type})} className={`py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${txn.type === type ? (type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'opacity-60 hover:opacity-100 text-slate-500 dark:text-slate-400'}`}>{type}</button>))}</div>
            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95">Execute Order</button>
        </form>
    );
}

function PortfolioSkeleton({ isDarkMode }) {
    return (<div className={`min-h-screen p-8 bg-transparent`}><div className="max-w-7xl mx-auto space-y-6 animate-pulse"><div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2 space-y-6"><div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div><div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div></div><div className="hidden lg:block h-80 bg-slate-200 dark:bg-slate-800 rounded-xl"></div></div></div></div>);
}
