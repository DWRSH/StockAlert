import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ✅ FIX 1: Receive 'currencySymbol' prop
const CustomTooltip = ({ active, payload, label, isDarkMode, currencySymbol }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'} border p-3 rounded-lg shadow-xl text-xs font-mono`}>
        <p className="opacity-70 mb-1">{label}</p>
        {/* ✅ FIX 2: Use dynamic currency symbol */}
        <p className="text-lg font-bold text-emerald-500">{currencySymbol}{payload[0].value}</p>
      </div>
    )
  }
  return null
};

export default function ChartModal({ selectedStock, setSelectedStock, chartData, isChartLoading, theme, isDarkMode }) {
    if (!selectedStock) return null;

    // ✅ FIX 3: Logic to determine Currency based on Symbol
    // India stocks usually have .NS or .BO suffix
    const currencySymbol = selectedStock.includes('.') ? '₹' : '$';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className={`w-full max-w-4xl rounded-3xl p-6 shadow-2xl relative border ${theme.card}`}>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className={`text-2xl font-bold ${theme.heading}`}>{selectedStock}</h2>
                        <p className="text-xs opacity-50 font-mono uppercase mt-1">Price History (30D)</p>
                    </div>
                    <button onClick={() => setSelectedStock(null)} className="absolute top-6 right-6 opacity-50 hover:opacity-100 transition">✕</button>
                </div>
                <div className="h-72 w-full" style={{ minHeight: '300px' }}>
                    {isChartLoading ? (
                        <div className="h-full flex items-center justify-center text-indigo-500 font-mono text-xs animate-pulse">LOADING DATA...</div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: theme.chartAxis }} dy={10} />
                                
                                {/* ✅ FIX 4: Y-Axis now uses dynamic symbol */}
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: theme.chartAxis }} 
                                    tickFormatter={(val)=>`${currencySymbol}${val}`} 
                                />
                                
                                {/* ✅ FIX 5: Pass symbol to Tooltip */}
                                <Tooltip 
                                    content={<CustomTooltip isDarkMode={isDarkMode} currencySymbol={currencySymbol} />} 
                                    cursor={{stroke: '#6366f1'}} 
                                />
                                
                                <Area type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} fill="url(#colorPrice)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center flex-col opacity-40">
                            <p className="text-sm font-bold">No Data Available</p>
                            <p className="text-xs">Market closed or data missing.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
