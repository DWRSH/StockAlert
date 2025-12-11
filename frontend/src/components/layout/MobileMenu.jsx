import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, DashboardIcon, NewsIcon, SunIcon, MoonIcon } from '../common/Icons';
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

export default function MobileMenu({ isMobileMenuOpen, setIsMobileMenuOpen, theme, isDarkMode, setIsProfileOpen, userEmail, getAvatarLetter, indices, activeView, setActiveView, toggleTheme, logout }) {
    return (
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    <motion.div 
                        initial={{x: "-100%"}} animate={{x: 0}} exit={{x: "-100%"}} transition={{type: "spring", damping: 25}}
                        className={`fixed inset-y-0 left-0 w-72 z-50 border-r shadow-2xl ${theme.sidebar} md:hidden flex flex-col`}
                    >
                        <div className="p-6 flex items-center justify-between">
                            <span className={`text-xl font-bold tracking-tight ${theme.heading}`}>Stock<span className="text-indigo-500">Watcher</span></span>
                            <button onClick={()=>setIsMobileMenuOpen(false)}><CloseIcon /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto px-4 mt-2">
                            <div onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className={`p-4 mb-6 rounded-xl flex items-center gap-3 cursor-pointer ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                                    {getAvatarLetter()}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${theme.heading}`}>My Profile</p>
                                    <p className="text-xs opacity-50 truncate max-w-[140px]">{userEmail || 'User'}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <MarketStatusCard indices={indices} theme={theme} isDarkMode={isDarkMode} />
                            </div>

                            <div className={`p-4 rounded-xl border mb-6 ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <p className="text-xs font-bold opacity-50 uppercase mb-3 tracking-widest">Menu</p>
                                <SidebarItem icon={<DashboardIcon/>} label="Dashboard" active={activeView === 'dashboard'} onClick={()=>{setActiveView('dashboard'); setIsMobileMenuOpen(false)}} isDarkMode={isDarkMode} />
                                <div className="h-2"></div>
                                <SidebarItem icon={<NewsIcon/>} label="Market News" active={activeView === 'news'} onClick={()=>{setActiveView('news'); setIsMobileMenuOpen(false)}} isDarkMode={isDarkMode} />
                            </div>

                            <button onClick={toggleTheme} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                                {isDarkMode ? <SunIcon /> : <MoonIcon />} <span>Switch Theme</span>
                            </button>
                        </div>

                        <div className="p-4 border-t border-dashed border-slate-500/20">
                            <button onClick={logout} className="w-full py-3 text-sm font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded-xl transition">Logout</button>
                        </div>
                    </motion.div>
                    
                    <div onClick={()=>setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"></div>
                </>
            )}
        </AnimatePresence>
    );
}