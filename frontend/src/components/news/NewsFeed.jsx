import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLinkIcon } from '../common/Icons';
import { Skeleton } from '../../utils/helpers';

export default function NewsFeed({ generalNews, isNewsLoading, fetchMarketNews, theme, isDarkMode }) {
    return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme.heading}`}>Market <span className="text-indigo-500">News</span></h1>
                    <p className={`text-sm mt-1 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Live Updates from Indian Markets
                    </p>
                </div>
                <button 
                    onClick={fetchMarketNews} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}
                >
                    Refresh News
                </button>
            </div>

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
                        <div className="col-span-2 text-center py-20 opacity-30">
                            <p>No news found right now.</p>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
