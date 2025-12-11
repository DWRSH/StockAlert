import React from 'react';
import { Skeleton } from '../../utils/helpers';

export default function MarketStatusCard({ indices, theme, isDarkMode }) {
    return (
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs font-bold opacity-50 uppercase mb-3 tracking-widest">Market Status</p>
            <div className="flex justify-between items-center text-sm font-mono font-bold text-emerald-500 mb-2">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>NIFTY</span>
                <span className="flex items-center gap-1">
                    {indices.nifty || <Skeleton className={`w-12 h-4 ${theme.skeleton}`}/>} 
                </span>
            </div>
            <div className="flex justify-between items-center text-sm font-mono font-bold text-emerald-500">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>SENSEX</span>
                <span className="flex items-center gap-1">
                    {indices.sensex || <Skeleton className={`w-12 h-4 ${theme.skeleton}`}/>} 
                </span>
            </div>
        </div>
    );
}