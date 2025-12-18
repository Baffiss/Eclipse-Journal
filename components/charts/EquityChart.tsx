
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { EquityDataPoint, Account, ValueType, DrawdownType } from '../../types';
import { useApp } from '../../context/AppContext';

interface EquityChartProps {
    data: EquityDataPoint[];
    currencySymbol?: string;
    account?: Account | null;
}

const EquityChart: React.FC<EquityChartProps> = ({ data, currencySymbol = '$', account }) => {
    const { theme } = useApp();
    const axisColor = theme === 'dark' ? '#A1A1AA' : '#71717A';

    const formatYAxis = (tickItem: number) => `${currencySymbol}${tickItem.toLocaleString()}`;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-bkg p-2 border border-border rounded-md shadow-lg text-sm text-content">
                    <p className="font-semibold mb-1">{`Date: ${label === 'Initial' ? 'Start' : new Date(label).toLocaleDateString()}`}</p>
                    {payload.map((p: any) => (
                         <p key={p.name} style={{ color: p.color }}>{`${p.name}: ${currencySymbol}${p.value.toLocaleString(undefined, {minimumFractionDigits: 2})}`}</p>
                    ))}
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
            profitTargetLine = <ReferenceLine y={value} label={{ value: "Target", position: "insideTopRight", fill: 'hsl(var(--success))' }} stroke="hsl(var(--success))" strokeDasharray="3 3" />;
        }

        if (!hasTrailingDrawdown && account.drawdownValue > 0) {
            const value = account.drawdownValueType === ValueType.FIXED
                ? account.initialCapital - account.drawdownValue
                : account.initialCapital * (1 - account.drawdownValue / 100);
            maxDrawdownLine = <ReferenceLine y={value} label={{ value: "Max DD", position: "insideBottomRight", fill: 'hsl(var(--danger))' }} stroke="hsl(var(--danger))" strokeDasharray="3 3" />;
        }
    }

    return (
        <div className="w-full h-full bg-muted/50 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => str === 'Initial' ? 'Start' : new Date(str).toLocaleDateString()}
                        stroke={axisColor}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        tickFormatter={formatYAxis} 
                        stroke={axisColor}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                        allowDataOverflow={true}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                    {profitTargetLine}
                    {maxDrawdownLine}
                    <Line type="monotone" name="Equity" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    {hasTrailingDrawdown && (
                        <Line 
                            type="stepAfter" 
                            name="Trailing DD" 
                            dataKey="trailingDrawdown" 
                            stroke="hsl(var(--danger))" 
                            strokeDasharray="5 5" 
                            strokeWidth={2} 
                            dot={false}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default EquityChart;
