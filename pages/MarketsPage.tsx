
import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutGridIcon, BanknoteIcon, CpuIcon, TrendingUpIcon, NewspaperIcon, CalendarIcon, EyeIcon, PlusIcon, TrashIcon, EditIcon, FilterIcon, ChevronUpIcon, GlobeIcon, AlertTriangleIcon, RefreshCwIcon, InfoIcon } from '../components/Icons';

const AVAILABLE_CURRENCIES = [
    { code: 'USD', label: 'United States' },
    { code: 'EUR', label: 'Eurozone' },
    { code: 'GBP', label: 'United Kingdom' },
    { code: 'JPY', label: 'Japan' },
    { code: 'AUD', label: 'Australia' },
    { code: 'CAD', label: 'Canada' },
    { code: 'CHF', label: 'Switzerland' },
    { code: 'CNY', label: 'China' },
    { code: 'NZD', label: 'New Zealand' },
];

const IMPORTANCE_LEVELS = [
    { value: '0', label: 'High' },
    { value: '1', label: 'Medium' },
    { value: '2', label: 'Low' },
];

interface WidgetProps {
    src: string;
    config: any;
    className?: string;
    style?: React.CSSProperties;
}

const TradingViewWidget: React.FC<WidgetProps> = ({ src, config, className, style }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = ``;
        const widgetContainer = document.createElement(`div`);
        widgetContainer.className = `tradingview-widget-container__widget`;
        widgetContainer.style.width = `100%`;
        widgetContainer.style.height = `100%`;
        containerRef.current.appendChild(widgetContainer);
        const script = document.createElement(`script`);
        script.type = `text/javascript`;
        script.src = src;
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        containerRef.current.appendChild(script);
        return () => { if (containerRef.current) containerRef.current.innerHTML = ``; };
    }, [src, JSON.stringify(config)]);
    return <div ref={containerRef} className={`tradingview-widget-container ${className || ``}`} style={{ width: `100%`, height: `100%`, ...style }} />;
};

const TickerTape = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = {
        "symbols": [
            { "proName": "FOREXCOM:SPXUSD", "title": "S&P 500" },
            { "proName": "FOREXCOM:NSXUSD", "title": "Nasdaq 100" },
            { "proName": "FX_IDC:EURUSD", "title": "EUR/USD" },
            { "proName": "BITSTAMP:BTCUSD", "title": "BTC/USD" },
            { "proName": "BITSTAMP:ETHUSD", "title": "ETH/USD" },
            { "description": "Gold", "proName": "OANDA:XAUUSD" },
            { "description": "Oil", "proName": "TVC:USOIL" }
        ],
        "showSymbolLogo": true,
        "isTransparent": true,
        "displayMode": "adaptive",
        "colorTheme": theme,
        "locale": locale
    };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js`} config={config} className={`h-12`} />;
});

const MarketNews = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = { "feedMode": "all_symbols", "colorTheme": theme, "isTransparent": true, "displayMode": "regular", "width": "100%", "height": "100%", "locale": locale };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-timeline.js`} config={config} />;
});

interface EconomicCalendarProps { theme: string; locale: string; currencies: string[]; importance: string[]; }
const EconomicCalendar = memo(({ theme, locale, currencies, importance }: EconomicCalendarProps) => {
    const config = { "width": "100%", "height": "100%", "colorTheme": theme, "isTransparent": true, "locale": locale, "importanceFilter": importance.length > 0 ? importance.join(",") : "0,1,2", "currencyFilter": currencies.length > 0 ? currencies.join(",") : undefined };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-events.js`} config={config} />;
});

const MarketOverview = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = { "colorTheme": theme, "dateRange": "12M", "showChart": true, "locale": locale, "largeChartUrl": "", "isTransparent": true, "showSymbolLogo": true, "showFloatingTooltip": false, "width": "100%", "height": "100%", "plotLineColorGrowing": "rgba(41, 98, 255, 1)", "plotLineColorFalling": "rgba(41, 98, 255, 1)", "gridLineColor": "rgba(240, 243, 250, 0)", "scaleFontColor": "rgba(106, 109, 120, 1)", "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)", "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)", "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)", "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)", "symbolActiveColor": "rgba(41, 98, 255, 0.12)", "tabs": [{ "title": "Indices", "symbols": [{ "s": "FOREXCOM:SPXUSD", "d": "S&P 500" }, { "s": "FOREXCOM:NSXUSD", "d": "Nasdaq 100" }, { "s": "FOREXCOM:DJI", "d": "Dow 30" }, { "s": "INDEX:DEU40", "d": "DAX 40" }, { "s": "FOREXCOM:UKXGBP", "d": "FTSE 100" }], "originalTitle": "Indices" }, { "title": "Crypto", "symbols": [{ "s": "BINANCE:BTCUSDT", "d": "Bitcoin" }, { "s": "BINANCE:ETHUSDT", "d": "Ethereum" }, { "s": "BINANCE:SOLUSDT", "d": "Solana" }] }, { "title": "Forex", "symbols": [{ "s": "FX:EURUSD", "d": "EUR/USD" }, { "s": "FX:GBPUSD", "d": "GBP/USD" }, { "s": "FX:USDJPY", "d": "USD/JPY" }, { "s": "FX:USDCAD", "d": "USD/CAD" }], "originalTitle": "Forex" }] };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js`} config={config} />;
});

