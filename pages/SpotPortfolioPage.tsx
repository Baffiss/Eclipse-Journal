import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Holding, Portfolio, HoldingType, AssetCategory } from '../types';
import Modal from '../components/Modal';
import { 
    PlusIcon, 
    EditIcon, 
    TrashIcon, 
    BriefcaseIcon, 
    PieChartIcon, 
    AlertTriangleIcon,
    ChevronLeftIcon,
    StrategyIcons,
    ActivityIcon,
    RefreshCwIcon,
    ClockIcon,
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    CpuIcon
} from '../components/Icons';
import { ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

const PIE_COLORS = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#2dd4bf'];

// --- Helpers & API ---

const getLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fetchPrices = async (ids: string[]) => {
    if (!ids || ids.length === 0) return {};
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`);
        if (!response.ok) throw new Error('Rate limit or network error');
        return await response.json();
    } catch (e) {
        console.error("CoinGecko Price fetch failed", e);
        return {};
    }
};

const fetchHistoricalPrice = async (id: string, date: string) => {
    if (!id || !date) return null;
    const [y, m, d] = date.split('-');
    const formattedDate = `${d}-${m}-${y}`;
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/history?date=${formattedDate}&localization=false`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.market_data?.current_price?.usd || null;
    } catch (e) {
        return null;
    }
};

const fetchHistory = async (id: string, days: number = 7) => {
    if (!id) return null;
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.prices; 
    } catch (e) {
        return null;
    }
};

const searchAssets = async (query: string) => {
    if (!query || query.length < 2) return [];
    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
        const data = await response.json();
        return data.coins ? data.coins.slice(0, 8) : [];
    } catch (e) {
        return [];
    }
};

// --- Sub-Components ---

