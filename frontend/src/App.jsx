import { useState, useEffect } from 'react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

// --- Components ---
import AuthPage from './AuthPage'
import Sidebar from './components/layout/Sidebar'
import MobileMenu from './components/layout/MobileMenu'
import AlertForm from './components/dashboard/AlertForm'
import AlertList from './components/dashboard/AlertList'
import NewsFeed from './components/news/NewsFeed'

// --- Modals ---
import ChartModal from './components/modals/ChartModal'
import ProfileModal from './components/modals/ProfileModal'
import AiModal from './components/modals/AiModal'

// --- AI Chat Feature ---
import ChatAssistant from './components/chat/ChatAssistant' // ✅ Imported

// --- Utils & Icons ---
import { API_URL, getThemeStyles } from './utils/helpers'
import { MenuIcon } from './components/common/Icons'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  
  // Dashboard States
  const [form, setForm] = useState({ symbol: '', target: '' })
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [indices, setIndices] = useState({ nifty: 0, sensex: 0 })
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  // UI States
  const [activeView, setActiveView] = useState('dashboard') 
  const [generalNews, setGeneralNews] = useState([])
  const [isNewsLoading, setIsNewsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Modal States
  const [chartData, setChartData] = useState([])
  const [isChartLoading, setIsChartLoading] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  // AI Analysis States
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [analyzedStockName, setAnalyzedStockName] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
    
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('stockTheme');
    return savedTheme === 'light' ? false : true;
  });

  const theme = getThemeStyles(isDarkMode);

  // --- Effects ---
  const logout = () => { localStorage.removeItem('token'); setToken(null); toast.success('See you soon!') }
  
  const toggleTheme = () => setIsDarkMode(!isDarkMode)

  useEffect(() => {
    localStorage.setItem('stockTheme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const fetchAlerts = async (isBackground = false) => {
    if (!token) return;
    if (!isBackground) setIsInitialLoading(true);
    try {
      const res = await axios.get(`${API_URL}/alerts`, { headers: { Authorization: `Bearer ${token}` } })
      setAlerts(res.data)
      if(res.data.length > 0 && res.data[0].email) {
        setUserEmail(res.data[0].email)
      }
    } catch (error) { if(error.response?.status === 401) logout(); }
    finally { if (!isBackground) setIsInitialLoading(false); }
  }

  const fetchIndices = async () => {
    try { const res = await axios.get(`${API_URL}/indices`); setIndices(res.data) } catch (error) {}
  }

  const fetchMarketNews = async () => {
    setIsNewsLoading(true);
    try {
        const res = await axios.get(`${API_URL}/market-news`);
        setGeneralNews(res.data);
    } catch (error) {
        toast.error("Failed to load news");
    }
    setIsNewsLoading(false);
  }

  useEffect(() => {
    if (token) {
        fetchAlerts(); fetchIndices();
        const interval = setInterval(() => { fetchAlerts(true); fetchIndices(); }, 5000)
        return () => clearInterval(interval)
    }
  }, [token])

  useEffect(() => {
      if(activeView === 'news' && generalNews.length === 0) {
          fetchMarketNews();
      }
  }, [activeView])
  
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (form.symbol.length > 1) {
        setIsSearching(true)
        try {
          const res = await axios.get(`${API_URL}/search-stock?query=${form.symbol}`)
          setSuggestions(res.data)
          if(res.data.length > 0) setShowSuggestions(true)
          else setShowSuggestions(false)
        } catch (err) {}
        setIsSearching(false)
      } else { setSuggestions([]); setShowSuggestions(false) }
    }, 300)
    return () => clearTimeout(delay)
  }, [form.symbol])

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const tId = toast.loading('Adding...')
    try {
      const url = `${API_URL}/add-alert?symbol=${form.symbol}&target=${form.target}`
      await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success(`Added ${form.symbol}`, { id: tId })
      setForm({ symbol: '', target: '' })
      fetchAlerts(true) 
    } catch (error) { toast.error('Failed', { id: tId }) }
    setLoading(false)
  }
  
  const handleDelete = async (id) => {
    const tId = toast.loading("Removing...")
    try { 
        await axios.delete(`${API_URL}/alert/${id}`, { headers: { Authorization: `Bearer ${token}` } }); 
        setAlerts(prev => prev.filter(a => a._id !== id))
        toast.success('Removed', { id: tId }) 
    } catch (error) { toast.error("Failed", { id: tId }) }
  }

  const openChart = async (symbol) => {
    setSelectedStock(symbol); 
    setIsChartLoading(true); 
    setChartData([]);
    try { 
        const res = await axios.get(`${API_URL}/stock-history/${symbol}`); 
        setChartData(res.data);
    } catch (error) { console.error(error); }
    setIsChartLoading(false)
  }

  const handleAnalyze = async (symbol) => {
    setAnalyzedStockName(symbol);
    setAiAnalysisResult(null); 
    setIsAiLoading(true);
    const tId = toast.loading(`AI is analyzing ${symbol}...`);
    try {
        const res = await axios.get(`${API_URL}/analyze-stock/${symbol}`);
        setAiAnalysisResult(res.data.analysis);
        toast.success("Analysis Ready!", { id: tId });
    } catch (error) {
        console.error(error);
        toast.error("AI is currently busy.", { id: tId });
        setAnalyzedStockName(null);
    } finally {
        setIsAiLoading(false);
    }
  }

  const getAvatarLetter = () => {
    return userEmail ? userEmail.charAt(0).toUpperCase() : 'U';
  }

  // --- Main Render ---
  if (!token) return <AuthPage onLogin={() => setToken(localStorage.getItem('token'))} />

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      <Toaster position="bottom-right" toastOptions={{ style: { background: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#333', border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' } }} />

      <MobileMenu 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        theme={theme}
        isDarkMode={isDarkMode}
        setIsProfileOpen={setIsProfileOpen}
        userEmail={userEmail}
        getAvatarLetter={getAvatarLetter}
        indices={indices}
        activeView={activeView}
        setActiveView={setActiveView}
        toggleTheme={toggleTheme}
        logout={logout}
      />

      <div className="flex h-screen overflow-hidden">
        
        <Sidebar 
          theme={theme}
          isDarkMode={isDarkMode}
          activeView={activeView}
          setActiveView={setActiveView}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          userEmail={userEmail}
          logout={logout}
          toggleTheme={toggleTheme}
          indices={indices}
          getAvatarLetter={getAvatarLetter}
        />

        <main className={`flex-1 overflow-y-auto relative transition-colors duration-300 ${theme.bg}`}>
            
            <div className={`md:hidden sticky top-0 z-20 border-b px-4 py-4 flex justify-between items-center backdrop-blur-md ${isDarkMode ? 'bg-[#0B0F19]/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
                <span className={`text-lg font-bold ${theme.heading}`}>StockWatcher</span>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-1">
                    <MenuIcon />
                </button>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 lg:p-10 pb-24">
                {activeView === 'dashboard' ? (
                    <>
                         <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
                            {/* Stats Cards manually rendered here for simplicity, can be component */}
                            {[
                                {label: 'Total', val: alerts.length, color: isDarkMode ? 'text-white' : 'text-slate-900', bg: isDarkMode ? 'from-slate-800 to-slate-900 border-slate-700' : 'from-white to-slate-50 border-slate-200'},
                                {label: 'Active', val: alerts.filter(a => a.status !== 'triggered').length, color: 'text-indigo-500', bg: isDarkMode ? 'from-indigo-900/20 to-slate-900 border-indigo-500/20' : 'from-indigo-50 to-white border-indigo-100'},
                                {label: 'Hit', val: alerts.filter(a => a.status === 'triggered').length, color: 'text-red-500', bg: isDarkMode ? 'from-red-900/20 to-slate-900 border-red-500/20' : 'from-red-50 to-white border-red-100'}
                            ].map((s, i) => (
                                <div key={i} className={`p-3 md:p-5 bg-gradient-to-br border rounded-2xl flex flex-col justify-center items-center md:items-start text-center md:text-left ${s.bg}`}>
                                    <p className="text-[10px] md:text-xs font-bold opacity-50 uppercase tracking-wider">{s.label}</p>
                                    <p className={`text-xl md:text-3xl font-black mt-1 ${s.color}`}>{s.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-10 relative z-20">
                            <AlertForm 
                                form={form} setForm={setForm} handleSubmit={handleSubmit} 
                                loading={loading} suggestions={suggestions} 
                                showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
                                isSearching={isSearching} theme={theme} isDarkMode={isDarkMode}
                            />
                        </div>

                        <AlertList 
                            alerts={alerts} loading={loading} isInitialLoading={isInitialLoading}
                            handleDelete={handleDelete} openChart={openChart} handleAnalyze={handleAnalyze}
                            theme={theme} isDarkMode={isDarkMode}
                        />
                    </>
                ) : (
                    <NewsFeed 
                        generalNews={generalNews}
                        isNewsLoading={isNewsLoading}
                        fetchMarketNews={fetchMarketNews}
                        theme={theme}
                        isDarkMode={isDarkMode}
                    />
                )}
            </div>
        </main>
      </div>
      
      {/* --- Modals & Overlays --- */}
      <ChartModal 
        selectedStock={selectedStock} setSelectedStock={setSelectedStock}
        chartData={chartData} isChartLoading={isChartLoading}
        theme={theme} isDarkMode={isDarkMode}
      />
      
      <ProfileModal 
        isProfileOpen={isProfileOpen} setIsProfileOpen={setIsProfileOpen}
        userEmail={userEmail} getAvatarLetter={getAvatarLetter}
        logout={logout} theme={theme} isDarkMode={isDarkMode}
      />

      <AiModal 
        analyzedStockName={analyzedStockName} setAnalyzedStockName={setAnalyzedStockName}
        aiAnalysisResult={aiAnalysisResult} isAiLoading={isAiLoading}
        theme={theme} isDarkMode={isDarkMode}
      />

      {/* ✅ AI CHAT ASSISTANT (Floating) */}
      <ChatAssistant theme={theme} isDarkMode={isDarkMode} />

    </div>
  )
}

export default App
