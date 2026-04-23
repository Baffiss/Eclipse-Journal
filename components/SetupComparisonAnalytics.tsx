import React, { useMemo, useState } from 'react';
import { Strategy, Trade, StrategySetup } from '../types';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, PieChart, Pie } from 'recharts';
import { 
  ActivityIcon, 
  ZapIcon, 
  TargetIcon, 
  TrendingDownIcon, 
  BanknoteIcon, 
  BarChart3Icon, 
  EyeIcon, 
  EyeOffIcon,
  PieChartIcon,
  NewspaperIcon
} from '../components/Icons';

interface SetupComparisonAnalyticsProps {
  strategy: Strategy;
  trades: Trade[];
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

export const SetupComparisonAnalytics: React.FC<SetupComparisonAnalyticsProps> = ({ strategy, trades }) => {
  const { t, getCurrencySymbol } = useApp();
  const [hiddenSetups, setHiddenSetups] = useState<Set<string>>(new Set());
  const currencySymbol = getCurrencySymbol(undefined); // Depending on how active currency is handled, fallback to $

  const strategyTrades = useMemo(() => 
    trades.filter(t => t.strategyId === strategy.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  , [trades, strategy.id]);

  const setups = strategy.setups || [];

  const handleLegendClick = (data: any) => {
    const { value } = data;
    setHiddenSetups(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (hiddenSetups.size === setups.length) {
      setHiddenSetups(new Set());
    } else {
      setHiddenSetups(new Set(setups.map(s => s.name)));
    }
  };

  const allHidden = hiddenSetups.size === setups.length;

  const { profitCurveData, metricsData } = useMemo(() => {
    // Profit Curve Data
    const uniqueDates = new Set(strategyTrades.map(t => new Date(t.date).toLocaleDateString()));
    const dates = Array.from(uniqueDates).sort((a: string, b: string) => new Date(a).getTime() - new Date(b).getTime());
    
    const pcd = [];
    const initialPoint: any = { date: 'Initial' };
    setups.forEach(s => initialPoint[s.name] = 0);
    pcd.push(initialPoint);

    const setupCumulative: Record<string, number> = {};
    setups.forEach(s => setupCumulative[s.name] = 0);

    dates.forEach(d => {
      const point: any = { date: d };
      const tradesOnDate = strategyTrades.filter(t => new Date(t.date).toLocaleDateString() === d);
      tradesOnDate.forEach(t => {
        const setup = setups.find(s => s.id === t.setupId);
        if (setup) {
          setupCumulative[setup.name] += (parseFloat(String(t.result)) || 0);
        }
      });
      setups.forEach(s => {
        point[s.name] = setupCumulative[s.name];
      });
      pcd.push(point);
    });

    // Metrics calculation
    const metrics = setups.map((setup, index) => {
      const sTrades = strategyTrades.filter(t => t.setupId === setup.id);
      const totalPL = sTrades.reduce((sum, t) => sum + (parseFloat(String(t.result)) || 0), 0);
      const wins = sTrades.filter(t => (parseFloat(String(t.result)) || 0) > 0).length;
      const losses = sTrades.filter(t => (parseFloat(String(t.result)) || 0) < 0).length;
      const winRate = sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0;
      const expectancy = sTrades.length > 0 ? totalPL / sTrades.length : 0;
      
      let peak = 0; let current = 0; let maxDd = 0;
      sTrades.forEach(t => {
          current += parseFloat(String(t.result)) || 0;
          if(current > peak) peak = current;
          let dd = peak - current;
          if(dd > maxDd) maxDd = dd;
      });

      return {
        id: setup.id,
        name: setup.name,
        color: COLORS[index % COLORS.length],
        totalPL,
        winRate,
        wins,
        losses,
        expectancy,
        maxDrawdownAmount: maxDd,
        tradeCount: sTrades.length
      };
    });

    return { profitCurveData: pcd, metricsData: metrics };
  }, [strategyTrades, setups]);

  if (setups.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bkg/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-xs font-black uppercase">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </div>
              <span className={entry.value >= 0 ? 'text-success' : 'text-danger'}>
                {entry.value >= 0 ? '+' : ''}{currencySymbol}{Number(entry.value).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bkg/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">{data.name}</p>
          <div className="text-xl font-black uppercase">
            <span className={data.totalPL >= 0 ? 'text-success' : 'text-danger'}>
               {data.totalPL >= 0 ? '+' : ''}{currencySymbol}{Number(data.totalPL).toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] uppercase text-muted-foreground mt-2 font-black">{data.tradeCount} Trades</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 mt-12 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <BarChart3Icon className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight">Setup Comparison</h3>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Profit Curve Comparison */}
        <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 min-h-[480px] flex flex-col relative xl:col-span-2">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Cumulative Equity Curves</h3>
                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Compare cumulative performance of each setup over time</p>
             </div>
             <div className="flex items-center gap-3">
               <button 
                 onClick={toggleAll}
                 className="flex items-center gap-2 px-4 py-2 bg-muted/20 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/40 transition-all"
                 title={allHidden ? "Show All" : "Hide All"}
               >
                 {allHidden ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                 {allHidden ? "Show All" : "Hide All"}
               </button>
               <div className="p-3 bg-muted/20 rounded-2xl border border-border"><ActivityIcon className="w-5 h-5 text-primary" /></div>
             </div>
          </div>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitCurveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickMargin={15} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickMargin={15} tickFormatter={(value) => `${currencySymbol}${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  onClick={handleLegendClick}
                  wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, paddingTop: '20px', cursor: 'pointer' }} 
                />
                {setups.map((setup, index) => (
                  <Line 
                    key={setup.id} 
                    type="monotone" 
                    dataKey={setup.name} 
                    name={setup.name}
                    stroke={COLORS[index % COLORS.length]} 
                    hide={hiddenSetups.has(setup.name)}
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6, fill: COLORS[index % COLORS.length], stroke: 'var(--color-bkg)', strokeWidth: 3 }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Setup Metrics */}
        <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 flex flex-col relative xl:col-span-2">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Comparative Metrics</h3>
                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Win Rate, Expectancy, and Drawdown</p>
             </div>
             <div className="p-3 bg-muted/20 rounded-2xl border border-border"><TargetIcon className="w-5 h-5 text-primary" /></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {metricsData.map((metric, index) => (
              <div key={metric.id} className="bg-bkg/50 border border-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                  <h4 className="font-black uppercase tracking-tight text-sm flex-1">{metric.name}</h4>
                  <span className="text-[10px] font-black uppercase text-muted-foreground">{metric.tradeCount} Trades</span>
                </div>
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="flex flex-col gap-1 items-center">
                    <div className="w-16 h-16 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Wins', value: metric.wins || (metric.tradeCount === 0 ? 1 : 0), color: 'hsl(var(--success))' },
                              { name: 'Losses', value: metric.losses, color: 'hsl(var(--danger))' }
                            ]}
                            innerRadius={16}
                            outerRadius={24}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            cx="50%"
                            cy="50%"
                          >
                            <Cell fill="hsl(var(--success))" />
                            <Cell fill="hsl(var(--danger))" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Win Rate</span>
                    <span className="text-sm font-black uppercase">{metric.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col gap-1 text-center">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Expectancy</span>
                    <span className={`text-sm font-black uppercase ${metric.expectancy >= 0 ? 'text-success' : 'text-danger'}`}>
                      {metric.expectancy >= 0 ? '+' : ''}{currencySymbol}{metric.expectancy.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-center px-2">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">P&L</span>
                    <span className={`text-sm font-black uppercase ${metric.totalPL >= 0 ? 'text-success' : 'text-danger'}`}>
                      {metric.totalPL >= 0 ? '+' : ''}{currencySymbol}{metric.totalPL.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">Max Drop</span>
                    <span className="text-sm font-black uppercase text-danger">-{currencySymbol}{metric.maxDrawdownAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Distribution Pie Chart */}
        <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 min-h-[400px] flex flex-col relative xl:col-span-2">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Trade Distribution</h3>
                  <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Setup activity volume comparison</p>
                </div>
                <div className="p-3 bg-muted/20 rounded-2xl border border-border"><PieChartIcon className="w-5 h-5 text-primary" /></div>
              </div>
              <div className="space-y-3">
                {metricsData.sort((a, b) => b.tradeCount - a.tradeCount).map((metric, i) => (
                  <div key={metric.id} className="flex items-center justify-between p-4 bg-bkg/50 border border-border rounded-2xl group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: metric.color }} />
                      <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[120px]">{metric.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-muted-foreground uppercase">{((metric.tradeCount / (strategyTrades.length || 1)) * 100).toFixed(0)}%</span>
                      <span className="text-xs font-black min-w-[50px] text-right">{metric.tradeCount} {t('trades')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-full h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricsData}
                      dataKey="tradeCount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      stroke="none"
                      animationDuration={1500}
                    >
                      {metricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      itemStyle={{ color: 'hsl(var(--content))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black tracking-tighter">{strategyTrades.length}</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Trades</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* P&L Histogram */}
        <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-10 min-h-[300px] flex flex-col relative xl:col-span-2">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">P&L by Setup</h3>
                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Total Net Profit/Loss</p>
             </div>
             <div className="p-3 bg-muted/20 rounded-2xl border border-border"><BanknoteIcon className="w-5 h-5 text-primary" /></div>
          </div>
          <div className="flex-1 min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={metricsData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} opacity={0.5} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${Math.abs(value) >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                <Bar dataKey="totalPL" radius={[0, 4, 4, 0]} barSize={24}>
                  {metricsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.totalPL >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
