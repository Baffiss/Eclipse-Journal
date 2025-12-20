
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trade, TradeDirection, TradePreset } from '../types';
import Modal from '../components/Modal';
import { 
    PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, 
    UploadCloudIcon, XIcon, FilterIcon, AlertTriangleIcon, ZapIcon,
    SaveIcon, CalendarIcon
} from '../components/Icons';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const getLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getCurrentTimeRounded = () => {
    const now = new Date();
    const h = now.getHours();
    let m = now.getMinutes();
    m = Math.floor(m / 5) * 5; 
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const TradeForm: React.FC<{ isOpen: boolean; onClose: () => void; trade?: Trade | null; selectedDate?: Date | null }> = ({ isOpen, onClose, trade, selectedDate }) => {
    const { accounts, strategies, presets, addTrade, updateTrade, addPreset, deletePreset, t, language } = useApp();
    const [showSavePreset, setShowSavePreset] = useState(false);
    const [newPresetName, setNewPresetName] = useState('');
    
    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 5) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                options.push(time);
            }
        }
        return options;
    }, []);

    const getInitialFormData = () => {
        const tradeDate = trade ? new Date(trade.date) : (selectedDate || new Date());
        return {
            accountId: trade?.accountId || accounts[0]?.id || '',
            strategyId: trade?.strategyId || '',
            date: getLocalDateString(tradeDate),
            time: trade ? new Date(trade.date).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'}) : getCurrentTimeRounded(),
            asset: trade?.asset || '',
            direction: trade?.direction || TradeDirection.BUY,
            lotSize: trade?.lotSize || 0,
            takeProfitPips: trade?.takeProfitPips || 0,
            stopLossPips: trade?.stopLossPips || 0,
            result: trade?.result || 0,
            notes: trade?.notes || '',
            imageUrl: trade?.imageUrl || '',
        };
    };
    
    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setShowSavePreset(false);
            setNewPresetName('');
        }
    }, [isOpen, trade, selectedDate, accounts]);

    const handlePresetSelect = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setFormData(prev => ({
                ...prev,
                asset: preset.asset || prev.asset,
                lotSize: preset.lotSize || prev.lotSize,
                takeProfitPips: preset.takeProfitPips || prev.takeProfitPips,
                stopLossPips: preset.stopLossPips || prev.stopLossPips,
                strategyId: preset.strategyId || prev.strategyId
            }));
        }
    };

    const handleSaveCurrentAsPreset = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!newPresetName.trim()) return;
        
        const preset: TradePreset = {
            id: crypto.randomUUID(),
            name: newPresetName.trim(),
            strategyId: formData.strategyId,
            asset: formData.asset.toUpperCase(),
            lotSize: Number(formData.lotSize),
            takeProfitPips: Number(formData.takeProfitPips),
            stopLossPips: Number(formData.stopLossPips),
        };
        addPreset(preset);
        setShowSavePreset(false);
        setNewPresetName('');
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setFormData(prev => ({...prev, imageUrl: base64}));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [hours, minutes] = formData.time.split(':').map(Number);
        const localDate = new Date(`${formData.date}T00:00:00`);
        localDate.setHours(hours);
        localDate.setMinutes(minutes);

        const tradeData = {
            ...formData,
            lotSize: Number(formData.lotSize),
            takeProfitPips: Number(formData.takeProfitPips),
            stopLossPips: Number(formData.stopLossPips),
            result: parseFloat(String(formData.result)) || 0,
            hour: hours,
            date: localDate.toISOString(),
        };

        const { time, ...finalTradeData } = tradeData as any;

        if (trade) {
            updateTrade(trade, { ...trade, ...finalTradeData });
        } else {
            addTrade({ id: crypto.randomUUID(), ...finalTradeData });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={trade ? t('editTrade') : t('registerTrade')}>
            <div className="space-y-6">
                {/* Selector de Configuración al inicio */}
                {!trade && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('selectPreset')}</label>
                        <div className="flex gap-2">
                            <select 
                                onChange={(e) => handlePresetSelect(e.target.value)}
                                className="flex-1 p-2 bg-bkg border border-border rounded-xl text-xs font-bold outline-none"
                                defaultValue=""
                            >
                                <option value="" disabled>{t('selectPreset')}...</option>
                                {presets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.asset || 'N/A'})</option>
                                ))}
                            </select>
                            {presets.length > 0 && (
                                <div className="flex items-center text-primary px-1">
                                    <ZapIcon className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('selectAccount')}</label>
                            <select name="accountId" value={formData.accountId} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm" required>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('strategies')}</label>
                            <select name="strategyId" value={formData.strategyId} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm">
                                <option value="">{t('noStrategy')}</option>
                                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('date')}</label>
                            <div className="w-full p-2 bg-muted border border-border rounded-lg mt-1 h-[38px] flex items-center text-sm font-semibold">
                                {new Date(`${formData.date}T00:00:00`).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('hour')}</label>
                            <select name="time" value={formData.time} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-mono text-sm">
                                {timeOptions.map(tOption => <option key={tOption} value={tOption}>{tOption}</option>)}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('asset')}</label>
                            <input name="asset" value={formData.asset} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-bold uppercase text-sm" required placeholder="e.g. NAS100" />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('direction')}</label>
                            <select name="direction" value={formData.direction} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm">
                                <option value={TradeDirection.BUY}>Long</option>
                                <option value={TradeDirection.SELL}>Short</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('lotSize')}</label>
                            <input type="number" step="0.01" name="lotSize" value={formData.lotSize} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-success uppercase tracking-widest pl-1">{t('takeProfitPips')}</label>
                            <input type="number" name="takeProfitPips" value={formData.takeProfitPips} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-danger uppercase tracking-widest pl-1">{t('stopLossPips')}</label>
                            <input type="number" name="stopLossPips" value={formData.stopLossPips} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 font-semibold text-sm" />
                        </div>

                        {/* Opción de "Guardar configuración" justo arriba del resultado */}
                        {!trade && (
                            <div className="md:col-span-2 border-t border-border/50 pt-4 mt-2">
                                {!showSavePreset ? (
                                    <button 
                                        type="button"
                                        onClick={() => setShowSavePreset(true)}
                                        className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-all mb-4"
                                    >
                                        <SaveIcon className="w-4 h-4" />
                                        {t('saveAsPreset')}
                                    </button>
                                ) : (
                                    <div className="flex gap-2 animate-fade-in mb-4">
                                        <input 
                                            value={newPresetName} 
                                            onChange={e => setNewPresetName(e.target.value)}
                                            placeholder={t('presetName')}
                                            className="flex-1 p-2 bg-muted border border-border rounded-lg text-sm font-semibold"
                                        />
                                        <button 
                                            onClick={handleSaveCurrentAsPreset}
                                            className="px-4 py-2 bg-primary text-bkg rounded-lg text-xs font-bold uppercase"
                                        >
                                            {t('save')}
                                        </button>
                                        <button 
                                            onClick={() => setShowSavePreset(false)}
                                            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-xs font-bold uppercase"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('resultInDollars')}</label>
                            <input type="number" step="0.01" name="result" value={formData.result} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-lg mt-1 text-lg font-black" required />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('notes')}</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-lg mt-1 min-h-[80px] text-sm font-medium" placeholder="Psychology, context..."></textarea>
                    </div>
                    
                    {formData.imageUrl ? (
                        <div className="relative group">
                            <img src={formData.imageUrl} alt="Trade screenshot" className="max-h-48 w-full object-cover rounded-lg" />
                            <button type="button" onClick={() => setFormData(p => ({...p, imageUrl: ''}))} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-danger transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">{t('uploadScreenshot')}</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-lg bg-muted/30">
                                <div className="space-y-1 text-center">
                                    <UploadCloudIcon className="mx-auto h-10 w-10 text-muted-foreground opacity-50"/>
                                    <div className="flex text-xs text-muted-foreground">
                                        <label htmlFor="file-upload" className="relative cursor-pointer font-bold text-primary hover:underline">
                                            <span>{t('uploadScreenshot')}</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-muted rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                        <button type="submit" className="px-6 py-2.5 bg-primary text-bkg rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary-focus shadow-lg shadow-primary/20">{trade ? t('update') : t('registerTrade')}</button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

const CalendarView: React.FC<{
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    trades: Trade[];
    onDayClick: (date: Date) => void;
    selectedDate: Date | null;
}> = ({ currentDate, setCurrentDate, trades, onDayClick, selectedDate }) => {
    const { language, getCurrencySymbol, accounts } = useApp();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    const dayNames = useMemo(() => {
        const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' });
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(2023, 0, i + 1); // A week that starts on Sunday
            return formatter.format(date);
        });
    }, [language]);

    return (
        <div className="bg-muted/30 border border-border rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-xl bg-bkg border border-border hover:bg-muted transition-colors"><ChevronLeftIcon className="w-5 h-5"/></button>
                <h3 className="text-xl font-black uppercase tracking-tight">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-xl bg-bkg border border-border hover:bg-muted transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3">
                {dayNames.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-2">
                {days.map(d => {
                    const tradesOnDay = trades.filter(t => isSameDay(new Date(t.date), d));
                    const dayProfit = tradesOnDay.reduce((sum, t) => sum + t.result, 0);
                    const isToday = isSameDay(d, new Date());
                    const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
                    const defaultCurrency = getCurrencySymbol(accounts.length > 0 ? accounts[0]?.currency : undefined);
                    return (
                        <div 
                            key={d.toString()} 
                            onClick={() => onDayClick(d)} 
                            className={`p-2 h-20 md:h-24 flex flex-col rounded-2xl cursor-pointer transition-all duration-200 border-2 ${d.getMonth() !== currentDate.getMonth() ? 'bg-transparent text-muted-foreground/20 border-transparent opacity-40 pointer-events-none' : 'bg-bkg hover:border-primary/50 shadow-sm'} ${isSelected ? 'bg-primary/10 border-primary ring-2 ring-primary/5' : isToday ? 'border-primary/20 bg-primary/5' : 'border-transparent'}`}
                        >
                            <span className="text-xs font-black">{d.getDate()}</span>
                            {tradesOnDay.length > 0 && (
                                <div className="mt-auto text-center flex-grow flex items-center justify-center">
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ${dayProfit > 0 ? 'bg-success/10 text-success' : dayProfit < 0 ? 'bg-danger/10 text-danger' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                        {dayProfit >= 0 ? '+' : ''}{dayProfit.toFixed(0)}{defaultCurrency}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const TradesPage: React.FC = () => {
    const { trades, accounts, strategies, deleteTrade, t, language, getCurrencySymbol } = useApp();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
    
    const [filterAccountId, setFilterAccountId] = useState('');
    const [filterStrategyId, setFilterStrategyId] = useState('');
    const [filterAsset, setFilterAsset] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredTrades = useMemo(() => {
        return trades.filter(trade => {
            if (filterAccountId && trade.accountId !== filterAccountId) return false;
            if (filterStrategyId && trade.strategyId !== filterStrategyId) return false;
            if (filterAsset && !trade.asset.toLowerCase().includes(filterAsset.toLowerCase())) return false;
            return true;
        });
    }, [trades, filterAccountId, filterStrategyId, filterAsset]);

    const tradesForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return filteredTrades
            .filter(t => new Date(t.date).toDateString() === selectedDate.toDateString())
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTrades, selectedDate]);

    const confirmDeleteTrade = () => {
        if (tradeToDelete) {
            deleteTrade(tradeToDelete);
            setTradeToDelete(null);
        }
    };

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="flex justify-between items-center bg-muted/20 border border-border rounded-3xl p-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">{t('trades')}</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Transaction Ledger</p>
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-2xl transition-all duration-300 ${showFilters ? 'bg-primary text-bkg shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-border'}`}
                >
                    <FilterIcon className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 p-6 bg-muted/20 border border-border rounded-3xl animate-slide-in-up">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">{t('accounts')}</label>
                                <select value={filterAccountId} onChange={e => setFilterAccountId(e.target.value)} className="w-full p-2 bg-bkg border border-border rounded-xl text-xs font-bold"><option value="">{t('allAccounts')}</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">{t('strategies')}</label>
                                <select value={filterStrategyId} onChange={e => setFilterStrategyId(e.target.value)} className="w-full p-2 bg-bkg border border-border rounded-xl text-xs font-bold"><option value="">{t('allStrategies')}</option>{strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">{t('asset')}</label>
                                <input value={filterAsset} onChange={e => setFilterAsset(e.target.value)} placeholder={t('filterByAsset')} className="w-full p-2 bg-bkg border border-border rounded-xl text-xs font-bold" />
                            </div>
                        </div>
                    )}
                    <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} trades={filteredTrades} onDayClick={setSelectedDate} selectedDate={selectedDate} />
                </div>
                
                <div className="w-full lg:w-96 flex-shrink-0 bg-muted/20 border border-border rounded-3xl flex flex-col h-full min-h-[500px]">
                     {selectedDate ? (
                        <>
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
                                {/* ********************************************************************************************************** */}
                                {/* Nota: El código debajo ya incluía los cambios de la turn anterior pero se ajustó strategyId */}
                                {/* ********************************************************************************************************** */}
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tight">{selectedDate.toLocaleDateString(language, {day: 'numeric', month: 'long'})}</h2>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{tradesForSelectedDate.length} {t('trades')}</p>
                                </div>
                                <button 
                                    onClick={() => { setEditingTrade(null); setFormOpen(true); }}
                                    className="p-3 bg-primary text-bkg rounded-2xl hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                    disabled={accounts.length === 0}
                                >
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-4 scrollbar-thin">
                                {tradesForSelectedDate.length > 0 ? tradesForSelectedDate.map(trade => {
                                    const account = accounts.find(a => a.id === trade.accountId);
                                    const currencySymbol = getCurrencySymbol(account?.currency);
                                    return (
                                        <div key={trade.id} className="group relative p-4 bg-bkg rounded-2xl shadow-sm border border-border hover:border-primary/30 transition-all animate-slide-in-up">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-black text-base uppercase tracking-tight">{trade.asset} 
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg ml-2 uppercase tracking-widest ${
                                                            trade.direction === 'Buy' 
                                                                ? 'bg-primary/10 text-primary' 
                                                                : 'bg-danger/10 text-danger'
                                                        }`}>
                                                            {trade.direction === 'Buy' ? 'Long' : 'Short'}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{account?.name || 'N/A'}</p>
                                                </div>
                                                <p className={`font-black text-lg tracking-tighter ${trade.result >= 0 ? 'text-success' : 'text-danger'}`}>{trade.result >= 0 ? '+' : ''}{currencySymbol}{trade.result.toFixed(2)}</p>
                                            </div>
                                            {trade.imageUrl && (
                                                <div className="mt-3 rounded-lg overflow-hidden border border-border">
                                                    <img src={trade.imageUrl} alt="Proof" className="w-full h-24 object-cover" />
                                                </div>
                                            )}
                                            {trade.notes && <p className="text-[11px] mt-3 pt-3 border-t border-border/50 text-muted-foreground italic font-medium leading-relaxed">"{trade.notes}"</p>}
                                            <div className="flex gap-2 justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingTrade(trade); setFormOpen(true); }} className="p-2 bg-muted/50 hover:bg-border rounded-xl transition-colors"><EditIcon className="w-4 h-4 text-muted-foreground"/></button>
                                                <button onClick={() => setTradeToDelete(trade)} className="p-2 bg-danger/5 hover:bg-danger/10 rounded-xl transition-colors"><TrashIcon className="w-4 h-4 text-danger"/></button>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30 opacity-50">
                                        <CalendarIcon className="w-12 h-12 mb-3" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">{t('noTradesOnThisDay')}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 p-8 text-center">
                            <CalendarIcon className="w-16 h-16 mb-4 opacity-10" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">{t('selectDayToViewTrades')}</p>
                        </div>
                    )}
                </div>
            </div>

            <TradeForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} trade={editingTrade} selectedDate={selectedDate} />
            
             {/* Delete Confirmation Modal */}
            <Modal isOpen={!!tradeToDelete} onClose={() => setTradeToDelete(null)} title={t('delete')}>
                <div className="space-y-6 text-center">
                    <div className="flex justify-center p-5 bg-danger/10 text-danger rounded-3xl w-fit mx-auto">
                         <AlertTriangleIcon className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight">{t('areYouSure')}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{t('deleteTradeConfirmation')}</p>
                    </div>
                    <div className="flex gap-3 justify-center pt-2">
                         <button onClick={() => setTradeToDelete(null)} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                         <button onClick={confirmDeleteTrade} className="px-6 py-2.5 bg-danger text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-danger/90 transition-all shadow-lg shadow-danger/20">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TradesPage;
