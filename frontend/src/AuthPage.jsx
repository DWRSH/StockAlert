import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ FIX: Path changed from '../utils/helpers' to './utils/helpers'
import { API_URL } from './utils/helpers'; 

// --- ICONS ---
const LogoIcon = () => <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const MailIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
const LockIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
const CheckIcon = () => <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
const ArrowRight = () => <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Check URL for Verification Success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setSuccessMsg("Email Verified Successfully! You can now login.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('error') === 'invalid_token') {
      setError("Invalid or Expired Verification Link.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // ==========================================
        // 🔒 LOGIN LOGIC
        // ==========================================
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        // ✅ API Path: /api/auth/token
        const res = await axios.post(`${API_URL}/api/auth/token`, formData);
        
        localStorage.setItem('token', res.data.access_token);
        onLogin(); 
      } else {
        // ==========================================
        // 📝 REGISTER LOGIC
        // ==========================================
        
        // ✅ API Path: /api/auth/register
        const res = await axios.post(`${API_URL}/api/auth/register`, { email, password });
        
        setIsLogin(true);
        setSuccessMsg(res.data.msg || "Account Created! Check your email to verify.");
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      if (err.response) {
        setError(err.response.data.detail || "Authentication Failed");
      } else {
        setError("Server Error. Is backend running?");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans text-slate-200 relative overflow-hidden">
      
      {/* 🎨 Animated Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} 
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px]" 
          />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20 }} animate={{ y: 0 }}
            className="inline-flex items-center justify-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl mb-5"
          >
            <LogoIcon />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">Stock<span className="text-indigo-500">Watcher</span></h1>
          <p className="text-slate-500 text-sm font-medium mt-2 tracking-wide uppercase">Real-time Market Intelligence</p>
        </div>

        <div className="bg-[#0f172a]/60 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden relative">
          
          {/* ✨ Sliding Tab Switcher */}
          <div className="flex p-1.5 m-1.5 bg-black/20 rounded-2xl relative">
            <motion.div 
                className="absolute top-1.5 bottom-1.5 bg-indigo-600 rounded-xl shadow-lg z-0"
                initial={false}
                animate={{ 
                    left: isLogin ? '6px' : '50%', 
                    width: 'calc(50% - 6px)' 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <button 
              onClick={() => {setIsLogin(true); setError(''); setSuccessMsg('')}}
              className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => {setIsLogin(false); setError(''); setSuccessMsg('')}}
              className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${!isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8 pt-6">
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                  <div className="text-red-500 mt-0.5">⚠️</div>
                  <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                  <CheckIcon />
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed">{successMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><MailIcon /></div>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full py-4 pl-12 pr-4 bg-[#020617]/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" 
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Password</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><LockIcon /></div>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e)=>setPassword(e.target.value)} 
                    className="w-full py-4 pl-12 pr-4 bg-[#020617]/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className={`w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        {isLogin ? 'Access Dashboard' : 'Create Account'}
                        <ArrowRight />
                    </>
                )}
              </motion.button>
            </form>
          </div>
          
          <div className="bg-slate-950/50 p-4 text-center border-t border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Protected by Enterprise Security
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
