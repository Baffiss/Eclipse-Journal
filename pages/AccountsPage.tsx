
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Account, DrawdownType, Trade, ValueType, AccountStatus, AccountType, Currency, Withdrawal } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, TrashIcon, TargetIcon, TrendingDownIcon, InfoIcon, AlertTriangleIcon, FilterIcon, ChevronLeftIcon, BanknoteIcon, CalendarIcon } from '../components/Icons';
import EquityChart from '../components/charts/EquityChart';
import { calculateEquityCurve, calculateAccountStats } from '../services/analytics';

const AccountForm: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    account?: Account | null;
}> = ({ isOpen, onClose, account }) => {
    const { strategies, addAccount, updateAccount, t } = useApp();
    
    const getInitialState = () => ({
        name: account?.name || '',
        initialCapital: account?.initialCapital || 10000,
        currency: account?.currency || Currency.USD,
        profitTarget: account?.profitTarget || 10,
        profitTargetType: account?.profitTargetType || ValueType.PERCENTAGE,
        drawdownType: account?.drawdownType || DrawdownType.MAXIMUM,
        drawdownValue: account?.drawdownValue || 5,
        drawdownValueType: account?.drawdownValueType || ValueType.PERCENTAGE,
        strategyId: account?.strategyId || '',
        status: account?.status || AccountStatus.ACTIVE,
        accountType: account?.accountType || AccountType.REAL,
        totalWithdrawn: account?.totalWithdrawn || 0,
    });

    const [formData, setFormData] = useState(getInitialState());

    React.useEffect(() => {
        if(isOpen) {
            setFormData(getInitialState());
        }
    }, [isOpen, account]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['initialCapital', 'profitTarget', 'drawdownValue'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (account) {
            updateAccount({ ...account, ...formData });
        } else {
            const newAccount: Account = {
                id: crypto.randomUUID(),
                ...formData,
                currentCapital: formData.initialCapital,
            };
            addAccount(newAccount);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={account ? t('editAccount') : t('createAccount')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('accountName')}</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="My Funded Account" required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('initialCapital')}</label>
                        <input type="number" name="initialCapital" value={formData.initialCapital} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" required />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('currency')}</label>
                        <select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            {Object.values(Currency).map(c => <option key={c} value={c}>{t(c.toLowerCase())}</option>)}
                        </select>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('profitTarget')}</label>
                        <div className="flex gap-3">
                            <input type="number" name="profitTarget" value={formData.profitTarget} onChange={handleChange} className="flex-1 p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" required />
                            <select name="profitTargetType" value={formData.profitTargetType} onChange={handleChange} className="w-32 p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                <option value={ValueType.PERCENTAGE}>{t('percentage')}</option>
                                <option value={ValueType.FIXED}>{t('fixed')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('drawdownType')}</label>
                         <select name="drawdownType" value={formData.drawdownType} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            <option value={DrawdownType.MAXIMUM}>{t('maximumDrawdown')}</option>
                            <option value={DrawdownType.TRAILING}>{t('trailingDrawdown')}</option>
                        </select>
                    </div>

                     <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('drawdownValue')}</label>
                        <div className="flex gap-3">
                            <input type="number" name="drawdownValue" value={formData.drawdownValue} onChange={handleChange} className="flex-1 p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" required />
                             <select name="drawdownValueType" value={formData.drawdownValueType} onChange={handleChange} className="w-32 p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                <option value={ValueType.PERCENTAGE}>{t('percentage')}</option>
                                <option value={ValueType.FIXED}>{t('fixed')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('status')}</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            <option value={AccountStatus.ACTIVE}>{t('active')}</option>
                            <option value={AccountStatus.INACTIVE}>{t('inactive')}</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{t('accountType')}</label>
                        <select name="accountType" value={formData.accountType} onChange={handleChange} className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                            <option value={AccountType.EVAL}>{t('evaluation')}</option>
                             <option value={AccountType.DEMO}>{t('demo')}</option>
                            <option value={AccountType.REAL}>{t('real')}</option>
                             <option value={AccountType.PA}>{t('proprietary')}</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg shadow-primary/20">{account ? t('update') : t('create')}</button>
                </div>
            </form>
        </Modal>
    );
};

