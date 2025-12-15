import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';
import { TrashIcon, UserIcon, DashboardIcon } from '../common/Icons';

// --- ✨ ICONS (Added Lock & Unlock) ---
const MegaphoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
const AdminBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>;
// 👇 New Icons for Ban System
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
                axios.get(`${API_URL}/admin/stats`, config),
                axios.get(`${API_URL}/admin/users`, config)
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
            await axios.delete(`${API_URL}/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User Deleted", { id: tId });
        } catch (error) {
            toast.error("Failed to delete user", { id: tId });
        }
    };

    // 🚫 NEW: Toggle Status Function (Ban/Unban)
    const handleToggleStatus = async (userId, currentStatus) => {
        // Optimistic UI Update (Immediate feedback)
        const updatedUsers = users.map(u => 
            u._id === userId ? { ...u, is_active: !currentStatus } : u
        );
        setUsers(updatedUsers);

        try {
            await axios.patch(`${API_URL}/admin/user/${userId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(currentStatus ? "User Suspended 🚫" : "User Activated ✅");
        } catch (error) {
            // Revert on error
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
            await axios.post(`${API_URL}/admin/broadcast`, broadcast, { headers: { Authorization: `Bearer ${token}` } });
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
        toast.success("Email copied!");
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-slate-300/20 rounded-lg"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-300/10"></div>)}
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="h-64 rounded-3xl bg-slate-300/10 lg:col-span-1"></div>
                <div className="h-64 rounded-3xl bg-slate-300/10 lg:col-span-2"></div>
            </div>
        </div>
    );

    const cardBg = isDarkMode ? 'bg-[#151a25]/80 backdrop-blur-md border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50';
    const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
    const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-20">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className={`text-2xl md:text-3xl font-black tracking-tight mb-1 ${textMain}`}>
                        Admin <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Hub</span>
                    </h1>
                    <p className={`text-xs md:text-sm ${textMuted}`}>Overview of system performance.</p>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={fetchAdminData} className={`p-2.5 rounded-full border transition-all active:scale-95 active:rotate-180 duration-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                        <RefreshIcon />
                    </button>
                    <div className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        System Online
                    </div>
                </div>
            </div>

            {/* 1. Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <ModernStatCard label="Total Users" value={stats.total_users} icon={<UserIcon />} color="from-blue-500 to-indigo-600" isDarkMode={isDarkMode} delay="0" />
                <ModernStatCard label="Total Alerts" value={stats.total_alerts} icon={<DashboardIcon />} color="from-violet-500 to-purple-600" isDarkMode={isDarkMode} delay="100" />
                <ModernStatCard label="Active" value={stats.active_alerts} icon={<div className="w-2 h-2 rounded-full bg-white"/>} color="from-emerald-400 to-teal-500" isDarkMode={isDarkMode} delay="200" />
                <ModernStatCard label="Triggered" value={stats.triggered_alerts} icon={<div className="text-xs">⚠️</div>} color="from-orange-400 to-red-500" isDarkMode={isDarkMode} delay="300" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* 2. Broadcast Section */}
                <div className={`lg:col-span-1 p-5 md:p-6 rounded-3xl border flex flex-col relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/10 ${cardBg}`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>

                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                            <MegaphoneIcon />
                        </div>
                        <div>
                            <h2 className={`font-bold text-lg ${textMain}`}>Announcement</h2>
                            <p className="text-xs opacity-50">Notify {stats.total_users} users</p>
                        </div>
                    </div>

                    <form onSubmit={handleBroadcast} className="space-y-4 flex-1 flex flex-col relative z-10">
                        <div className="group">
                            <input 
                                type="text" 
                                placeholder="Subject"
                                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900/50 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                                value={broadcast.subject}
                                onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                            />
                        </div>
                        <div className="flex-1 group">
                            <textarea 
                                rows="3"
                                placeholder="Type your message..."
                                className={`w-full h-full min-h-[120px] px-4 py-3 rounded-xl border outline-none text-sm transition-all resize-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-900/50 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`}
                                value={broadcast.message}
                                onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                            ></textarea>
                        </div>
                        <button 
                            disabled={sending}
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
                        >
                            {sending ? <span className="animate-pulse">Sending...</span> : <><span className="text-sm">Send Broadcast</span><SendIcon /></>}
                        </button>
                    </form>
                </div>

                {/* 3. Users List */}
                <div className={`lg:col-span-2 rounded-3xl border overflow-hidden flex flex-col h-full ${cardBg}`}>
                    
                    {/* Toolbar */}
                    <div className="p-4 md:p-6 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-inherit">
                        <div>
                            <h2 className={`font-bold text-lg ${textMain}`}>User Database</h2>
                            <p className="text-xs opacity-50">{users.length} registered accounts</p>
                        </div>
                        {/* 🔍 Smart Search Bar */}
                        <div className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-64 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="opacity-50"><SearchIcon /></div>
                            <input 
                                type="text" 
                                placeholder="Search email..." 
                                className={`bg-transparent outline-none text-sm w-full ${textMain} placeholder:text-opacity-50`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="p-1 rounded-full hover:bg-slate-500/20 transition-colors opacity-50 hover:opacity-100">
                                    <XIcon />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Table Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[500px] lg:max-h-none p-0">
                        
                        {/* 🖥️ DESKTOP VIEW */}
                        <table className="w-full text-left border-collapse hidden md:table">
                            <thead className={`text-[10px] uppercase tracking-wider font-bold sticky top-0 z-10 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/90 text-slate-500' : 'bg-slate-50/90 text-slate-400'}`}>
                                <tr>
                                    <th className="p-5 pl-6">User Identity</th>
                                    <th className="p-5">Status</th>
                                    <th className="p-5 text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-inherit border-inherit">
                                {filteredUsers.map((user) => (
                                    <UserRow 
                                        key={user._id} 
                                        user={user} 
                                        isDarkMode={isDarkMode} 
                                        handleDeleteUser={handleDeleteUser} 
                                        handleToggleStatus={handleToggleStatus}
                                        textMain={textMain}
                                        copyToClipboard={copyToClipboard}
                                        copiedEmail={copiedEmail}
                                    />
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr><td colSpan="3" className="p-12 text-center opacity-50 text-sm italic">No users matching "{searchTerm}" found.</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* 📱 MOBILE VIEW */}
                        <div className="md:hidden flex flex-col divide-y divide-inherit border-inherit">
                            {filteredUsers.map((user) => (
                                <UserMobileCard 
                                    key={user._id} 
                                    user={user} 
                                    isDarkMode={isDarkMode} 
                                    handleDeleteUser={handleDeleteUser} 
                                    handleToggleStatus={handleToggleStatus}
                                    textMain={textMain}
                                    copyToClipboard={copyToClipboard}
                                    copiedEmail={copiedEmail}
                                />
                            ))}
                            {filteredUsers.length === 0 && (
                                <div className="p-12 text-center opacity-50 text-sm italic">No users found.</div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
            
            {/* Custom Scrollbar Styles */}
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

const UserRow = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, copyToClipboard, copiedEmail }) => {
    const initial = user.email.charAt(0).toUpperCase();
    const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'];
    const colorClass = colors[user.email.length % colors.length];
    
    // Check Active Status (Default True if missing)
    const isActive = user.is_active !== false;

    return (
        <tr className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'} ${!isActive ? 'opacity-60 bg-red-500/5' : ''}`}>
            <td className="p-4 pl-6">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-black/5 ring-2 ring-white/10`}>
                        {initial}
                    </div>
                    <div>
                        <button 
                            onClick={() => copyToClipboard(user.email)}
                            className={`font-bold font-mono text-sm ${textMain} flex items-center gap-2 hover:text-indigo-500 transition-colors group/email`}
                            title="Click to copy email"
                        >
                            {user.email}
                            <span className={`opacity-0 group-hover/email:opacity-100 transition-opacity text-xs ${copiedEmail === user.email ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {copiedEmail === user.email ? <CheckIcon /> : <CopyIcon />}
                            </span>
                        </button>
                        <div className="text-[10px] opacity-40 uppercase tracking-widest mt-0.5">ID: {user._id.slice(-6)}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex flex-col gap-2 items-start">
                    <RoleBadge role={user.role} isDarkMode={isDarkMode} />
                    
                    {/* ✨ BAN/UNBAN TOGGLE */}
                    {user.role !== 'admin' && (
                        <button 
                            onClick={() => handleToggleStatus(user._id, isActive)}
                            className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit transition-all ${isActive 
                                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' 
                                : 'border-red-500/20 text-red-600 bg-red-500/10 hover:bg-red-500/20'}`}
                            title={isActive ? "Suspend User" : "Activate User"}
                        >
                            {isActive ? <><UnlockIcon /> ACTIVE</> : <><LockIcon /> BANNED</>}
                        </button>
                    )}
                </div>
            </td>
            <td className="p-4 pr-6 text-right">
                <DeleteButton user={user} handleDeleteUser={handleDeleteUser} />
            </td>
        </tr>
    );
};

const UserMobileCard = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, copyToClipboard, copiedEmail }) => {
    const initial = user.email.charAt(0).toUpperCase();
    const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500'];
    const colorClass = colors[user.email.length % colors.length];
    const isActive = user.is_active !== false;

    return (
        <div className={`p-4 flex items-center justify-between ${isDarkMode ? 'active:bg-slate-800' : 'active:bg-slate-50'} ${!isActive ? 'opacity-70 bg-red-500/5' : ''}`}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 ${colorClass} flex items-center justify-center text-white font-bold shadow-md`}>
                    {initial}
                </div>
                <div className="min-w-0">
                     <button 
                        onClick={() => copyToClipboard(user.email)}
                        className={`font-bold text-sm truncate ${textMain} flex items-center gap-2`}
                    >
                        {user.email}
                        {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                    </button>
                    <div className="flex items-center gap-2 mt-1.5">
                        <RoleBadge role={user.role} isDarkMode={isDarkMode} />
                        {user.role !== 'admin' && (
                             <button 
                                onClick={() => handleToggleStatus(user._id, isActive)}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isActive ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30 bg-red-500/10'}`}
                            >
                                {isActive ? "ACTIVE" : "BANNED"}
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-sm shadow-purple-500/10">
            <AdminBadgeIcon /> ADMIN
        </span>
    ) : (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            USER
        </span>
    )
);

const DeleteButton = ({ user, handleDeleteUser, isMobile }) => (
    <button 
        onClick={() => handleDeleteUser(user._id)}
        disabled={user.role === 'admin'}
        className={`p-2.5 rounded-xl bg-transparent text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed ${isMobile ? 'ml-2' : ''}`}
        title="Delete User"
    >
        <TrashIcon />
    </button>
);

const ModernStatCard = ({ label, value, icon, color, isDarkMode, delay }) => (
    <div className={`relative overflow-hidden p-4 md:p-5 rounded-3xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${isDarkMode ? 'bg-[#151a25]/80 backdrop-blur-md border-slate-800' : 'bg-white border-slate-200 shadow-lg shadow-slate-100'}`} style={{ animationDelay: `${delay}ms` }}>
        <div className="relative z-10 flex flex-col justify-between h-full gap-3">
            <div className="flex justify-between items-start">
                <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                <div className={`p-1.5 md:p-2 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                    {React.isValidElement(icon) ? icon : <span className="w-4 h-4 block" />}
                </div>
            </div>
            <p className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        </div>
        {/* Decorative Glow */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${color} opacity-[0.15] rounded-full blur-2xl group-hover:opacity-25 transition-opacity`}></div>
    </div>
);
