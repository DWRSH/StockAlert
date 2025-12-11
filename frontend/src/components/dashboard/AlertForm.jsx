import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon } from '../common/Icons';

export default function AlertForm({ form, setForm, handleSubmit, loading, suggestions, showSuggestions, setShowSuggestions, isSearching, theme, isDarkMode }) {
  return (
    <div className={`border rounded-2xl p-2 shadow-lg flex flex-col md:flex-row gap-2 transition-colors duration-300 ${theme.card}`}>
        <div className="relative flex-1 group">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-indigo-500' : 'opacity-40'}`}>
                {isSearching ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin border-current"></div> : <SearchIcon />}
            </div>
            <input 
                type="text" 
                placeholder="Search stock (e.g. TATA)" 
                value={form.symbol}
                onChange={(e) => setForm({...form, symbol: e.target.value.toUpperCase()})}
                className={`w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 font-medium h-full ${theme.input}`} 
            />
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`absolute top-full left-0 w-full border rounded-xl mt-2 shadow-xl overflow-hidden z-50 ${theme.card}`}>
                        {suggestions.map((s, i) => (
                            <div key={i} onClick={() => {setForm({...form, symbol: s.symbol}); setShowSuggestions(false)}} className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 ${isDarkMode ? 'hover:bg-slate-800/50 border-slate-800' : 'hover:bg-slate-50 border-slate-100'}`}>
                                <span className="font-bold text-indigo-500">{s.symbol}</span>
                                <span className="text-xs opacity-50 truncate max-w-[150px]">{s.name}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        <div className={`w-px hidden md:block mx-2 my-2 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
        <div className={`h-px md:hidden mx-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
        <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 font-mono">₹</div>
            <input 
                type="number" 
                placeholder="Target Price" 
                value={form.target}
                onChange={(e) => setForm({...form, target: e.target.value})}
                className={`w-full bg-transparent border-none outline-none py-3 pl-10 pr-4 font-mono font-medium h-full ${theme.input}`}
            />
        </div>
        <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            {loading ? '...' : 'Add'}
        </button>
    </div>
  );
}