const WithdrawForm: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    account: Account;
}> = ({ isOpen, onClose, account }) => {
    const { withdrawFunds, t, getCurrencySymbol } = useApp();
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState('');
    const currencySymbol = getCurrencySymbol(account.currency);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) return;
        
        if (amount > account.currentCapital) {
            setError(t('insufficientFunds'));
            return;
        }

        const withdrawal: Withdrawal = {
            id: crypto.randomUUID(),
            accountId: account.id,
            amount,
            date: new Date().toISOString(),
        };

        withdrawFunds(withdrawal);
        onClose();
        setAmount(0);
        setError('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('withdraw')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1 block">
                        {t('withdrawAmount')} ({currencySymbol})
                    </label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
                        className="w-full p-3 bg-muted border border-border rounded-xl font-bold text-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                        placeholder="0.00" 
                        autoFocus
                    />
                    {error && <p className="text-danger text-[10px] font-black uppercase mt-2">{error}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg shadow-primary/20">
                        {t('withdraw')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const ProgressBar: React.FC<{ value: number; colorClass: string; }> = ({ value, colorClass }) => (
    <div className="w-full bg-muted rounded-full h-2 shadow-inner">
        <div 
            className={`${colorClass} h-2 rounded-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_10px_rgba(0,0,0,0.1)]`} 
            style={{ width: `${Math.max(2, Math.min(value, 100))}%` }}
        />
    </div>
);

const AccountCard: React.FC<{ account: Account; onSelect: () => void }> = ({ account, onSelect }) => {
    const { getCurrencySymbol, t, trades } = useApp();
    const currencySymbol = getCurrencySymbol(account.currency);

    const stats = useMemo(() => calculateAccountStats(account, trades), [account, trades]);
    const profit = stats.equity - account.initialCapital;
    
    const typeColors: Record<AccountType, string> = {
        [AccountType.EVAL]: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        [AccountType.DEMO]: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
        [AccountType.REAL]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        [AccountType.PA]: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    };

    return (
        <div 
            onClick={onSelect} 
            className="group bg-bkg border border-border rounded-[2.5rem] p-8 cursor-pointer hover:border-primary/40 transition-all duration-500 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] flex flex-col justify-between animate-slide-in-up relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity bg-primary rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <h3 className="font-black text-2xl tracking-tight group-hover:text-primary transition-colors">{account.name}</h3>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">ID: {account.id.slice(0, 8)}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${typeColors[account.accountType]}`}>{t(account.accountType.toLowerCase())}</span>
                    </div>
                 </div>
                <p className="text-4xl font-black tracking-tighter leading-none mb-1">{currencySymbol}{account.currentCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-black px-2 py-0.5 rounded-md ${profit >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {profit >= 0 ? <PlusIcon className="w-3 h-3" /> : ''}{currencySymbol}{Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
            </div>
            
            <div className="mt-10 space-y-6 relative z-10">
                 <div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        <span>{t('progressToTarget')}</span>
                        <span className="text-success font-black">{stats.profitProgress.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={stats.profitProgress} colorClass="bg-success" />
                </div>
                <div>
                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        <span>{t('drawdownLimit')}</span>
                        <span className="text-danger font-black">{stats.drawdownProgress.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={stats.drawdownProgress} colorClass="bg-danger" />
                </div>
            </div>
        </div>
    );
};


const AccountDetailView: React.FC<{ account: Account; onBack: () => void }> = ({ account, onBack }) => {
    const { trades, withdrawals, deleteAccount, t, getCurrencySymbol } = useApp();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [withdrawalAccount, setWithdrawalAccount] = useState<Account | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'trades' | 'withdrawals'>('trades');

    const accountTrades = useMemo(() => trades.filter(t => t.accountId === account.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [trades, account.id]);
    const accountWithdrawals = useMemo(() => withdrawals.filter(w => w.accountId === account.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [withdrawals, account.id]);
    const equityCurve = useMemo(() => calculateEquityCurve(accountTrades, account.initialCapital, account), [accountTrades, account.initialCapital, account]);
    const currencySymbol = getCurrencySymbol(account.currency);

    const profit = account.currentCapital + (account.totalWithdrawn || 0) - account.initialCapital;
    const profitPercent = account.initialCapital !== 0 ? (profit / account.initialCapital) * 100 : 0;
    
    const profitTargetValue = account.profitTargetType === ValueType.PERCENTAGE
        ? account.initialCapital * (1 + account.profitTarget / 100)
        : account.initialCapital + account.profitTarget;

    const confirmDelete = () => {
        deleteAccount(account.id);
        setShowDeleteConfirm(false);
        onBack();
    }

    return (
        <div className="animate-fade-in flex flex-col gap-10">
            {/* Header Section */}
            <div className="bg-muted/30 border border-border rounded-[3rem] p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-10 bg-primary rounded-full -mr-32 -mt-32" />
                
                <div className="relative z-10">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-8">
                        <ChevronLeftIcon className="w-4 h-4"/> {t('backToAccounts')}
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-5xl font-black tracking-tighter uppercase">{account.name}</h2>
                                <span className="px-3 py-1 bg-primary text-bkg text-[9px] font-black uppercase tracking-widest rounded-full">{t(account.accountType.toLowerCase())}</span>
                            </div>
                            <p className="text-muted-foreground font-bold tracking-tight opacity-60 uppercase text-[10px]">{t('status')}: {t(account.status.toLowerCase())}</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setWithdrawalAccount(account)} 
                                className="flex items-center gap-2 px-6 py-4 bg-primary text-bkg rounded-2xl hover:bg-primary-focus transition-all shadow-lg shadow-primary/20 group"
                            >
                                <BanknoteIcon className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                <span className="font-black text-xs uppercase tracking-widest">{t('withdraw')}</span>
                            </button>
                            <button onClick={() => setEditingAccount(account)} className="p-4 bg-bkg border border-border rounded-2xl hover:bg-muted transition-all shadow-sm">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-2xl hover:bg-danger hover:text-white transition-all shadow-sm">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-bkg border border-border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{t('currentCapital')}</p>
                    <p className="text-3xl font-black tracking-tighter">{currencySymbol}{account.currentCapital.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-bkg border border-border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{t('netPL')}</p>
                    <p className={`text-3xl font-black tracking-tighter ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {profit >= 0 ? '+' : ''}{currencySymbol}{profit.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${profit >= 0 ? 'text-success' : 'text-danger'} opacity-80`}>
                        {profitPercent.toFixed(2)}% ROI
                    </span>
                </div>
                <div className="bg-bkg border border-border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{t('totalWithdrawn')}</p>
                    <p className="text-3xl font-black tracking-tighter text-primary">{currencySymbol}{(account.totalWithdrawn || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-bkg border border-border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{t('profitTarget')}</p>
                    <p className="text-3xl font-black tracking-tighter">{currencySymbol}{profitTargetValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                </div>
                <div className="bg-bkg border border-border rounded-[2rem] p-6 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{t('drawdownValue')}</p>
                    <p className="text-3xl font-black tracking-tighter">
                        {account.drawdownValue}{account.drawdownValueType === ValueType.PERCENTAGE ? '%' : ` ${currencySymbol}`}
                    </p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {t(account.drawdownType.toLowerCase())}
                    </span>
                </div>
            </div>
            
            {/* Chart Area */}
            <div className="bg-muted/10 border border-border rounded-[3rem] p-8 min-h-[500px] flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                        <TrendingDownIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">{t('equityCurve')}</h3>
                </div>
                <div className="flex-1">
                    <EquityChart data={equityCurve} currencySymbol={currencySymbol} account={account} />
                </div>
            </div>

            {/* History Table with Tabs */}
            <div className="bg-bkg border border-border rounded-[3.5rem] overflow-hidden shadow-sm">
                <div className="px-10 py-6 border-b border-border bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-muted/50 rounded-2xl p-1 gap-1">
                        <button 
                            onClick={() => setActiveTab('trades')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'trades' ? 'bg-primary text-bkg shadow-lg' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            {t('recentTrades')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('withdrawals')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'withdrawals' ? 'bg-primary text-bkg shadow-lg' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                            {t('withdrawalLog')}
                        </button>
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {activeTab === 'trades' ? `${accountTrades.length} TOTAL` : `${accountWithdrawals.length} TOTAL`}
                    </span>
                </div>
                <div className="divide-y divide-border">
                    {activeTab === 'trades' ? (
                        accountTrades.length > 0 ? (
                            accountTrades.slice(0, 20).map(trade => <TradeListItem key={trade.id} trade={trade} currencySymbol={currencySymbol}/>)
                        ) : (
                            <div className="py-20 text-center opacity-40">
                                <TargetIcon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">{t('noTradesYet')}</p>
                            </div>
                        )
                    ) : (
                        accountWithdrawals.length > 0 ? (
                            accountWithdrawals.map(withdrawal => <WithdrawalListItem key={withdrawal.id} withdrawal={withdrawal} currencySymbol={currencySymbol}/>)
                        ) : (
                            <div className="py-20 text-center opacity-40">
                                <BanknoteIcon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">{t('noWithdrawalsYet')}</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {editingAccount && <AccountForm isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} account={editingAccount} />}
            {withdrawalAccount && <WithdrawForm isOpen={!!withdrawalAccount} onClose={() => setWithdrawalAccount(null)} account={withdrawalAccount} />}
            
            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={t('delete')}>
                <div className="space-y-6 text-center">
                    <div className="flex justify-center p-5 bg-danger/10 text-danger rounded-3xl w-fit mx-auto">
                         <AlertTriangleIcon className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight">{t('areYouSure')}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{t('deleteAccountConfirmation')}</p>
                    </div>
                    <div className="flex gap-3 justify-center pt-2">
                         <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                         <button onClick={confirmDelete} className="px-6 py-2.5 bg-danger text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-danger/90 transition-all shadow-lg shadow-danger/20">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const TradeListItem: React.FC<{trade: Trade, currencySymbol: string}> = ({trade, currencySymbol}) => {
    const isWin = trade.result > 0;
    return (
        <div className="flex justify-between items-center px-10 py-6 hover:bg-muted/30 transition-colors">
             <div className="flex items-center gap-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${trade.direction === 'Buy' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                    {trade.direction === 'Buy' ? 'B' : 'S'}
                </div>
                <div>
                    <p className="font-black text-lg uppercase tracking-tight">{trade.asset}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {new Date(trade.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                </div>
            </div>
             <p className={`text-xl font-black tracking-tighter ${isWin ? 'text-success' : 'text-danger'}`}>
                {isWin ? '+' : ''}{currencySymbol}{trade.result.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
        </div>
    )
}

const WithdrawalListItem: React.FC<{withdrawal: Withdrawal, currencySymbol: string}> = ({withdrawal, currencySymbol}) => {
    return (
        <div className="flex justify-between items-center px-10 py-6 hover:bg-muted/30 transition-colors">
             <div className="flex items-center gap-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
                    <BanknoteIcon className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-black text-lg uppercase tracking-tight">Withdrawal</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {new Date(withdrawal.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                </div>
            </div>
             <p className="text-xl font-black tracking-tighter text-amber-500">
                -{currencySymbol}{withdrawal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
        </div>
    )
}

const AccountsPage: React.FC = () => {
    const { accounts, t } = useApp();
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    const filteredAccounts = useMemo(() => {
        return accounts.filter(acc => {
            if (filterStatus && acc.status !== filterStatus) return false;
            if (filterType && acc.accountType !== filterType) return false;
            return true;
        });
    }, [accounts, filterStatus, filterType]);

    // Use latest account data from global state if detailed view is open
    const currentSelectedAccount = useMemo(() => 
        selectedAccount ? accounts.find(a => a.id === selectedAccount.id) || null : null,
    [accounts, selectedAccount]);

    if (currentSelectedAccount) {
        return <AccountDetailView account={currentSelectedAccount} onBack={() => setSelectedAccount(null)} />;
    }

    return (
        <div className="animate-fade-in flex flex-col gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase">{t('accounts')}</h1>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-4 rounded-2xl transition-all duration-300 ${showFilters ? 'bg-primary text-bkg shadow-lg shadow-primary/20' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-primary'}`}
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setFormOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-primary text-bkg rounded-2xl hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0 group">
                        <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/>
                        <span className="font-black text-xs uppercase tracking-[0.2em]">{t('newAccount')}</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-8 bg-muted/20 border border-border rounded-[2.5rem] animate-slide-in-up">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('status')}</label>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="w-full p-3 bg-bkg border border-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                            <option value="">{t('allStatuses')}</option>
                            {Object.values(AccountStatus).map(s => <option key={s} value={s}>{t(s.toLowerCase())}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('accountType')}</label>
                        <select 
                            value={filterType} 
                            onChange={e => setFilterType(e.target.value)} 
                            className="w-full p-3 bg-bkg border border-border rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                            <option value="">{t('allTypes')}</option>
                            {Object.values(AccountType).map(type => <option key={type} value={type}>{t(type.toLowerCase())}</option>)}
                        </select>
                    </div>
                </div>
            )}
            
            {filteredAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredAccounts.map(acc => (
                        <AccountCard key={acc.id} account={acc} onSelect={() => setSelectedAccount(acc)} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-muted/10 border-2 border-dashed border-border rounded-[3rem] group hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setFormOpen(true)}>
                    <div className="p-6 bg-bkg rounded-full border border-border shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
                        <TargetIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{accounts.length === 0 ? t('noAccountsYet') : t('noAccountsFound')}</h3>
                    
                    {accounts.length === 0 ? (
                         <>
                            <p className="text-muted-foreground font-bold mt-2">{t('createYourFirstAccount')}</p>
                        </>
                    ) : (
                        <button onClick={() => { setFilterStatus(''); setFilterType(''); }} className="mt-8 px-8 py-3 bg-muted hover:bg-border rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest">
                            {t('clearFilters')}
                        </button>
                    )}
                </div>
            )}
            
            <AccountForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
        </div>
    );
};

export default AccountsPage;
