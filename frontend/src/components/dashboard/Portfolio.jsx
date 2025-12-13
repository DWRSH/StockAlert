import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/helpers';
import toast from 'react-hot-toast';

// --- Icons ---
const WalletIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrendUp = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const PieChartIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;

export default function Portfolio({ token, isDarkMode }) {
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

    const fetchPortfolio = async () => {
        setLoading(true); // Loading Show karein kyunki live price lane me time lagta hai
        try {
            const res = await axios.get(`${API_URL}/portfolio`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHoldings(res.data);
        } catch (error) {
            console.error("Error fetching portfolio");
            toast.error("Could not fetch live prices");
        }
        setLoading(false);
    };

    useEffect(() => { fetchPortfolio(); }, []);

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

    // ✅ REAL CALCULATIONS (Ab backend current_price bhej raha hai)
    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0);
    const totalPnL = currentValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

    if (loading && holdings.length === 0) {
        return <div className="p-10 text-center opacity-50 animate-pulse">Fetching Live Market Data... 🚀</div>;
    }

    return (
        <div className="space-y-6">
            {/* HERO SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`col-span-2 relative overflow-hidden rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between min-h-[200px] ${
                    isDarkMode ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-white/5' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200'
                }`}>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 opacity-90 mb-2">
                            <WalletIcon />
                            <span className="text-xs font-bold uppercase tracking-widest">Net Worth</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tight text-white mb-2">
                            ₹{currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-md ${totalPnL >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'}`}>
                                {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pnlPercentage}%)
                                {totalPnL >= 0 && <TrendUp />}
                            </span>
                        </div>
                    </div>
                    <div className="mt-8 relative z-10">
                        <div className="flex justify-between text-[10px] font-bold uppercase opacity-70 mb-2">
                            <span>Portfolio Allocation</span>
                            <span>{holdings.length} Assets</span>
                        </div>
                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-black/20 backdrop-blur-sm">
                            {holdings.length > 0 ? holdings.map((h, i) => {
                                const percent = ((h.quantity * h.current_price) / currentValue) * 100;
                                return <div key={i} style={{ width: `${percent}%` }} className={colors[i % colors.length]} title={h.symbol} />;
                            }) : <div className="w-full h-full bg-white/10" />}
                        </div>
                    </div>
                </div>

                <div className={`rounded-[2rem] p-6 border flex flex-col justify-center gap-4 ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><PieChartIcon /></div>
                        <div>
                            <p className="text-xs font-bold opacity-50 uppercase">Invested Amount</p>
                            <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₹{totalInvested.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 w-full my-1"></div>
                    <button onClick={() => setShowForm(!showForm)} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${showForm ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'}`}>
                        {showForm ? 'Cancel Action' : 'Add Transaction'}
                        {!showForm && <PlusIcon />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <form onSubmit={handleTransaction} className={`p-6 rounded-3xl border mb-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-xl ${isDarkMode ? 'bg-[#1e2433] border-slate-700' : 'bg-white border-slate-100'}`}>
                            <InputGroup label="Stock Symbol" placeholder="e.g. MRF" value={txn.symbol} onChange={e => setTxn({...txn, symbol: e.target.value.toUpperCase()})} isDarkMode={isDarkMode} />
                            <InputGroup label="Quantity" type="number" placeholder="10" value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} isDarkMode={isDarkMode} />
                            <InputGroup label="Avg. Price" type="number" placeholder="85000" value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} isDarkMode={isDarkMode} />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setTxn({...txn, type: 'BUY'})} className={`flex-1 h-[46px] rounded-xl font-bold text-xs transition ${txn.type === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 opacity-50'}`}>BUY</button>
                                <button type="button" onClick={() => setTxn({...txn, type: 'SELL'})} className={`flex-1 h-[46px] rounded-xl font-bold text-xs transition ${txn.type === 'SELL' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 opacity-50'}`}>SELL</button>
                                <button type="submit" className="h-[46px] px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`rounded-[2rem] border overflow-hidden pb-4 ${isDarkMode ? 'bg-[#151a25] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`}>
                <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Your Assets</h3>
                </div>
                <div className="overflow-x-auto">
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
                                holdings.map((h, i) => {
                                    // ✅ Using Backend Provided Real Price
                                    const investVal = h.quantity * h.avg_price;
                                    const curVal = h.quantity * h.current_price; 
                                    const rowPnL = curVal - investVal;
                                    const rowPnLPercent = ((rowPnL / investVal) * 100).toFixed(2);
                                    const colorClass = colors[i % colors.length].replace('bg-', 'text-');

                                    return (
                                        <motion.tr key={h._id} variants={item} className={`group transition-all ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-indigo-50/40'}`}>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} ${colorClass}`}>
                                                        {h.symbol.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{h.symbol}</div>
                                                        <div className="text-[10px] font-bold opacity-40 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded w-fit mt-0.5">EQUITY</div>
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
                                                    <span className={`text-[10px] mt-1 font-bold ${rowPnL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {rowPnLPercent}%
                                                    </span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const InputGroup = ({ label, type="text", placeholder, value, onChange, isDarkMode }) => (
    <div className="w-full">
        <label className="text-[10px] uppercase font-bold opacity-60 ml-1 mb-1 block">{label}</label>
        <input required type={type} placeholder={placeholder} className={`w-full px-4 py-3 rounded-xl text-sm border font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:shadow-lg focus:shadow-indigo-100 focus:border-indigo-200'}`} value={value} onChange={onChange} />
    </div>
);
