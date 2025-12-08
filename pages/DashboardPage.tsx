
import React, { useMemo, useEffect, useRef, useState, useCallback, memo } from 'react';
import { useApp } from '../context/AppContext';
import { 
    BarChart3Icon, TargetIcon, ActivityIcon, CalendarIcon, 
    FilterIcon, ChevronUpIcon, TrendingUpIcon, GlobeIcon, 
    EyeIcon, EditIcon, PlusIcon, TrashIcon, AlertTriangleIcon 
} from '../components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { calculateAccountStats } from '../services/analytics';
import { AccountStatus } from '../types';

// --- Constants ---
const AVAILABLE_CURRENCIES = [
    { code: 'USD', label: 'United States' },
    { code: 'EUR', label: 'Eurozone' },
    { code: 'GBP', label: 'United Kingdom' },
    { code: 'JPY', label: 'Japan' },
    { code: 'AUD', label: 'Australia' },
    { code: 'CAD', label: 'Canada' },
    { code: 'CHF', label: 'Switzerland' },
    { code: 'CNY', label: 'China' },
    { code: 'NZD', label: 'New Zealand' },
];

const IMPORTANCE_LEVELS = [
    { value: '0', label: 'High' },
    { value: '1', label: 'Medium' },
    { value: '2', label: 'Low' },
];

// --- Widget Wrappers ---
interface WidgetProps {
    src: string;
    config: any;
    className?: string;
    style?: React.CSSProperties;
}

const SimpleTradingViewWidget: React.FC<WidgetProps> = ({ src, config, className, style }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        containerRef.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        
        containerRef.current.appendChild(script);
        
        return () => {
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [src, JSON.stringify(config)]); 

    return (
        <div 
            ref={containerRef} 
            className={`tradingview-widget-container ${className || ''}`}
            style={{ width: '100%', height: '100%', ...style }}
        />
    );
};

// --- Watchlist Widget Component ---
const WatchlistWidget = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const [symbols, setSymbols] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('eclipse_watchlist');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSymbols(Array.isArray(parsed) ? parsed : ['FOREXCOM:SPXUSD', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD']);
            } catch(e) {
                setSymbols(['FOREXCOM:SPXUSD', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD']);
            }
        } else {
            setSymbols(['FOREXCOM:SPXUSD', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD']);
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem('eclipse_watchlist', JSON.stringify(symbols));
        }
    }, [symbols, isInitialized]);

    const addSymbol = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newSymbol && !symbols.includes(newSymbol)) {
            setSymbols([...symbols, newSymbol.trim()]);
            setNewSymbol('');
        }
    };

    const removeSymbol = (s: string) => {
        setSymbols(symbols.filter(sym => sym !== s));
    };

    const config = {
        "width": "100%",
        "height": "100%",
        "symbolsGroups": [
            {
                "name": "Watchlist",
                "symbols": symbols.map(s => ({ "name": s }))
            }
        ],
        "colorTheme": theme,
        "isTransparent": true,
        "locale": locale
    };

    // Dynamic height calculation
    const containerHeight = isEditing 
        ? Math.max(450, (symbols.length * 50) + 150) 
        : Math.max(400, (symbols.length * 50) + 80);

    return (
        <div 
            className="bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-[height] duration-300 ease-in-out"
            style={{ height: `${containerHeight}px` }}
        >
            <div className="flex justify-between items-center px-4 py-3 border-b border-border/50 bg-transparent flex-shrink-0">
                 <h2 className="text-lg font-semibold flex items-center gap-2">
                     <EyeIcon className="w-5 h-5 text-primary" />
                     Watchlist
                 </h2>
                 <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`p-1.5 rounded-md transition-colors ${isEditing ? 'bg-primary text-bkg' : 'hover:bg-muted text-muted-foreground'}`}
                    title="Edit Watchlist"
                 >
                    <EditIcon className="w-4 h-4" />
                 </button>
            </div>

            <div className="flex-grow overflow-hidden relative">
                {isEditing ? (
                    <div className="p-4 h-full flex flex-col">
                        <form onSubmit={addSymbol} className="flex gap-2 mb-4">
                            <input 
                                value={newSymbol} 
                                onChange={e => setNewSymbol(e.target.value)}
                                placeholder="Add symbol..."
                                className="flex-grow p-2 bg-muted border border-border rounded-md text-sm"
                            />
                            <button type="submit" className="p-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {symbols.map(s => (
                                <div key={s} className="flex justify-between items-center p-2 bg-muted/50 rounded-md group">
                                    <span className="text-sm font-medium">{s}</span>
                                    <button onClick={() => removeSymbol(s)} className="text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    symbols.length > 0 ? (
                        <SimpleTradingViewWidget 
                            key={JSON.stringify(config)} 
                            src="https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js" 
                            config={config} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
                            No symbols added.
                        </div>
                    )
                )}
            </div>
        </div>
    );
});

