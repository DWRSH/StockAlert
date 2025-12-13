import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_URL } from '../../utils/helpers';
import toast from 'react-hot-toast';

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
            
            toast.success("Success!", { id: tId });
            setShowForm(false);
            setTxn({ symbol: '', quantity: '', price: '', type: 'BUY' });
            fetchPortfolio();
        } catch (error) {
            toast.error("Failed", { id: tId });
        }
    };

    // Calculations
    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    // Note: Live Value ke liye humein current price chahiye hoga (abhi hum dummy +5% profit dikha rahe hain logic samjhne ke liye)
    const currentValue = totalInvested * 1.05; 
    const totalPnL = currentValue - totalInvested;

    return (
        <div className="space-y-6">
            
            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard label="Total Invested" value={`₹${totalInvested.toLocaleString()}`} color="text-indigo-500" isDarkMode={isDarkMode} />
                <SummaryCard label="Current Value" value={`₹${currentValue.toLocaleString()}`} color="text-emerald-500" isDarkMode={isDarkMode} />
                <SummaryCard label="Total P/L" value={`${totalPnL >= 0 ? '+' : ''}₹${totalPnL.toLocaleString()}`} color={totalPnL >= 0 ? "text-emerald-500" : "text-red-500"} isDarkMode={isDarkMode} />
            </div>

            {/* 2. Action Header */}
            <div className="flex justify-between items-center">
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>My Holdings</h2>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition"
                >
                    {showForm ? 'Close' : '+ Add Transaction'}
                </button>
            </div>

            {/* 3. Transaction Form */}
            {showForm && (
                <motion.form 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleTransaction}
                    className={`p-4 rounded-2xl border grid grid-cols-2 md:grid-cols-5 gap-3 items-end ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                >
                    <div>
                        <label className="text-[10px] uppercase font-bold opacity-60 ml-1">Symbol</label>
                        <input required placeholder="e.g. RELIANCE" className={`w-full p-2 rounded-lg text-sm border bg-transparent ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`} 
                            value={txn.symbol} onChange={e => setTxn({...txn, symbol: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold opacity-60 ml-1">Qty</label>
                        <input required type="number" placeholder="10" className={`w-full p-2 rounded-lg text-sm border bg-transparent ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`} 
                            value={txn.quantity} onChange={e => setTxn({...txn, quantity: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold opacity-60 ml-1">Price</label>
                        <input required type="number" placeholder="2400" className={`w-full p-2 rounded-lg text-sm border bg-transparent ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`} 
                            value={txn.price} onChange={e => setTxn({...txn, price: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold opacity-60 ml-1">Type</label>
                        <select className={`w-full p-2 rounded-lg text-sm border bg-transparent ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}
                            value={txn.type} onChange={e => setTxn({...txn, type: e.target.value})}>
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>
                    <button type="submit" className="h-10 bg-emerald-500 text-white rounded-lg font-bold text-sm hover:bg-emerald-600 transition">
                        Submit
                    </button>
                </motion.form>
            )}

            {/* 4. Holdings Table */}
            <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left text-sm">
                    <thead className={`text-xs uppercase font-bold opacity-60 border-b ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <tr>
                            <th className="p-4">Symbol</th>
                            <th className="p-4 text-center">Qty</th>
                            <th className="p-4 text-right">Avg Price</th>
                            <th className="p-4 text-right">Inv. Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {holdings.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center opacity-50">No holdings found. Add your first stock!</td></tr>
                        ) : (
                            holdings.map((h) => (
                                <tr key={h._id} className={`transition ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4 font-bold">{h.symbol}</td>
                                    <td className="p-4 text-center opacity-80">{h.quantity}</td>
                                    <td className="p-4 text-right">₹{h.avg_price.toFixed(2)}</td>
                                    <td className="p-4 text-right font-medium">₹{(h.quantity * h.avg_price).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const SummaryCard = ({ label, value, color, isDarkMode }) => (
    <div className={`p-5 rounded-2xl border flex flex-col justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <p className="text-xs font-bold opacity-50 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
);
