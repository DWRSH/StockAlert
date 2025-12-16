import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast'; // Assuming you use react-hot-toast
// import { API_URL } from '../../utils/helpers'; // Apne utils path ke hisab se adjust karein
// import { SearchIcon, PlusIcon } from '../common/Icons'; // Niche inline icons use kiye hain agar ye files nahi hain

// --- Placeholder for API_URL if not imported ---
const API_URL = "http://localhost:8000"; // Apni backend URL yahan set karein

// --- INLINE ICONS (Agar aapke paas common/Icons file nahi hai to inhe use karein) ---
const PlusIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

const SearchIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
    </svg>
);

export default function Portfolio({ token, isDarkMode }) {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });

    // Search States
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    const fetchPortfolio = async () => {
        setLoading(true);
        try {
            // Mock data agar API fail ho (Testing ke liye remove kar sakte hain)
            // const res = await axios.get(`${API_URL}/portfolio`, { headers: { Authorization: `Bearer ${token}` } });
            // setHoldings(res.data);
            
            // --- DEMO DATA FOR TESTING VISUALS (Remove this block & uncomment axios above for real app) ---
            setTimeout(() => {
                 setHoldings([
                    { _id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', quantity: 10, avg_price: 2400, current_price: 2500 },
                    { _id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', quantity: 5, avg_price: 3500, current_price: 3600 },
                    { _id: '3', symbol: 'INFY', name: 'Infosys Ltd', quantity: 20, avg_price: 1400, current_price: 1350 },
                 ]);
                 setLoading(false);
            }, 1000);
            // ---------------------------------------------------------------------------------------------

        } catch (error) {
            console.error("Error fetching portfolio");
            setLoading(false);
        }
    };

    useEffect(() => { fetchPortfolio(); }, []);

    // Search Logic
    useEffect(() => {
        const delay = setTimeout(async () => {
            if (txn.symbol.length > 1 && showSuggestions) {
                try {
                    const res = await axios.get(`${API_URL}/search-stock?query=${txn.symbol}`);
                    setSuggestions(res.data);
                } catch (err) { console.error("Search failed"); }
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [txn.symbol, showSuggestions]);

    const handleTransaction = async (e) => {
        e.preventDefault();
        if (!txn.symbol || txn.quantity <= 0 || txn.price <= 0) {
            toast.error("Invalid Input");
            return;
        }
        const tId = toast.loading("Processing...");
        const payload = {
            symbol: txn.symbol.toUpperCase(),
            quantity: Number(txn.quantity),
            price: Number(txn.price),
            type: txn.type
        };
        try {
            await axios.post(`${API_URL}/portfolio/transaction`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Saved!", { id: tId });
            setShowBottomSheet(false);
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' });
            fetchPortfolio();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed", { id: tId });
        }
    };

    const selectStock = (stock) => {
        setTxn({ 
            ...txn, 
            symbol: stock.symbol, 
            price: stock.current_price || txn.price 
        });
        setShowSuggestions(false);
    };

    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    if (loading) return <PortfolioSkeleton isDarkMode={isDarkMode} />;

    return (
        <div className={`min-h-screen pb-20 md:pb-10 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
            <Toaster position="top-center" />

            {/* MOBILE HEADER */}
            <div className="md:hidden relative px-5 pt-6 pb-4 flex justify-between items-start">
                <div>
                    <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Portfolio</h1>
                    <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>My Investments</p>
                </div>
                <button onClick={() => setShowBottomSheet(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white shadow-lg active:scale-95 transition-transform">
                    <PlusIcon className="w-4 h-4" /> <span className="text-xs font-bold">Add</span>
                </button>
            </div>

            <div className="px-4 md:px-8 space-y-6 max-w-[1600px] mx-auto pt-4 md:pt-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT COLUMN (Main Content) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* 1. STATS ROW */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Net Worth Card */}
                            <div className={`sm:col-span-2 relative overflow-hidden rounded-[1.5rem] p-6 flex flex-col justify-between min-h-[160px] ${
                                isDarkMode ? 'bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-white/5' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-200'
                            }`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -mr-5 -mt-5"></div>
                                <div className="relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1 block">Net Worth</span>
                                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                                        ₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </h1>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md border border-white/10 w-fit flex items-center gap-1 ${totalPnL >= 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'}`}>
                                        {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString()} ({pnlPercentage}%)
                                    </span>
                                </div>
                            </div>

                            {/* Invested Card - FIXED MULTI COLOR BAR */}
                            <div className={`rounded-[1.5rem] p-6 flex flex-col justify-center gap-1 border ${
                                isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-lg shadow-slate-100'
                            }`}>
                                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Invested</span>
                                <h2 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                    ₹{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h2>
                                
                                {/* --- FIX START: Multi-color bar --- */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden flex">
                                    {holdings.map((h, i) => {
                                        const itemInvested = h.quantity * h.avg_price;
                                        const itemPercent = totalInvested > 0 ? (itemInvested / totalInvested) * 100 : 0;
                                        return (
                                            <div 
                                                key={h._id}
                                                style={{ width: `${itemPercent}%` }} 
                                                className={`h-full ${colors[i % colors.length]}`} 
                                                title={`${h.symbol}: ${itemPercent.toFixed(1)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                {/* --- FIX END --- */}
                            </div>
                        </div>

                        {/* 2. HOLDINGS TABLE */}
                        <div className={`rounded-[1.5rem] border overflow-hidden min-h-[400px] flex flex-col ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                            <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Holdings ({holdings.length})</h3>
                                <div className="hidden md:flex gap-2">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>Current Value</span>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className={`text-xs uppercase font-bold ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        <tr>
                                            <th className="p-5 pl-6">Instrument</th>
                                            <th className="p-5 text-center">Qty</th>
                                            <th className="p-5 text-right">Avg. Price</th>
                                            <th className="p-5 text-right">LTP</th>
                                            <th className="p-5 text-right pr-6">Current Val</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {holdings.length === 0 ? (
                                            <tr><td colSpan="5" className="p-12 text-center opacity-40">No positions found.</td></tr>
                                        ) : (
                                            holdings.map((h, i) => <DesktopRow key={h._id} h={h} i={i} colors={colors} isDarkMode={isDarkMode} />)
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden flex flex-col p-2 gap-2">
                                {holdings.map((h, i) => <MobileCard key={h._id} h={h} i={i} colors={colors} isDarkMode={isDarkMode} />)}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Quick Trade Only) */}
                    <div className="hidden lg:flex lg:col-span-4 flex-col gap-6">

                        {/* QUICK TRADE WIDGET */}
                        <div className={`sticky top-6 rounded-[1.5rem] p-6 border ${isDarkMode ? 'bg-[#1e2433] border-slate-700' : 'bg-white border-slate-100 shadow-xl shadow-indigo-100'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-500 rounded-xl text-white"><PlusIcon /></div>
                                <div>
                                    <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Quick Trade</h3>
                                    <p className="text-xs opacity-50 font-bold uppercase">Buy or Sell Instantly</p>
                                </div>
                            </div>

                            <form onSubmit={handleTransaction} className="flex flex-col gap-4">
                                <div className="relative z-50">
                                    <input 
                                        type="text" placeholder="SEARCH SYMBOL" 
                                        className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500'}`}
                                        value={txn.symbol}
                                        onChange={e => {
                                            setTxn({...txn, symbol: e.target.value.toUpperCase()});
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                    />
                                    <AnimatePresence>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`absolute left-0 right-0 top-[110%] rounded-xl shadow-xl border z-50 max-h-60 overflow-y-auto ${isDarkMode ? 'bg-[#0B0F19] border-slate-700' : 'bg-white border-slate-200'}`}>
                                                {suggestions.map((s, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => selectStock(s)} 
                                                        className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-indigo-500 text-sm">{s.symbol}</span>
                                                            <span className={`text-[10px] font-medium uppercase tracking-wide truncate max-w-[150px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                                                {s.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`font-mono font-bold text-sm block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                                ₹{s.current_price ? s.current_price.toLocaleString() : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" placeholder="Qty" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} />
                                    <input type="number" placeholder="Price" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} />
                                </div>

                                <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                    <TypeButton type="BUY" current={txn.type} onClick={() => setTxn({...txn, type: 'BUY'})} isDarkMode={isDarkMode} />
                                    <TypeButton type="SELL" current={txn.type} onClick={() => setTxn({...txn, type: 'SELL'})} isDarkMode={isDarkMode} />
                                </div>

                                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">
                                    Execute Order
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM SHEET (Complete Code) */}
            <AnimatePresence>
                {showBottomSheet && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBottomSheet(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`fixed bottom-0 left-0 right-0 z-[70] rounded-t-[2rem] overflow-hidden p-6 ${isDarkMode ? 'bg-[#1e2433]' : 'bg-white'}`}>
                            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6" />
                            <h2 className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Add Transaction</h2>
                            <form onSubmit={handleTransaction} className="flex flex-col gap-4 pb-4">
                                <div className="relative z-50">
                                    <input type="text" placeholder="SEARCH SYMBOL" className={`w-full px-4 py-3.5 rounded-xl font-bold outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={txn.symbol} onChange={e => { setTxn({...txn, symbol: e.target.value.toUpperCase()}); setShowSuggestions(true); }} onFocus={() => setShowSuggestions(true)}/>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className={`absolute left-0 right-0 top-[110%] rounded-xl shadow-xl border z-50 max-h-48 overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                            {suggestions.map((s, idx) => (
                                                <div key={idx} onClick={() => selectStock(s)} className="px-4 py-3 cursor-pointer flex justify-between items-center border-b dark:border-slate-700 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-900">
                                                    <span className="font-bold text-indigo-500 text-sm">{s.symbol}</span>
                                                    <span className="font-mono text-sm dark:text-white">₹{s.current_price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" placeholder="Qty" className={`w-full px-4 py-3.5 rounded-xl font-bold outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} />
                                    <input type="number" placeholder="Price" className={`w-full px-4 py-3.5 rounded-xl font-bold outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} />
                                </div>
                                <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                    <TypeButton type="BUY" current={txn.type} onClick={() => setTxn({...txn, type: 'BUY'})} isDarkMode={isDarkMode} />
                                    <TypeButton type="SELL" current={txn.type} onClick={() => setTxn({...txn, type: 'SELL'})} isDarkMode={isDarkMode} />
                                </div>
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform">
                                    Execute Order
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB COMPONENTS (Is file mein hi define kar diye taaki errors na aaye) ---

function DesktopRow({ h, i, colors, isDarkMode }) {
    const totalVal = h.quantity * h.current_price;
    const invested = h.quantity * h.avg_price;
    const pnl = totalVal - invested;
    
    return (
        <tr className={`group transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
            <td className="p-5 pl-6">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${colors[i % colors.length]}`}></div>
                    <div>
                        <h4 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{h.symbol}</h4>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">{h.name}</p>
                    </div>
                </div>
            </td>
            <td className={`p-5 text-center font-mono font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{h.quantity}</td>
            <td className={`p-5 text-right font-mono ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>₹{h.avg_price.toLocaleString()}</td>
            <td className={`p-5 text-right font-mono font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{h.current_price.toLocaleString()}</td>
            <td className="p-5 text-right pr-6">
                <div className="flex flex-col items-end">
                    <span className={`font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{totalVal.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}{((pnl/invested)*100).toFixed(2)}%
                    </span>
                </div>
            </td>
        </tr>
    );
}

function MobileCard({ h, i, colors, isDarkMode }) {
    const totalVal = h.quantity * h.current_price;
    const invested = h.quantity * h.avg_price;
    const pnl = totalVal - invested;

    return (
        <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-10 rounded-full ${colors[i % colors.length]}`}></div>
                    <div>
                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{h.symbol}</h4>
                        <p className="text-[10px] font-bold uppercase opacity-50">{h.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₹{totalVal.toLocaleString()}</span>
                    <span className={`text-xs font-bold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pnl >= 0 ? '+' : ''}{((pnl/invested)*100).toFixed(2)}%
                    </span>
                </div>
            </div>
            <div className={`flex justify-between items-center pt-3 border-t text-xs font-mono ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <span>Qty: <b className={isDarkMode ? 'text-white' : 'text-slate-800'}>{h.quantity}</b></span>
                <span>Avg: <b className={isDarkMode ? 'text-white' : 'text-slate-800'}>{h.avg_price}</b></span>
                <span>LTP: <b className={isDarkMode ? 'text-white' : 'text-slate-800'}>{h.current_price}</b></span>
            </div>
        </div>
    );
}

function TypeButton({ type, current, onClick, isDarkMode }) {
    const isActive = current === type;
    const activeClass = type === 'BUY' 
        ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
        : 'bg-red-500 text-white shadow-red-500/30';
    
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${isActive ? activeClass + ' shadow-lg' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600')}`}
        >
            {type}
        </button>
    );
}

function PortfolioSkeleton({ isDarkMode }) {
    return (
        <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
            <div className="animate-pulse space-y-6 max-w-7xl mx-auto">
                <div className="h-8 w-32 bg-slate-300 dark:bg-slate-800 rounded-lg"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 h-40 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
                    <div className="h-40 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
                </div>
                <div className="h-96 bg-slate-300 dark:bg-slate-800 rounded-2xl"></div>
            </div>
        </div>
    );
}
