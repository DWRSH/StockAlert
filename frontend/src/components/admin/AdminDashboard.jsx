import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';

// --- ✨ SLICK ICONS ---
const MegaphoneIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const TargetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const ZapIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>;
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const CopyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;

export default function AdminDashboard({ token, isDarkMode }) {
    const [stats, setStats] = useState({ total_users: 0, total_alerts: 0, active_alerts: 0, triggered_alerts: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [broadcast, setBroadcast] = useState({ subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(null); 

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [statsRes, usersRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/stats`, config),
                axios.get(`${API_URL}/api/admin/users`, config)
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
        } catch (error) {
            toast.error("Failed to sync system data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(token) fetchAdminData();
    }, [token]);

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("Delete this user permanently? This cannot be undone.")) return;
        const tId = toast.loading("Deleting user...");
        try {
            await axios.delete(`${API_URL}/api/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User deleted successfully.", { id: tId });
        } catch (error) {
            toast.error("Failed to delete user.", { id: tId });
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const updatedUsers = users.map(u => u._id === userId ? { ...u, is_active: !currentStatus } : u);
        setUsers(updatedUsers);
        try {
            await axios.patch(`${API_URL}/api/admin/user/${userId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(currentStatus ? "User Suspended." : "User Activated.");
        } catch (error) {
            setUsers(users); 
            toast.error("Failed to update status.");
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if(!broadcast.subject || !broadcast.message) return toast.error("Please fill in all fields.");
        if(!window.confirm(`Send broadcast to ${stats.total_users} users?`)) return;

        setSending(true);
        const tId = toast.loading("Sending broadcast...");
        try {
            await axios.post(`${API_URL}/api/admin/broadcast`, broadcast, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Broadcast delivered!", { id: tId });
            setBroadcast({ subject: '', message: '' });
        } catch (error) {
            toast.error("Failed to send broadcast.", { id: tId });
        } finally {
            setSending(false);
        }
    };

    const copyToClipboard = (email) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    // --- GLASSMORPHISM THEME VARIABLES ---
    // Background is completely transparent. The "Glass" effect adapts to whatever is behind it.
    const textMain = isDarkMode ? 'text-white' : 'text-slate-900';
    const textMuted = isDarkMode ? 'text-slate-300' : 'text-slate-500';
    
    // Glass Card Styles
    const glassCard = isDarkMode 
        ? 'bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl' 
        : 'bg-white/70 backdrop-blur-xl border border-slate-200/50 shadow-lg shadow-slate-200/50';
    
    const glassHeader = isDarkMode 
        ? 'bg-slate-900/80 border-white/10' 
        : 'bg-white/80 border-slate-200/50';

    const glassInput = isDarkMode
        ? 'bg-slate-950/50 border-white/10 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20'
        : 'bg-white/50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20';

    if (loading) return (
        <div className={`min-h-[80vh] w-full flex items-center justify-center bg-transparent ${textMain}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-medium tracking-wide">Loading Admin Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen w-full font-sans bg-transparent ${textMain} p-4 md:p-6 lg:p-8`}>
            {/* Desktop Wrapper (Constrains width for ultra-wide monitors) */}
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* 1. HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>System Online</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Command Center</h1>
                    </div>
                    
                    <button 
                        onClick={fetchAdminData} 
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${glassCard} hover:bg-opacity-100`}
                    >
                        <RefreshIcon /> Refresh Data
                    </button>
                </div>

                {/* 2. STATS GRID (Glass Cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <StatCard title="Total Users" value={stats.total_users} icon={<UserIcon />} color="text-indigo-500" bgIcon="bg-indigo-500/10" glassCard={glassCard} textMain={textMain} textMuted={textMuted} />
                    <StatCard title="Total Alerts" value={stats.total_alerts} icon={<BellIcon />} color="text-purple-500" bgIcon="bg-purple-500/10" glassCard={glassCard} textMain={textMain} textMuted={textMuted} />
                    <StatCard title="Active Triggers" value={stats.active_alerts} icon={<TargetIcon />} color="text-emerald-500" bgIcon="bg-emerald-500/10" glassCard={glassCard} textMain={textMain} textMuted={textMuted} />
                    <StatCard title="Alerts Fired" value={stats.triggered_alerts} icon={<ZapIcon />} color="text-orange-500" bgIcon="bg-orange-500/10" glassCard={glassCard} textMain={textMain} textMuted={textMuted} />
                </div>

                {/* 3. MAIN DASHBOARD SPLIT */}
                <div className="grid lg:grid-cols-12 gap-6 items-start pb-20">
                    
                    {/* LEFT: BROADCAST WIDGET (3/12 width on Desktop) */}
                    <div className={`lg:col-span-4 rounded-2xl flex flex-col overflow-hidden transition-all ${glassCard}`}>
                        <div className={`p-5 border-b flex items-center gap-3 backdrop-blur-md ${glassHeader}`}>
                            <div className="p-2.5 rounded-lg bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
                                <MegaphoneIcon />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">System Broadcast</h2>
                                <p className={`text-[11px] font-medium uppercase tracking-wider ${textMuted}`}>To {stats.total_users} Users</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleBroadcast} className="flex flex-col p-5 gap-5">
                            <div>
                                <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${textMuted}`}>Subject Line</label>
                                <input 
                                    type="text" 
                                    className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all focus:ring-4 ${glassInput}`}
                                    value={broadcast.subject}
                                    onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                                    placeholder="Announcement Title"
                                />
                            </div>
                            <div className="flex-1">
                                <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${textMuted}`}>Message Content</label>
                                <textarea 
                                    className={`w-full h-36 px-4 py-3 rounded-xl border outline-none text-sm transition-all resize-none focus:ring-4 ${glassInput}`}
                                    value={broadcast.message}
                                    onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                                    placeholder="Type your message here..."
                                ></textarea>
                            </div>
                            <button 
                                disabled={sending} type="submit"
                                className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                            >
                                {sending ? <span className="animate-pulse">Sending...</span> : <>Deploy Message <SendIcon /></>}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT: USER DIRECTORY (9/12 width on Desktop) */}
                    <div className={`lg:col-span-8 rounded-2xl flex flex-col overflow-hidden h-[600px] transition-all ${glassCard}`}>
                        
                        {/* Toolbar */}
                        <div className={`p-4 md:px-6 md:py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md z-20 ${glassHeader}`}>
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    User Directory
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-white/10' : 'bg-slate-900/10'}`}>
                                        {users.length}
                                    </span>
                                </h2>
                            </div>
                            
                            {/* Search */}
                            <div className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border w-full sm:w-72 transition-all focus-within:ring-4 ${glassInput}`}>
                                <SearchIcon className="opacity-50" />
                                <input 
                                    type="text" 
                                    className="bg-transparent outline-none text-sm w-full placeholder-inherit"
                                    placeholder="Search by email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* List / Table Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                            
                            {/* 🖥️ DESKTOP: Proper HTML Table for perfect alignment */}
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead className={`sticky top-0 z-20 backdrop-blur-xl border-b text-xs font-bold uppercase tracking-wider ${textMuted} ${glassHeader}`}>
                                    <tr>
                                        <th className="py-4 px-6">User Account</th>
                                        <th className="py-4 px-6">Role</th>
                                        <th className="py-4 px-6">Status</th>
                                        <th className="py-4 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-200/50'}`}>
                                    {filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className={`py-16 text-center text-sm ${textMuted}`}>No users found.</td></tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <DesktopUserRow 
                                                key={user._id} user={user} isDarkMode={isDarkMode} 
                                                handleDeleteUser={handleDeleteUser} handleToggleStatus={handleToggleStatus}
                                                copyToClipboard={copyToClipboard} copiedEmail={copiedEmail}
                                                textMain={textMain} textMuted={textMuted}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* 📱 MOBILE: Card View */}
                            <div className={`md:hidden flex flex-col divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-200/50'}`}>
                                {filteredUsers.length === 0 ? (
                                    <div className={`py-16 text-center text-sm ${textMuted}`}>No users found.</div>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <MobileUserCard 
                                            key={user._id} user={user} isDarkMode={isDarkMode} 
                                            handleDeleteUser={handleDeleteUser} handleToggleStatus={handleToggleStatus}
                                            copyToClipboard={copyToClipboard} copiedEmail={copiedEmail}
                                            textMain={textMain} textMuted={textMuted}
                                        />
                                    ))
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Scrollbar to match glass effect */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'}; }
            `}</style>
        </div>
    );
}

// ---------------- SUB COMPONENTS ----------------

const StatCard = ({ title, value, icon, color, bgIcon, glassCard, textMain, textMuted }) => (
    <div className={`p-5 md:p-6 rounded-2xl flex flex-col justify-between h-32 md:h-36 transition-all hover:-translate-y-1 ${glassCard}`}>
        <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>
                {title}
            </span>
            <div className={`p-2 rounded-xl ${bgIcon} ${color}`}>
                {icon}
            </div>
        </div>
        <span className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textMain}`}>
            {value}
        </span>
    </div>
);

// --- DESKTOP TABLE ROW ---
const DesktopUserRow = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, copyToClipboard, copiedEmail, textMain, textMuted }) => {
    const isActive = user.is_active !== false;
    const initial = user.email.charAt(0).toUpperCase();
    
    // Dynamic initials color
    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];
    const colorClass = colors[user.email.length % colors.length];

    return (
        <tr className={`group transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-900/5'} ${!isActive ? 'opacity-50' : ''}`}>
            <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0 ${colorClass}`}>
                        {initial}
                    </div>
                    <div>
                        <button 
                            onClick={() => copyToClipboard(user.email)}
                            className={`font-semibold text-[15px] ${textMain} hover:text-indigo-500 transition-colors flex items-center gap-2`}
                        >
                            {user.email}
                            {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                        </button>
                        <div className={`text-[11px] font-mono tracking-wider mt-0.5 ${textMuted}`}>ID: {user._id.slice(-8)}</div>
                    </div>
                </div>
            </td>
            <td className="py-4 px-6">
                {user.role === 'admin' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase bg-purple-500/20 text-purple-500 border border-purple-500/20">
                        Admin
                    </span>
                ) : (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-900/5 border-slate-200 text-slate-600'}`}>
                        User
                    </span>
                )}
            </td>
            <td className="py-4 px-6">
                {user.role !== 'admin' ? (
                    <button 
                        onClick={() => handleToggleStatus(user._id, isActive)}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${isActive 
                            ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100')
                            : (isDarkMode ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100')}`}
                    >
                        {isActive ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> : null}
                        {isActive ? "Active" : "Suspended"}
                    </button>
                ) : (
                    <span className={`text-xs font-medium italic ${textMuted}`}>Always Active</span>
                )}
            </td>
            <td className="py-4 px-6 text-right">
                <button 
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={user.role === 'admin'}
                    className={`p-2 rounded-xl transition-all ${user.role === 'admin' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-500 hover:text-white hover:shadow-lg shadow-red-500/30 text-slate-400'}`}
                >
                    <TrashIcon />
                </button>
            </td>
        </tr>
    );
};