const ForexHeatmap = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = { "width": "100%", "height": "100%", "currencies": ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"], "isTransparent": true, "colorTheme": theme, "locale": locale };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js`} config={config} />;
});

const CryptoHeatmap = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = { "dataSource": "Crypto", "blockSize": "market_cap_calc", "blockColor": "change", "locale": locale, "symbolUrl": "", "colorTheme": theme, "hasTopBar": false, "isDataSetEnabled": false, "isZoomEnabled": true, "hasSymbolTooltip": true, "width": "100%", "height": "100%" };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js`} config={config} />;
});

const StockHeatmap = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const config = { "exch": "US", "group": "sector", "blockSize": "market_cap_basic", "blockColor": "change", "locale": locale, "symbolUrl": "", "colorTheme": theme, "hasTopBar": false, "isDataSetEnabled": false, "isZoomEnabled": true, "hasSymbolTooltip": true, "width": "100%", "height": "100%" };
    return <TradingViewWidget src={`https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js`} config={config} />;
});

const WatchlistWidget = memo(({ theme, locale }: { theme: string, locale: string }) => {
    const [symbols, setSymbols] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem(`eclipse_watchlist`);
        if (saved) { try { const parsed = JSON.parse(saved); setSymbols(Array.isArray(parsed) ? parsed : [`FOREXCOM:SPXUSD`, `NASDAQ:AAPL`, `BINANCE:BTCUSDT`, `FX:EURUSD`]); } catch (e) { setSymbols([`FOREXCOM:SPXUSD`, `NASDAQ:AAPL`, `BINANCE:BTCUSDT`, `FX:EURUSD`]); } } else { setSymbols([`FOREXCOM:SPXUSD`, `NASDAQ:AAPL`, `BINANCE:BTCUSDT`, `FX:EURUSD`]); }
        setIsInitialized(true);
    }, []);
    useEffect(() => { if (isInitialized) { localStorage.setItem(`eclipse_watchlist`, JSON.stringify(symbols)); } }, [symbols, isInitialized]);
    const addSymbol = (e?: React.FormEvent) => { if (e) e.preventDefault(); if (newSymbol && !symbols.includes(newSymbol)) { setSymbols([...symbols, newSymbol.trim()]); setNewSymbol(``); } };
    const removeSymbol = (s: string) => { setSymbols(symbols.filter(sym => sym !== s)); };
    const config = { "width": "100%", "height": "100%", "symbolsGroups": [{ "name": "Watchlist", "symbols": symbols.map(s => ({ "name": s })) }], "colorTheme": theme, "isTransparent": true, "locale": locale };
    const containerHeight = isEditing ? Math.max(450, (symbols.length * 50) + 150) : Math.max(400, (symbols.length * 50) + 80);
    return (
        <div className={`bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col overflow-hidden transition-[height] duration-300 ease-in-out min-w-0`} style={{ height: `${containerHeight}px` }}>
            <div className={`flex justify-between items-center px-4 py-3 border-b border-border/50 bg-transparent flex-shrink-0`}>
                <h2 className={`text-lg font-semibold flex items-center gap-2 truncate`}><EyeIcon className={`w-5 h-5 text-primary`} /> Watchlist</h2>
                <button onClick={() => setIsEditing(!isEditing)} className={`p-1.5 rounded-md flex-shrink-0 transition-colors ${isEditing ? `bg-primary text-bkg` : `hover:bg-muted text-muted-foreground`}`} title={`Edit Watchlist`}><EditIcon className={`w-4 h-4`} /></button>
            </div>
            <div className={`flex-grow overflow-hidden relative min-h-0`}>
                {isEditing ? (
                    <div className={`p-4 h-full flex flex-col`}>
                        <form onSubmit={addSymbol} className={`flex gap-2 mb-4`}><input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder={`Add symbol (e.g. AAPL)`} className={`flex-grow p-2 bg-muted border border-border rounded-md text-sm min-w-0`} /><button type={`submit`} className={`p-2 bg-primary text-bkg rounded-md flex-shrink-0`}><PlusIcon className={`w-5 h-5`} /></button></form>
                        <div className={`flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin`}>{symbols.map(s => (<div key={s} className={`flex justify-between items-center p-2 bg-muted/50 rounded-md group`}><span className={`text-sm font-medium truncate`}>{s}</span><button onClick={() => removeSymbol(s)} className={`text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity`}><TrashIcon className={`w-4 h-4`} /></button></div>))}{symbols.length === 0 && <p className={`text-center text-sm text-muted-foreground py-4`}>{`No symbols in watchlist`}</p>}</div>
                    </div>
                ) : (symbols.length > 0 ? (<TradingViewWidget key={JSON.stringify(config)} src={`https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js`} config={config} />) : (<div className={`flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center`}>{`No symbols added.`}<br />{`Click the edit button to manage your watchlist.`}</div>))}
            </div>
        </div>
    );
});

type Tab = 'overview' | 'forex' | 'crypto' | 'stocks';
const MarketsPage: React.FC = () => {
    const { theme, t, language } = useApp();
    const [activeTab, setActiveTab] = useState<Tab>(`overview`);
    const [showCalendarFilters, setShowCalendarFilters] = useState(false);
    const [calendarFilters, setCalendarFilters] = useState({ currencies: AVAILABLE_CURRENCIES.map(c => c.code), importance: IMPORTANCE_LEVELS.map(i => i.value) });
    const widgetTheme = theme === 'dark' ? 'dark' : 'light';
    const widgetLocale = language === 'es' ? 'es' : 'en';
    const toggleCurrency = useCallback((code: string) => { setCalendarFilters(prev => { const exists = prev.currencies.includes(code); const newCurrencies = exists ? prev.currencies.filter(c => c !== code) : [...prev.currencies, code]; return { ...prev, currencies: newCurrencies }; }); }, []);
    const toggleImportance = useCallback((val: string) => { setCalendarFilters(prev => { const exists = prev.importance.includes(val); const newImportance = exists ? prev.importance.filter(v => v !== val) : [...prev.importance, val]; return { ...prev, importance: newImportance }; }); }, []);
    const selectAllCurrencies = () => setCalendarFilters(prev => ({ ...prev, currencies: AVAILABLE_CURRENCIES.map(c => c.code) }));
    const deselectAllCurrencies = () => setCalendarFilters(prev => ({ ...prev, currencies: [] }));
    const renderActiveWidget = () => { switch (activeTab) { case 'overview': return <MarketOverview key={`overview-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} />; case 'forex': return <ForexHeatmap key={`heatmap-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} />; case 'crypto': return <CryptoHeatmap key={`crypto-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} />; case 'stocks': return <StockHeatmap key={`stocks-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} />; default: return null; } };
    const tabs: { id: Tab, label: string, icon: React.ReactElement }[] = [{ id: 'overview', label: t('marketOverview'), icon: <LayoutGridIcon className={`w-4 h-4`} /> }, { id: 'forex', label: t('forexHeatmap'), icon: <BanknoteIcon className={`w-4 h-4`} /> }, { id: 'crypto', label: t('cryptoHeatmap'), icon: <CpuIcon className={`w-4 h-4`} /> }, { id: 'stocks', label: t('stockHeatmap'), icon: <TrendingUpIcon className={`w-4 h-4`} /> }];
    return (
        <div className={`animate-fade-in flex flex-col space-y-4 pb-8 min-h-screen w-full max-w-full overflow-x-hidden`}>
            <div className={`space-y-4 flex-shrink-0 w-full`}><div className={`flex justify-between items-center no-print w-full`}><h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 truncate`}>{t('markets')}</h1></div><div className={`w-full bg-bkg/50 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`} style={{ height: `72px` }}><TickerTape key={`ticker-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} /></div></div>
            <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 w-full`}>
                <div className={`lg:col-span-3 flex flex-col gap-4 min-w-0`}>
                    <div className={`bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden min-w-0`}>
                        <div className={`flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-b border-border/50 gap-2 bg-transparent min-w-0 flex-shrink-0`}><h2 className={`text-lg font-semibold flex items-center gap-2 truncate`}>{tabs.find(t => t.id === activeTab)?.icon}{tabs.find(t => t.id === activeTab)?.label}</h2><div className={`flex bg-muted/50 rounded-lg p-1 gap-1 overflow-x-auto no-scrollbar max-w-full`}>{tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.id ? `bg-bkg text-primary shadow-sm` : `text-muted-foreground hover:bg-muted/80 hover:text-content`}`}><span className={`hidden sm:inline`}>{tab.icon}</span>{tab.label}</button>))}</div></div>
                        <div className={`flex-grow relative min-h-0`}>{renderActiveWidget()}</div>
                    </div>
                    <div className={`bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col h-[500px] overflow-hidden min-w-0`}>
                        <div className={`flex justify-between items-center px-4 py-3 border-b border-border/50 bg-transparent flex-shrink-0 min-w-0`}><h2 className={`text-lg font-semibold flex items-center gap-2 truncate`}><CalendarIcon className={`w-5 h-5 text-primary`} />{t('economicCalendar')}<span className={`text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-2 hidden sm:inline-block`}>{`Powered by TradingView`}</span></h2><button onClick={() => setShowCalendarFilters(!showCalendarFilters)} className={`p-2 rounded-md flex-shrink-0 transition-all duration-200 ${showCalendarFilters ? `bg-primary text-bkg shadow-sm` : `bg-muted text-muted-foreground hover:bg-muted`}`} title={showCalendarFilters ? `Close Filters` : `Filter Calendar`}>{showCalendarFilters ? <ChevronUpIcon className={`w-4 h-4`} /> : <FilterIcon className={`w-4 h-4`} />}</button></div>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-bkg border-b border-border/50 flex-shrink-0 ${showCalendarFilters ? `max-h-[600px] opacity-100 shadow-sm` : `max-h-0 opacity-0`}`}><div className={`p-4 space-y-4 overflow-y-auto max-h-[300px] scrollbar-thin`}><div><h3 className={`text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-wider`}><TrendingUpIcon className={`w-3 h-3`} /> Impact</h3><div className={`flex gap-2`}>{IMPORTANCE_LEVELS.map(level => (<button key={level.value} onClick={() => toggleImportance(level.value)} className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all ${calendarFilters.importance.includes(level.value) ? `bg-primary text-bkg border border-primary shadow-sm` : `bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted`}`}>{level.label}</button>))}</div></div><div><div className={`flex justify-between items-center mb-2`}><h3 className={`text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-wider`}><GlobeIcon className={`w-3 h-3`} /> Currencies</h3><div className={`flex gap-2`}><button onClick={selectAllCurrencies} className={`text-[10px] text-primary hover:underline`}>All</button><button onClick={deselectAllCurrencies} className={`text-[10px] text-muted-foreground hover:underline`}>Clear</button></div></div><div className={`grid grid-cols-3 sm:grid-cols-4 gap-2`}>{AVAILABLE_CURRENCIES.map(curr => { const isSelected = calendarFilters.currencies.includes(curr.code); return (<button key={curr.code} onClick={() => toggleCurrency(curr.code)} className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${isSelected ? `bg-primary text-bkg border-primary shadow-sm` : `bg-muted/30 border-transparent text-muted-foreground hover:bg-muted`}`}>{isSelected && <div className={`w-1.5 h-1.5 rounded-full bg-bkg`} />}{curr.code}</button>); })}</div></div></div></div>
                        <div className={`flex-grow relative overflow-hidden min-h-0`}><EconomicCalendar theme={widgetTheme} locale={widgetLocale} currencies={calendarFilters.currencies} importance={calendarFilters.importance} /></div>
                    </div>
                </div>
                <div className={`lg:col-span-1 flex flex-col gap-4 min-w-0`}>
                    <div className={`rounded-2xl min-w-0`}><WatchlistWidget theme={widgetTheme} locale={widgetLocale} /></div>
                    <div className={`bg-bkg/50 backdrop-blur-xl border border-border rounded-2xl shadow-sm flex flex-col h-[500px] overflow-hidden min-w-0`}>
                        <div className={`flex justify-between items-center px-4 py-3 border-b border-border/50 bg-transparent flex-shrink-0 min-w-0`}><h2 className={`text-lg font-semibold flex items-center gap-2 truncate`}><NewspaperIcon className={`w-5 h-5 text-primary`} />{t('marketNews')}</h2></div>
                        <div className={`flex-grow relative overflow-hidden min-h-0`}><MarketNews key={`news-${widgetTheme}-${widgetLocale}`} theme={widgetTheme} locale={widgetLocale} /></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketsPage;
