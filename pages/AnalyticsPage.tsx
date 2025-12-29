
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateAnalytics, calculateEquityCurve } from '../services/analytics';
import EquityChart from '../components/charts/EquityChart';
import { 
    BarChart3Icon, TargetIcon, TrendingDownIcon, InfoIcon, 
    ActivityIcon, ZapIcon, ArrowUpRightIcon, ArrowDownRightIcon,
    CalendarIcon, LayoutGridIcon, PieChartIcon, TrendingUpIcon,
    BanknoteIcon
} from '../components/Icons';
import { 
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';

const PIE_CHART_COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group flex items-center z-50">
        <InfoIcon className="w-3.5 h-3.5 text-muted-foreground cursor-help transition-colors group-hover:text-primary" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-muted/95 backdrop-blur-md border border-border rounded-xl shadow-2xl text-[11px] font-black leading-relaxed text-content z-[100] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform translate-y-2 group-hover:translate-y-0 text-center">
            {text}
        </div>
    </div>
);

const DataTile: React.FC<{ 
    label: string; 
    value: React.ReactNode; 
    color?: 'success' | 'danger' | 'primary'; 
    icon: React.ReactNode; 
    trend?: string;
    description: string;
    extra?: React.ReactNode;
}> = ({ label, value, color, icon, trend, description, extra }) => {
    const colorMap = {
        success: 'text-success bg-success/15',
        danger: 'text-danger bg-danger/15',
        primary: 'text-primary bg-primary/15',
    };

    return (
        <div className="group relative bg-muted/20 backdrop-blur-xl border border-border rounded-[2rem] p-6 hover:border-primary/40 transition-all duration-300 min-h-[160px] flex flex-col justify-between">
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full ${color === 'success' ? 'bg-success' : color === 'danger' ? 'bg-danger' : 'bg-primary'}`} />
            
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${color ? colorMap[color] : 'bg-bkg text-muted-foreground border border-border'}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
                </div>
                <InfoTooltip text={description} />
            </div>

            <div className="relative z-10 flex justify-between items-end mt-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className={`text-2xl font-black tracking-tighter ${color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : 'text-content'}`}>
                            {value}
                        </h3>
                        {trend && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${trend.startsWith('+') ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {trend}
                            </span>
                        )}
                    </div>
                </div>
                {extra && <div className="ml-2">{extra}</div>}
            </div>
        </div>
    );
};

const AnalyticsPage: React.FC<{ isComponent?: boolean; defaultAccountId?: string; defaultStrategyId?: string }> = ({ 
    isComponent = false, 
    defaultAccountId = '', 
    defaultStrategyId = '' 
}) => {
    const { trades, accounts, strategies, t, getCurrencySymbol, theme } = useApp();
    const [filterAccountId, setFilterAccountId] = useState(defaultAccountId);
    const [filterStrategyId, setFilterStrategyId] = useState(defaultStrategyId);

    const axisColor = theme === 'dark' ? '#52525B' : '#3F3F46';
    const activeAccount = accounts.find(a => a.id === filterAccountId);
    const initialCapital = filterAccountId ? (activeAccount?.initialCapital ?? 0) : accounts.reduce((sum, acc) => sum + acc.initialCapital, 0);
    const currencySymbol = getCurrencySymbol(activeAccount?.currency);

    const filteredTrades = useMemo(() => {
        return trades.filter(t => 
            (filterAccountId ? t.accountId === filterAccountId : true) && 
            (filterStrategyId ? t.strategyId === filterStrategyId : true)
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [trades, filterAccountId, filterStrategyId]);

    const stats = useMemo(() => calculateAnalytics(filteredTrades, initialCapital), [filteredTrades, initialCapital]);
    const equityCurveData = useMemo(() => calculateEquityCurve(filteredTrades, initialCapital, activeAccount), [filteredTrades, initialCapital, activeAccount]);

    const totalProfitCurveData = useMemo(() => {
        let cumulative = 0;
        const points = filteredTrades.map(t => {
            cumulative += (parseFloat(String(t.result)) || 0);
            return {
                date: t.date,
                profit: cumulative
            };
        });
        return [{ date: 'Initial', profit: 0 }, ...points];
    }, [filteredTrades]);

    const winRatePieData = useMemo(() => [
        { name: 'Wins', value: stats.totalWins || (stats.totalTrades === 0 ? 1 : 0), color: 'hsl(var(--success))' },
        { name: 'Losses', value: stats.totalLosses, color: 'hsl(var(--danger))' }
    ], [stats]);

    if (filteredTrades.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-muted/10 border-2 border-dashed border-border rounded-[3rem] animate-fade-in">
                <BarChart3Icon className="w-20 h-20 text-muted-foreground/10 mb-6" />
                <h3 className="text-2xl font-black tracking-tight">{t('notEnoughData')}</h3>
                <p className="text-muted-foreground font-black mt-2 max-w-sm text-center">{t('selectAccountOrStrategyForAnalytics')}</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col gap-8 pb-20">
            {/* Premium Header Control Bar */}
            {!isComponent && (
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-muted/30 backdrop-blur-xl border border-border rounded-[2.5rem] p-6 lg:p-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight leading-none uppercase">{t('analytics')}</h1>
                    </div>
                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <div className="relative group flex-1 lg:w-56">
                            <LayoutGridIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <select 
                                value={filterAccountId} 
                                onChange={e => setFilterAccountId(e.target.value)} 
                                className="w-full pl-11 pr-4 py-3 bg-bkg border border-border rounded-2xl outline-none font-bold text-xs appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">{t('allAccounts')}</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="relative group flex-1 lg:w-56">
                            <TargetIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <select 
                                value={filterStrategyId} 
                                onChange={e => setFilterStrategyId(e.target.value)} 
                                className="w-full pl-11 pr-4 py-3 bg-bkg border border-border rounded-2xl outline-none font-bold text-xs appearance-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                            >
                                <option value="">{t('allStrategies')}</option>
                                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Bento Stat Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                <DataTile 
                    label="Total P&L" 
                    value={`${currencySymbol}${stats.totalProfit.toLocaleString()}`} 
                    color={stats.totalProfit >= 0 ? 'success' : 'danger'} 
                    icon={<ZapIcon />} 
                    description={t('totalProfit_desc')}
                />
                <DataTile 
                    label="Win Rate" 
                    value={`${stats.winRate.toFixed(1)}%`} 
                    color="primary"
                    icon={<TargetIcon />} 
                    description={t('winRate_desc')}
                    extra={
                        <div className="w-20 h-20">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={winRatePieData}
                                        innerRadius={24}
                                        outerRadius={34}
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
                        </div>
                    }
                />
                <DataTile 
                    label="Profit Factor" 
                    value={stats.profitFactor?.toFixed(2) || '0.00'} 
                    color={Number(stats.profitFactor) > 1.5 ? 'success' : 'primary'}
                    icon={<ActivityIcon />} 
                    description={t('profitFactor_desc')}
                />
                <DataTile 
                    label="Avg. R:R" 
                    value={stats.payoffRatio ? `1:${stats.payoffRatio.toFixed(2)}` : 'N/A'} 
                    color="primary"
                    icon={<TrendingUpIcon />} 
                    description={t('payoffRatio_desc') || 'The realized risk to reward ratio.'}
                />
                <DataTile 
                    label="Expected Value" 
                    value={`${currencySymbol}${stats.expectedValue.toFixed(2)}`} 
                    color={stats.expectedValue >= 0 ? 'success' : 'danger'}
                    icon={<BanknoteIcon />} 
                    description={t('expectedValue_desc')}
                />
                <DataTile 
                    label="Max Drawdown" 
                    value={`${stats.maxDrawdown.toFixed(1)}%`} 
                    color="danger" 
                    icon={<TrendingDownIcon />} 
                    description={t('maxDrawdown_desc')}
                />
            </div>

            {/* Visualization Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Equity Curve */}
                <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 min-h-[480px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Equity Curve</h3>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-2xl border border-border">
                            <ActivityIcon className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <EquityChart data={equityCurveData} currencySymbol={currencySymbol} account={activeAccount} />
                    </div>
                </div>

                {/* Total Profit Curve */}
                <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 min-h-[480px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Total Profit Curve</h3>
                            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Cumulative Result Progression</p>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-2xl border border-border">
                            <TrendingUpIcon className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={totalProfitCurveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(str) => str === 'Initial' ? 'Start' : new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke={axisColor} 
                                    fontSize={10} 
                                    fontWeight="black"
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    stroke={axisColor} 
                                    fontSize={10} 
                                    fontWeight="black"
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(v) => `${v < 0 ? '-' : ''}${currencySymbol}${Math.abs(v) >= 1000 ? (Math.abs(v)/1000).toFixed(0) + 'k' : Math.abs(v)}`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))', fontSize: '12px', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Profit']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="profit" 
                                    stroke="hsl(var(--success))" 
                                    fill="url(#colorProfit)" 
                                    strokeWidth={3} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Tertiary Analysis Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Daily Flux Distribution */}
                <div className="bg-muted/30 border border-border rounded-[3rem] p-8 lg:p-10 flex flex-col xl:col-span-1">
                    <div className="mb-10">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-2">Daily Flux</h3>
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Profit/Loss distribution per day.</p>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyDistribution} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                                <XAxis dataKey="day" stroke={axisColor} fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                                <YAxis stroke={axisColor} fontSize={10} fontWeight="black" tickLine={false} axisLine={false} tickFormatter={(v) => `${v < 0 ? '-' : ''}${currencySymbol}${Math.abs(v)}`} />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '20px', padding: '12px' }}
                                    itemStyle={{ color: 'hsl(var(--content))', fontWeight: 'black', fontSize: '12px' }}
                                    labelStyle={{ display: 'none' }}
                                    formatter={(value: number) => [`${value >= 0 ? '+' : ''}${currencySymbol}${value.toLocaleString()}`, 'Net P/L']}
                                />
                                <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                                    {stats.dailyDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alpha Dominance (Assets) */}
                <div className="bg-muted/20 border border-border rounded-[3rem] p-10 flex flex-col md:flex-row gap-8 items-center xl:col-span-1">
                    <div className="flex-1">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-2">Alpha Dominance</h3>
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest mb-8">Identification of top performing assets.</p>
                        
                        <div className="space-y-4">
                            {stats.assetPerformance.slice(0, 3).map((asset, i) => (
                                <div key={asset.asset} className="flex justify-between items-center p-4 bg-bkg border border-border rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_CHART_COLORS[i] }} />
                                        <span className="text-sm font-black uppercase tracking-tight">{asset.asset}</span>
                                    </div>
                                    <span className="text-sm font-black text-success">+{currencySymbol}{asset.profit.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-full md:w-44 h-44 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats.assetPerformance.filter(a => a.profit > 0)} 
                                    dataKey="profit" 
                                    nameKey="asset" 
                                    innerRadius={45} 
                                    outerRadius={65} 
                                    paddingAngle={10}
                                    stroke="none"
                                    cx="50%"
                                    cy="50%"
                                >
                                    {stats.assetPerformance.map((_, i) => <Cell key={i} fill={PIE_CHART_COLORS[i % PIE_CHART_COLORS.length]} />)}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    itemStyle={{ color: 'hsl(var(--content))' }}
                                    formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Profit']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <PieChartIcon className="w-5 h-5 text-muted-foreground/50 mb-1" />
                        </div>
                    </div>
                </div>

                {/* Notable Trades */}
                <div className="space-y-6 xl:col-span-1">
                    <div className="group bg-success/10 border border-success/30 rounded-[2.5rem] p-8 hover:bg-success/15 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="p-3 bg-success/20 text-success rounded-2xl border border-success/30">
                                <ArrowUpRightIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-success">Peak Execution</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-3xl font-black tracking-tighter uppercase mb-1">{stats.maxWin?.asset}</h4>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{new Date(stats.maxWin?.date || '').toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-success">+{currencySymbol}{stats.maxWin?.result.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-danger/10 border border-danger/30 rounded-[2.5rem] p-8 hover:bg-danger/15 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="p-3 bg-danger/20 text-danger rounded-2xl border border-danger/30">
                                <ArrowDownRightIcon className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-danger">Bottom Out</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <h4 className="text-3xl font-black tracking-tighter uppercase mb-1">{stats.maxLoss?.asset}</h4>
                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{new Date(stats.maxLoss?.date || '').toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-danger">{currencySymbol}{stats.maxLoss?.result.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hourly Psychology Panel */}
            <div className="bg-muted/20 border border-border rounded-[3rem] p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tight uppercase">{t('hourlyDistribution')}</h3>
                    </div>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.hourlyDistribution} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                            <XAxis dataKey="hour" stroke={axisColor} fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <YAxis stroke={axisColor} fontSize={10} fontWeight="black" tickLine={false} axisLine={false} />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--primary))', opacity: 0.1 }}
                                contentStyle={{ backgroundColor: 'hsl(var(--bkg))', border: '1px solid hsl(var(--border))', borderRadius: '16px', fontWeight: 'bold' }}
                                itemStyle={{ color: 'hsl(var(--content))', fontWeight: 'black' }}
                                labelFormatter={(h) => `Time: ${h}:00`}
                            />
                            <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                                {stats.hourlyDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