// --- Risk Monitor Widget ---
const RiskMonitorWidget: React.FC = () => {
    const { accounts, trades, t } = useApp();
    const activeAccounts = useMemo(() => accounts.filter(a => a.status === AccountStatus.ACTIVE), [accounts]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccounts[0]?.id || '');

    useEffect(() => {
        if (!selectedAccountId && activeAccounts.length > 0) {
            setSelectedAccountId(activeAccounts[0].id);
        }
    }, [activeAccounts, selectedAccountId]);

    const selectedAccount = activeAccounts.find(a => a.id === selectedAccountId);

    if (activeAccounts.length === 0) return null;

    const stats = selectedAccount ? calculateAccountStats(selectedAccount, trades) : null;

    return (
        <div className="bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5 text-primary" />
                    Risk Monitor
                </h2>
                {activeAccounts.length > 1 && (
                    <select 
                        value={selectedAccountId} 
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="text-xs bg-muted border-none rounded-md py-1 px-2 cursor-pointer focus:ring-1 focus:ring-primary"
                    >
                        {activeAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                )}
            </div>

            {stats && (
                <div className="space-y-4">
                    {/* Profit Target */}
                    <div>
                        <div className="flex justify-between items-end mb-1 text-sm">
                            <span className="font-medium text-muted-foreground">{t('profitTarget')}</span>
                            <span className="font-bold text-success">
                                {stats.profitProgress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-success h-full rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${stats.profitProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Drawdown Limit */}
                    <div>
                        <div className="flex justify-between items-end mb-1 text-sm">
                            <span className="font-medium text-muted-foreground">{t('drawdownLimit')}</span>
                            <span className="font-bold text-danger">
                                {stats.drawdownProgress.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-danger h-full rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${stats.drawdownProgress}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                            Used: {stats.currentDrawdownAmount.toLocaleString(undefined, {style: 'currency', currency: selectedAccount?.currency || 'USD'})}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---
const DashboardPage: React.FC = () => {
    const { trades, accounts, t, getCurrencySymbol, theme, language } = useApp();
    
    // Calendar Filter State
    const [showCalendarFilters, setShowCalendarFilters] = useState(false);
    const [calendarFilters, setCalendarFilters] = useState({
        currencies: AVAILABLE_CURRENCIES.map(c => c.code),
        importance: ['0', '1'] // High and Medium by default
    });

    const widgetTheme = theme === 'dark' ? 'dark' : 'light';
    const widgetLocale = language === 'es' ? 'es' : 'en';

    // Toggle logic for currencies
    const toggleCurrency = useCallback((code: string) => {
        setCalendarFilters(prev => {
            const exists = prev.currencies.includes(code);
            const newCurrencies = exists 
                ? prev.currencies.filter(c => c !== code)
                : [...prev.currencies, code];
            return { ...prev, currencies: newCurrencies };
        });
    }, []);

    // Toggle logic for importance
    const toggleImportance = useCallback((val: string) => {
        setCalendarFilters(prev => {
            const exists = prev.importance.includes(val);
            const newImportance = exists
                ? prev.importance.filter(v => v !== val)
                : [...prev.importance, val];
            return { ...prev, importance: newImportance };
        });
    }, []);

    const selectAllCurrencies = () => setCalendarFilters(prev => ({ ...prev, currencies: AVAILABLE_CURRENCIES.map(c => c.code) }));
    const deselectAllCurrencies = () => setCalendarFilters(prev => ({ ...prev, currencies: [] }));

    // Stats Calculation
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return t('goodMorning');
        if (hour < 18) return t('goodAfternoon');
        return t('goodEvening');
    }, [t]);

    const todayTrades = useMemo(() => {
        return trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return (
                tradeDate.getDate() === currentDate.getDate() &&
                tradeDate.getMonth() === currentDate.getMonth() &&
                tradeDate.getFullYear() === currentDate.getFullYear()
            );
        });
    }, [trades]);

    const stats = useMemo(() => {
        const totalTrades = todayTrades.length;
        const wins = todayTrades.filter(t => t.result > 0).length;
        const pnl = todayTrades.reduce((acc, curr) => acc + curr.result, 0);
        const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
        const longs = todayTrades.filter(t => t.direction === 'Buy').length;
        const shorts = todayTrades.filter(t => t.direction === 'Sell').length;
        return { totalTrades, wins, pnl, winRate, longs, shorts };
    }, [todayTrades]);

    // Prepare P&L Chart Data
    const pnlData = useMemo(() => {
        if (todayTrades.length === 0) return [];
        
        // Sort trades by date
        const sortedTrades = [...todayTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let cumulative = 0;
        const data = sortedTrades.map(trade => {
            cumulative += trade.result;
            return {
                time: new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                pnl: cumulative
            };
        });

        // Add a starting point at 0 if desired, but for daily view, just the trades is usually fine.
        // Or prepend a { time: 'Start', pnl: 0 } to show growth from zero.
        return [{ time: 'Start', pnl: 0 }, ...data];
    }, [todayTrades]);

    const defaultCurrency = getCurrencySymbol(accounts.length > 0 ? accounts[0]?.currency : undefined);
    const winRateData = [
        { name: t('wins'), value: stats.wins },
        { name: t('losses'), value: stats.totalTrades - stats.wins }
    ];

    return (
        <div className="animate-fade-in flex flex-col gap-6 pb-8 min-h-screen">
            
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    {greeting}
                </h1>
                <p className="text-muted-foreground mt-1">{formattedDate}</p>
            </div>

            {/* Main Grid: 3 columns on XL screens (Stats=2, Sidebar=1) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Left Column: Stats & Activity (Span 2) */}
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* P&L Card */}
                        <div className="bg-muted border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('todaysPnL')}</p>
                                    <h2 className={`text-3xl font-bold mt-2 ${stats.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {stats.pnl >= 0 ? '+' : ''}{defaultCurrency}{stats.pnl.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </h2>
                                </div>
                                <div className={`p-2 rounded-lg ${stats.pnl >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                    <ActivityIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Win Rate Card */}
                        <div className="bg-muted border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-center h-full">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('todaysWinRate')}</p>
                                    <h2 className="text-3xl font-bold mt-2 text-content">
                                        {stats.winRate.toFixed(0)}%
                                    </h2>
                                </div>
                                {/* Reduced radii and fixed size container to prevent overflow */}
                                <div className="h-20 w-20 relative flex-shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={winRateData} 
                                                dataKey="value" 
                                                innerRadius={18} 
                                                outerRadius={28} 
                                                paddingAngle={2}
                                                startAngle={90}
                                                endAngle={-270}
                                                stroke="none"
                                            >
                                                <Cell fill="hsl(var(--success))" />
                                                <Cell fill="hsl(var(--danger))" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Trades Count Card */}
                         <div className="bg-muted border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{t('tradesToday')}</p>
                                    <h2 className="text-3xl font-bold mt-2 text-content">
                                        {stats.totalTrades}
                                    </h2>
                                </div>
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <TargetIcon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-3">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                                    Longs: {stats.longs}
                                </span>
                                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20">
                                    Shorts: {stats.shorts}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Today's Activity List & P&L Chart */}
                    <div className="bg-bkg border border-border rounded-2xl shadow-sm overflow-hidden min-h-[300px]">
                        <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <BarChart3Icon className="w-5 h-5 text-primary"/>
                                {t('dailyOverview')}
                            </h3>
                            {todayTrades.length > 0 && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{todayTrades.length} trades</span>
                            )}
                        </div>
                        
                        {/* Daily P&L Chart Section */}
                        {todayTrades.length > 0 && (
                            <div className="h-64 p-4 border-b border-border">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={stats.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={stats.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                            formatter={(value: number) => [`${defaultCurrency}${value.toFixed(2)}`, 'Cumulative P&L']}
                                        />
                                        <ReferenceLine y={0} stroke="hsl(var(--content))" strokeDasharray="3 3" opacity={0.3} />
                                        <Area 
                                            type="monotone" 
                                            dataKey="pnl" 
                                            stroke={stats.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--danger))"} 
                                            fillOpacity={1} 
                                            fill="url(#colorPnl)" 
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="p-0">
                            {todayTrades.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {todayTrades.map(trade => {
                                        const account = accounts.find(a => a.id === trade.accountId);
                                        const sym = getCurrencySymbol(account?.currency);
                                        return (
                                            <div key={trade.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-1 h-10 rounded-full ${trade.result >= 0 ? 'bg-success' : 'bg-danger'}`}></div>
                                                    <div>
                                                        <p className="font-bold">{trade.asset}</p>
                                                        <div className="flex gap-2 items-center text-xs text-muted-foreground">
                                                            <span>{new Date(trade.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            <span>•</span>
                                                            <span className={`${trade.direction === 'Buy' ? 'text-blue-500' : 'text-orange-500'}`}>
                                                                {trade.direction === 'Buy' ? 'Long' : 'Short'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{account?.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${trade.result >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {trade.result >= 0 ? '+' : ''}{sym}{trade.result.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="p-12 text-center text-muted-foreground h-full flex items-center justify-center">
                                    <p>{t('noTradesToday')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right Column: Sidebar (Span 1) - Calendar + Watchlist */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    
                    {/* Risk Monitor Widget */}
                    <RiskMonitorWidget />
                    
                    {/* Economic Calendar with Filters */}
                    <div className="bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col min-h-[500px] overflow-hidden">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-border/50 bg-transparent flex-shrink-0">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                {t('economicCalendar')}
                            </h2>
                            <button 
                                onClick={() => setShowCalendarFilters(!showCalendarFilters)}
                                className={`p-1.5 rounded-md transition-all duration-200 ${showCalendarFilters ? 'bg-primary text-bkg shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                                title={showCalendarFilters ? "Close Filters" : "Filter Calendar"}
                            >
                                {showCalendarFilters ? <ChevronUpIcon className="w-4 h-4" /> : <FilterIcon className="w-4 h-4" />}
                            </button>
                        </div>

                         {/* Filters Dropdown */}
                         <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-bkg border-b border-border/50 flex-shrink-0 ${showCalendarFilters ? 'max-h-[600px] opacity-100 shadow-sm' : 'max-h-0 opacity-0'}`}>
                            <div className="p-4 space-y-4 overflow-y-auto max-h-[300px] scrollbar-thin">
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-wider">
                                        <TrendingUpIcon className="w-3 h-3" /> Impact
                                    </h3>
                                    <div className="flex gap-2">
                                        {IMPORTANCE_LEVELS.map(level => (
                                            <button 
                                                key={level.value}
                                                onClick={() => toggleImportance(level.value)}
                                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                                                    calendarFilters.importance.includes(level.value) 
                                                    ? 'bg-primary text-bkg border border-primary shadow-sm' 
                                                    : 'bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {level.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-wider">
                                            <GlobeIcon className="w-3 h-3" /> Currencies
                                        </h3>
                                        <div className="flex gap-2">
                                            <button onClick={selectAllCurrencies} className="text-[10px] text-primary hover:underline">All</button>
                                            <button onClick={deselectAllCurrencies} className="text-[10px] text-muted-foreground hover:underline">Clear</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {AVAILABLE_CURRENCIES.map(curr => {
                                            const isSelected = calendarFilters.currencies.includes(curr.code);
                                            return (
                                                <button 
                                                    key={curr.code} 
                                                    onClick={() => toggleCurrency(curr.code)}
                                                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                                                        isSelected 
                                                        ? 'bg-primary text-bkg border-primary shadow-sm' 
                                                        : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                   {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-bkg" />}
                                                   {curr.code}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow relative">
                            <SimpleTradingViewWidget 
                                src="https://s3.tradingview.com/external-embedding/embed-widget-events.js"
                                config={{
                                    "width": "100%",
                                    "height": "100%",
                                    "colorTheme": widgetTheme,
                                    "isTransparent": true,
                                    "locale": widgetLocale,
                                    "importanceFilter": calendarFilters.importance.join(","),
                                    "currencyFilter": calendarFilters.currencies.join(",")
                                }}
                            />
                        </div>
                    </div>

                    {/* Watchlist Widget - Stacked Below Calendar */}
                    <WatchlistWidget theme={widgetTheme} locale={widgetLocale} />

                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
