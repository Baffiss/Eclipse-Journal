export enum DrawdownType {
    MAXIMUM = 'Maximum',
    TRAILING = 'Trailing',
}

export enum ValueType {
    PERCENTAGE = 'Percentage',
    FIXED = 'Fixed',
}

export enum AccountStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum AccountType {
    EVAL = 'Evaluation',
    DEMO = 'Demo',
    REAL = 'Real',
    PA = 'Proprietary',
}

export enum Currency {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    JPY = 'JPY',
}

export interface Account {
    id: string;
    name: string;
    initialCapital: number;
    currency: Currency;
    currentCapital: number;
    profitTarget: number;
    profitTargetType: ValueType;
    drawdownType: DrawdownType;
    drawdownValue: number;
    drawdownValueType: ValueType;
    strategyId?: string;
    status: AccountStatus;
    accountType: AccountType;
    totalWithdrawn: number;
}

export interface Withdrawal {
    id: string;
    accountId: string;
    amount: number;
    date: string; // ISO string
}

export enum TradeDirection {
    BUY = 'Buy',
    SELL = 'Sell',
}

export interface Trade {
    id: string;
    accountId: string;
    strategyId?: string;
    date: string; // ISO string
    asset: string;
    direction: TradeDirection;
    lotSize: number;
    takeProfitPips: number;
    stopLossPips: number;
    result: number; // in $
    notes?: string;
    imageUrl?: string; // base64 data URL
    hour?: number; // 0-23
}

export interface StrategyImage {
    id: string;
    url: string;
    notes?: string;
}

export interface Strategy {
    id: string;
    name: string;
    description: string;
    images?: StrategyImage[];
    iconId?: string;
}

export interface TradePreset {
    id: string;
    name: string;
    strategyId?: string;
    asset: string;
    lotSize: number;
    takeProfitPips: number;
    stopLossPips: number;
}

export interface AnalyticsStats {
    totalTrades: number;
    winRate: number;
    profitFactor: number | null;
    expectedValue: number;
    averageWin: number;
    averageLoss: number;
    payoffRatio: null | number;
    maxDrawdown: number;
    sharpeRatio: number | null;
    totalProfit: number;
    maxWin: Trade | null;
    maxLoss: Trade | null;
    dailyDistribution: { day: string; profit: number }[];
    hourlyDistribution: { hour: string; profit: number }[];
    assetPerformance: { asset: string; profit: number; trades: number }[];
    winLossDistribution: number[];
    totalWins: number;
    totalLosses: number;
}

export interface EquityDataPoint {
    date: string;
    equity: number;
    trailingDrawdown?: number;
}

// Fix: Added missing types for Spot Portfolio functionality
export type HoldingType = 'BUY' | 'SELL';
export type AssetCategory = 'CRYPTO' | 'STOCK' | 'FOREX';

export interface Holding {
    id: string;
    portfolioId: string;
    asset: string;
    category: AssetCategory;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    date: string; // ISO string
    type: HoldingType;
}

export interface Portfolio {
    id: string;
    name: string;
    iconId: string;
    description: string;
}