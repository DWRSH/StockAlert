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
            toast.success(currentStatus ? "User Suspended" : "User Activated");
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
            toast.success("Broadcast Sent!", { id: tId });
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
        <div className="space-y-6 animate-pulse p-6 max-w-7xl mx-auto">
            <div className="h-10 w-48 bg-slate-300/20 rounded-lg"></div>
            <div className="h-32 w-full bg-slate-300/10 rounded-2xl"></div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="h-96 rounded-2xl bg-slate-300/10 lg:col-span-1"></div>
                <div className="h-96 rounded-2xl bg-slate-300/10 lg:col-span-2"></div>
            </div>
        </div>
    );

    // --- THEME VARIABLES ---
    const pageBg = isDarkMode ? 'bg-[#0f172a]' : 'bg-[#f8fafc]';
    const cardBg = isDarkMode ? 'bg-[#1e293b] border-slate-700/50' : 'bg-white border-slate-200';
    const textMain = isDarkMode ? 'text-slate-100' : 'text-slate-900';
    const textMuted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

    return (
        <div className={`min-h-screen w-full font-sans ${pageBg} ${textMain} pb-24 md:pb-20 transition-colors duration-300`}>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold tracking-tight mb-1 flex items-center gap-3 ${textMain}`}>
                            Admin Workspace
                            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                Live
                            </span>
                        </h1>
                        <p className={`text-sm ${textMuted}`}>System overview & user management</p>
                    </div>
                    
                    <button onClick={fetchAdminData} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm'}`}>
                        <RefreshIcon />
                        Refresh Data
                    </button>
                </div>

                {/* 1. Sleek Grouped Stats Panel */}
                <div className={`w-full rounded-2xl border mb-8 flex flex-col md:flex-row overflow-hidden shadow-sm ${cardBg}`}>
                    <StatBlock label="Total Accounts" value={stats.total_users} icon={<UserIcon />} color="text-indigo-500" bg="bg-indigo-500/10" isDarkMode={isDarkMode} borderRight />
                    <StatBlock label="Total Alerts" value={stats.total_alerts} icon={<DashboardIcon />} color="text-purple-500" bg="bg-purple-500/10" isDarkMode={isDarkMode} borderRight />
                    <StatBlock label="Active Triggers" value={stats.active_alerts} icon={<div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>} color="text-emerald-500" bg="bg-emerald-500/10" isDarkMode={isDarkMode} borderRight />
                    <StatBlock label="Fired Alerts" value={stats.triggered_alerts} icon={<div className="font-bold">!</div>} color="text-orange-500" bg="bg-orange-500/10" isDarkMode={isDarkMode} />
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* 2. Composer Style Broadcast */}
                    <div className={`lg:col-span-1 p-0 rounded-2xl border flex flex-col relative shadow-sm ${cardBg}`}>
                        <div className={`p-5 border-b flex items-center gap-3 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                <MegaphoneIcon />
                            </div>
                            <h2 className={`font-semibold text-lg ${textMain}`}>Send Broadcast</h2>
                        </div>

                        <form onSubmit={handleBroadcast} className="flex-1 flex flex-col p-5">
                            <div className="mb-4">
                                <label className={`text-[11px] font-bold uppercase tracking-wider mb-2 block ${textMuted}`}>Subject</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter subject..."
                                    className={`w-full px-4 py-3 rounded-lg outline-none text-sm transition-all focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                    value={broadcast.subject}
                                    onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                                />
                            </div>
                            <div className="flex-1 flex flex-col mb-6">
                                <label className={`text-[11px] font-bold uppercase tracking-wider mb-2 block ${textMuted}`}>Message</label>
                                <textarea 
                                    placeholder="Write your email content here..."
                                    className={`w-full h-full min-h-[180px] px-4 py-3 rounded-lg outline-none text-sm transition-all resize-none focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-400'}`}
                                    value={broadcast.message}
                                    onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                                ></textarea>
                            </div>
                            
                            <button 
                                disabled={sending}
                                type="submit"
                                className={`w-full py-3.5 font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isDarkMode ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                            >
                                {sending ? <span className="animate-pulse">Sending...</span> : <>Send Message <SendIcon /></>}
                            </button>
                        </form>
                    </div>

                    {/* 3. Minimalist Data Grid */}
                    <div className={`lg:col-span-2 rounded-2xl border flex flex-col h-[600px] shadow-sm ${cardBg}`}>
                        
                        {/* Toolbar */}
                        <div className={`p-4 md:px-6 md:py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDarkMode ? 'border-slate-700/50' : 'border-slate-100'}`}>
                            <h2 className={`font-semibold text-lg ${textMain}`}>Users <span className={`text-sm ml-2 px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>{users.length}</span></h2>
                            
                            <div className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 w-full sm:w-64 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                                <div className="text-slate-400"><SearchIcon /></div>
                                <input 
                                    type="text" 
                                    placeholder="Search by email..." 
                                    className={`bg-transparent outline-none text-sm w-full ${textMain} placeholder:text-slate-400`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                        <XIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            
                            {/* 🖥️ DESKTOP VIEW */}
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead className={`text-xs sticky top-0 z-10 font-medium ${isDarkMode ? 'bg-[#1e293b] text-slate-400 shadow-[0_1px_0_rgba(255,255,255,0.05)]' : 'bg-white text-slate-500 shadow-[0_1px_0_rgba(0,0,0,0.05)]'}`}>
                                    <tr>
                                        <th className="py-4 px-6 font-medium">Email Address</th>
                                        <th className="py-4 px-6 font-medium">Role</th>
                                        <th className="py-4 px-6 font-medium">Status</th>
                                        <th className="py-4 px-6 text-right font-medium">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
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
                                        <tr><td colSpan="4" className="py-12 text-center text-slate-500 text-sm">No users found.</td></tr>
                                    )}
                                </tbody>
                            </table>

                            {/* 📱 MOBILE VIEW */}
                            <div className={`md:hidden flex flex-col divide-y ${isDarkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
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
                                    <div className="py-12 text-center text-slate-500 text-sm">No users found.</div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#475569' : '#cbd5e1'}; }
            `}</style>
        </div>
    );
}

