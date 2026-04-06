import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Legend } from 'recharts';
import { EquityDataPoint, Account, ValueType, DrawdownType } from '../../types';
import { useApp } from '../../context/AppContext';

interface EquityChartProps {
    data: EquityDataPoint[];
    currencySymbol?: string;
    account?: Account | null;
}

/**
 * EquityChart Component
 * 
 * Refactored to use ResizeObserver instead of Recharts' ResponsiveContainer.
 * This fixes a common bug where charts render blank in conditional views or 
 * flex containers because ResponsiveContainer fails to measure the stable 
 * size on mount.
 */
const EquityChart: React.FC<EquityChartProps> = ({ data, currencySymbol = '$', account }) => {
    const { theme } = useApp();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    
    // Use ResizeObserver to track the actual container size
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            
            // Get dimensions from the first entry
            const { width, height } = entries[0].contentRect;
            
            // Only update state if dimensions actually changed to prevent loops
            setDimensions(prev => {
                if (prev.width === width && prev.height === height) return prev;
                return { width, height };
            });
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

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
    
    // Memoize reference lines and drawdown type to optimize performance
    const { profitTargetLine, maxDrawdownLine, hasTrailingDrawdown } = useMemo(() => {
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
        return { profitTargetLine, maxDrawdownLine, hasTrailingDrawdown };
    }, [account]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full min-h-[300px] min-w-0 relative flex items-center justify-center overflow-hidden"
            id="equity-chart-container"
        >
            {/* Only render the chart when valid dimensions are available */}
            {dimensions.width > 0 && dimensions.height > 0 ? (
                <AreaChart 
                    width={dimensions.width} 
                    height={dimensions.height} 
                    data={data} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
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
                        />
                    )}
                </AreaChart>
            ) : (
                /* Fallback UI while measuring dimensions */
                <div className="flex flex-col items-center justify-center gap-3 opacity-20 animate-pulse">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Initializing Chart...</p>
                </div>
            )}
        </div>
    );
};

export default EquityChart;
