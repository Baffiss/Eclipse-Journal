
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Trade, TradeDirection, TradePreset, AccountStatus } from '../types';
import Modal from '../components/Modal';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UploadCloudIcon,
  XIcon,
  FilterIcon,
  AlertTriangleIcon,
  ZapIcon,
  SaveIcon,
  CalendarIcon,
  ActivityIcon,
  BarChart3Icon,
  CameraIcon,
  ChevronDownIcon,
  TargetIcon
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

const getCurrentTime = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const WinLossPie: React.FC<{ wins: number; losses: number; size?: number; fontSize?: string }> = ({ wins, losses, size = 60, fontSize }) => {
  const winRate = useMemo(() => {
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }, [wins, losses]);

  const data = useMemo(() => [
    { name: 'Wins', value: wins || (wins + losses === 0 ? 1 : 0), color: 'hsl(var(--success))' },
    { name: 'Losses', value: losses, color: 'hsl(var(--danger))' }
  ], [wins, losses]);

  const dynamicFontSize = fontSize || `${size * 0.18}px`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={size * 0.28}
            outerRadius={size * 0.44}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} opacity={wins + losses === 0 && index === 0 ? 0.2 : 1} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-black leading-none" style={{ fontSize: dynamicFontSize }}>
          {wins + losses > 0 ? `${winRate}%` : '--'}
        </span>
      </div>
    </div>
  );
};