// ---------------- SUB COMPONENTS ----------------

const StatBlock = ({ label, value, icon, color, bg, isDarkMode, borderRight }) => (
    <div className={`flex-1 p-6 flex items-center gap-4 ${borderRight ? (isDarkMode ? 'border-b md:border-b-0 md:border-r border-slate-700/50' : 'border-b md:border-b-0 md:border-r border-slate-100') : ''}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${color}`}>
            {icon}
        </div>
        <div>
            <p className={`text-xs font-medium mb-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        </div>
    </div>
);

const UserRow = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, copyToClipboard, copiedEmail }) => {
    const isActive = user.is_active !== false;

    return (
        <tr className={`group transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'} ${!isActive ? 'opacity-60' : ''}`}>
            <td className="py-3 px-6">
                <div className="flex flex-col">
                    <button 
                        onClick={() => copyToClipboard(user.email)}
                        className={`font-medium text-left ${textMain} flex items-center gap-2 hover:text-indigo-500 transition-colors group/email`}
                    >
                        {user.email}
                        <span className={`opacity-0 group-hover/email:opacity-100 transition-opacity text-xs ${copiedEmail === user.email ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {copiedEmail === user.email ? <CheckIcon /> : <CopyIcon />}
                        </span>
                    </button>
                    <span className={`text-[11px] font-mono mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user._id}</span>
                </div>
            </td>
            <td className="py-3 px-6">
                <RoleBadge role={user.role} isDarkMode={isDarkMode} />
            </td>
            <td className="py-3 px-6">
                {user.role !== 'admin' ? (
                    <button 
                        onClick={() => handleToggleStatus(user._id, isActive)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${isActive 
                            ? (isDarkMode ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100')
                            : (isDarkMode ? 'text-slate-400 bg-slate-800 hover:bg-slate-700' : 'text-slate-600 bg-slate-100 hover:bg-slate-200')}`}
                        title={isActive ? "Suspend User" : "Activate User"}
                    >
                        {isActive ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> : <LockIcon />}
                        {isActive ? "Active" : "Suspended"}
                    </button>
                ) : (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>N/A</span>
                )}
            </td>
            <td className="py-3 px-6 text-right">
                <DeleteButton user={user} handleDeleteUser={handleDeleteUser} />
            </td>
        </tr>
    );
};

const UserMobileCard = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, textMain, copyToClipboard, copiedEmail }) => {
    const isActive = user.is_active !== false;

    return (
        <div className={`p-4 flex flex-col gap-3 ${isDarkMode ? 'active:bg-slate-800/30' : 'active:bg-slate-50'} ${!isActive ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                     <button 
                        onClick={() => copyToClipboard(user.email)}
                        className={`font-medium text-sm truncate ${textMain} flex items-center gap-2`}
                    >
                        {user.email}
                        {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                    </button>
                    <span className={`text-[10px] font-mono block mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user._id}</span>
                </div>
                <DeleteButton user={user} handleDeleteUser={handleDeleteUser} />
            </div>
            <div className="flex items-center gap-3">
                <RoleBadge role={user.role} isDarkMode={isDarkMode} />
                {user.role !== 'admin' && (
                     <button 
                        onClick={() => handleToggleStatus(user._id, isActive)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${isActive ? 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' : 'text-slate-600 bg-slate-200 dark:text-slate-400 dark:bg-slate-800'}`}
                    >
                        {isActive ? "ACTIVE" : "SUSPENDED"}
                    </button>
                )}
            </div>
        </div>
    );
};

const RoleBadge = ({ role, isDarkMode }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${role === 'admin' 
        ? (isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-700')
        : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>
        {role === 'admin' ? "Admin" : "User"}
    </span>
);

const DeleteButton = ({ user, handleDeleteUser }) => (
    <button 
        onClick={() => handleDeleteUser(user._id)}
        disabled={user.role === 'admin'}
        className={`p-1.5 rounded-md text-slate-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${user.role !== 'admin' && 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
        title="Delete User"
    >
        <TrashIcon />
    </button>
);
