import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { EquityDataPoint, Account, ValueType, DrawdownType } from '../../types';
import { useApp } from '../../context/AppContext';

interface EquityChartProps {
    data: EquityDataPoint[];
    currencySymbol?: string;
    account?: Account | null;
}

const EquityChart: React.FC<EquityChartProps> = ({ data, currencySymbol = '$', account }) => {
    const { theme } = useApp();
    const axisColor = theme === 'dark' ? '#52525B' : '#A1A1AA';
    const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000000) return `${currencySymbol}${(tickItem / 1000000).toFixed(1)}M`;
        if (tickItem >= 1000) return `${currencySymbol}${(tickItem / 1000).toFixed(0)}k`;
        return `${currencySymbol}${tickItem}`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bkg/95 backdrop-blur-md p-3 border border-border rounded-2xl shadow-2xl text-xs z-50 pointer-events-none">
                    <p className="font-black mb-2 uppercase tracking-widest text-muted-foreground">
                        {label === 'Initial' ? 'Account Start' : new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="space-y-1">
                        {payload.map((p: any) => (
                             <div key={p.name} className="flex justify-between gap-4 items-center">
                                <span className="font-bold text-muted-foreground">{p.name}:</span>
                                <span className="font-black" style={{ color: p.color }}>
                                    {currencySymbol}{p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </span>
                             </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };
    
    let profitTargetLine, maxDrawdownLine;
    const hasTrailingDrawdown = account?.drawdownType === DrawdownType.TRAILING;
    
    if (account) {
        if (account.profitTarget > 0) {
            const value = account.profitTargetType === ValueType.FIXED
                ? account.initialCapital + account.profitTarget
                : account.initialCapital * (1 + account.profitTarget / 100);
            profitTargetLine = <ReferenceLine y={value} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeWidth={1} />;
        }

        if (!hasTrailingDrawdown && account.drawdownValue > 0) {
            const value = account.drawdownValueType === ValueType.FIXED
                ? account.initialCapital - account.drawdownValue
                : account.initialCapital * (1 - account.drawdownValue / 100);
            maxDrawdownLine = <ReferenceLine y={value} stroke="hsl(var(--danger))" strokeDasharray="4 4" strokeWidth={1} />;
        }
    }

    return (
        <div className="w-full h-full min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%" debounce={1}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                        <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => str === 'Initial' ? 'Start' : new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        stroke={axisColor}
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis 
                        tickFormatter={formatYAxis} 
                        stroke={axisColor}
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} 
                        isAnimationActive={false}
                    />
                    <Legend 
                        verticalAlign="top" 
                        align="right" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} 
                    />
                    {profitTargetLine}
                    {maxDrawdownLine}
                    <Area 
                        type="monotone" 
                        name="Equity" 
                        dataKey="equity" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#equityGradient)" 
                        isAnimationActive={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                        connectNulls
                    />
                    {hasTrailingDrawdown && (
                        <Area 
                            type="stepAfter" 
                            name="Trailing DD" 
                            dataKey="trailingDrawdown" 
                            stroke="hsl(var(--danger))" 
                            strokeDasharray="4 4" 
                            strokeWidth={1.5} 
                            fill="none"
                            dot={false}
                            isAnimationActive={false}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EquityChart;