import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/helpers';
import toast from 'react-hot-toast';

// --- Icons ---
const WalletIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrendUp = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

export default function Portfolio({ token, isDarkMode }) {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [showForm, setShowForm] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });

    // Fetch Portfolio
    const fetchPortfolio = async () => {
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

    // Handle Buy/Sell
    const handleTransaction = async (e) => {
        e.preventDefault();
        const tId = toast.loading("Processing...");
        try {
            await axios.post(`${API_URL}/portfolio/transaction`, {
                ...txn,
                quantity: Number(txn.quantity),
                price: Number(txn.price)
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Transaction Saved!", { id: tId });
            setShowForm(false);
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' });
            fetchPortfolio();
        } catch (error) {
            toast.error("Failed", { id: tId });
        }
    };

    // Calculations
    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    // Dummy Logic for Current Value (+5% gain simulation)
    const currentValue = totalInvested * 1.05; 
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    return (
        <div className="space-y-8">
            
            {/* 1. HERO SECTION (Fintech Style) */}
            <div className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl ${
                isDarkMode 
                ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black border border-white/10' 
                : 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-indigo-200'
            }`}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 opacity-80 mb-1">
                            <WalletIcon />
                            <span className="text-sm font-bold uppercase tracking-wider">Total Portfolio Value</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                            ₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h1>
                        <div className="mt-2 flex items-center gap-3">
                            <span className="opacity-70 text-sm">Invested: <span className="font-bold text-white">₹{totalInvested.toLocaleString()}</span></span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${totalPnL >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pnlPercentage}%)
                                {totalPnL >= 0 && <TrendUp />}
                            </span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="group flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-lg active:scale-95"
                    >
                        {showForm ? 'Close' : 'Add Transaction'}
                        <span className={`transition-transform duration-300 ${showForm ? 'rotate-45' : 'group-hover:rotate-90'}`}>
                            <PlusIcon />
                        </span>
                    </button>
                </div>
            </div>

            {/* 2. TRANSACTION FORM (Smooth Slide) */}
            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <form onSubmit={handleTransaction} className={`p-6 rounded-3xl border mb-2 grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-xl ${
                            isDarkMode ? 'bg-[#1e2433] border-slate-700' : 'bg-white border-slate-100 shadow-slate-200/50'
                        }`}>
                            <InputGroup label="Symbol" placeholder="TATASTEEL" value={txn.symbol} onChange={e => setTxn({...txn, symbol: e.target.value.toUpperCase()})} isDarkMode={isDarkMode} />
                            <InputGroup label="Quantity" type="number" placeholder="10" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} isDarkMode={isDarkMode} />
                            <InputGroup label="Price" type="number" placeholder="125.50" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} isDarkMode={isDarkMode} />
                            
                            <div className="w-full">
                                <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">Type</label>
                                <div className={`flex rounded-xl p-1 border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    {['BUY', 'SELL'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTxn({ ...txn, type })}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                                txn.type === type
                                                ? (type === 'BUY' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg')
                                                : 'opacity-50 hover:opacity-100'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="h-[46px] bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                                Save Transaction
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. HOLDINGS TABLE (Premium List) */}
            <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Current Holdings</h3>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        {holdings.length} Stocks
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className={`text-xs uppercase font-bold opacity-50 ${isDarkMode ? 'text-slate-400 bg-slate-900/50' : 'text-slate-500 bg-slate-50'}`}>
                            <tr>
                                <th className="p-5 font-bold tracking-wider">Stock Symbol</th>
                                <th className="p-5 text-center tracking-wider">Qty</th>
                                <th className="p-5 text-right tracking-wider">Avg. Price</th>
                                <th className="p-5 text-right tracking-wider">Cur. Value</th>
                                <th className="p-5 text-right tracking-wider">P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {holdings.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center opacity-50 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-2xl">💼</div>
                                        <span>No holdings found. Start investing!</span>
                                    </td>
                                </tr>
                            ) : (
                                holdings.map((h) => {
                                    // Row Level Calc
                                    const investVal = h.quantity * h.avg_price;
                                    const curVal = investVal * 1.05; // Dummy Logic
                                    const rowPnL = curVal - investVal;

                                    return (
                                        <tr key={h._id} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-indigo-50/30'}`}>
                                            <td className="p-5">
                                                <div className="font-black text-sm">{h.symbol}</div>
                                                <div className="text-[10px] opacity-50">NSE Equity</div>
                                            </td>
                                            <td className="p-5 text-center font-medium opacity-80">{h.quantity}</td>
                                            <td className="p-5 text-right opacity-80">₹{h.avg_price.toFixed(2)}</td>
                                            <td className="p-5 text-right font-bold">₹{curVal.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                            <td className={`p-5 text-right font-bold ${rowPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {rowPnL >= 0 ? '+' : ''}₹{rowPnL.toFixed(0)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Reusable Input Component
const InputGroup = ({ label, type="text", placeholder, value, onChange, isDarkMode }) => (
    <div className="w-full">
        <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">{label}</label>
        <input 
            required 
            type={type} 
            placeholder={placeholder} 
            className={`w-full px-4 py-3 rounded-xl text-sm border font-medium outline-none transition-all ${
                isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:bg-slate-800' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white focus:shadow-lg focus:shadow-indigo-100'
            }`} 
            value={value} 
            onChange={onChange} 
        />
    </div>
);
