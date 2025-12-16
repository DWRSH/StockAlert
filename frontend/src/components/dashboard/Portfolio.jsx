import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PlusIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
    <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
  </svg>
);

const formatPrice = (p) => (typeof p === 'number' ? p.toFixed(2) : '0.00');

export default function Portfolio({ token, isDarkMode }) {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [txn, setTxn] = useState({ symbol: '', quantity: '', price: '', type: 'BUY' });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHoldings(Array.isArray(res.data) ? res.data : res.data.holdings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPortfolio();
  }, [token]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (txn.symbol.length > 1 && showSuggestions) {
        const res = await axios.get(`${API_URL}/search-stock?query=${txn.symbol}`);
        setSuggestions(res.data || []);
      } else setSuggestions([]);
    }, 300);
    return () => clearTimeout(t);
  }, [txn.symbol, showSuggestions]);

  const selectStock = (s) => {
    setTxn({ ...txn, symbol: s.symbol, price: s.current_price || '' });
    setShowSuggestions(false);
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto">
        <h1 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Portfolio – Quick Trade
        </h1>

        {/* QUICK TRADE */}
        <div className={`relative rounded-2xl p-6 border ${isDarkMode ? 'bg-[#1e2433] border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><PlusIcon /></div>
            <div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Search & Trade</h3>
              <p className="text-xs opacity-60">Symbol • Company • Live Price</p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search stock (e.g. RELIANCE)"
              value={txn.symbol}
              onChange={(e) => {
                setTxn({ ...txn, symbol: e.target.value.toUpperCase() });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={`w-full px-4 py-3 rounded-xl font-bold outline-none border
              ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute left-0 right-0 top-[110%] rounded-xl border shadow-xl z-50 max-h-64 overflow-y-auto
                  ${isDarkMode ? 'bg-[#0B0F19] border-slate-700' : 'bg-white border-slate-200'}`}
                >
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      onClick={() => selectStock(s)}
                      className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0
                      ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/60' : 'border-slate-100 hover:bg-slate-50'}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-indigo-500 text-sm">{s.symbol}</span>
                        <span className={`text-[11px] truncate max-w-[240px]
                          ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {s.name}
                        </span>
                      </div>

                      <span className={`font-mono font-bold text-sm
                        ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        ₹{formatPrice(s.current_price)}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
