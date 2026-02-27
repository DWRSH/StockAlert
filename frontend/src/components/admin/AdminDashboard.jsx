import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';
import { TrashIcon, UserIcon, DashboardIcon } from '../common/Icons';

// --- ✨ INTERNAL ICONS ---
const MegaphoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const AdminBadgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>;
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>;
const ActivityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;

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
            toast.error("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(token) fetchAdminData();
    }, [token]);

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("Delete this user permanently?")) return;
        const tId = toast.loading("Deleting...");
        try {
            await axios.delete(`${API_URL}/api/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("User Deleted", { id: tId });
        } catch (error) {
            toast.error("Deletion failed", { id: tId });
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const updatedUsers = users.map(u => u._id === userId ? { ...u, is_active: !currentStatus } : u);
        setUsers(updatedUsers);
        try {
            await axios.patch(`${API_URL}/api/admin/user/${userId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(currentStatus ? "Account Suspended" : "Account Activated");
        } catch (error) {
            setUsers(users); 
            toast.error("Action failed");
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if(!broadcast.subject || !broadcast.message) return toast.error("Empty fields");
        if(!window.confirm(`Broadcast to ${stats.total_users} users?`)) return;

        setSending(true);
        const tId = toast.loading("Sending Broadcast...");
        try {
            await axios.post(`${API_URL}/api/admin/broadcast`, broadcast, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Message Sent", { id: tId });
            setBroadcast({ subject: '', message: '' });
        } catch (error) {
            toast.error("Broadcast failed", { id: tId });
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

    // --- Core Themes ---
    const bgMain = isDarkMode ? 'bg-[#0B0E14]' : 'bg-[#f4f6f8]';
    const bgPanel = isDarkMode ? 'bg-[#151A23]' : 'bg-white';
    const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
    const borderDim = isDarkMode ? 'border-[#222A38]' : 'border-gray-200';

    if (loading) return (
        <div className={`min-h-screen w-full flex items-center justify-center ${bgMain} ${textPrimary}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-mono text-sm tracking-widest">INITIALIZING SYSTEM...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen lg:h-screen w-full flex flex-col lg:flex-row p-4 gap-4 md:p-6 md:gap-6 font-sans ${bgMain} ${textPrimary} overflow-hidden`}>
            
            {/* ================= LEFT SIDEBAR (STATS & ACTIONS) ================= */}
            <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 hide-scrollbar">
                
                {/* Header Block */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            <ActivityIcon /> OVERVIEW
                        </h1>
                        <p className={`text-sm mt-1 ${textSecondary}`}>Live Monitoring Dashboard</p>
                    </div>
                    <button onClick={fetchAdminData} className={`p-3 rounded-full border ${borderDim} ${isDarkMode ? 'hover:bg-[#222A38]' : 'hover:bg-gray-100'} transition-all active:rotate-180`}>
                        <RefreshIcon />
                    </button>
                </div>

                {/* 2x2 Bento Grid for Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <StatBox title="TOTAL USERS" value={stats.total_users} bg={isDarkMode ? 'bg-[#1D2432]' : 'bg-white'} border={borderDim} text={textPrimary} sub={textSecondary} />
                    <StatBox title="TOTAL ALERTS" value={stats.total_alerts} bg={isDarkMode ? 'bg-[#1D2432]' : 'bg-white'} border={borderDim} text={textPrimary} sub={textSecondary} />
                    <StatBox title="ACTIVE TRIGGERS" value={stats.active_alerts} bg="bg-emerald-500 text-white border-transparent" border={borderDim} text="text-white" sub="text-emerald-100" />
                    <StatBox title="FIRED ALERTS" value={stats.triggered_alerts} bg={isDarkMode ? 'bg-[#1D2432]' : 'bg-white'} border={borderDim} text={textPrimary} sub={textSecondary} alert />
                </div>

                {/* Broadcast Action Card (Vibrant & Distinct) */}
                <div className={`p-6 rounded-3xl flex flex-col gap-4 shadow-xl ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm"><MegaphoneIcon /></div>
                        <div>
                            <h2 className="font-bold text-lg tracking-wide">SYSTEM BROADCAST</h2>
                            <p className="text-indigo-200 text-xs uppercase tracking-widest mt-0.5">Reach {stats.total_users} Users</p>
                        </div>
                    </div>

                    <form onSubmit={handleBroadcast} className="flex flex-col gap-3 mt-2">
                        <input 
                            type="text" placeholder="Subject Title"
                            className="w-full px-4 py-3.5 bg-indigo-700/50 border border-indigo-400/30 rounded-xl outline-none text-sm text-white placeholder:text-indigo-300 focus:border-white transition-colors"
                            value={broadcast.subject} onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                        />
                        <textarea 
                            placeholder="Compose your message..."
                            className="w-full min-h-[140px] px-4 py-3.5 bg-indigo-700/50 border border-indigo-400/30 rounded-xl outline-none text-sm text-white placeholder:text-indigo-300 resize-none focus:border-white transition-colors"
                            value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                        ></textarea>
                        <button 
                            disabled={sending} type="submit"
                            className="w-full py-4 mt-1 bg-white text-indigo-700 font-bold rounded-xl transition-transform active:scale-95 flex justify-center items-center gap-2 hover:bg-indigo-50 disabled:opacity-70"
                        >
                            {sending ? "TRANSMITTING..." : "DEPLOY MESSAGE"} <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {/* ================= RIGHT SIDEBAR (USER DIRECTORY LEDGER) ================= */}
            <div className={`flex-1 flex flex-col rounded-[2rem] border shadow-sm overflow-hidden ${bgPanel} ${borderDim} min-h-[600px] lg:min-h-0`}>
                
                {/* Ledger Header */}
                <div className={`p-5 md:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${borderDim}`}>
                    <div>
                        <h2 className="font-bold text-xl tracking-tight">User Ledger</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className={`text-xs font-mono uppercase tracking-widest ${textSecondary}`}>Database Live</span>
                        </div>
                    </div>
                    
                    {/* Minimalist Search */}
                    <div className={`relative flex items-center px-4 py-3 rounded-xl border w-full sm:w-72 transition-all focus-within:border-emerald-500 ${isDarkMode ? 'bg-[#0B0E14] border-[#222A38]' : 'bg-gray-50 border-gray-200'}`}>
                        <SearchIcon className={textSecondary} />
                        <input 
                            type="text" placeholder="Search identity..." 
                            className={`ml-3 bg-transparent outline-none text-sm w-full ${textPrimary} placeholder:${textSecondary}`}
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className={textSecondary}><XIcon /></button>}
                    </div>
                </div>

                {/* Ledger Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4">
                    <div className="flex flex-col gap-2">
                        {filteredUsers.map(user => (
                            <UserCard 
                                key={user._id} 
                                user={user} 
                                isDarkMode={isDarkMode} 
                                handleDeleteUser={handleDeleteUser} 
                                handleToggleStatus={handleToggleStatus}
                                copyToClipboard={copyToClipboard}
                                copiedEmail={copiedEmail}
                                borderDim={borderDim}
                                textPrimary={textPrimary}
                                textSecondary={textSecondary}
                            />
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className={`flex flex-col items-center justify-center py-20 ${textSecondary}`}>
                                <SearchIcon />
                                <p className="mt-4 text-sm uppercase tracking-widest">No matching records</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#222A38' : '#e5e7eb'}; border-radius: 10px; }
            `}</style>
        </div>
    );
}

// ---------------- SUB COMPONENTS ----------------

const StatBox = ({ title, value, bg, border, text, sub, alert }) => (
    <div className={`p-5 rounded-3xl border flex flex-col justify-between h-36 relative overflow-hidden ${bg} ${border}`}>
        <p className={`text-[10px] font-bold uppercase tracking-widest z-10 ${sub}`}>{title}</p>
        <p className={`text-4xl font-black tracking-tighter z-10 ${text}`}>{value}</p>
        {alert && <div className="absolute -bottom-4 -right-4 text-7xl opacity-5">⚠️</div>}
    </div>
);

const UserCard = ({ user, isDarkMode, handleDeleteUser, handleToggleStatus, copyToClipboard, copiedEmail, borderDim, textPrimary, textSecondary }) => {
    const isActive = user.is_active !== false;
    const initial = user.email.charAt(0).toUpperCase();
    
    // Sleek single color for avatars instead of random colors
    const avatarBg = isDarkMode ? 'bg-[#222A38] text-white' : 'bg-gray-100 text-gray-900';

    return (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/50 ${isDarkMode ? 'bg-[#0B0E14] border-[#222A38]' : 'bg-white border-gray-200 shadow-sm'} ${!isActive ? 'opacity-60 grayscale' : ''}`}>
            
            {/* Identity */}
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-black text-lg ${avatarBg}`}>
                    {initial}
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <button onClick={() => copyToClipboard(user.email)} className={`font-semibold text-[15px] ${textPrimary} hover:text-emerald-500 transition-colors text-left break-all`}>
                            {user.email}
                        </button>
                        {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-mono tracking-widest uppercase ${textSecondary}`}>ID: {user._id.slice(-6)}</span>
                        {user.role === 'admin' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded uppercase tracking-wider">Admin</span>
                        ) : (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${isDarkMode ? 'bg-[#222A38] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>User</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end sm:border-l pl-0 sm:pl-4 border-transparent sm:border-inherit" style={{borderColor: isDarkMode ? '#222A38' : '#e5e7eb'}}>
                {user.role !== 'admin' && (
                    <button 
                        onClick={() => handleToggleStatus(user._id, isActive)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${isActive ? 'bg-emerald-500' : (isDarkMode ? 'bg-[#222A38]' : 'bg-gray-300')}`}
                        title={isActive ? "Suspend" : "Activate"}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`}></div>
                    </button>
                )}
                
                <button 
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={user.role === 'admin'}
                    className={`p-2.5 rounded-xl transition-colors ${user.role === 'admin' ? 'opacity-20 cursor-not-allowed text-gray-500' : 'text-gray-400 hover:bg-red-500/10 hover:text-red-500'}`}
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    );
};
