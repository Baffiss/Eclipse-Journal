
import { Trade, AnalyticsStats, EquityDataPoint, Account, DrawdownType, ValueType, Withdrawal } from '../types';

export const calculateAnalytics = (trades: Trade[], initialCapital: number, withdrawals: Withdrawal[] = []): AnalyticsStats => {
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
    
    const equityCurve = calculateEquityCurve(trades, initialCapital, null, withdrawals);
    const maxDrawdown = calculateMaxDrawdown(equityCurve);

    const returns = trades.map(t => t.result);
    const sharpeRatio = calculateSharpeRatio(returns);

    const maxWin = trades.length > 0 ? trades.reduce((max, t) => t.result > max.result ? t : max, trades[0]) : null;
    const maxLoss = trades.length > 0 ? trades.reduce((min, t) => t.result < min.result ? t : min, {...trades[0], result: 0}) : null;

    const dailyDistribution = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({ day, profit: 0 }));
    trades.forEach(t => {
        const localDate = new Date(t.date);
        const dayIndex = localDate.getDay();
        dailyDistribution[dayIndex].profit += t.result;
    });
    
    const hourlyDistribution = Array.from({length: 24}, (_, i) => ({ hour: i.toString().padStart(2, '0'), profit: 0 }));
    trades.forEach(t => {
        const localDate = new Date(t.date);
        const hour = t.hour ?? localDate.getHours();
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

export const calculateEquityCurve = (
    trades: Trade[], 
    initialCapital: number, 
    account: Account | null = null,
    withdrawals: Withdrawal[] = []
): EquityDataPoint[] => {
    // Combine events chronologically
    const events: { date: string, amount: number, type: 'trade' | 'withdrawal' }[] = [
        ...trades.map(t => ({ date: t.date, amount: t.result, type: 'trade' as const })),
        ...withdrawals.map(w => ({ date: w.date, amount: -w.amount, type: 'withdrawal' as const }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentBalance = initialCapital;
    let highWaterMark = initialCapital;

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

    const curve = events.map(event => {
        currentBalance += event.amount;
        
        // HWM logic (Peak is recalculated based on cumulative profit, ignoring withdrawal drops for HWM purposes in most firm rules)
        // But for visual trail, we usually track the peak relative to current balance
        if (currentBalance > highWaterMark) {
            highWaterMark = currentBalance;
        }

        const dataPoint: EquityDataPoint = {
            date: event.date,
            equity: currentBalance,
        };

        if (hasTrailingDrawdown) {
            dataPoint.trailingDrawdown = highWaterMark - trailingDrawdownLimit;
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
        if (peak > 0) { 
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
    return mean / stdDev;
};

export const calculateAccountStats = (account: Account, trades: Trade[]) => {
    const accountTrades = trades
        .filter(t => t.accountId === account.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let equity = account.initialCapital;
    let highWaterMark = account.initialCapital;

    for (const trade of accountTrades) {
        equity += trade.result;
        if (equity > highWaterMark) {
            highWaterMark = equity;
        }
    }

    const profitTargetValue = account.profitTargetType === ValueType.FIXED
        ? account.profitTarget
        : account.initialCapital * (account.profitTarget / 100);

    const currentProfit = (equity - account.initialCapital);
    const profitProgress = profitTargetValue > 0 
        ? Math.max(0, Math.min((currentProfit / profitTargetValue) * 100, 100))
        : 0;

    const drawdownLimitValue = account.drawdownValueType === ValueType.FIXED
        ? account.drawdownValue
        : account.initialCapital * (account.drawdownValue / 100);

    let currentDrawdownAmount = 0;
    const currentBalance = equity - (account.totalWithdrawn || 0);
    const peakBalance = highWaterMark - (account.totalWithdrawn || 0);

    if (account.drawdownType === DrawdownType.TRAILING) {
        currentDrawdownAmount = Math.max(0, peakBalance - currentBalance);
    } else {
        currentDrawdownAmount = Math.max(0, account.initialCapital - currentBalance);
    }

    const drawdownProgress = drawdownLimitValue > 0
        ? Math.max(0, Math.min((currentDrawdownAmount / drawdownLimitValue) * 100, 100))
        : 0;

    return {
        equity: currentBalance,
        highWaterMark: peakBalance,
        profitTargetValue,
        drawdownLimitValue,
        profitProgress,
        drawdownProgress,
        currentProfit,
        currentDrawdownAmount
    };
};
