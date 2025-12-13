import React from 'react';
// ✅ Added BriefcaseIcon import
import { LogoIcon, DashboardIcon, NewsIcon, SunIcon, MoonIcon, BriefcaseIcon } from '../common/Icons';
import MarketStatusCard from '../dashboard/MarketStatusCard';

const SidebarItem = ({ icon, label, active, onClick, isDarkMode }) => (
    <div 
      onClick={onClick}
      className={`px-3 py-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all font-medium ${
          active 
          ? (isDarkMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200')
          : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:bg-slate-100')
      }`}
    >
        {icon}
        <span className="text-sm">{label}</span>
    </div>
);

export default function Sidebar({ theme, isDarkMode, activeView, setActiveView, isProfileOpen, setIsProfileOpen, userEmail, logout, toggleTheme, indices, getAvatarLetter }) {
    return (
        <aside className={`w-64 flex-col hidden md:flex border-r transition-colors duration-300 ${theme.sidebar}`}>
            <div className="p-6 flex items-center gap-3">
                <LogoIcon />
                <span className={`text-xl font-bold tracking-tight ${theme.heading}`}>Stock<span className="text-indigo-500">Watcher</span></span>
            </div>
            
            <div className="px-4 mt-2">
                <div 
                    onClick={() => setIsProfileOpen(true)}
                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 bg-slate-800/30' : 'border-slate-200 hover:bg-slate-100 bg-slate-50'}`}
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {getAvatarLetter()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className={`text-sm font-bold truncate ${theme.heading}`}>My Profile</p>
                        <p className="text-[10px] opacity-50 uppercase tracking-wider">View Details</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 mt-6 space-y-6">
                <MarketStatusCard indices={indices} theme={theme} isDarkMode={isDarkMode} />
                
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs font-bold opacity-50 uppercase mb-3 tracking-widest">Menu</p>
                    
                    <SidebarItem 
                        icon={<DashboardIcon/>} 
                        label="Dashboard" 
                        active={activeView === 'dashboard'} 
                        onClick={() => setActiveView('dashboard')} 
                        isDarkMode={isDarkMode}
                    />
                    
                    <div className="h-2"></div>
                    
                    {/* ✅ NEW: Portfolio Button */}
                    <SidebarItem 
                        icon={<BriefcaseIcon />} 
                        label="Portfolio" 
                        active={activeView === 'portfolio'} 
                        onClick={() => setActiveView('portfolio')} 
                        isDarkMode={isDarkMode} 
                    />

                    <div className="h-2"></div>
                    
                    <SidebarItem 
                        icon={<NewsIcon/>} 
                        label="Market News" 
                        active={activeView === 'news'} 
                        onClick={() => setActiveView('news')} 
                        isDarkMode={isDarkMode}
                    />
                </div>
            </nav>

            <div className="p-4 border-t border-dashed border-slate-500/20">
                <div className="flex items-center justify-between mb-4 px-2">
                    <span className="text-xs font-bold opacity-50">THEME</span>
                    <button onClick={toggleTheme} className={`p-2 rounded-full transition hover:bg-slate-500/10`}>{isDarkMode ? <SunIcon /> : <MoonIcon />}</button>
                </div>
                <button onClick={logout} className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 rounded-lg transition border border-transparent hover:border-red-500/20">Logout</button>
            </div>
        </aside>
    );
}
