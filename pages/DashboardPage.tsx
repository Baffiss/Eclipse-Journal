
import React, { useMemo, useEffect, useRef, useState, memo } from 'react';
import { useApp } from '../context/AppContext';
import { 
    BarChart3Icon, TargetIcon, ActivityIcon, CalendarIcon, 
    EyeIcon, EditIcon, PlusIcon, TrashIcon, 
    ZapIcon,
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    TradesIcon,
    WalletIcon,
    TrendingDownIcon,
    InfoIcon
} from '../components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TradeDirection, Account } from '../types';
import { calculateAccountStats } from '../services/analytics';

interface WidgetProps {
    src: string;
    config: any;
    className?: string;
    style?: React.CSSProperties;
}

const SimpleTradingViewWidget: React.FC<WidgetProps> = ({ src, config, className, style }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const currentContainer = containerRef.current;
        if (!currentContainer) return;
        
        currentContainer.innerHTML = '';
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        currentContainer.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.async = true;
        try {
            script.innerHTML = JSON.stringify(config);
        } catch (e) {
            console.error("Failed to stringify TV config", e);
        }
        currentContainer.appendChild(script);

        return () => { 
            if (currentContainer) currentContainer.innerHTML = ''; 
        };
    }, [src, JSON.stringify(config)]); 

    return <div ref={containerRef} className={`tradingview-widget-container ${className || ''}`} style={{ width: '100%', height: '100%', ...style }} />;
};

