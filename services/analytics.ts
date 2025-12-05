
import { Trade, AnalyticsStats, EquityDataPoint, Account, DrawdownType, ValueType } from '../types';

export const calculateAnalytics = (trades: Trade[], initialCapital: number): AnalyticsStats => {
    const emptyStats: AnalyticsStats = {
        totalTrades: 0,
        winRate: 0,
        profitFactor: null,
        expectedValue: 0,
        averageWin: 0,
        averageLoss: 0,
        payoffRatio: null,
        maxDrawdown: 0,
        sharpeRatio: null,
        totalProfit: 0,
        maxWin: null,
        maxLoss: null,
        dailyDistribution: [],
        hourlyDistribution: [],
        assetPerformance: [],
        winLossDistribution: [],
        totalWins: 0,
        totalLosses: 0,
    };

    if (trades.length === 0) {
        return emptyStats;
    }

    const wins = trades.filter(t => t.result > 0);
    const losses = trades.filter(t => t.result < 0);
    const totalWins = wins.length;
    const totalLosses = losses.length;

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

    const grossProfit = wins.reduce((sum, t) => sum + t.result, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.result, 0));
    const totalProfit = grossProfit - grossLoss;

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

    const averageWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const averageLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    
    const payoffRatio = averageLoss > 0 ? averageWin / averageLoss : null;

    const expectedValue = ((winRate / 100) * averageWin) - (((100 - winRate) / 100) * averageLoss);
    
    const equityCurve = calculateEquityCurve(trades, initialCapital);
    const maxDrawdown = calculateMaxDrawdown(equityCurve);

    const returns = trades.map(t => t.result);
    const sharpeRatio = calculateSharpeRatio(returns);

    const maxWin = trades.length > 0 ? trades.reduce((max, t) => t.result > max.result ? t : max, trades[0]) : null;
    const maxLoss = trades.length > 0 ? trades.reduce((min, t) => t.result < min.result ? t : min, {...trades[0], result: 0}) : null;

    const dailyDistribution = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({ day, profit: 0 }));
    trades.forEach(t => {
        const localDate = new Date(t.date);
        const dayIndex = localDate.getDay(); // Use local day
        dailyDistribution[dayIndex].profit += t.result;
    });
    
    const hourlyDistribution = Array.from({length: 24}, (_, i) => ({ hour: i.toString().padStart(2, '0'), profit: 0 }));
    trades.forEach(t => {
        const localDate = new Date(t.date);
        const hour = t.hour ?? localDate.getHours(); // Use local hour
        if(hour >= 0 && hour < 24) {
            hourlyDistribution[hour].profit += t.result;
        }
    });

    const assetPerformanceMap = new Map<string, { profit: number, trades: number }>();
    trades.forEach(t => {
        const assetData = assetPerformanceMap.get(t.asset) || { profit: 0, trades: 0 };
        assetData.profit += t.result;
        assetData.trades += 1;
        assetPerformanceMap.set(t.asset, assetData);
    });
    const assetPerformance = Array.from(assetPerformanceMap.entries()).map(([asset, data]) => ({ asset, ...data })).sort((a,b) => b.profit - a.profit);
    
    const winLossDistribution = trades.map(t => t.result).sort((a,b) => a - b);

    return {
        totalTrades,
        winRate,
        profitFactor,
        expectedValue,
        averageWin,
        averageLoss,
        payoffRatio,
        maxDrawdown,
        sharpeRatio,
        totalProfit,
        maxWin,
        maxLoss,
        dailyDistribution,
        hourlyDistribution,
        assetPerformance,
        winLossDistribution,
        totalWins,
        totalLosses,
    };
};


export const calculateEquityCurve = (trades: Trade[], initialCapital: number, account?: Account | null): EquityDataPoint[] => {
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let cumulativeEquity = initialCapital;
    let highestEquity = initialCapital;

    const hasTrailingDrawdown = account && account.drawdownType === DrawdownType.TRAILING && account.drawdownValue > 0;
    
    const trailingDrawdownLimit = hasTrailingDrawdown
        ? account.drawdownValueType === ValueType.FIXED
            ? account.drawdownValue
            : account.initialCapital * (account.drawdownValue / 100)
        : 0;

    const initialPoint: EquityDataPoint = {
        date: 'Initial',
        equity: initialCapital,
    };

    if (hasTrailingDrawdown) {
        initialPoint.trailingDrawdown = initialCapital - trailingDrawdownLimit;
    }

    const curve = sortedTrades.map(trade => {
        cumulativeEquity += trade.result;
        const dataPoint: EquityDataPoint = {
            date: trade.date,
            equity: cumulativeEquity,
        };

        if (hasTrailingDrawdown) {
            highestEquity = Math.max(highestEquity, cumulativeEquity);
            dataPoint.trailingDrawdown = highestEquity - trailingDrawdownLimit;
        }

        return dataPoint;
    });

    return [initialPoint, ...curve];
};

export const calculateMaxDrawdown = (equityCurve: EquityDataPoint[]): number => {
    if (equityCurve.length < 2) return 0;

    let peak = -Infinity;
    let maxDd = 0;

    for (const point of equityCurve) {
        if (point.equity > peak) {
            peak = point.equity;
        }
        if (peak > 0) { // Avoid division by zero or negative peaks if account goes negative
            const drawdown = ((peak - point.equity) / peak) * 100;
            if (drawdown > maxDd) {
                maxDd = drawdown;
            }
        }
    }

    return maxDd;
};

const calculateSharpeRatio = (returns: number[]): number | null => {
    if (returns.length < 2) return null;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
        returns.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (returns.length - 1)
    );

    if (stdDev === 0) return null;

    // Assuming risk-free rate of 0
    return mean / stdDev;
};