// --- MOBILE LIST CARD ---
const MobileUserCard = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, copyToClipboard, copiedEmail, textMain, textMuted }) => {
    const isActive = user.is_active !== false;
    const initial = user.email.charAt(0).toUpperCase();
    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500'];
    const colorClass = colors[user.email.length % colors.length];

    return (
        <div className={`p-4 flex flex-col gap-3 transition-colors ${isDarkMode ? 'active:bg-white/5' : 'active:bg-slate-900/5'} ${!isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-full flex shrink-0 items-center justify-center text-white text-sm font-bold shadow-md ${colorClass}`}>
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <button 
                            onClick={() => copyToClipboard(user.email)}
                            className={`font-semibold text-sm truncate ${textMain} flex items-center gap-1.5`}
                        >
                            {user.email}
                            {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                        </button>
                        <span className={`text-[10px] font-mono tracking-wider block mt-0.5 ${textMuted}`}>{user._id}</span>
                    </div>
                </div>
                <button 
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={user.role === 'admin'}
                    className={`p-2 rounded-lg ${user.role !== 'admin' && 'text-slate-400 hover:text-red-500'} disabled:opacity-20`}
                >
                    <TrashIcon />
                </button>
            </div>
            
            <div className="flex items-center gap-2 pl-12">
                {user.role === 'admin' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-500">Admin</span>
                ) : (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-900/5 border-slate-200 text-slate-600'}`}>User</span>
                )}
                
                {user.role !== 'admin' && (
                    <button 
                        onClick={() => handleToggleStatus(user._id, isActive)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}
                    >
                        {isActive ? "ACTIVE" : "SUSPENDED"}
                    </button>
                )}
            </div>
        </div>
    );
};