const WatchlistWidget = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const [symbols, setSymbols] = useState<string[]>(['FOREXCOM:SPXUSD', 'NASDAQ:AAPL', 'BINANCE:BTCUSDT', 'FX:EURUSD']);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('eclipse_watchlist');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setSymbols(parsed);
            }
        } catch (e) {
            console.error("Failed to load watchlist", e);
        }
    }, []);

    const addSymbol = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newSymbol.trim().toUpperCase();
        if (trimmed && !symbols.includes(trimmed)) {
            const next = [...symbols, trimmed];
            setSymbols(next);
            localStorage.setItem('eclipse_watchlist', JSON.stringify(next));
            setNewSymbol('');
        }
    };

    const removeSymbol = (s: string) => {
        const next = symbols.filter(sym => sym !== s);
        setSymbols(next);
        localStorage.setItem('eclipse_watchlist', JSON.stringify(next));
    };

    const config = useMemo(() => ({
        "width": "100%",
        "height": "100%",
        "symbolsGroups": [{"name": "Watchlist", "symbols": symbols.map(s => ({"name": s}))}],
        "colorTheme": theme,
        "isTransparent": true,
        "locale": locale
    }), [symbols, theme, locale]);

    return (
        <div className="bg-muted/30 backdrop-blur-xl border border-border rounded-[2rem] flex flex-col h-[450px] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/50">
                 <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <EyeIcon className="w-4 h-4 text-primary" /> Watchlist
                 </h2>
                 <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-primary text-bkg' : 'hover:bg-muted text-muted-foreground'}`}>
                    <EditIcon className="w-4 h-4" />
                 </button>
            </div>
            <div className="flex-grow overflow-hidden relative">
                {isEditing ? (
                    <div className="p-6 h-full flex flex-col">
                        <form onSubmit={addSymbol} className="flex gap-2 mb-4">
                            <input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="Symbol..." className="flex-grow p-3 bg-bkg/50 border border-border rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-primary" />
                            <button type="submit" className="p-3 bg-primary text-bkg rounded-xl"><PlusIcon className="w-5 h-5" /></button>
                        </form>
                        <div className="flex-grow overflow-y-auto space-y-1">
                            {symbols.map(s => (
                                <div key={s} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl group transition-colors">
                                    <span className="text-sm font-black">{s}</span>
                                    <button onClick={() => removeSymbol(s)} className="text-danger opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <SimpleTradingViewWidget src="https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js" config={config} />
                )}
            </div>
        </div>
    );
});

const ProgressBar: React.FC<{ value: number; colorClass: string; }> = ({ value, colorClass }) => (
    <div className="w-full bg-muted/50 rounded-full h-2 shadow-inner">
        <div 
            className={`${colorClass} h-2 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]`} 
            style={{ width: `${Math.max(2, Math.min(value, 100))}%` }}
        />
    </div>
);

const RiskMonitorWidget: React.FC<{ account: Account }> = ({ account }) => {
    const { trades, getCurrencySymbol, t } = useApp();
    const stats = useMemo(() => calculateAccountStats(account, trades), [account, trades]);
    const currencySym = getCurrencySymbol(account.currency);

    return (
        <div className="bg-muted/30 backdrop-blur-xl border border-border rounded-[2.5rem] p-8 flex flex-col animate-slide-in-up">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <TargetIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">{t('progressToTarget')}</h3>
                </div>
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">{account.name}</span>
            </div>

            <div className="space-y-8">
                {/* Profit Target Progress */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('profitTarget')}</p>
                            <p className="text-xl font-black tracking-tighter">{currencySym}{stats.profitTargetValue.toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-black text-success">{stats.profitProgress.toFixed(1)}%</p>
                    </div>
                    <ProgressBar value={stats.profitProgress} colorClass="bg-success" />
                </div>

                {/* Drawdown Progress */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('drawdownLimit')}</p>
                            <p className="text-xl font-black tracking-tighter">{currencySym}{stats.drawdownLimitValue.toLocaleString()}</p>
                        </div>
                        <p className={`text-sm font-black ${stats.drawdownProgress > 80 ? 'text-danger' : 'text-muted-foreground'}`}>
                            {stats.drawdownProgress.toFixed(1)}%
                        </p>
                    </div>
                    <ProgressBar value={stats.drawdownProgress} colorClass={stats.drawdownProgress > 80 ? 'bg-danger' : 'bg-primary'} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Available DD</p>
                        <p className="text-lg font-black tracking-tight text-danger">
                            {currencySym}{(stats.drawdownLimitValue - stats.currentDrawdownAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Distance to Target</p>
                        <p className="text-lg font-black tracking-tight text-success">
                            {currencySym}{Math.max(0, stats.profitTargetValue - stats.currentProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { trades, accounts, t, getCurrencySymbol, theme, language, setPage, focusTrade } = useApp();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const widgetTheme = theme === 'dark' ? 'dark' : 'light';
    const axisColor = theme === 'dark' ? '#A1A1AA' : '#3F3F46';

    const selectedAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

    const filteredTodayTrades = useMemo(() => {
        const today = new Date().toDateString();
        return trades
            .filter(t => {
                if (!t.date) return false;
                if (selectedAccountId && t.accountId !== selectedAccountId) return false;
                return new Date(t.date).toDateString() === today;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [trades, selectedAccountId]);

    const stats = useMemo(() => {
        const pnl = filteredTodayTrades.reduce((acc, curr) => acc + (parseFloat(String(curr.result)) || 0), 0);
        const wins = filteredTodayTrades.filter(t => (parseFloat(String(t.result)) || 0) > 0).length;
        const losses = filteredTodayTrades.filter(t => (parseFloat(String(t.result)) || 0) <= 0).length;
        const winRate = filteredTodayTrades.length > 0 ? (wins / filteredTodayTrades.length) * 100 : 0;
        const longs = filteredTodayTrades.filter(t => t.direction === TradeDirection.BUY).length;
        const shorts = filteredTodayTrades.filter(t => t.direction === TradeDirection.SELL).length;

        return { pnl, winRate, count: filteredTodayTrades.length, wins, losses, longs, shorts };
    }, [filteredTodayTrades]);

    const winRatePieData = useMemo(() => [
        { name: 'Wins', value: stats.wins || (stats.count === 0 ? 1 : 0), color: 'hsl(var(--success))' },
        { name: 'Losses', value: stats.losses, color: 'hsl(var(--danger))' }
    ], [stats]);

    const pnlData = useMemo(() => {
        let cumulative = 0;
        const ascendingToday = [...filteredTodayTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const points = ascendingToday.map(t => {
            cumulative += (parseFloat(String(t.result)) || 0);
            const dateObj = new Date(t.date);
            return { 
                time: dateObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}), 
                pnl: cumulative 
            };
        });
        return [{time: '00:00', pnl: 0}, ...points];
    }, [filteredTodayTrades]);

    const handleTradeClick = (tradeId: string) => {
        focusTrade(tradeId);
        setPage('trades');
    };

    const defaultCurrency = getCurrencySymbol(selectedAccount?.currency || accounts[0]?.currency);

    return (
        <div className="animate-fade-in flex flex-col gap-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-muted/10 border border-border/50 rounded-[2.5rem] p-8">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter leading-tight uppercase">
                        {t('dashboard')}
                    </h1>
                    <p className="text-muted-foreground font-black flex items-center gap-2 mt-2">
                        <CalendarIcon className="w-4 h-4" /> {new Date().toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                
                {/* Account Selection Filter */}
                <div className="relative group min-w-[240px]">
                    <WalletIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <select 
                        value={selectedAccountId} 
                        onChange={e => setSelectedAccountId(e.target.value)} 
                        className="w-full pl-11 pr-4 py-3 bg-bkg border border-border rounded-2xl outline-none font-bold text-xs appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="">{t('allAccounts')}</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* PNL Card */}
                        <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8 relative overflow-hidden group min-h-[160px]">
                            <ActivityIcon className="absolute -right-6 -bottom-6 w-40 h-40 opacity-5 text-primary group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{t('todaysPnL')}</p>
                                <h2 className={`text-4xl font-black tracking-tighter ${stats.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {stats.pnl >= 0 ? '+' : ''}{defaultCurrency}{stats.pnl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </h2>
                            </div>
                        </div>

                        {/* Win Rate Card (Pie Chart) */}
                        <div className="bg-muted/30 border border-border rounded-[2.5rem] p-6 flex flex-row items-center gap-4 relative group min-h-[160px]">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">{t('todaysWinRate')}</p>
                                <h2 className="text-4xl font-black tracking-tighter">{stats.winRate.toFixed(0)}%</h2>
                                <div className="mt-2 flex gap-3 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-success flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-success"/>{stats.wins} W</span>
                                    <span className="text-danger flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-danger"/>{stats.losses} L</span>
                                </div>
                            </div>
                            <div className="w-24 h-24 relative flex-shrink-0">
                                {stats.count > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={winRatePieData}
                                                innerRadius={28}
                                                outerRadius={38}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                                cx="50%"
                                                cy="50%"
                                            >
                                                {winRatePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full rounded-full border-4 border-muted border-dashed flex items-center justify-center">
                                        <TargetIcon className="w-8 h-8 text-muted-foreground/20" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trades Today Card */}
                        <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">{t('tradesToday')}</p>
                                <h2 className="text-4xl font-black tracking-tighter">{stats.count}</h2>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <div className="flex-1 bg-success/10 rounded-2xl p-3 border border-success/30">
                                    <p className="text-[9px] font-black uppercase text-success mb-1 tracking-tighter">Longs</p>
                                    <p className="text-lg font-black text-success">{stats.longs}</p>
                                </div>
                                <div className="flex-1 bg-danger/10 rounded-2xl p-3 border border-danger/30">
                                    <p className="text-[9px] font-black uppercase text-danger mb-1 tracking-tighter">Shorts</p>
                                    <p className="text-lg font-black text-danger">{stats.shorts}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/20 border border-border rounded-[3rem] overflow-hidden">
                        <div className="px-8 py-6 border-b border-border/50 bg-muted/10 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <BarChart3Icon className="w-5 h-5 text-primary"/> Performance Curve
                            </h3>
                        </div>
                        <div className="h-80 p-8">
                            {filteredTodayTrades.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={pnlData}>
                                        <defs>
                                            <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="time" stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                        <YAxis stroke={axisColor} fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}
                                            formatter={(value: number) => [`${defaultCurrency}${value.toLocaleString()}`, 'P&L']}
                                        />
                                        <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fill="url(#colorPnl)" strokeWidth={4} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                                    <BarChart3Icon className="w-16 h-16 opacity-10" />
                                    <p className="font-bold text-sm uppercase tracking-widest">{t('noTradesToday')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Today's Trades History */}
                    <div className="bg-muted/20 border border-border rounded-[3rem] overflow-hidden">
                        <div className="px-8 py-6 border-b border-border/50 bg-muted/10 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <TradesIcon className="w-5 h-5 text-primary"/> {t('recentTrades')}
                            </h3>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredTodayTrades.length} {t('tradesToday')}</span>
                        </div>
                        <div className="p-4 overflow-x-auto">
                            {filteredTodayTrades.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredTodayTrades.map(trade => {
                                        const tradeAccount = accounts.find(a => a.id === trade.accountId);
                                        const currencySym = getCurrencySymbol(tradeAccount?.currency);
                                        const isWin = (parseFloat(String(trade.result)) || 0) > 0;
                                        const tradeTime = new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <div 
                                                key={trade.id} 
                                                onClick={() => handleTradeClick(trade.id)}
                                                className="group bg-bkg/50 hover:bg-muted/50 border border-border rounded-2xl p-5 flex flex-col animate-slide-in-up cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isWin ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                            {isWin ? <ArrowUpRightIcon className="w-5 h-5" /> : <ArrowDownRightIcon className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black uppercase tracking-tight">{trade.asset}</span>
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${trade.direction === TradeDirection.BUY ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'}`}>
                                                                    {trade.direction === TradeDirection.BUY ? 'Long' : 'Short'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                                                                {tradeAccount?.name || 'Unknown Account'} • {tradeTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-base font-black tracking-tighter ${isWin ? 'text-success' : 'text-danger'}`}>
                                                            {isWin ? '+' : ''}{currencySym}{trade.result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                            {trade.lotSize} Lots
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/30">
                                    <TradesIcon className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('noTradesToday')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8">
                    {/* Conditional Risk Monitor Rendering */}
                    {selectedAccount && <RiskMonitorWidget account={selectedAccount} />}

                    <WatchlistWidget theme={widgetTheme} locale={language === 'es' ? 'es' : 'en'} />
                    
                    <div className="bg-muted/30 border border-border rounded-[2rem] p-6 h-[400px] flex flex-col">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary" /> Economic Events
                        </h3>
                        <div className="flex-grow overflow-hidden rounded-2xl">
                             <SimpleTradingViewWidget 
                                src="https://s3.tradingview.com/external-embedding/embed-widget-events.js" 
                                config={{ "width": "100%", "height": "100%", "colorTheme": widgetTheme, "isTransparent": true, "locale": language }} 
                             />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
