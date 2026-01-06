import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLinkIcon } from '../common/Icons'; // Ensure path is correct
import { Skeleton } from '../../utils/helpers'; // Ensure path is correct

export default function NewsFeed({ generalNews, isNewsLoading, fetchMarketNews, theme, isDarkMode }) {
    // State to track active market (IN = India, US = USA)
    const [marketType, setMarketType] = useState('IN');

    // Function to handle tab switching
    const handleMarketSwitch = (type) => {
        if (marketType === type) return; // Avoid duplicate fetch
        setMarketType(type);
        fetchMarketNews(type); // Parent function ko type pass karein
    };

    return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
            
            {/* Header & Controls Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme.heading}`}>
                        {marketType === 'IN' ? 'Indian' : 'US'} <span className="text-indigo-500">Markets</span>
                    </h1>
                    <p className={`text-sm mt-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className={`w-2 h-2 rounded-full animate-pulse ${marketType === 'IN' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        Live Updates from {marketType === 'IN' ? 'BSE/NSE' : 'NASDAQ/NYSE'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Market Switcher Tabs */}
                    <div className={`flex p-1 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        <button
                            onClick={() => handleMarketSwitch('IN')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                marketType === 'IN' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : `hover:bg-black/5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`
                            }`}
                        >
                            🇮🇳 India
                        </button>
                        <button
                            onClick={() => handleMarketSwitch('US')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                marketType === 'US' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : `hover:bg-black/5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`
                            }`}
                        >
                            🇺🇸 USA
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button 
                        onClick={() => fetchMarketNews(marketType)} 
                        className={`p-2 rounded-lg border transition-all active:scale-95 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                        title="Refresh News"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${isNewsLoading ? 'animate-spin' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* News Grid */}
            {isNewsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1,2,3,4].map(i => <Skeleton key={i} className={`h-48 w-full ${theme.skeleton}`} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generalNews.length > 0 ? generalNews.map((news, i) => (
                        <motion.a 
                            whileHover={{ y: -4 }}
                            key={i} 
                            href={news.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 group overflow-hidden ${theme.card}`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/10">
                                        {news.publisher}
                                    </span>
                                    <span className="text-[10px] opacity-50 font-mono">• {news.time}</span>
                                    {/* Optional: Show Flag in Card */}
                                    <span className="ml-auto text-xs opacity-50 grayscale group-hover:grayscale-0 transition-all">
                                        {marketType === 'IN' ? '🇮🇳' : '🇺🇸'}
                                    </span>
                                </div>
                                <h3 className={`text-lg font-bold leading-snug mb-3 group-hover:text-indigo-500 transition-colors ${theme.heading}`}>
                                    {news.title}
                                </h3>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity text-indigo-500">
                                Read Article <ExternalLinkIcon />
                            </div>
                        </motion.a>
                    )) : (
                        <div className="col-span-2 text-center py-20 opacity-30 flex flex-col items-center">
                            <p className="text-4xl mb-2">📰</p>
                            <p>No {marketType === 'IN' ? 'Indian' : 'US'} market news found right now.</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
