// src/utils/helpers.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getExchangeDisplay = (symbol) => {
    if (!symbol) return 'N/A';
    const s = symbol.toUpperCase();
    if (s.endsWith('.BO')) return 'BSE';
    return 'NSE'; 
};

export const getThemeStyles = (isDarkMode) => ({
    bg: isDarkMode ? 'bg-[#0B0F19]' : 'bg-slate-50',
    text: isDarkMode ? 'text-slate-200' : 'text-slate-700',
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    sidebar: isDarkMode ? 'bg-[#0F1422] border-slate-800/50' : 'bg-white border-slate-200 shadow-sm',
    sidebarLink: isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100',
    card: isDarkMode ? 'bg-[#151A29] border-slate-800' : 'bg-white border-slate-200 shadow-sm hover:shadow-md',
    input: isDarkMode 
        ? 'bg-[#151A29] border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500' 
        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500',
    skeleton: isDarkMode ? 'bg-slate-800/50' : 'bg-slate-200',
    chartGrid: isDarkMode ? '#1e293b' : '#e2e8f0',
    chartAxis: isDarkMode ? '#64748b' : '#94a3b8'
});

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-lg ${className}`}></div>
);