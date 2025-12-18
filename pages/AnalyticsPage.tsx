
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateAnalytics, calculateEquityCurve } from '../services/analytics';
import EquityChart from '../components/charts/EquityChart';
import { BarChart3Icon, TargetIcon, TrendingDownIcon, InfoIcon } from '../components/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LineChart, Line, PieChart, Pie } from 'recharts';
import { Trade } from '../types';

interface AnalyticsPageProps {
    isComponent?: boolean;
    defaultAccountId?: string;
    defaultStrategyId?: string;
}

const PIE_CHART_COLORS = ['#34d399', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative group flex items-center">
        <InfoIcon className="w-4 h-4 text-muted-foreground/70 cursor-help" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-bkg border border-border rounded-lg shadow-xl text-xs text-content z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {text}
        </div>
    </div>
);

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ isComponent = false, defaultAccountId = '', defaultStrategyId = '' }) => {
    const { trades, accounts, strategies, t, getCurrencySymbol, theme } = useApp();
    const [filterAccountId, setFilterAccountId] = useState(defaultAccountId);
    const [filterStrategyId, setFilterStrategyId] = useState(defaultStrategyId);

    const axisColor = theme === 'dark' ? '#A1A1AA' : '#71717A';

    const account = useMemo(() => accounts.find(a => a.id === filterAccountId), [accounts, filterAccountId]);
    
    const initialCapital = useMemo(() => {
        if (filterAccountId) {
            return account?.initialCapital ?? 0;
        }
        if (accounts.length > 0) {
            return accounts.reduce((sum, acc) => sum + acc.initialCapital, 0);
        }
        return 0;
    }, [accounts, filterAccountId, account]);

    const currencySymbol = getCurrencySymbol(account?.currency);

    const filteredTrades = useMemo(() => {
        if (!filterAccountId && !filterStrategyId) return trades;
        return trades.filter(trade => {
            const accountMatch = filterAccountId ? trade.accountId === filterAccountId : true;
            const strategyMatch = filterStrategyId ? trade.strategyId === filterStrategyId : true;
            return accountMatch && strategyMatch;
        });
    }, [trades, filterAccountId, filterStrategyId]);

    const stats = useMemo(() => calculateAnalytics(filteredTrades, initialCapital), [filteredTrades, initialCapital]);
    const equityCurve = useMemo(() => calculateEquityCurve(filteredTrades, initialCapital, account), [filteredTrades, initialCapital, account]);

    const profitCurveData = useMemo(() => {
        let cumulativeProfit = 0;
        return filteredTrades
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((trade, index) => {
                cumulativeProfit += trade.result;
                return { name: index + 1, profit: cumulativeProfit };
            });
    }, [filteredTrades]);

    const winRateData = [
        { name: t('wins'), value: stats.totalWins },
        { name: t('losses'), value: stats.totalLosses }
    ];

    const profitableAssetsData = useMemo(() => 
        stats.assetPerformance.filter(a => a.profit > 0).map(a => ({ name: a.asset, value: a.profit }))
    , [stats.assetPerformance]);

    return (
        <div className="animate-fade-in print-bkg-white print-text-black">
            {!isComponent && (
                <div className="flex justify-between items-center mb-6 no-print">
                    <h1 className="text-3xl font-bold">{t('analytics')}</h1>
                </div>
            )}
            
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${isComponent ? 'hidden' : ''} no-print`}>
                <select value={filterAccountId} onChange={e => setFilterAccountId(e.target.value)} className="w-full p-2 bg-muted border border-border rounded-md">
                    <option value="">{t('allAccounts')}</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={filterStrategyId} onChange={e => setFilterStrategyId(e.target.value)} className="w-full p-2 bg-muted border border-border rounded-md">
                    <option value="">{t('allStrategies')}</option>
                    {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            
            {filteredTrades.length > 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{t('winRate')}</h3>
                                <InfoTooltip text={t('winRate_desc')} />
                            </div>
                            <ChartContainer height={300}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={winRateData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={5}>
                                            <Cell fill="hsl(var(--success))" stroke="none"/>
                                            <Cell fill="hsl(var(--danger))" stroke="none"/>
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value, name) => [value, name]} 
                                            contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                                            itemStyle={{ color: 'hsl(var(--content))' }} 
                                        />
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-content text-4xl font-bold">
                                            {`${stats.winRate.toFixed(1)}%`}
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <StatCard label={t('totalProfit')} value={`${currencySymbol}${stats.totalProfit.toFixed(2)}`} color={stats.totalProfit >= 0 ? 'success' : 'danger'} icon={<BarChart3Icon />} tooltipText={t('totalProfit_desc')} />
                            <StatCard label={t('totalTrades')} value={stats.totalTrades} icon={<InfoIcon/>} tooltipText={t('totalTrades_desc')} />
                            <StatCard label={t('profitFactor')} value={stats.profitFactor?.toFixed(2) || 'N/A'} icon={<InfoIcon />} tooltipText={t('profitFactor_desc')} />
                             <StatCard 
                                label={t('avgWinLoss')} 
                                value={<span><span className="text-success">{currencySymbol}{stats.averageWin.toFixed(2)}</span> / <span className="text-danger">{currencySymbol}{stats.averageLoss.toFixed(2)}</span></span>} 
                                icon={<InfoIcon />} 
                                tooltipText={t('avgWinLoss_desc')}
                            />
                            <StatCard label={t('expectedValue')} value={`${currencySymbol}${stats.expectedValue.toFixed(2)}`} color={stats.expectedValue >= 0 ? 'success' : 'danger'} icon={<InfoIcon />} tooltipText={t('expectedValue_desc')} />
                            <StatCard label={t('maxDrawdown')} value={`${stats.maxDrawdown.toFixed(2)}%`} color={stats.maxDrawdown > 15 ? 'danger' : 'success'} icon={<TrendingDownIcon />} tooltipText={t('maxDrawdown_desc')} />
                        </div>
                    </div>
                    
                    <div className="h-96">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{t('equityCurve')}</h3>
                            <InfoTooltip text={t('equityCurve_desc')} />
                        </div>
                        <EquityChart data={equityCurve} currencySymbol={currencySymbol} account={account}/>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-96">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{t('totalProfitCurve')}</h3>
                                <InfoTooltip text={t('totalProfitCurve_desc')} />
                            </div>
                            <ChartContainer>
                                <LineChart data={profitCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: "Trade Number", position: "insideBottom", offset: -5, fill: axisColor }} />
                                    <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `${currencySymbol}${val}`}/>
                                    <Tooltip 
                                        formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} 
                                        contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                                        itemStyle={{ color: 'hsl(var(--content))' }}
                                    />
                                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ChartContainer>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                 <h3 className="text-lg font-semibold">{t('performanceByAsset')}</h3>
                                 <InfoTooltip text={t('performanceByAsset_desc')} />
                            </div>
                             <ChartContainer height={384}>
                                {profitableAssetsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={profitableAssetsData} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                outerRadius="75%" 
                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                                                    const RADIAN = Math.PI / 180;
                                                    const radius = outerRadius * 1.3;
                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                  
                                                    return (
                                                      <text 
                                                        x={x} 
                                                        y={y} 
                                                        fill="hsl(var(--content))" 
                                                        textAnchor={x > cx ? 'start' : 'end'} 
                                                        dominantBaseline="central"
                                                        fontSize={12}
                                                        fontWeight="500"
                                                      >
                                                        {`${name} (${(percent * 100).toFixed(0)}%)`}
                                                      </text>
                                                    );
                                                  }}
                                            >
                                                {profitableAssetsData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} stroke="none" />)}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} 
                                                contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                                                itemStyle={{ color: 'hsl(var(--content))' }} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">{t('noProfitableAssets')}</div>
                                )}
                             </ChartContainer>
                        </div>
                    </div>
                    
                    <DistributionChart title={t('dailyDistribution')} tooltipText={t('dailyDistribution_desc')} data={stats.dailyDistribution} dataKey="day" valueKey="profit" currencySymbol={currencySymbol} axisColor={axisColor} />
                    <DistributionChart title={t('hourlyDistribution')} tooltipText={t('hourlyDistribution_desc')} data={stats.hourlyDistribution} dataKey="hour" valueKey="profit" currencySymbol={currencySymbol} axisColor={axisColor} />
                    
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{t('notableTrades')}</h3>
                            <InfoTooltip text={t('notableTrades_desc')} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NotableTradeCard trade={stats.maxWin} title={t('maxWin')} currencySymbol={currencySymbol} />
                            <NotableTradeCard trade={stats.maxLoss} title={t('maxLoss')} currencySymbol={currencySymbol} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
                    <h3 className="text-xl font-semibold">{t('notEnoughData')}</h3>
                    <p className="text-muted-foreground mt-2">{t('selectAccountOrStrategyForAnalytics')}</p>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; color?: 'success' | 'danger', icon: React.ReactElement<{ className?: string }>, tooltipText: string }> = ({ label, value, color, icon, tooltipText }) => {
    const colorClass = color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : '';
    return (
        <div className="bg-muted p-4 rounded-lg flex items-start gap-4 animate-slide-in-up">
            <div className="bg-bkg p-3 rounded-lg text-primary">
                {React.cloneElement(icon, { className: "w-6 h-6" })}
            </div>
            <div>
                 <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-medium">{label}</p>
                    <InfoTooltip text={tooltipText} />
                </div>
                <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
            </div>
        </div>
    );
};

const ChartContainer: React.FC<{children: React.ReactNode, height?: number}> = ({ children, height=384 }) => (
    <div style={{height: `${height}px`}} className="bg-muted/50 p-4 rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
            {children}
        </ResponsiveContainer>
    </div>
);

const DistributionChart: React.FC<{title: string, tooltipText: string, data: any[], dataKey: string, valueKey: string, currencySymbol: string, axisColor: string}> = ({ title, tooltipText, data, dataKey, valueKey, currencySymbol, axisColor }) => (
    <div>
        <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <InfoTooltip text={tooltipText} />
        </div>
        <ChartContainer height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey={dataKey} stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${currencySymbol}${val}`} />
                <Tooltip 
                    formatter={(value: number) => `${currencySymbol}${value.toFixed(2)}`} 
                    cursor={{fill: 'hsl(var(--border))', opacity: 0.4}} 
                    contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} 
                    itemStyle={{ color: 'hsl(var(--content))' }}
                />
                <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry[valueKey] >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} />
                ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    </div>
);

const NotableTradeCard: React.FC<{trade: Trade | null, title: string, currencySymbol: string}> = ({ trade, title, currencySymbol }) => {
    if (!trade) return null;
    const isWin = trade.result > 0;
    return (
        <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <div className="flex justify-between items-center mt-1">
                <p className="font-bold text-lg">{trade.asset}</p>
                <p className={`text-xl font-bold ${isWin ? 'text-success' : 'text-danger'}`}>{currencySymbol}{trade.result.toFixed(2)}</p>
            </div>
             <p className="text-xs text-muted-foreground">{new Date(trade.date).toLocaleString()}</p>
        </div>
    )
}

export default AnalyticsPage;
