
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Account, DrawdownType, Trade, ValueType, AccountStatus, AccountType, Currency } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, TrashIcon, TargetIcon, TrendingDownIcon, InfoIcon, AlertTriangleIcon, FilterIcon } from '../components/Icons';
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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('accountName')}</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('initialCapital')}</label>
                        <input type="number" name="initialCapital" value={formData.initialCapital} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1" required />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('currency')}</label>
                        <select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            {Object.values(Currency).map(c => <option key={c} value={c}>{t(c.toLowerCase())}</option>)}
                        </select>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('profitTarget')}</label>
                        <div className="flex gap-2 mt-1">
                            <input type="number" name="profitTarget" value={formData.profitTarget} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md" required />
                            <select name="profitTargetType" value={formData.profitTargetType} onChange={handleChange} className="p-2 bg-muted border border-border rounded-md">
                                <option value={ValueType.PERCENTAGE}>{t('percentage')}</option>
                                <option value={ValueType.FIXED}>{t('fixed')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                         <label className="text-sm font-medium">{t('drawdownType')}</label>
                         <div className="flex gap-2 mt-1">
                             <select name="drawdownType" value={formData.drawdownType} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md">
                                <option value={DrawdownType.MAXIMUM}>{t('maximumDrawdown')}</option>
                                <option value={DrawdownType.TRAILING}>{t('trailingDrawdown')}</option>
                            </select>
                        </div>
                    </div>

                     <div className="md:col-span-2">
                        <label className="text-sm font-medium">{t('drawdownValue')}</label>
                        <div className="flex gap-2 mt-1">
                            <input type="number" name="drawdownValue" value={formData.drawdownValue} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md" required />
                             <select name="drawdownValueType" value={formData.drawdownValueType} onChange={handleChange} className="p-2 bg-muted border border-border rounded-md">
                                <option value={ValueType.PERCENTAGE}>{t('percentage')}</option>
                                <option value={ValueType.FIXED}>{t('fixed')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">{t('status')}</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            <option value={AccountStatus.ACTIVE}>{t('active')}</option>
                            <option value={AccountStatus.INACTIVE}>{t('inactive')}</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">{t('accountType')}</label>
                        <select name="accountType" value={formData.accountType} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            <option value={AccountType.EVAL}>{t('evaluation')}</option>
                             <option value={AccountType.DEMO}>{t('demo')}</option>
                            <option value={AccountType.REAL}>{t('real')}</option>
                             <option value={AccountType.PA}>{t('proprietary')}</option>
                        </select>
                    </div>
                     <div className="md:col-span-2">
                         <label className="text-sm font-medium">{t('strategies')}</label>
                         <select name="strategyId" value={formData.strategyId || ''} onChange={handleChange} className="w-full p-2 bg-muted border border-border rounded-md mt-1">
                            <option value="">{t('noStrategy')}</option>
                            {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-muted rounded-md hover:bg-border">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">{account ? t('update') : t('create')}</button>
                </div>
            </form>
        </Modal>
    );
};

const ProgressBar: React.FC<{ value: number; colorClass: string; }> = ({ value, colorClass }) => (
    <div className="w-full bg-muted rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}></div>
    </div>
);

const AccountCard: React.FC<{ account: Account; onSelect: () => void }> = ({ account, onSelect }) => {
    const { getCurrencySymbol, t, trades } = useApp();
    const currencySymbol = getCurrencySymbol(account.currency);

    const stats = useMemo(() => calculateAccountStats(account, trades), [account, trades]);
    const profit = stats.equity - account.initialCapital;
    
    const typeColors: Record<AccountType, string> = {
        [AccountType.EVAL]: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300',
        [AccountType.DEMO]: 'bg-blue-500/20 text-blue-800 dark:text-blue-300',
        [AccountType.REAL]: 'bg-green-500/20 text-green-800 dark:text-green-300',
        [AccountType.PA]: 'bg-purple-500/20 text-purple-800 dark:text-purple-300',
    };

    return (
        <div onClick={onSelect} className="bg-muted border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between animate-slide-in-up">
            <div>
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{account.name}</h3>
                     <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[account.accountType]}`}>{t(account.accountType.toLowerCase())}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${account.status === AccountStatus.ACTIVE ? 'bg-success/20 text-success' : 'bg-gray-500/20 text-gray-700 dark:text-gray-400'}`}>
                            {t(account.status.toLowerCase())}
                        </span>
                    </div>
                 </div>
                <p className="text-3xl font-bold">{currencySymbol}{account.currentCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className={`text-sm font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {profit >= 0 ? '+' : ''}{currencySymbol}{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            
            <div className="mt-6 space-y-4">
                 <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-muted-foreground">{t('progressToTarget')}</span>
                        <span className="font-semibold">{stats.profitProgress.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={stats.profitProgress} colorClass="bg-success" />
                </div>
                <div>
                     <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-muted-foreground">{t('drawdownLimit')}</span>
                        <span className="font-semibold">{stats.drawdownProgress.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={stats.drawdownProgress} colorClass="bg-danger" />
                </div>
            </div>
        </div>
    );
};


const AccountDetailView: React.FC<{ account: Account; onBack: () => void }> = ({ account, onBack }) => {
    const { trades, deleteAccount, t, getCurrencySymbol } = useApp();
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const accountTrades = useMemo(() => trades.filter(t => t.accountId === account.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [trades, account.id]);
    const equityCurve = useMemo(() => calculateEquityCurve(accountTrades, account.initialCapital, account), [accountTrades, account.initialCapital, account]);
    const currencySymbol = getCurrencySymbol(account.currency);

    const profit = account.currentCapital - account.initialCapital;
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
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <button onClick={onBack} className="text-sm hover:underline mb-2">&larr; {t('backToAccounts')}</button>
                    <h2 className="text-3xl font-bold">{account.name}</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setEditingAccount(account)} className="p-2 bg-muted rounded-md hover:bg-border"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 bg-muted rounded-md hover:bg-border text-danger"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">{t('currentCapital')}</p><p className="text-2xl font-semibold">{currencySymbol}{account.currentCapital.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">{t('netPL')}</p><p className={`text-2xl font-semibold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>{profit >= 0 ? '+' : ''}{currencySymbol}{profit.toLocaleString(undefined, {minimumFractionDigits: 2})} ({profitPercent.toFixed(2)}%)</p></div>
                <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">{t('profitTarget')}</p><p className="text-2xl font-semibold">{currencySymbol}{profitTargetValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">{t('drawdownValue')}</p><p className="text-2xl font-semibold">{account.drawdownValue}{account.drawdownValueType === ValueType.PERCENTAGE ? '%' : ` ${currencySymbol}`}</p></div>
            </div>
            
            <div className="mb-6 h-96">
                <h3 className="text-lg font-semibold mb-2">{t('equityCurve')}</h3>
                <EquityChart data={equityCurve} currencySymbol={currencySymbol} account={account} />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">{t('recentTrades')}</h3>
                <div className="bg-muted rounded-lg">
                    {accountTrades.length > 0 ? accountTrades.slice(0, 10).map(trade => <TradeListItem key={trade.id} trade={trade} currencySymbol={currencySymbol}/>) : <p className="p-4 text-center text-muted-foreground">{t('noTradesYet')}</p>}
                </div>
            </div>

            {editingAccount && <AccountForm isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} account={editingAccount} />}
            
            {/* Delete Confirmation Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={t('delete')}>
                <div className="space-y-4 text-center">
                     <div className="flex justify-center text-danger mb-2">
                        <AlertTriangleIcon className="w-12 h-12" />
                    </div>
                    <p>{t('deleteAccountConfirmation')}</p>
                    <div className="flex gap-2 justify-center mt-6">
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-muted rounded-md hover:bg-border">{t('cancel')}</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-danger text-bkg rounded-md hover:bg-danger/90">{t('delete')}</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const TradeListItem: React.FC<{trade: Trade, currencySymbol: string}> = ({trade, currencySymbol}) => {
    const { t } = useApp();
    const isWin = trade.result > 0;
    return (
        <div className="flex justify-between items-center p-3 border-b border-border last:border-b-0">
             <div>
                <p className="font-semibold">{trade.asset} <span className={`text-xs px-2 py-0.5 rounded-full ${trade.direction === 'Buy' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>{trade.direction === 'Buy' ? t('buy') : t('sell')}</span></p>
                <p className="text-sm text-muted-foreground">{new Date(trade.date).toLocaleString()}</p>
            </div>
             <p className={`font-semibold ${isWin ? 'text-success' : 'text-danger'}`}>{isWin ? '+' : ''}{currencySymbol}{trade.result.toFixed(2)}</p>
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

    if (selectedAccount) {
        return <AccountDetailView account={selectedAccount} onBack={() => setSelectedAccount(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('accounts')}</h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-md transition-all duration-200 ${showFilters ? 'bg-primary text-bkg shadow-sm' : 'bg-muted text-muted-foreground hover:bg-border'}`}
                        title={t('toggleFilters')}
                    >
                        <FilterIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus shadow-sm transition-shadow hover:shadow-md">
                        <PlusIcon className="w-5 h-5"/>
                        <span>{t('newAccount')}</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border animate-fade-in">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('status')}</label>
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)} 
                            className="w-full p-2 bg-bkg border border-border rounded-md text-sm"
                        >
                            <option value="">{t('allStatuses')}</option>
                            {Object.values(AccountStatus).map(s => <option key={s} value={s}>{t(s.toLowerCase())}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">{t('accountType')}</label>
                        <select 
                            value={filterType} 
                            onChange={e => setFilterType(e.target.value)} 
                            className="w-full p-2 bg-bkg border border-border rounded-md text-sm"
                        >
                            <option value="">{t('allTypes')}</option>
                            {Object.values(AccountType).map(type => <option key={type} value={type}>{t(type.toLowerCase())}</option>)}
                        </select>
                    </div>
                </div>
            )}
            
            {filteredAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map(acc => (
                        <AccountCard key={acc.id} account={acc} onSelect={() => setSelectedAccount(acc)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-lg mt-8">
                    <h3 className="text-xl font-semibold">{accounts.length === 0 ? t('noAccountsYet') : t('noAccountsFound')}</h3>
                    
                    {accounts.length === 0 ? (
                         <>
                            <p className="text-muted-foreground mt-2">{t('createYourFirstAccount')}</p>
                            <button onClick={() => setFormOpen(true)} className="mt-6 flex mx-auto items-center gap-2 px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">
                                <PlusIcon className="w-5 h-5"/>
                                <span>{t('createAccount')}</span>
                            </button>
                        </>
                    ) : (
                        <button onClick={() => { setFilterStatus(''); setFilterType(''); }} className="mt-4 px-4 py-2 bg-muted hover:bg-border rounded-md transition-colors text-sm font-medium">
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
