import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/helpers';
import toast from 'react-hot-toast';

// --- Icons ---
import { SearchIcon, PlusIcon } from '../common/Icons';

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
            price: stock.current_price || txn.price // Auto-fill price if available
        });
        setShowSuggestions(false);
    };

    const totalInvested = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.avg_price), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.quantity * curr.current_price), 0);
    const totalPnL = currentValue - totalInvested