const TradeForm: React.FC<{ isOpen: boolean; onClose: () => void; trade?: Trade | null; selectedDate?: Date | null }> = ({ isOpen, onClose, trade, selectedDate }) => {
  const { accounts, strategies, presets, addTrade, updateTrade, addPreset, t, language } = useApp();
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const activeAccounts = useMemo(() => accounts.filter(acc => acc.status === AccountStatus.ACTIVE), [accounts]);
  
  const getInitialFormData = () => {
    const tradeDate = trade ? new Date(trade.date) : (selectedDate || new Date());
    return {
      accountId: trade?.accountId || activeAccounts[0]?.id || '',
      strategyId: trade?.strategyId || '',
      date: getLocalDateString(tradeDate),
      time: trade ? new Date(trade.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : getCurrentTime(),
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
  }, [isOpen, trade, selectedDate, activeAccounts]);

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
      stopLossPips: Number(formData.stopLossPips) 
    };
    addPreset(preset); 
    setShowSavePreset(false); 
    setNewPresetName('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files && e.target.files[0]) { 
      const base64 = await fileToBase64(e.target.files[0]); 
      setFormData(prev => ({ ...prev, imageUrl: base64 })); 
    } 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { 
    const { name, value } = e.target; 
    setFormData(prev => ({ ...prev, [name]: value })); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [hours, minutes] = formData.time.split(':').map(Number);
    const localDate = new Date(`${formData.date}T00:00:00`);
    localDate.setHours(hours); localDate.setMinutes(minutes || 0);
    const tradeData = { 
      ...formData, 
      lotSize: Number(formData.lotSize), 
      takeProfitPips: Number(formData.takeProfitPips), 
      stopLossPips: Number(formData.stopLossPips), 
      result: parseFloat(String(formData.result)) || 0, 
      hour: hours, 
      date: localDate.toISOString() 
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
        {!trade && (
          <div className="bg-muted/30 p-4 rounded-2xl border border-border">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('selectPreset')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select onChange={(e) => handlePresetSelect(e.target.value)} className="w-full p-2.5 bg-bkg border border-border rounded-xl text-xs font-black uppercase appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all" defaultValue="">
                  <option value="" disabled>{t('selectPreset')}...</option>
                  {presets.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.asset || 'N/A'})</option>))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {presets.length > 0 && (<div className="flex items-center text-primary px-1"><ZapIcon className="w-4 h-4" /></div>)}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('selectAccount')}</label>
              <div className="relative mt-1">
                <select name="accountId" value={formData.accountId} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl font-black uppercase text-xs appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all" required>
                  {!trade 
                    ? activeAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
                    : accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)
                  }
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('strategies')}</label>
              <div className="relative mt-1">
                <select name="strategyId" value={formData.strategyId} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl font-black uppercase text-xs appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value="">{t('noStrategy')}</option>
                  {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('date')}</label>
              <div className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 h-[38px] flex items-center text-xs font-black uppercase">{new Date(`${formData.date}T00:00:00`).toLocaleDateString(language, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('hour')}</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 font-black text-xs h-[38px] outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('asset')}</label>
              <input name="asset" value={formData.asset} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 font-black uppercase text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all" required placeholder="e.g. NAS100" />
            </div>
            <div className="relative">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('direction')}</label>
              <div className="relative mt-1">
                <select name="direction" value={formData.direction} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl font-black uppercase text-xs appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                  <option value={TradeDirection.BUY}>{t('buy')}</option>
                  <option value={TradeDirection.SELL}>{t('sell')}</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('lotSize')}</label>
              <input type="number" step="0.01" name="lotSize" value={formData.lotSize} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 font-black text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-success pl-1 block">{t('takeProfitPips')}</label>
              <input type="number" name="takeProfitPips" value={formData.takeProfitPips} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 font-black text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-danger pl-1 block">{t('stopLossPips')}</label>
              <input type="number" name="stopLossPips" value={formData.stopLossPips} onChange={handleChange} className="w-full p-2.5 bg-muted border border-border rounded-xl mt-1 font-black text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            {!trade && (<div className="md:col-span-2 border-t border-border/50 pt-4 mt-2">{!showSavePreset ? (<button type="button" onClick={() => setShowSavePreset(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-all mb-4"><SaveIcon className="w-4 h-4" />{t('saveAsPreset')}</button>) : (<div className="flex gap-2 animate-fade-in mb-4"><input value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder={t('presetName')} className="flex-1 p-2.5 bg-muted border border-border rounded-xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all" /><button onClick={handleSaveCurrentAsPreset} className="px-4 py-2 bg-primary text-bkg rounded-xl text-[10px] font-black uppercase tracking-widest">{t('save')}</button><button onClick={() => setShowSavePreset(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest">{t('cancel')}</button></div>)}</div>)}
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('resultInDollars')}</label>
              <input type="number" step="0.01" name="result" value={formData.result} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl mt-1 text-2xl font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all" required />
            </div>
          </div>
          <div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('notes')}</label><textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Psychology, context..." className="w-full p-4 bg-muted border border-border rounded-xl mt-1 min-h-[100px] text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"></textarea></div>
          {formData.imageUrl ? (<div className="relative group"><img src={formData.imageUrl} alt="Trade screenshot" className="max-h-64 w-full object-cover rounded-2xl border border-border" /><button type="button" onClick={() => setFormData(p => ({ ...p, imageUrl: '' }))} className="absolute top-3 right-3 bg-black/50 p-2 rounded-full text-white hover:bg-danger transition-colors"><XIcon className="w-4 h-4" /></button></div>) : (<div><label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1 block">{t('uploadScreenshot')}</label><div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-border border-dashed rounded-[2rem] bg-muted/30"><div className="space-y-2 text-center"><UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-30" /><div className="flex text-xs text-muted-foreground"><label htmlFor="file-upload" className="relative cursor-pointer font-black text-primary hover:underline uppercase tracking-widest text-[10px]"><span>{t('uploadScreenshot')}</span><input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" /></label></div></div></div></div>)}
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50"><button type="button" onClick={onClose} className="px-8 py-3 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button><button type="submit" className="px-8 py-3 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">{trade ? t('update') : t('registerTrade')}</button></div>
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
  const startDate = new Date(monthStart); startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd); endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  const days = []; let day = new Date(startDate); while (day <= endDate) { days.push(new Date(day)); day.setDate(day.getDate() + 1); }
  const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  const dayNames = useMemo(() => { const formatter = new Intl.DateTimeFormat(language, { weekday: 'short' }); return Array.from({ length: 7 }, (_, i) => { const date = new Date(2023, 0, i + 1); return formatter.format(date); }); }, [language]);
  
  return (
    <div className="bg-muted/30 border border-border rounded-[2.5rem] p-4 sm:p-8 h-full transition-all duration-500 ease-in-out">
      <div className="flex justify-between items-center mb-8">
        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 rounded-xl bg-bkg border border-border hover:bg-muted transition-colors"><ChevronLeftIcon className="w-6 h-6" /></button>
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">{currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 rounded-xl bg-bkg border border-border hover:bg-muted transition-colors"><ChevronRightIcon className="w-6 h-6" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4">
        {dayNames.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-3 mt-2 transition-all duration-500">
        {days.map(d => {
          const tradesOnDay = trades.filter(t => isSameDay(new Date(t.date), d));
          const dayProfit = tradesOnDay.reduce((sum, t) => sum + t.result, 0);
          const hasTrades = tradesOnDay.length > 0;
          const isWin = hasTrades && dayProfit > 0;
          const isLoss = hasTrades && dayProfit < 0;
          const isToday = isSameDay(d, new Date());
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          const defaultCurrency = getCurrencySymbol(accounts.length > 0 ? accounts[0]?.currency : undefined);
          
          let bgClasses = "bg-bkg hover:border-primary/50 shadow-sm"; 
          let borderClasses = "border-transparent";
          
          if (d.getMonth() !== currentDate.getMonth()) { 
            bgClasses = "bg-transparent text-muted-foreground/20 border-transparent opacity-40 pointer-events-none"; 
          } else if (hasTrades) { 
            if (isWin) { 
              bgClasses = "bg-success/5 hover:bg-success/10 shadow-lg shadow-success/5"; 
              borderClasses = "border-success/30"; 
            } else if (isLoss) { 
              bgClasses = "bg-danger/5 hover:bg-danger/10 shadow-lg shadow-danger/5"; 
              borderClasses = "border-danger/30"; 
            } 
          }
          
          return (
            <div key={d.toString()} onClick={() => onDayClick(d)} className={`group relative p-1.5 sm:p-3 h-16 sm:h-24 md:h-28 flex flex-col rounded-xl sm:rounded-2xl cursor-pointer transition-all duration-300 border-2 ${bgClasses} ${borderClasses} ${isSelected ? 'border-primary bg-primary/10 ring-4 ring-primary/5 scale-[1.02] z-10' : isToday ? 'border-primary/30' : ''}`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] sm:text-xs font-black ${isSelected ? 'text-primary' : 'text-content/80'}`}>{d.getDate()}</span>
                {hasTrades && (<div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isWin ? 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.8)]' : isLoss ? 'bg-danger shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-muted-foreground'}`} />)}
              </div>
              {hasTrades && (<div className="mt-auto text-center flex-grow flex items-center justify-center animate-fade-in"><span className={`text-[8px] sm:text-[11px] font-black px-1.5 py-0.5 sm:py-1 rounded-lg backdrop-blur-sm ${isWin ? 'bg-success/20 text-success' : isLoss ? 'bg-danger/20 text-danger' : 'bg-muted-foreground/20 text-muted-foreground'}`}>{dayProfit >= 0 ? '+' : ''}{dayProfit.toFixed(0)}{defaultCurrency}</span></div>)}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 sm:h-1.5 rounded-t-full transition-all duration-300 group-hover:w-2/3 ${isWin ? 'bg-success/50' : isLoss ? 'bg-danger/50' : 'bg-primary/50'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TradesPage: React.FC = () => {
  const { trades, accounts, strategies, deleteTrade, t, language, getCurrencySymbol, focusedTradeId } = useApp();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterStrategyId, setFilterStrategyId] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { 
    if (focusedTradeId) { 
      const trade = trades.find(t => t.id === focusedTradeId); 
      if (trade) { 
        const tradeDate = new Date(trade.date); 
        setSelectedDate(tradeDate); 
        setCurrentDate(tradeDate); 
      } 
    } 
  }, [focusedTradeId, trades]);

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  };

  const activeAccounts = useMemo(() => accounts.filter(acc => acc.status === AccountStatus.ACTIVE), [accounts]);

  const filteredTrades = useMemo(() => trades.filter(trade => { 
    if (filterAccountId && trade.accountId !== filterAccountId) return false; 
    if (filterStrategyId && trade.strategyId !== filterStrategyId) return false; 
    if (filterAsset && !trade.asset.toLowerCase().includes(filterAsset.toLowerCase())) return false; 
    return true; 
  }), [trades, filterAccountId, filterStrategyId, filterAsset]);

  const tradesForSelectedDate = useMemo(() => { 
    if (!selectedDate) return []; 
    return filteredTrades.filter(t => new Date(t.date).toDateString() === selectedDate.toDateString()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); 
  }, [filteredTrades, selectedDate]);

  const currencySymbol = useMemo(() => getCurrencySymbol(accounts[0]?.currency), [accounts, getCurrencySymbol]);

  const annualSummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const annualTrades = filteredTrades.filter(t => new Date(t.date).getFullYear() === year);
    const profit = annualTrades.reduce((sum, t) => sum + t.result, 0);
    const wins = annualTrades.filter(t => t.result > 0).length;
    const losses = annualTrades.filter(t => t.result <= 0).length;
    return { profit, wins, losses };
  }, [filteredTrades, currentDate]);

  const monthSummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthTrades = filteredTrades.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalProfit = monthTrades.reduce((sum, t) => sum + t.result, 0);
    const totalWins = monthTrades.filter(t => t.result > 0).length;
    const totalLosses = monthTrades.filter(t => t.result <= 0).length;

    const weeks: { week: number; profit: number; wins: number; losses: number; start: Date; end: Date }[] = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let currentStart = new Date(firstDayOfMonth);
    currentStart.setDate(currentStart.getDate() - currentStart.getDay()); 

    while (currentStart <= lastDayOfMonth) {
      const weekEnd = new Date(currentStart);
      weekEnd.setDate(currentStart.getDate() + 6);
      
      const weekTrades = monthTrades.filter(t => {
        const d = new Date(t.date);
        return d >= currentStart && d <= weekEnd;
      });

      const weekProfit = weekTrades.reduce((sum, t) => sum + t.result, 0);
      const weekWins = weekTrades.filter(t => t.result > 0).length;
      const weekLosses = weekTrades.filter(t => t.result <= 0).length;
      
      if (weekTrades.length > 0 || (currentStart <= lastDayOfMonth && weekEnd >= firstDayOfMonth)) {
        weeks.push({
          week: Math.ceil((currentStart.getDate() + (currentStart.getMonth() !== month ? 0 : firstDayOfMonth.getDay())) / 7),
          profit: weekProfit,
          wins: weekWins,
          losses: weekLosses,
          start: new Date(currentStart),
          end: weekEnd
        });
      }

      currentStart.setDate(currentStart.getDate() + 7);
    }

    return { totalProfit, totalWins, totalLosses, weeks };
  }, [currentDate, filteredTrades]);

  const confirmDeleteTrade = () => { 
    if (tradeToDelete) { 
      deleteTrade(tradeToDelete); 
      setTradeToDelete(null); 
    } 
  };
  
  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-[1600px] mx-auto w-full text-content pb-12">
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-muted/20 border border-border rounded-[2.5rem] p-6 sm:p-8 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10 w-full sm:w-auto">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">{t('trades')}</h1>
          <div className={`flex items-center justify-between gap-6 px-6 py-3 rounded-3xl border backdrop-blur-md transition-all shadow-xl flex-1 sm:flex-initial ${annualSummary.profit >= 0 ? 'bg-success/5 border-success/20 text-success' : 'bg-danger/5 border-danger/20 text-danger'}`}>
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] opacity-60 mb-1">{currentDate.getFullYear()} {t('annualPnL')}</span>
              <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none">{annualSummary.profit >= 0 ? '+' : ''}{currencySymbol}{annualSummary.profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center">
              <WinLossPie wins={annualSummary.wins} losses={annualSummary.losses} size={50} />
            </div>
          </div>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-4 rounded-2xl transition-all duration-300 ${showFilters ? 'bg-primary text-bkg shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-border'}`}>
          <FilterIcon className="w-6 h-6" />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 p-8 bg-muted/20 border border-border rounded-[2.5rem] animate-slide-in-up">
          <div className="relative">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">{t('accounts')}</label>
            <div className="relative">
              <select value={filterAccountId} onChange={e => setFilterAccountId(e.target.value)} className="w-full p-4 bg-bkg border border-border rounded-2xl text-xs font-black uppercase appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="">{t('allAccounts')}</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="relative">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">{t('strategies')}</label>
            <div className="relative">
              <select value={filterStrategyId} onChange={e => setFilterStrategyId(e.target.value)} className="w-full p-4 bg-bkg border border-border rounded-2xl text-xs font-black uppercase appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="">{t('allStrategies')}</option>
                {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">{t('asset')}</label>
            <input value={filterAsset} onChange={e => setFilterAsset(e.target.value)} placeholder={t('filterByAsset')} className="w-full p-4 bg-bkg border border-border rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-8 items-stretch min-h-[600px]">
        <div className={`transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${selectedDate ? 'xl:flex-[2.5]' : 'xl:flex-1'} w-full`}>
          <CalendarView 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            trades={filteredTrades} 
            onDayClick={handleDayClick} 
            selectedDate={selectedDate} 
          />
        </div>
        
        {/* Sidebar Container */}
        <div 
          className={`
            flex flex-col flex-shrink-0 bg-muted/20 border border-border rounded-[2.5rem] 
            shadow-2xl backdrop-blur-xl overflow-hidden
            transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
            w-full xl:w-[480px] min-h-[500px] xl:min-h-full
          `}
        >
          {selectedDate ? (
            <div key="day-view" className="flex flex-col flex-1 h-full animate-fade-in">
              <div className="p-6 sm:p-8 border-b border-border/50 flex justify-between items-center bg-muted/10 flex-shrink-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-content leading-none">
                    {selectedDate.toLocaleDateString(language, { day: 'numeric', month: 'long' })}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                    {tradesForSelectedDate.length} {t('trades')} {t('dailyOverview')}
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button 
                    onClick={() => { setEditingTrade(null); setFormOpen(true); }} 
                    className="p-3 sm:p-4 bg-primary text-bkg rounded-2xl hover:bg-primary-focus shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={activeAccounts.length === 0} 
                    title={activeAccounts.length === 0 ? t('noActiveAccounts') : t('registerTrade')}
                  >
                    <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button onClick={() => setSelectedDate(null)} className="p-3 sm:p-4 bg-muted/50 text-muted-foreground rounded-2xl hover:bg-danger hover:text-white transition-all active:scale-95" title={t('cancel')}>
                    <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-1 overflow-y-auto scrollbar-thin max-h-[600px] xl:max-h-none">
                {tradesForSelectedDate.length > 0 ? tradesForSelectedDate.map(trade => { 
                  const account = accounts.find(a => a.id === trade.accountId); 
                  const currencySym = getCurrencySymbol(account?.currency); 
                  const isFocused = trade.id === focusedTradeId; 
                  const isWin = trade.result >= 0;
                  return (
                    <div key={trade.id} className={`group relative p-4 sm:p-5 rounded-[1.5rem] shadow-sm border transition-all animate-slide-in-up ${isFocused ? 'bg-primary/5 border-primary ring-2 ring-primary/20 scale-[1.02]' : 'bg-bkg border-border hover:border-primary/40'}`}>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-black text-base sm:text-lg uppercase tracking-tight text-content flex items-center gap-2 truncate">
                            {trade.asset} 
                            <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-widest flex-shrink-0 ${trade.direction === 'Buy' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                              {trade.direction === 'Buy' ? t('buy').charAt(0) : t('sell').charAt(0)}
                            </span>
                          </p>
                          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70 truncate">
                            {account?.name || 'Account'} • {new Date(trade.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className={`font-black text-lg sm:text-xl tracking-tighter ml-2 flex-shrink-0 ${isWin ? 'text-success' : 'text-danger'}`}>
                          {isWin ? '+' : ''}{currencySym}{trade.result.toFixed(2)}
                        </p>
                      </div>
                      {trade.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-border cursor-zoom-in relative group/img shadow-sm" onClick={() => setLightboxImage(trade.imageUrl!)}>
                          <img src={trade.imageUrl} alt="Proof" className="w-full h-24 object-cover transition-transform duration-500 group-hover/img:scale-105" />
                        </div>
                      )}
                      {trade.notes && <p className="mt-3 text-[9px] sm:text-[10px] text-muted-foreground italic font-medium leading-relaxed line-clamp-2">"{trade.notes}"</p>}
                      <div className="flex gap-2 justify-end mt-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingTrade(trade); setFormOpen(true); }} className="p-2 bg-muted/50 hover:bg-border rounded-lg transition-colors"><EditIcon className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => setTradeToDelete(trade)} className="p-2 bg-danger/5 hover:bg-danger/10 rounded-lg transition-colors"><TrashIcon className="w-4 h-4 text-danger" /></button>
                      </div>
                    </div>
                  ); 
                }) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 opacity-50 py-10">
                    <CalendarIcon className="w-16 h-16 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">{t('noTradesOnThisDay')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key="summary-view" className="flex flex-col flex-1 h-full animate-fade-in">
              {/* Month Summary Header */}
              <div className="p-6 sm:p-8 border-b border-border/50 bg-muted/10 flex-shrink-0 relative overflow-hidden flex items-center justify-between min-h-[140px] sm:min-h-[160px]">
                <div className="absolute top-0 right-0 w-32 sm:w-48 h-32 sm:h-48 blur-[80px] sm:blur-[100px] opacity-20 bg-primary rounded-full -mr-16 sm:-mr-24 -mt-16 sm:-mt-24" />
                <div className="relative z-10 text-left flex-1 pr-4">
                  <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.35em] text-muted-foreground mb-2 opacity-80">{t('monthPerformance')}</p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter text-content mb-1 leading-none">
                    {currentDate.toLocaleDateString(language, { month: 'long' })}
                  </h2>
                  <div className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tighter flex items-center gap-2 ${monthSummary.totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                    <span className="opacity-50 text-lg sm:text-xl font-black">{monthSummary.totalProfit >= 0 ? '+' : ''}</span>
                    {currencySymbol}{Math.abs(monthSummary.totalProfit).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="relative z-10 flex-shrink-0 -mr-2 sm:-mr-4">
                  <WinLossPie wins={monthSummary.totalWins} losses={monthSummary.totalLosses} size={80} fontSize="14px" />
                </div>
              </div>

              {/* Weekly Breakdown Recuadros */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col min-h-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg"><BarChart3Icon className="w-4 h-4 text-primary" /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">{t('weeklyBreakdown')}</h3>
                </div>
                
                <div className="flex-1 flex flex-col gap-2 overflow-hidden pb-2">
                  {monthSummary.weeks.map((week, idx) => {
                    const isPositive = week.profit >= 0;
                    return (
                      <div 
                        key={idx} 
                        className="group p-3 sm:p-4 bg-bkg border border-border rounded-2xl transition-all hover:border-primary/40 hover:shadow-lg flex items-center justify-between flex-1 min-h-[60px] sm:min-h-0"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5 opacity-80">
                            {t('week')} {week.week || (idx + 1)}
                          </p>
                          <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground opacity-40 uppercase tracking-widest leading-none truncate">
                            {week.start.toLocaleDateString(language, { day: 'numeric', month: 'short' })} - {week.end.toLocaleDateString(language, { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <WinLossPie wins={week.wins} losses={week.losses} size={36} fontSize="7px" />
                          <div className="text-right min-w-[70px] sm:min-w-[90px]">
                            <div className={`flex items-center justify-end gap-1 font-black text-base sm:text-lg md:text-xl tracking-tighter ${isPositive ? 'text-success' : 'text-danger'}`}>
                              <span className="text-[10px] opacity-50">{isPositive ? '+' : '-'}</span>
                              {currencySymbol}{Math.abs(week.profit).toLocaleString()}
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mt-0.5 leading-none">{week.wins + week.losses} {t('trades')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {monthSummary.weeks.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 opacity-50 py-10">
                      <CalendarIcon className="w-10 h-10 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('noTradesRecorded')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-muted/5 border-t border-border/50 text-center flex-shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/70 animate-pulse">{t('selectDayForDetails')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <TradeForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} trade={editingTrade} selectedDate={selectedDate} />
      
      {/* Modals remaining the same */}
      <Modal isOpen={!!tradeToDelete} onClose={() => setTradeToDelete(null)} title={t('delete')}>
        <div className="space-y-8 text-center py-4">
          <div className="flex justify-center p-6 bg-danger/10 text-danger rounded-[2rem] w-fit mx-auto border border-danger/20 shadow-inner">
            <AlertTriangleIcon className="w-12 h-12" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black uppercase tracking-tight text-content">{t('areYouSure')}</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed px-6">{t('deleteTradeConfirmation')}</p>
          </div>
          <div className="flex gap-4 justify-center pt-4">
            <button onClick={() => setTradeToDelete(null)} className="flex-1 px-8 py-4 bg-muted rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
            <button onClick={confirmDeleteTrade} className="flex-1 px-8 py-4 bg-danger text-bkg rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-danger/90 transition-all shadow-xl shadow-danger/30">{t('delete')}</button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={!!lightboxImage} onClose={() => setLightboxImage(null)} title={t('viewScreenshot')} maxWidth="max-w-7xl">
        <div className="flex justify-center items-center overflow-hidden bg-black rounded-[2.5rem] p-4 min-h-[500px] shadow-2xl">
          <img src={lightboxImage || ''} alt="Screenshot Full View" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl animate-fade-in" />
        </div>
        <div className="flex justify-center mt-8">
          <button onClick={() => setLightboxImage(null)} className="px-10 py-4 bg-primary text-bkg rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-xl shadow-primary/30 flex items-center gap-3 active:scale-95">
            <XIcon className="w-5 h-5" /> {t('cancel')}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TradesPage;
