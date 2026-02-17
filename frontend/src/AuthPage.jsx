import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Ensure path is correct
import { API_URL } from './utils/helpers'; 

// --- ULTRA PREMIUM ICONS ---
const LogoIcon = () => (
  <svg className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const MailIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
const LockIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const ArrowLeft = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>;
const Spinner = () => <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default function AuthPage({ onLogin }) {
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 📦 OTP STATE (6 Digits)
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState(''); 

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setSuccessMsg("Email Verified! Login to continue.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get('error') === 'invalid_token') {
      setError("Invalid or Expired Link.");
    }
  }, []);

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const switchMode = (mode) => {
    setAuthMode(mode);
    clearMessages();
  };

  // --- 📦 OTP LOGIC ---
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1].focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, 6).split("");
    if (data.length === 6) { setOtp(data); otpRefs.current[5].focus(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      if (authMode === 'login') {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post(`${API_URL}/api/auth/token`, formData);
        localStorage.setItem('token', res.data.access_token);
        onLogin(); 
      } 
      else if (authMode === 'register') {
        const res = await axios.post(`${API_URL}/api/auth/register`, { email, password });
        switchMode('login');
        setSuccessMsg(res.data.msg || "Account created! Verify email.");
        setEmail(''); setPassword('');
      }
      else if (authMode === 'forgot') {
        await axios.post(`${API_URL}/api/auth/forgot-password?email=${email}`);
        setSuccessMsg(`OTP sent to ${email}`);
        setAuthMode('reset'); 
      }
      else if (authMode === 'reset') {
        const finalOtp = otp.join(""); 
        if(finalOtp.length !== 6) throw new Error("Enter full 6-digit OTP");
        await axios.post(`${API_URL}/api/auth/reset-password`, { email, otp: finalOtp, new_password: newPassword });
        setSuccessMsg("Reset Successful! Please Login.");
        setAuthMode('login'); 
        setPassword(''); setOtp(new Array(6).fill("")); setNewPassword('');
      }
    } catch (err) {
      setError(err.message === "Enter full 6-digit OTP" ? err.message : (err.response?.data?.detail || "Server Error."));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* 🌌 AURORA BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] opacity-40 animate-pulse" />
         <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-[#020617]" />
         {/* Grid Texture */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.1]" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-[420px] px-6"
      >
        {/* 💎 BLACK GLASS CARD */}
        <div className="bg-[#0f172a]/40 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5">
          
          {/* Header */}
          <div className="pt-10 pb-6 text-center">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_-5px_rgba(99,102,241,0.6)] mb-6 border border-white/10"
            >
              <LogoIcon />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
              Stock<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Watcher</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">
              {authMode === 'login' && "Market Intelligence Awaits"}
              {authMode === 'register' && "Smart Stock Monitoring System"}
              {authMode === 'forgot' && "Recover Account Access"}
              {authMode === 'reset' && "Secure Your Vault"}
            </p>
          </div>

          <div className="px-8 pb-10">
            {/* 3D Segmented Control */}
            {(authMode === 'login' || authMode === 'register') && (
              <div className="flex p-1.5 bg-[#020617]/50 rounded-xl mb-8 border border-white/5 relative shadow-inner">
                 <motion.div 
                    className="absolute top-1.5 bottom-1.5 bg-[#1e293b] rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/5 z-0"
                    initial={false}
                    animate={{ left: authMode === 'login' ? '6px' : '50%', width: 'calc(50% - 6px)' }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 />
                 <button onClick={() => switchMode('login')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all z-10 ${authMode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>Sign In</button>
                 <button onClick={() => switchMode('register')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all z-10 ${authMode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>Sign Up</button>
              </div>
            )}

            {/* Notification Area */}
            <AnimatePresence mode='wait'>
              {error && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden mb-6">
                  <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-200 text-xs font-semibold p-4 rounded-r-lg shadow-lg">
                    {error}
                  </div>
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="overflow-hidden mb-6">
                   <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-200 text-xs font-semibold p-4 rounded-r-lg shadow-lg">
                    {successMsg}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">Email Address</label>
                <div className="group relative">
                    <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <MailIcon />
                    </div>
                    <input 
                    type="email" required disabled={authMode === 'reset'} 
                    value={email} onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full bg-[#020617]/50 border border-slate-800 text-white text-sm rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-[#0f172a] transition-all placeholder:text-slate-600 font-medium"
                    placeholder="name@company.com"
                    />
                </div>
              </div>

              {/* Password Input */}
              {(authMode === 'login' || authMode === 'register') && (
                <div className="space-y-1.5">
                   {/* ✅ FIXED: Forgot Password moved to Top Right of Label */}
                   <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                        {authMode === 'login' && (
                            <button type="button" onClick={() => switchMode('forgot')} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                                Forgot?
                            </button>
                        )}
                   </div>
                   
                   <div className="group relative">
                      <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                         <LockIcon />
                      </div>
                      <input 
                         type="password" required 
                         value={password} onChange={(e)=>setPassword(e.target.value)} 
                         className="w-full bg-[#020617]/50 border border-slate-800 text-white text-sm rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-[#0f172a] transition-all placeholder:text-slate-600 font-medium"
                         placeholder="••••••••"
                      />
                   </div>
                </div>
              )}

              {/* 📦 OTP VAULT STYLE INPUTS */}
              {authMode === 'reset' && (
                <>
                    <div className="space-y-3">
                         <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Security Code</label>
                         <div className="flex justify-between gap-2">
                             {otp.map((digit, index) => (
                                 <motion.input
                                     key={index}
                                     whileFocus={{ scale: 1.05, y: -2 }}
                                     ref={el => otpRefs.current[index] = el}
                                     type="text"
                                     className="w-12 h-14 bg-[#020617] border border-slate-800 rounded-xl text-center text-xl font-bold text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] focus:outline-none transition-all caret-indigo-500"
                                     value={digit}
                                     onChange={(e) => handleOtpChange(e, index)}
                                     onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                     onPaste={handleOtpPaste}
                                     maxLength={1}
                                 />
                             ))}
                         </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                        <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-wider">New Password</label>
                        <div className="group relative">
                            <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                            <LockIcon />
                            </div>
                            <input 
                                type="password" required 
                                value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} 
                                className="w-full bg-[#020617]/50 border border-slate-800 text-white text-sm rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-[#0f172a] transition-all placeholder:text-slate-600 font-medium"
                                placeholder="Set new password"
                            />
                        </div>
                    </div>
                </>
              )}

              {/* CTA Button */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_10px_30px_-10px_rgba(99,102,241,0.5)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide uppercase text-sm"
              >
                {loading ? <Spinner /> : (
                    <>
                        {authMode === 'login' && 'Access Dashboard'}
                        {authMode === 'register' && 'Create Account'}
                        {authMode === 'forgot' && 'Send Code'}
                        {authMode === 'reset' && 'Update Password'}
                    </>
                )}
              </motion.button>
              
              {(authMode === 'forgot' || authMode === 'reset') && (
                <button 
                  type="button" 
                  onClick={() => switchMode('login')} 
                  className="w-full text-center text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 mt-4 uppercase tracking-widest"
                >
                  <ArrowLeft /> Return to Login
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Footer Brand */}
        <div className="mt-8 text-center opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> Enterprise Security
           </p>
        </div>

      </motion.div>
    </div>
  );
}
