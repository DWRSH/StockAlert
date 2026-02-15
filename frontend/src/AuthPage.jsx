import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Path same rakha hai
import { API_URL } from './utils/helpers'; 

// --- ICONS ---
const LogoIcon = () => <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const MailIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
const LockIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
const KeyIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.87-1.521-1.412-2.596-1.412A4.5 4.5 0 0 1 4.5 10.5a4.5 4.5 0 0 1 4.5 4.5c0 1.075.542 2.033 1.412 2.596a6 6 0 1 1 5.912-7.029Zm0 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
const CheckIcon = () => <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
const ArrowRight = () => <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
const ArrowLeft = () => <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>

export default function AuthPage({ onLogin }) {
  // Modes: 'login', 'register', 'forgot', 'reset'
  const [authMode, setAuthMode] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');           // For Reset
  const [newPassword, setNewPassword] = useState(''); // For Reset

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

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    clearMessages();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      // ==========================
      // 1. LOGIN
      // ==========================
      if (authMode === 'login') {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const res = await axios.post(`${API_URL}/api/auth/token`, formData);
        localStorage.setItem('token', res.data.access_token);
        onLogin(); 
      } 
      // ==========================
      // 2. REGISTER
      // ==========================
      else if (authMode === 'register') {
        const res = await axios.post(`${API_URL}/api/auth/register`, { email, password });
        switchMode('login');
        setSuccessMsg(res.data.msg || "Account Created! Check your email to verify.");
        setEmail(''); setPassword('');
      }
      // ==========================
      // 3. FORGOT PASSWORD (Send OTP)
      // ==========================
      else if (authMode === 'forgot') {
        const res = await axios.post(`${API_URL}/api/auth/forgot-password?email=${email}`);
        setSuccessMsg(`OTP sent to ${email}. Check inbox.`);
        setAuthMode('reset'); // Move to next step
      }
      // ==========================
      // 4. RESET PASSWORD (Verify OTP)
      // ==========================
      else if (authMode === 'reset') {
        await axios.post(`${API_URL}/api/auth/reset-password`, {
            email,
            otp,
            new_password: newPassword
        });
        setSuccessMsg("Password Reset Successful! Please Login.");
        setAuthMode('login'); // Back to login
        setPassword(''); setOtp(''); setNewPassword('');
      }

    } catch (err) {
      console.error("Auth Error:", err);
      if (err.response) {
        setError(err.response.data.detail || "Request Failed");
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
          
          {/* ✨ Sliding Tab Switcher (Visible only for Login/Register) */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex p-1.5 m-1.5 bg-black/20 rounded-2xl relative">
                <motion.div 
                    className="absolute top-1.5 bottom-1.5 bg-indigo-600 rounded-xl shadow-lg z-0"
                    initial={false}
                    animate={{ 
                        left: authMode === 'login' ? '6px' : '50%', 
                        width: 'calc(50% - 6px)' 
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                
                <button 
                onClick={() => switchMode('login')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${authMode === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                Sign In
                </button>
                <button 
                onClick={() => switchMode('register')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl relative z-10 transition-colors ${authMode === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                Sign Up
                </button>
            </div>
          )}

          {/* Header for Forgot/Reset Modes */}
          {(authMode === 'forgot' || authMode === 'reset') && (
             <div className="p-6 pb-0 flex items-center">
                <button onClick={() => switchMode('login')} className="text-slate-400 hover:text-white flex items-center text-sm font-semibold transition-colors">
                    <ArrowLeft /> Back to Login
                </button>
                <span className="ml-auto text-sm font-bold text-indigo-400 uppercase tracking-wider">
                    {authMode === 'forgot' ? 'Recovery' : 'Reset Password'}
                </span>
             </div>
          )}

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
              
              {/* EMAIL FIELD (Available in Login, Register, Forgot, Reset) */}
              <div className="group">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Email Address</label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><MailIcon /></div>
                  <input 
                    type="email" 
                    required 
                    // Reset mode mein email readonly rakho taaki user change na kare
                    disabled={authMode === 'reset'} 
                    value={email} 
                    onChange={(e)=>setEmail(e.target.value)} 
                    className="w-full py-4 pl-12 pr-4 bg-[#020617]/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50" 
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD (Login & Register Only) */}
              {(authMode === 'login' || authMode === 'register') && (
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
              )}

              {/* FORGOT PASSWORD LINK (Login Only) */}
              {authMode === 'login' && (
                <div className="flex justify-end -mt-2">
                    <button 
                        type="button" 
                        onClick={() => switchMode('forgot')}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>
              )}

              {/* RESET FIELDS (Reset Mode Only) */}
              {authMode === 'reset' && (
                <>
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Enter OTP</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><KeyIcon /></div>
                            <input 
                                type="text" 
                                required 
                                value={otp} 
                                onChange={(e)=>setOtp(e.target.value)} 
                                maxLength={6}
                                className="w-full py-4 pl-12 pr-4 bg-[#020617]/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium tracking-widest" 
                                placeholder="123456"
                            />
                        </div>
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">New Password</label>
                        <div className="relative flex items-center">
                            <div className="absolute left-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><LockIcon /></div>
                            <input 
                                type="password" 
                                required 
                                value={newPassword} 
                                onChange={(e)=>setNewPassword(e.target.value)} 
                                className="w-full py-4 pl-12 pr-4 bg-[#020617]/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium" 
                                placeholder="New Secure Password"
                            />
                        </div>
                    </div>
                </>
              )}

              {/* SUBMIT BUTTON */}
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
                      {authMode === 'login' && 'Access Dashboard'}
                      {authMode === 'register' && 'Create Account'}
                      {authMode === 'forgot' && 'Send Reset OTP'}
                      {authMode === 'reset' && 'Reset Password'}
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
