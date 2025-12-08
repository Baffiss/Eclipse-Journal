
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trade, TradeDirection } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, UploadCloudIcon, XIcon, FilterIcon, AlertTriangleIcon } from '../components/Icons';

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
    const { accounts, strategies, addTrade, updateTrade, t, language } = useApp();
    
    // Generate time options with 5-minute intervals
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
            lotSize: trade?.lotSize || 0.01,
            takeProfitPips: trade?.takeProfitPips || 20,
            stopLossPips: trade?.stopLossPips || 10,
            result: trade?.result || 0,
            notes: trade?.notes || '',
            imageUrl: trade?.imageUrl || '',
        };
    };
    
    const [formData, setFormData] = useState(getInitialFormData());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
        }
    }, [isOpen, trade, selectedDate, accounts]);

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
        
        // Parse time from the new selector
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
            hour: hours, // Maintain hour property for analytics grouping
            date: localDate.toISOString(),
        };

        // Remove the time property before sending to context as it is not part of Trade interface
        // (Though TypeScript interface might need update if we wanted to enforce it strictly, 
        // passing extra properties to JS object usually fine, but cleaner to conform)
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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium">{t('selectAccount')}</label>
                        <select name="accountId" value={formData.accountId} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" required>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('strategies')}</label>
                        <select name="strategyId" value={formData.strategyId} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            <option value="">{t('noStrategy')}</option>
                            {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium">{t('date')}</label>
                        <div className="w-full p-2 bg-muted border border-border rounded-md mt-1 h-[42px] flex items-center">
                            {new Date(`${formData.date}T00:00:00`).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('hour')}</label>
                        <select name="time" value={formData.time} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1 font-mono">
                            {timeOptions.map(tOption => <option key={tOption} value={tOption}>{tOption}</option>)}
                        </select>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('asset')}</label>
                        <input name="asset" value={formData.asset} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" required />
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium">{t('direction')}</label>
                        <select name="direction" value={formData.direction} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            <option value={TradeDirection.BUY}>Long</option>
                            <option value={TradeDirection.SELL}>Short</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('lotSize')}</label>
                        <input type="number" step="0.01" name="lotSize" value={formData.lotSize} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" />
                    </div>
                     <div>
                        <label className="text-sm font-medium">{t('takeProfitPips')}</label>
                        <input type="number" name="takeProfitPips" value={formData.takeProfitPips} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('stopLossPips')}</label>
                        <input type="number" name="stopLossPips" value={formData.stopLossPips} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('resultInDollars')}</label>
                        <input type="number" step="0.01" name="result" value={formData.result} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" required />
                    </div>
                </div>
                
                <div>
                    <label className="text-sm font-medium">{t('notes')}</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md min-h-[100px] mt-1"></textarea>
                </div>
                
                {formData.imageUrl ? (
                    <div className="relative">
                        <img src={formData.imageUrl} alt="Trade screenshot" className="max-h-48 w-auto rounded-md" />
                        <button type="button" onClick={() => setFormData(p => ({...p, imageUrl: ''}))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div>
                        <label className="text-sm font-medium">{t('uploadScreenshot')}</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground"/>
                                <div className="flex text-sm text-muted-foreground">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-bkg rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none">
                                        <span>{t('uploadScreenshot')}</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-muted rounded-md hover:bg-border">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">{trade ? t('update') : t('registerTrade')}</button>
                </div>
            </form>
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
        <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 rounded-full hover:bg-border"><ChevronLeftIcon /></button>
                <h3 className="text-lg font-semibold">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 rounded-full hover:bg-border"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-semibold">
                {dayNames.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {days.map(d => {
                    const tradesOnDay = trades.filter(t => isSameDay(new Date(t.date), d));
                    const dayProfit = tradesOnDay.reduce((sum, t) => sum + t.result, 0);
                    const isToday = isSameDay(d, new Date());
                    const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
                    const defaultCurrency = getCurrencySymbol(accounts.length > 0 ? accounts[0]?.currency : undefined);
                    return (
                        <div key={d.toString()} onClick={() => onDayClick(d)} className={`p-2 h-20 md:h-24 flex flex-col rounded-lg cursor-pointer transition-all duration-200 border-2 ${d.getMonth() !== currentDate.getMonth() ? 'bg-muted/50 text-muted-foreground/50' : 'bg-bkg hover:border-primary/50'} ${isSelected ? 'bg-primary/10 border-primary' : isToday ? 'border-primary/30' : 'border-transparent'}`}>
                            <span className="font-semibold">{d.getDate()}</span>
                            {tradesOnDay.length > 0 && (
                                <div className="mt-1 text-xs text-center flex-grow flex items-center justify-center">
                                    <span className={`px-2 py-1 rounded-md font-semibold ${dayProfit > 0 ? 'bg-success/20 text-success' : dayProfit < 0 ? 'bg-danger/20 text-danger' : 'bg-gray-500/20 text-gray-300'}`}>
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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('trades')}</h1>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-2 bg-muted text-content rounded-md hover:bg-border"
                    aria-label={t('toggleFilters')}
                >
                    <FilterIcon className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 animate-fade-in">
                            <select value={filterAccountId} onChange={e => setFilterAccountId(e.target.value)} className="w-full p-2 bg-muted border border-border rounded-md"><option value="">{t('allAccounts')}</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                            <select value={filterStrategyId} onChange={e => setFilterStrategyId(e.target.value)} className="w-full p-2 bg-muted border border-border rounded-md"><option value="">{t('allStrategies')}</option>{strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            <input value={filterAsset} onChange={e => setFilterAsset(e.target.value)} placeholder={t('filterByAsset')} className="w-full p-2 bg-muted border border-border rounded-md" />
                        </div>
                    )}
                    <CalendarView currentDate={currentDate} setCurrentDate={setCurrentDate} trades={filteredTrades} onDayClick={setSelectedDate} selectedDate={selectedDate} />
                </div>
                
                <div className="w-full lg:w-96 flex-shrink-0 bg-muted rounded-lg flex flex-col lg:max-h-[80vh]">
                     {selectedDate ? (
                        <>
                            <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                                <h2 className="text-lg font-semibold">{t('tradesOn')} {selectedDate.toLocaleDateString(language, {day: 'numeric', month: 'long'})}</h2>
                                <button 
                                    onClick={() => { setEditingTrade(null); setFormOpen(true); }}
                                    className="p-2 bg-primary text-bkg rounded-full hover:bg-primary-focus shadow-sm hover:shadow-md transition-shadow disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                    aria-label={t('registerTrade')}
                                    disabled={accounts.length === 0}
                                    title={accounts.length === 0 ? t('createAccountFirst') : t('registerTrade')}
                                >
                                    <PlusIcon className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="overflow-y-auto p-3 space-y-3">
                                {tradesForSelectedDate.length > 0 ? tradesForSelectedDate.map(trade => {
                                    const account = accounts.find(a => a.id === trade.accountId);
                                    const currencySymbol = getCurrencySymbol(account?.currency);
                                    return (
                                        <div key={trade.id} className="p-3 bg-bkg rounded-lg shadow-sm border border-border animate-slide-in-up">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-base">{trade.asset} 
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                                                            trade.direction === 'Buy' 
                                                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                                                                : 'bg-red-500/20 text-red-700 dark:text-red-300'
                                                        }`}>
                                                            {trade.direction === 'Buy' ? 'Long' : 'Short'}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{account?.name || 'N/A'}</p>
                                                </div>
                                                <p className={`font-semibold text-lg ${trade.result >= 0 ? 'text-success' : 'text-danger'}`}>{trade.result >= 0 ? '+' : ''}{currencySymbol}{trade.result.toFixed(2)}</p>
                                            </div>
                                            {trade.imageUrl && <a href={trade.imageUrl} target="_blank" rel="noopener noreferrer"><img src={trade.imageUrl} alt={`Trade on ${trade.asset}`} className="max-h-32 w-auto rounded-md mt-2 cursor-pointer" /></a>}
                                            {trade.notes && <p className="text-sm mt-2 pt-2 border-t border-border whitespace-pre-wrap">{trade.notes}</p>}
                                            <div className="flex gap-2 justify-end mt-2">
                                                <button onClick={() => { setEditingTrade(trade); setFormOpen(true); }} className="p-1.5 hover:bg-border rounded-md text-muted-foreground hover:text-content transition-colors"><EditIcon className="w-4 h-4"/></button>
                                                <button onClick={() => setTradeToDelete(trade)} className="p-1.5 hover:bg-border rounded-md text-danger transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    )
                                }) : <p className="p-8 text-center text-muted-foreground">{t('noTradesOnThisDay')}</p>}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground flex items-center justify-center h-full">
                            <p>{t('selectDayToViewTrades')}</p>
                        </div>
                    )}
                </div>
            </div>

            <TradeForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} trade={editingTrade} selectedDate={selectedDate} />
            
             {/* Delete Trade Confirmation Modal */}
            <Modal isOpen={!!tradeToDelete} onClose={() => setTradeToDelete(null)} title={t('delete')}>
                <div className="space-y-4 text-center">
                    <div className="flex justify-center text-danger mb-2">
                         <AlertTriangleIcon className="w-12 h-12" />
                    </div>
                    <p>{t('deleteTradeConfirmation')}</p>
                    <div className="flex gap-2 justify-center mt-6">
                         <button onClick={() => setTradeToDelete(null)} className="px-4 py-2 bg-muted rounded-md hover:bg-border">{t('cancel')}</button>
                         <button onClick={confirmDeleteTrade} className="px-4 py-2 bg-danger text-bkg rounded-md hover:bg-danger/90">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TradesPage;
