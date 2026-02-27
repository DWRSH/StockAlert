import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';
import { TrashIcon, UserIcon, DashboardIcon } from '../common/Icons';

// --- ✨ INTERNAL ICONS ---
const MegaphoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const AdminBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>;

export default function AdminDashboard({ token, isDarkMode }) {
    const [stats, setStats] = useState({ total_users: 0, total_alerts: 0, active_alerts: 0, triggered_alerts: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [broadcast, setBroadcast] = useState({ subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(null); 

    const fetchAdminData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/stats`, config),
                axios.get(`${API_URL}/api/admin/users`, config)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Admin Access Failed", error);
            toast.error("Access Denied");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(token) fetchAdminData();
    }, [token]);

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("Are you sure? This will delete the user and all their alerts.")) return;
        const tId = toast.loading("Deleting user...");
        try {
            await axios.delete(`${API_URL}/api/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User Deleted", { id: tId });
        } catch (error) {
            toast.error("Failed to delete user", { id: tId });
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const updatedUsers = users.map(u => 
            u._id === userId ? { ...u, is_active: !currentStatus } : u
        );
        setUsers(updatedUsers);

        try {
            await axios.patch(`${API_URL}/api/admin/user/${userId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(currentStatus ? "User Suspended 🚫" : "User Activated ✅");
        } catch (error) {
            setUsers(users); 
            toast.error("Failed to update status");
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if(!broadcast.subject || !broadcast.message) return toast.error("Please fill all fields");
        if(!window.confirm(`Send email to ${stats.total_users} users?`)) return;

        setSending(true);
        const tId = toast.loading("Queueing Broadcast...");
        try {
            await axios.post(`${API_URL}/api/admin/broadcast`, broadcast, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Broadcast Sent! 🚀", { id: tId });
            setBroadcast({ subject: '', message: '' });
        } catch (error) {
            toast.error("Failed to send", { id: tId });
        } finally {
            setSending(false);
        }
    };

    const copyToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        toast.success("Email copied!", { style: { borderRadius: '10px', background: '#333', color: '#fff' } });
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="space-y-6 p-6 min-h-screen">
            <div className="h-10 w-64 bg-slate-300/20 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-36 rounded-2xl bg-slate-300/10 animate-pulse"></div>)}
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="h-80 rounded-2xl bg-slate-300/10 lg:col-span-1 animate-pulse"></div>
                <div className="h-80 rounded-2xl bg-slate-300/10 lg:col-span-2 animate-pulse"></div>
            </div>
        </div>
    );

    // --- PREMIUM THEME VARIABLES ---
    const pageBg = isDarkMode ? 'bg-[#0B1120]' : 'bg-slate-50/50';
    const cardBg = isDarkMode ? 'bg-[#1e293b]/80 backdrop-blur-xl border-white/5 shadow-2xl shadow-black/50' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50';
    const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
    const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className={`min-h-screen w-full font-sans relative overflow-hidden ${pageBg} pb-24 md:pb-20`}>
            
            {/* Ambient Background Glow (Premium feel) */}
            <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 pointer-events-none ${isDarkMode ? 'bg-indigo-600' : 'bg-indigo-300'}`}></div>
            <div className={`absolute top-40 right-1/4 w-96 h-96 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none ${isDarkMode ? 'bg-purple-600' : 'bg-purple-300'}`}></div>
            
            <div className="relative z-10 max-w-7xl mx-auto pt-6 px-4 sm:px-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight mb-2 ${textMain}`}>
                            Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Command Center</span>
                        </h1>
                        <p className={`text-sm ${textMuted} font-medium tracking-wide`}>Monitor performance, manage users, and broadcast updates.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2.5 shadow-sm backdrop-blur-md ${isDarkMode ? 'bg-slate-800/50 border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            SYSTEM OPTIMAL
                        </div>
                         <button onClick={fetchAdminData} className={`p-2.5 rounded-xl border transition-all active:scale-95 active:rotate-180 duration-500 shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-white/10 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                            <RefreshIcon />
                        </button>
                    </div>
                </div>

                {/* 1. Stats Cards (Premium Glassmorphism) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                    <PremiumStatCard label="Total Users" value={stats.total_users} icon={<UserIcon />} gradient="from-blue-500 to-indigo-600" isDarkMode={isDarkMode} delay="0" />
                    <PremiumStatCard label="Total Alerts" value={stats.total_alerts} icon={<DashboardIcon />} gradient="from-purple-500 to-fuchsia-600" isDarkMode={isDarkMode} delay="100" />
                    <PremiumStatCard label="Active Alerts" value={stats.active_alerts} icon={<div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"/>} gradient="from-emerald-500 to-teal-600" isDarkMode={isDarkMode} delay="200" />
                    <PremiumStatCard label="Triggered" value={stats.triggered_alerts} icon={<div className="text-sm">⚠️</div>} gradient="from-orange-500 to-red-500" isDarkMode={isDarkMode} delay="300" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                    
                    {/* 2. Broadcast Section */}
                    <div className={`lg:col-span-1 p-6 md:p-8 rounded-2xl border flex flex-col relative transition-all duration-300 hover:shadow-2xl ${cardBg}`}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                <MegaphoneIcon />
                            </div>
                            <div>
                                <h2 className={`font-bold text-xl tracking-tight ${textMain}`}>Broadcast</h2>
                                <p className={`text-xs mt-0.5 ${textMuted}`}>Reach {stats.total_users} users instantly</p>
                            </div>
                        </div>

                        <form onSubmit={handleBroadcast} className="space-y-5 flex-1 flex flex-col">
                            <div>
                                <label className={`block text-xs font-bold mb-2 ml-1 ${textMuted}`}>SUBJECT LINE</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Important System Update"
                                    className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm transition-all focus:ring-4 focus:ring-indigo-500/10 ${isDarkMode ? 'bg-slate-900/50 border-white/10 focus:border-indigo-500 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'}`}
                                    value={broadcast.subject}
                                    onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                                />
                            </div>
                            <div className="flex-1 flex flex-col">
                                <label className={`block text-xs font-bold mb-2 ml-1 ${textMuted}`}>MESSAGE BODY</label>
                                <textarea 
                                    placeholder="Write your announcement here..."
                                    className={`w-full flex-1 min-h-[160px] px-4 py-3.5 rounded-xl border outline-none text-sm transition-all resize-none focus:ring-4 focus:ring-indigo-500/10 ${isDarkMode ? 'bg-slate-900/50 border-white/10 focus:border-indigo-500 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400'}`}
                                    value={broadcast.message}
                                    onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                                ></textarea>
                            </div>
                            <button 
                                disabled={sending}
                                type="submit"
                                className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                            >
                                {sending ? <span className="animate-pulse flex items-center gap-2">Transmitting...</span> : <><span className="tracking-wide">Deploy Message</span><SendIcon /></>}
                            </button>
                        </form>
                    </div>

                    {/* 3. Users List Section */}
                    <div className={`lg:col-span-2 rounded-2xl border overflow-hidden flex flex-col h-[600px] transition-all duration-300 hover:shadow-2xl ${cardBg}`}>
                        
                        {/* Toolbar */}
                        <div className={`p-5 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDarkMode ? 'border-white/10 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                            <div>
                                <h2 className={`font-bold text-xl tracking-tight ${textMain}`}>User Directory</h2>
                                <p className={`text-xs mt-0.5 ${textMuted}`}>Manage access and accounts</p>
                            </div>
                            {/* Premium Search Bar */}
                            <div className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border w-full sm:w-72 transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 ${isDarkMode ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}><SearchIcon /></div>
                                <input 
                                    type="text" 
                                    placeholder="Search by email..." 
                                    className={`bg-transparent outline-none text-sm w-full ${textMain} placeholder:opacity-50`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className={`p-1 rounded-full transition-colors ${isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                                        <XIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Table Container */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            
                            {/* 🖥️ DESKTOP VIEW */}
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead className={`text-[10px] uppercase tracking-widest font-extrabold sticky top-0 z-10 backdrop-blur-xl ${isDarkMode ? 'bg-slate-900/80 text-slate-400 border-b border-white/10' : 'bg-white/90 text-slate-500 border-b border-slate-200'}`}>
                                    <tr>
                                        <th className="p-5 pl-8">Account Details</th>
                                        <th className="p-5">Security Status</th>
                                        <th className="p-5 text-right pr-8">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                                    {filteredUsers.map((user) => (
                                        <UserRow 
                                            key={user._id} 
                                            user={user} 
                                            isDarkMode={isDarkMode} 
                                            handleDeleteUser={handleDeleteUser} 
                                            handleToggleStatus={handleToggleStatus}
                                            textMain={textMain}
                                            textMuted={textMuted}
                                            copyToClipboard={copyToClipboard}
                                            copiedEmail={copiedEmail}
                                        />
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr><td colSpan="3" className="p-16 text-center text-slate-500 text-sm">No users found matching "{searchTerm}"</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {/* 📱 MOBILE VIEW */}
                            <div className={`md:hidden flex flex-col divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                                {filteredUsers.map((user) => (
                                    <UserMobileCard 
                                        key={user._id} 
                                        user={user} 
                                        isDarkMode={isDarkMode} 
                                        handleDeleteUser={handleDeleteUser} 
                                        handleToggleStatus={handleToggleStatus}
                                        textMain={textMain}
                                        textMuted={textMuted}
                                        copyToClipboard={copyToClipboard}
                                        copiedEmail={copiedEmail}
                                    />
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="p-16 text-center text-slate-500 text-sm">No records found.</div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
            {/* Custom Scrollbar Styles (Sleeker) */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#475569' : '#94a3b8'}; }
            `}</style>
        </div>
    );
}

// ---------------- SUB COMPONENTS ----------------

const PremiumStatCard = ({ label, value, icon, gradient, isDarkMode, delay }) => (
    <div className={`relative overflow-hidden p-5 md:p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group ${isDarkMode ? 'bg-[#1e293b]/80 backdrop-blur-xl border-white/5' : 'bg-white border-slate-200'}`} style={{ animationDelay: `${delay}ms` }}>
        {/* Subtle background gradient glow */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`}></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start">
                <p className={`text-[11px] md:text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    {React.isValidElement(icon) ? icon : <span className="w-4 h-4 block" />}
                </div>
            </div>
            <p className={`text-3xl md:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        </div>
    </div>
);

const UserRow = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, textMuted, copyToClipboard, copiedEmail }) => {
    const initial = user.email.charAt(0).toUpperCase();
    const colors = ['from-rose-500 to-red-600', 'from-orange-400 to-orange-600', 'from-emerald-400 to-emerald-600', 'from-cyan-400 to-cyan-600', 'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600'];
    const colorClass = colors[user.email.length % colors.length];
    
    const isActive = user.is_active !== false;

    return (
        <tr className={`group transition-colors duration-200 ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} ${!isActive ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
            <td className="p-4 pl-8">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-extrabold shadow-md`}>
                        {initial}
                    </div>
                    <div>
                        <button 
                            onClick={() => copyToClipboard(user.email)}
                            className={`font-semibold text-[15px] ${textMain} flex items-center gap-2 hover:text-indigo-500 transition-colors group/email`}
                        >
                            {user.email}
                            <span className={`opacity-0 group-hover/email:opacity-100 transition-opacity text-xs ${copiedEmail === user.email ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {copiedEmail === user.email ? <CheckIcon /> : <CopyIcon />}
                            </span>
                        </button>
                        <div className={`text-[11px] uppercase tracking-wider mt-1 ${textMuted} font-mono`}>ID: {user._id.slice(-8)}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex flex-col gap-2.5 items-start">
                    <RoleBadge role={user.role} isDarkMode={isDarkMode} />
                    
                    {user.role !== 'admin' && (
                        <button 
                            onClick={() => handleToggleStatus(user._id, isActive)}
                            className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1 rounded-full border transition-all ${isActive 
                                ? `border-emerald-500/20 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 ${isDarkMode && 'text-emerald-400'}` 
                                : `border-red-500/20 text-red-600 bg-red-500/10 hover:bg-red-500/20 ${isDarkMode && 'text-red-400'}`}`}
                            title={isActive ? "Suspend Account" : "Reactivate Account"}
                        >
                            {isActive ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE</>
                            ) : (
                                <><LockIcon /> SUSPENDED</>
                            )}
                        </button>
                    )}
                </div>
            </td>
            <td className="p-4 pr-8 text-right">
                <DeleteButton user={user} handleDeleteUser={handleDeleteUser} />
            </td>
        </tr>
    );
};

const UserMobileCard = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, textMuted, copyToClipboard, copiedEmail }) => {
    const initial = user.email.charAt(0).toUpperCase();
    const colors = ['from-rose-500 to-red-600', 'from-orange-400 to-orange-600', 'from-emerald-400 to-emerald-600', 'from-cyan-400 to-cyan-600', 'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600'];
    const colorClass = colors[user.email.length % colors.length];
    const isActive = user.is_active !== false;

    return (
        <div className={`p-5 flex items-center justify-between transition-colors ${isDarkMode ? 'active:bg-slate-800/50' : 'active:bg-slate-50'} ${!isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4 overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-sm font-extrabold shadow-md`}>
                    {initial}
                </div>
                <div className="min-w-0">
                     <button 
                        onClick={() => copyToClipboard(user.email)}
                        className={`font-semibold text-sm truncate ${textMain} flex items-center gap-2 mb-1.5`}
                    >
                        {user.email}
                        {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                    </button>
                    <div className="flex items-center gap-2 flex-wrap">
                        <RoleBadge role={user.role} isDarkMode={isDarkMode} />
                        {user.role !== 'admin' && (
                             <button 
                                onClick={() => handleToggleStatus(user._id, isActive)}
                                className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isActive ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400' : 'text-red-600 border-red-500/20 bg-red-500/10 dark:text-red-400'}`}
                            >
                                {isActive ? <><span className="w-1 h-1 rounded-full bg-emerald-500"></span> ACTIVE</> : "SUSPENDED"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <DeleteButton user={user} handleDeleteUser={handleDeleteUser} isMobile />
        </div>
    );
};

const RoleBadge = ({ role, isDarkMode }) => (
    role === 'admin' ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wide bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20">
            <AdminBadgeIcon /> ADMIN
        </span>
    ) : (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide border ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            USER
        </span>
    )
);

const DeleteButton = ({ user, handleDeleteUser, isMobile }) => (
    <button 
        onClick={() => handleDeleteUser(user._id)}
        disabled={user.role === 'admin'}
        className={`p-2.5 rounded-xl bg-transparent ${user.role === 'admin' ? 'text-slate-300 dark:text-slate-700' : 'text-slate-400 hover:text-white hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/30'} transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed ${isMobile ? 'ml-2' : ''}`}
        title={user.role === 'admin' ? "Cannot delete admin" : "Delete User"}
    >
        <TrashIcon />
    </button>
);