const PortfolioForm: React.FC<{ isOpen: boolean; onClose: () => void; portfolio?: Portfolio | null }> = ({ isOpen, onClose, portfolio }) => {
    const { addPortfolio, updatePortfolio, t } = useApp();
    const getInitialState = () => ({
        name: portfolio?.name || '',
        iconId: portfolio?.iconId || 'briefcase',
        description: portfolio?.description || ''
    });
    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) setFormData(getInitialState());
    }, [isOpen, portfolio]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (portfolio) updatePortfolio({ ...portfolio, ...formData });
        else addPortfolio({ id: crypto.randomUUID(), ...formData });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={portfolio ? t('editPortfolio') : t('newPortfolio')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('portfolioName')}</label>
                    <input 
                        value={formData.name} 
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        className="w-full p-4 bg-muted border border-border rounded-xl font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="e.g. Long Term HODL" 
                        required 
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Portfolio Icon</label>
                    <div className="grid grid-cols-4 gap-2 bg-muted/40 p-3 rounded-2xl border border-border">
                        {Object.entries(StrategyIcons).map(([id, Icon]) => (
                            <button key={id} type="button" onClick={() => setFormData(p => ({ ...p, iconId: id }))}
                                className={`p-3 rounded-xl flex items-center justify-center transition-all ${formData.iconId === id ? 'bg-primary text-bkg shadow-lg scale-105' : 'bg-bkg border border-border text-muted-foreground hover:border-primary/40'}`}>
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <button type="button" onClick={onClose} className="px-8 py-3 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest">{t('cancel')}</button>
                    <button type="submit" className="px-10 py-3 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                        {portfolio ? t('update') : t('create')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const HoldingForm: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    portfolioId: string;
    holding?: Holding | null;
}> = ({ isOpen, onClose, portfolioId, holding }) => {
    const { addHolding, updateHolding, t } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [quantity, setQuantity] = useState(0);
    const [price, setPrice] = useState(0);
    const [totalUSD, setTotalUSD] = useState(0);
    const [date, setDate] = useState(getLocalDateString(new Date()));
    const [type, setType] = useState<HoldingType>('BUY');
    const [isUSDMode, setIsUSDMode] = useState(false);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (holding) {
                setPrice(holding.buyPrice);
                setQuantity(holding.quantity); 
                setTotalUSD(holding.buyPrice * holding.quantity); 
                setDate(holding.date.split('T')[0]);
                setType(holding.type); 
                setSelectedAsset({ id: holding.asset, name: (holding.asset || '').toUpperCase(), symbol: (holding.asset || '').slice(0,4) });
            } else {
                setPrice(0); setQuantity(0); setTotalUSD(0);
                setDate(getLocalDateString(new Date())); setType('BUY'); setSelectedAsset(null);
            }
        }
    }, [isOpen, holding]);

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        const res = await searchAssets(val); 
        setSearchResults(res);
    };

    const fetchPrice = async () => {
        if (!selectedAsset) return;
        setIsFetchingPrice(true);
        const p = await fetchHistoricalPrice(selectedAsset.id, date);
        if (p !== null) setPrice(p);
        setIsFetchingPrice(false);
    };

    useEffect(() => {
        if (isUSDMode) { if (price > 0 && totalUSD > 0) setQuantity(totalUSD / price); }
        else { if (price > 0 && quantity > 0) setTotalUSD(quantity * price); }
    }, [price, quantity, totalUSD, isUSDMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAsset) return;
        const data = { 
            id: holding?.id || crypto.randomUUID(), 
            portfolioId, 
            asset: selectedAsset.id, 
            category: 'CRYPTO' as AssetCategory, 
            quantity: Number(quantity), 
            buyPrice: Number(price), 
            currentPrice: 0, 
            date: new Date(`${date}T12:00:00`).toISOString(), 
            type 
        };
        if (holding) updateHolding(data); else addHolding(data);
        onClose(); setSelectedAsset(null); setSearchQuery('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={holding ? "Edit Transaction" : "New Transaction"}>
            <div className="space-y-6">
                {!selectedAsset ? (
                    <div className="animate-fade-in space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                            {t('searchCrypto')}
                        </label>
                        <div className="relative">
                            <input value={searchQuery} onChange={e => handleSearch(e.target.value)} className="w-full p-4 pl-12 bg-muted border border-border rounded-xl font-black uppercase outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. bitcoin, solana..." autoFocus />
                            <CpuIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-30" />
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                            {searchResults.map(coin => (<button key={coin.id} type="button" onClick={() => setSelectedAsset(coin)} className="flex items-center gap-4 p-3 bg-muted/50 border border-border rounded-xl text-left hover:border-primary/40 transition-colors"><img src={coin.thumb} alt="" className="w-6 h-6 rounded-full" /><div><p className="text-xs font-black uppercase">{coin.name}</p><p className="text-[9px] font-bold text-muted-foreground">{coin.symbol}</p></div></button>))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex justify-between items-center">
                           <div className="flex items-center gap-3">
                                {selectedAsset.thumb && <img src={selectedAsset.thumb} alt="" className="w-6 h-6 rounded-full" />}
                                <p className="text-sm font-black uppercase">{selectedAsset.name}</p>
                           </div>
                            {!holding && <button type="button" onClick={() => setSelectedAsset(null)} className="text-[10px] font-black uppercase text-danger">Change</button>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-black uppercase block mb-1">Date</label><div className="flex gap-2"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 p-3 bg-muted border border-border rounded-xl font-black text-xs" /><button type="button" onClick={fetchPrice} className="p-3 bg-primary/10 rounded-xl hover:bg-primary hover:text-bkg transition-all">{isFetchingPrice ? <RefreshCwIcon className="animate-spin w-4 h-4"/> : <ClockIcon className="w-4 h-4"/>}</button></div></div>
                            <div className="flex flex-col justify-end"><button type="button" onClick={() => setIsUSDMode(!isUSDMode)} className="text-[9px] font-black uppercase text-primary mb-1">Switch to {isUSDMode ? "Units" : "Total $"}</button>
                                <input type="number" step="any" value={isUSDMode ? totalUSD : quantity} onChange={e => isUSDMode ? setTotalUSD(parseFloat(e.target.value)) : setQuantity(parseFloat(e.target.value))} className="p-3 bg-muted border border-border rounded-xl font-black text-xs" />
                            </div>
                        </div>
                        <div><label className="text-[10px] font-black uppercase block mb-1">Entry Price ($)</label><input type="number" step="any" value={price} onChange={e => setPrice(parseFloat(e.target.value))} className="w-full p-3 bg-muted border border-border rounded-xl font-black text-xs" /></div>
                        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-6 py-2 bg-muted rounded-xl font-black text-[10px] uppercase">Cancel</button><button type="submit" className="px-8 py-2 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase">Save Holding</button></div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

const PortfolioDetailView: React.FC<{ portfolio: Portfolio; onBack: () => void }> = ({ portfolio, onBack }) => {
    const { holdings, deleteHolding, deletePortfolio, t, getCurrencySymbol } = useApp();
    const [livePrices, setLivePrices] = useState<Record<string, any>>({});
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isAssetFormOpen, setAssetFormOpen] = useState(false);
    const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [holdingToDelete, setHoldingToDelete] = useState<Holding | null>(null);

    const currencySymbol = getCurrencySymbol(undefined);
    const portfolioHoldings = useMemo(() => 
        holdings
            .filter(h => h && h.portfolioId === portfolio.id)
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    , [holdings, portfolio.id]);

    const refreshData = useCallback(async () => {
        if (!portfolioHoldings || portfolioHoldings.length === 0) { setHistoricalData([]); return; }
        setIsRefreshing(true); setFetchError(null);
        const cryptoIds: string[] = Array.from(new Set<string>(
            portfolioHoldings
                .filter(h => h.asset)
                .map(h => h.asset.toLowerCase())
        )).filter((id: string) => id && id.length > 2);

        try {
            const prices = await fetchPrices(cryptoIds); 
            setLivePrices(prev => ({ ...prev, ...prices }));
            
            const earliestDate = portfolioHoldings.reduce((min, h) => { 
                const d = new Date(h.date || Date.now()).getTime(); 
                return d < min ? d : min; 
            }, Date.now());
            const daysDiff = Math.ceil((Date.now() - earliestDate) / 86400000);
            const fetchDays = Math.max(7, daysDiff + 1);
            
            const historiesResults = await Promise.all(cryptoIds.map((id: string) => fetchHistory(id, fetchDays)));
            const historiesMap: Record<string, [number, number][]> = {};
            cryptoIds.forEach((id: string, idx: number) => { if (historiesResults[idx]) historiesMap[id] = historiesResults[idx]; });
            
            const firstId = Object.keys(historiesMap)[0] || 'time';
            const sampleTimeline = historiesMap[firstId] || Array.from({ length: 7 }, (_, i) => [Date.now() - (7 - i) * 86400000, 0]);
            
            const combined = sampleTimeline.map((point, idx) => {
                const timestamp = point[0]; 
                const dateLabel = new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const dataPoint: any = { time: dateLabel, totalPortfolioValue: 0 };
                
                cryptoIds.forEach((id: string) => {
                    const history = historiesMap[id];
                    if (history && history[idx]) {
                        const currentPrice = history[idx][1];
                        const startPrice = history[0][1];
                        dataPoint[`${id}_perc`] = ((currentPrice - startPrice) / (startPrice || 1)) * 100;
                        const netQty = portfolioHoldings.filter(h => h.asset && h.asset.toLowerCase() === id && new Date(h.date || 0).getTime() <= timestamp).reduce((sum, h) => h.type === 'BUY' ? sum + (h.quantity || 0) : sum - (h.quantity || 0), 0);
                        dataPoint.totalPortfolioValue += (netQty * currentPrice);
                    }
                });
                return dataPoint;
            });
            setHistoricalData(combined);
        } catch (err) { 
            setFetchError("Market data delayed"); 
        } finally { 
            setIsRefreshing(false); 
        }
    }, [portfolioHoldings]);

    useEffect(() => { 
        refreshData(); 
        const interval = setInterval(refreshData, 120000); 
        return () => clearInterval(interval); 
    }, [portfolioHoldings.length, refreshData]);

    const stats = useMemo(() => {
        let totalValue = 0, totalCost = 0;
        const assetGroups: Record<string, { netQty: number; totalSpent: number }> = {};
        
        portfolioHoldings.forEach(h => {
            const id = (h.asset || 'unknown').toLowerCase();
            if (!assetGroups[id]) assetGroups[id] = { netQty: 0, totalSpent: 0 };
            const qty = h.quantity || 0;
            const cost = qty * (h.buyPrice || 0);
            if (h.type === 'BUY') { assetGroups[id].netQty += qty; assetGroups[id].totalSpent += cost; }
            else { assetGroups[id].netQty -= qty; assetGroups[id].totalSpent -= cost; }
        });

        Object.entries(assetGroups).forEach(([id, data]) => {
            const currentPrice = (livePrices[id]?.usd || 0);
            totalValue += data.netQty * currentPrice; totalCost += data.totalSpent;
        });

        return { 
            totalValue, 
            totalProfit: totalValue - totalCost, 
            profitPercent: totalCost !== 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0 
        };
    }, [portfolioHoldings, livePrices]);

    const PortfolioIcon = StrategyIcons[portfolio.iconId] || BriefcaseIcon;

    return (
        <div className="animate-fade-in flex flex-col gap-8 pb-20">
            <div className="flex justify-between items-center bg-muted/20 border border-border p-6 rounded-[2.5rem]">
                <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all">
                    <ChevronLeftIcon className="w-4 h-4" /> {t('backToPortfolios')}
                </button>
                <div className="flex items-center gap-3">
                    {isRefreshing && <RefreshCwIcon className="w-3 h-3 animate-spin text-primary" />}
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{isRefreshing ? 'Updating Prices' : 'Market Live'}</span>
                    <div className={`w-2 h-2 rounded-full ${fetchError ? 'bg-danger' : 'bg-success animate-pulse'}`} />
                </div>
            </div>

            <div className="bg-muted/10 border border-border rounded-[3rem] p-8 lg:p-12 relative overflow-hidden shadow-xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-primary/10 text-primary rounded-[2rem] border border-primary/20"><PortfolioIcon className="w-10 h-10" /></div>
                        <div><h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">{portfolio.name}</h2><p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] opacity-60">Spot Digital Assets</p></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setEditingHolding(null); setAssetFormOpen(true); }} className="px-8 py-4 bg-primary text-bkg rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30 hover:bg-primary-focus transition-all">New Asset</button>
                        <button onClick={() => setEditModalOpen(true)} className="p-4 bg-bkg border border-border rounded-2xl hover:bg-muted"><EditIcon className="w-5 h-5" /></button>
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-2xl hover:bg-danger hover:text-white"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-bkg border border-border rounded-[2rem] p-8"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Portfolio Value</p><h2 className="text-4xl font-black tracking-tighter">{currencySymbol}{stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2></div>
                <div className="bg-bkg border border-border rounded-[2rem] p-8"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">Unrealized Return</p><h2 className={`text-4xl font-black tracking-tighter ${stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>{stats.totalProfit >= 0 ? '+' : ''}{currencySymbol}{stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2><span className={`text-[10px] font-black uppercase ${stats.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>{stats.profitPercent.toFixed(2)}% ROI</span></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-muted/10 border border-border rounded-[3rem] p-8 h-[400px]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Asset Progression</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={historicalData}>
                            <defs><linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" stroke="#52525B" fontSize={10} fontWeight="black" />
                            <YAxis stroke="#52525B" fontSize={10} fontWeight="black" tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                            <Area type="monotone" dataKey="totalPortfolioValue" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#vGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-muted/10 border border-border rounded-[3rem] p-8 h-[400px]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Asset Volatility</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" stroke="#52525B" fontSize={10} fontWeight="black" />
                            <YAxis stroke="#52525B" fontSize={10} fontWeight="black" tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--bkg))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase' }} />
                            {Array.from(new Set<string>(portfolioHoldings.filter(h => h.asset).map(h => h.asset.toLowerCase()))).map((id, idx) => (
                                <Line key={id} type="monotone" dataKey={`${id}_perc`} stroke={PIE_COLORS[idx % PIE_COLORS.length]} strokeWidth={2} dot={false} name={id.toUpperCase()} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-bkg border border-border rounded-[3.5rem] overflow-hidden">
                <div className="px-10 py-8 border-b border-border bg-muted/20 flex justify-between items-center"><h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Holding Ledger</h3></div>
                <div className="divide-y divide-border">
                    {portfolioHoldings.map(h => {
                        const assetId = (h.asset || '').toLowerCase();
                        const curP = (livePrices[assetId]?.usd || h.currentPrice || 0);
                        const qty = h.quantity || 0;
                        const buyP = h.buyPrice || 0;
                        const val = qty * curP; 
                        const prof = h.type === 'BUY' ? val - (qty * buyP) : (qty * buyP) - val;
                        return (
                            <div key={h.id} className="flex flex-col sm:flex-row justify-between items-center px-10 py-8 hover:bg-muted/30 transition-all gap-8">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${h.type === 'BUY' ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'}`}>{h.type === 'BUY' ? <ArrowUpRightIcon className="w-5 h-5"/> : <ArrowDownRightIcon className="w-5 h-5"/>}</div>
                                    <div className="min-w-0"><p className="font-black text-xl uppercase truncate">{h.asset} <span className="text-[8px] px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 ml-1 uppercase">{t('crypto')}</span></p><p className="text-[10px] font-bold text-muted-foreground uppercase">{qty.toLocaleString()} units @ {currencySymbol}{buyP.toLocaleString()}</p></div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right"><p className={`text-xl font-black tracking-tighter ${prof >= 0 ? 'text-success' : 'text-danger'}`}>{prof >= 0 ? '+' : ''}{currencySymbol}{prof.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                                    <div className="flex gap-2"><button onClick={() => { setEditingHolding(h); setAssetFormOpen(true); }} className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"><EditIcon className="w-4 h-4"/></button><button onClick={() => setHoldingToDelete(h)} className="p-2 bg-danger/5 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors"><TrashIcon className="w-4 h-4"/></button></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <HoldingForm isOpen={isAssetFormOpen} onClose={() => setAssetFormOpen(false)} portfolioId={portfolio.id} holding={editingHolding} />
            <PortfolioForm isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} portfolio={portfolio} />
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Portfolio"><div className="text-center py-4 space-y-6"><AlertTriangleIcon className="w-12 h-12 text-danger mx-auto" /><h3 className="text-xl font-black uppercase">Are you sure?</h3><div className="flex gap-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-muted rounded-xl font-black uppercase text-xs">Cancel</button><button onClick={() => { deletePortfolio(portfolio.id); onBack(); }} className="flex-1 py-3 bg-danger text-white rounded-xl font-black uppercase text-xs">Delete</button></div></div></Modal>
            <Modal isOpen={!!holdingToDelete} onClose={() => setHoldingToDelete(null)} title="Delete Transaction"><div className="text-center py-4 space-y-6"><AlertTriangleIcon className="w-12 h-12 text-danger mx-auto" /><h3 className="text-xl font-black uppercase">Remove transaction?</h3><div className="flex gap-4"><button onClick={() => setHoldingToDelete(null)} className="flex-1 py-3 bg-muted rounded-xl font-black uppercase text-xs">Cancel</button><button onClick={() => { if (holdingToDelete) { deleteHolding(holdingToDelete.id); setHoldingToDelete(null); } }} className="flex-1 py-3 bg-danger text-white rounded-xl font-black uppercase text-xs">Remove</button></div></div></Modal>
        </div>
    );
};

// --- Main Page Component ---

const SpotPortfolioPage: React.FC = () => {
    const { portfolios, holdings, t } = useApp();
    const [isPortfolioFormOpen, setPortfolioFormOpen] = useState(false);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

    const activePortfolio = useMemo(() => {
        if (!selectedPortfolioId || !portfolios) return null;
        return portfolios.find(p => p && p.id && p.id.toString() === selectedPortfolioId.toString()) || null;
    }, [portfolios, selectedPortfolioId]);

    if (activePortfolio) {
        return <PortfolioDetailView portfolio={activePortfolio} onBack={() => setSelectedPortfolioId(null)} />;
    }

    return (
        <div className="animate-fade-in flex flex-col gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/10 border border-border/50 rounded-[3rem] p-8">
                <div><h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-none">{t('portfolio')}</h1><p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] mt-3 opacity-60">Asset Ledger</p></div>
                <button onClick={() => setPortfolioFormOpen(true)} className="flex items-center gap-3 px-10 py-5 bg-primary text-bkg rounded-3xl hover:bg-primary-focus shadow-lg transition-all group">
                    <PlusIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" /><span className="font-black text-sm uppercase tracking-[0.2em]">{t('newPortfolio')}</span>
                </button>
            </div>

            {(portfolios || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {portfolios.map(p => {
                        if (!p || !p.id) return null;
                        const pHoldings = holdings ? holdings.filter(h => h && h.portfolioId === p.id) : [];
                        const PortfolioIcon = StrategyIcons[p.iconId] || BriefcaseIcon;
                        return (
                            <div key={p.id} onClick={() => setSelectedPortfolioId(p.id)} className="group relative bg-bkg border border-border rounded-[2.5rem] p-10 cursor-pointer hover:border-primary/40 transition-all duration-500 overflow-hidden active:scale-95">
                                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity bg-primary rounded-full -mr-16 -mt-16" />
                                <div className="flex justify-between items-start mb-12">
                                    <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform"><PortfolioIcon className="w-8 h-8" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">{pHoldings.length} Assets</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tight uppercase group-hover:text-primary transition-colors mb-2">{p.name}</h3>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">Spot Holdings</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-48 bg-muted/10 border-2 border-dashed border-border rounded-[4rem] group hover:border-primary/40 transition-all cursor-pointer" onClick={() => setPortfolioFormOpen(true)}>
                    <BriefcaseIcon className="w-20 h-20 text-primary opacity-10 mb-8 group-hover:scale-110 transition-transform" />
                    <h3 className="text-3xl font-black tracking-tight uppercase opacity-40">{t('noPortfoliosYet')}</h3>
                </div>
            )}
            <PortfolioForm isOpen={isPortfolioFormOpen} onClose={() => setPortfolioFormOpen(false)} />
        </div>
    );
};

export default SpotPortfolioPage;