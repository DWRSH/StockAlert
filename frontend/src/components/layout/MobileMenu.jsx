import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, DashboardIcon, NewsIcon, SunIcon, MoonIcon, LogOutIcon, BriefcaseIcon, UserIcon } from '../common/Icons';
import MarketStatusCard from '../dashboard/MarketStatusCard';

export default function MobileMenu({ 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    theme, 
    isDarkMode, 
    setIsProfileOpen, 
    userEmail, 
    getAvatarLetter, 
    indices, 
    activeView, 
    setActiveView, 
    toggleTheme, 
    logout,
    userRole // ✅ Receive User Role from App.js
}) {
    // 🚀 Optimization: Removed internal axios call.
    // Now relying completely on props passed from App.js

    const displayEmail = userEmail || 'User';

    // Animation Variants
    const sidebarVariants = {
        closed: { x: "-100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 35 } },
        open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }
    };

    const overlayVariants = {
        closed: { opacity: 0 },
        open: { opacity: 1 }
    };

    const MenuItem = ({ icon, label, id, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeView === id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 translate-x-1' 
                    : `text-slate-500 hover:bg-slate-100/50 ${isDarkMode ? 'hover:bg-slate-800/50 hover:text-slate-200' : 'hover:text-slate-900'}`
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    {/* 🌑 DARK BACKDROP */}
                    <motion.div
                        initial="closed" animate="open" exit="closed" variants={overlayVariants}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    />

                    {/* 📱 SIDEBAR DRAWER */}
                    <motion.div
                        initial="closed" animate="open" exit="closed" variants={sidebarVariants}
                        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-xs z-50 shadow-2xl flex flex-col md:hidden border-r ${
                            isDarkMode ? 'bg-[#0B0F19] border-slate-800' : 'bg-white border-slate-200'
                        }`}
                    >
                        {/* 1. Header Section */}
                        <div className="p-5 flex justify-between items-center border-b border-inherit">
                            <h2 className={`text-xl font-black tracking-tight ${theme.heading}`}>
                                Stock<span className="text-indigo-500">Watcher</span>
                            </h2>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* 2. Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
                            
                            {/* Profile Card */}
                            <div onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} 
                                 className={`p-4 mb-6 rounded-2xl flex items-center gap-3 border cursor-pointer active:scale-95 transition-transform ${
                                    isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                                    {getAvatarLetter()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className={`text-sm font-bold truncate ${theme.heading}`}>My Profile</p>
                                    <p className="text-xs opacity-50 truncate max-w-[140px]">{displayEmail}</p>
                                </div>
                            </div>

                            {/* Market Status */}
                            <div className="mb-6">
                                <MarketStatusCard indices={indices} theme={theme} isDarkMode={isDarkMode} />
                            </div>

                            {/* Navigation Links */}
                            <div className="space-y-1 mb-6">
                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-1">Menu</p>
                                
                                <MenuItem 
                                    id="dashboard" 
                                    label="Dashboard" 
                                    icon={<DashboardIcon />} 
                                    onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }} 
                                />
                                
                                <MenuItem 
                                    id="portfolio" 
                                    label="Portfolio" 
                                    icon={<BriefcaseIcon />} 
                                    onClick={() => { setActiveView('portfolio'); setIsMobileMenuOpen(false); }} 
                                />
                                
                                <MenuItem 
                                    id="news" 
                                    label="Market News" 
                                    icon={<NewsIcon />} 
                                    onClick={() => { setActiveView('news'); setIsMobileMenuOpen(false); }} 
                                />

                                {/* ✅ ADMIN LINK (Visible only to Admins) */}
                                {userRole === 'admin' && (
                                    <>
                                        <div className={`h-px my-3 mx-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                                        <p className="text-[10px] uppercase font-bold text-indigo-500 mb-2 px-1">Admin Tools</p>
                                        <MenuItem 
                                            id="admin" 
                                            label="Admin Panel" 
                                            icon={<UserIcon />} 
                                            onClick={() => { setActiveView('admin'); setIsMobileMenuOpen(false); }} 
                                        />
                                    </>
                                )}
                            </div>

                            {/* Theme Toggle */}
                            <button 
                                onClick={toggleTheme} 
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold border transition-all ${
                                    isDarkMode ? 'border-slate-700 bg-slate-800/50 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-3">
                                    {isDarkMode ? <MoonIcon /> : <SunIcon />} 
                                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </span>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>

                        {/* 3. Footer / Logout */}
                        <div className="p-4 border-t border-inherit bg-inherit">
                            <button 
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold transition-all active:scale-95"
                            >
                                <LogOutIcon />
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
