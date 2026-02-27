import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/helpers';

// --- ✨ MINIMALIST ICONS ---
const TerminalIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BellIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const ZapIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
const TargetIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>;
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const RefreshIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const CopyIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;

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
            toast.error("Failed to fetch system data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(token) fetchAdminData();
    }, [token]);

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("CONFIRM DELETION: This action is irreversible.")) return;
        const tId = toast.loading("Executing deletion...");
        try {
            await axios.delete(`${API_URL}/api/admin/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(users.filter(u => u._id !== userId));
            toast.success("Record purged.", { id: tId });
        } catch (error) {
            toast.error("Deletion failed.", { id: tId });
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const updatedUsers = users.map(u => u._id === userId ? { ...u, is_active: !currentStatus } : u);
        setUsers(updatedUsers);
        try {
            await axios.patch(`${API_URL}/api/admin/user/${userId}/toggle-status`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(currentStatus ? "Access Revoked." : "Access Granted.");
        } catch (error) {
            setUsers(users); 
            toast.error("Command failed.");
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if(!broadcast.subject || !broadcast.message) return toast.error("Missing parameters.");
        if(!window.confirm(`Execute broadcast to ${stats.total_users} nodes?`)) return;

        setSending(true);
        const tId = toast.loading("Transmitting...");
        try {
            await axios.post(`${API_URL}/api/admin/broadcast`, broadcast, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Transmission complete.", { id: tId });
            setBroadcast({ subject: '', message: '' });
        } catch (error) {
            toast.error("Transmission failed.", { id: tId });
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

    // --- Enterprise Theme Colors ---
    const bgMain = isDarkMode ? 'bg-[#000000]' : 'bg-[#f4f4f5]';
    const bgCard = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-white';
    const borderMuted = isDarkMode ? 'border-[#262626]' : 'border-[#e4e4e7]';
    const borderHighlight = isDarkMode ? 'border-[#404040]' : 'border-[#d4d4d8]';
    const textMain = isDarkMode ? 'text-[#f5f5f5]' : 'text-[#171717]';
    const textMuted = isDarkMode ? 'text-[#a3a3a3]' : 'text-[#737373]';
    const accentColor = 'emerald-500';

    if (loading) return (
        <div className={`min-h-screen w-full flex items-center justify-center font-mono text-sm ${bgMain} ${textMuted}`}>
            [ INITIALIZING ADMIN WORKSPACE... ]
        </div>
    );

    return (
        <div className={`min-h-screen w-full font-sans ${bgMain} ${textMain} p-4 md:p-8 pb-24 md:pb-12`}>
            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                
                {/* 1. TOP HEADER - COMMAND CENTER */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className={`text-[10px] font-mono tracking-widest uppercase ${textMuted}`}>System Status: Optimal</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
                    </div>
                    <button 
                        onClick={fetchAdminData} 
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border ${borderMuted} ${bgCard} hover:${borderHighlight} transition-all`}
                    >
                        <RefreshIcon /> Sync Data
                    </button>
                </header>

                {/* 2. STATS STRIP (1-Pixel Grid) */}
                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-[1px] border ${borderMuted} rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#262626]' : 'bg-[#e4e4e7]'}`}>
                    <StatBlock title="TOTAL USERS" value={stats.total_users} icon={<UserIcon />} bgCard={bgCard} textMain={textMain} textMuted={textMuted} />
                    <StatBlock title="ALERTS SET" value={stats.total_alerts} icon={<BellIcon />} bgCard={bgCard} textMain={textMain} textMuted={textMuted} />
                    <StatBlock title="ACTIVE TRACKERS" value={stats.active_alerts} icon={<TargetIcon />} bgCard={bgCard} textMain={textMain} textMuted={textMuted} highlight />
                    <StatBlock title="TARGETS HIT" value={stats.triggered_alerts} icon={<ZapIcon />} bgCard={bgCard} textMain={textMain} textMuted={textMuted} />
                </div>

                {/* 3. MAIN SPLIT LAYOUT */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: SYSTEM BROADCAST */}
                    <div className={`lg:col-span-4 flex flex-col border ${borderMuted} rounded-lg overflow-hidden ${bgCard}`}>
                        <div className={`p-4 border-b ${borderMuted} flex items-center gap-2`}>
                            <TerminalIcon />
                            <h2 className="text-sm font-semibold uppercase tracking-wider">Execute Broadcast</h2>
                        </div>
                        
                        <form onSubmit={handleBroadcast} className="flex flex-col p-4 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>Subject / Header</label>
                                <input 
                                    type="text" 
                                    className={`w-full px-3 py-2 text-sm bg-transparent border ${borderMuted} rounded focus:border-emerald-500 outline-none transition-colors font-medium`}
                                    value={broadcast.subject}
                                    onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                                    placeholder="Enter subject line..."
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>Payload / Message</label>
                                <textarea 
                                    className={`w-full h-32 px-3 py-2 text-sm bg-transparent border ${borderMuted} rounded focus:border-emerald-500 outline-none transition-colors resize-none`}
                                    value={broadcast.message}
                                    onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                                    placeholder="Enter transmission payload..."
                                ></textarea>
                            </div>
                            
                            <button 
                                disabled={sending} type="submit"
                                className="mt-2 w-full py-2.5 text-xs font-mono uppercase tracking-widest font-bold bg-white text-black hover:bg-gray-200 dark:bg-white dark:text-black transition-colors rounded disabled:opacity-50"
                            >
                                {sending ? "[ TRANSMITTING... ]" : "[ DEPLOY MESSAGE ]"}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT PANEL: USER REGISTRY */}
                    <div className={`lg:col-span-8 flex flex-col border ${borderMuted} rounded-lg overflow-hidden ${bgCard} h-[600px]`}>
                        
                        {/* Table Header / Search */}
                        <div className={`p-4 border-b ${borderMuted} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                                User Registry <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isDarkMode ? 'bg-[#262626]' : 'bg-gray-100'}`}>{users.length} Nodes</span>
                            </h2>
                            
                            <div className={`flex items-center gap-2 px-3 py-1.5 border ${borderMuted} rounded-md focus-within:border-emerald-500 transition-colors w-full sm:w-64`}>
                                <span className={textMuted}><SearchIcon /></span>
                                <input 
                                    type="text" 
                                    className="bg-transparent outline-none text-xs w-full font-mono"
                                    placeholder="Query email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Ultra Minimal List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col w-full">
                                {/* Desktop Table Headers */}
                                <div className={`hidden md:grid grid-cols-12 gap-4 px-4 py-3 border-b ${borderMuted} text-[10px] font-mono uppercase tracking-widest ${textMuted} sticky top-0 ${bgCard} z-10`}>
                                    <div className="col-span-5">Identity</div>
                                    <div className="col-span-3">Unique ID</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-2 text-right">Execute</div>
                                </div>

                                {/* Rows */}
                                {filteredUsers.length === 0 ? (
                                    <div className={`p-8 text-center text-xs font-mono uppercase ${textMuted}`}>No records match query.</div>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <div key={user._id} className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 border-b ${borderMuted} items-center transition-colors hover:${isDarkMode ? 'bg-[#171717]' : 'bg-gray-50'}`}>
                                            
                                            {/* Email / Role */}
                                            <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                                                <div className={`shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500 text-white' : (isDarkMode ? 'bg-[#262626]' : 'bg-gray-200')}`}>
                                                    {user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <button 
                                                    onClick={() => copyToClipboard(user.email)}
                                                    className={`text-sm font-medium truncate flex items-center gap-2 hover:text-emerald-500 transition-colors`}
                                                >
                                                    {user.email}
                                                    {copiedEmail === user.email && <span className="text-emerald-500"><CheckIcon /></span>}
                                                </button>
                                            </div>

                                            {/* ID (Monospace) */}
                                            <div className={`col-span-3 text-xs font-mono hidden md:block ${textMuted}`}>
                                                {user._id}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="col-span-2 flex items-center gap-2">
                                                {user.role === 'admin' ? (
                                                    <span className="text-[10px] uppercase font-mono tracking-widest text-purple-500">ADMIN</span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleToggleStatus(user._id, user.is_active !== false)}
                                                        className={`flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded border transition-colors ${user.is_active !== false ? `border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20` : `border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20`}`}
                                                    >
                                                        {user.is_active !== false ? 'ACTIVE' : 'BANNED'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-2 flex justify-end">
                                                <button 
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    disabled={user.role === 'admin'}
                                                    className={`p-1.5 rounded transition-colors ${user.role === 'admin' ? 'opacity-20 cursor-not-allowed' : 'hover:bg-red-500/10 hover:text-red-500 text-gray-400'}`}
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? '#262626' : '#d4d4d8'}; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? '#404040' : '#a3a3a3'}; }
            `}</style>
        </div>
    );
}

// ---------------- SUB COMPONENTS ----------------

const StatBlock = ({ title, value, icon, bgCard, textMain, textMuted, highlight }) => (
    <div className={`p-4 sm:p-5 flex flex-col justify-between h-28 relative ${bgCard}`}>
        <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono tracking-widest uppercase ${highlight ? 'text-emerald-500' : textMuted}`}>
                {title}
            </span>
            <span className={highlight ? 'text-emerald-500' : textMuted}>
                {icon}
            </span>
        </div>
        <span className={`text-3xl tracking-tight font-semibold ${highlight ? 'text-emerald-500' : textMain}`}>
            {value}
        </span>
    </div>
);
