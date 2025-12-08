
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AccountsPage from './pages/AccountsPage';
import TradesPage from './pages/TradesPage';
import StrategiesPage from './pages/StrategiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketsPage from './pages/MarketsPage';
import DashboardPage from './pages/DashboardPage';
import { EclipseIcon, WalletIcon, TradesIcon, StrategiesIcon, BarChart3Icon, SunIcon, MoonIcon, SettingsIcon, TrashIcon, PanelLeftCloseIcon, DownloadIcon, UploadCloudIcon, ActivityIcon, AlertTriangleIcon, LayoutDashboardIcon } from './components/Icons';
import Modal from './components/Modal';
import { exportData, importData } from './services/export';

type Page = 'dashboard' | 'accounts' | 'trades' | 'strategies' | 'analytics' | 'markets';

const THEMES = [
    { name: 'zinc', color: 'bg-zinc-500' },
    { name: 'slate', color: 'bg-slate-500' },
    { name: 'stone', color: 'bg-stone-500' },
    { name: 'red', color: 'bg-red-500' },
    { name: 'orange', color: 'bg-orange-500' },
    { name: 'amber', color: 'bg-amber-500' },
    { name: 'yellow', color: 'bg-yellow-500' },
    { name: 'lime', color: 'bg-lime-500' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'emerald', color: 'bg-emerald-500' },
    { name: 'teal', color: 'bg-teal-500' },
    { name: 'cyan', color: 'bg-cyan-500' },
    { name: 'sky', color: 'bg-sky-500' },
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'indigo', color: 'bg-indigo-500' },
    { name: 'violet', color: 'bg-violet-500' },
    { name: 'purple', color: 'bg-purple-500' },
    { name: 'fuchsia', color: 'bg-fuchsia-500' },
    { name: 'pink', color: 'bg-pink-500' },
    { name: 'rose', color: 'bg-rose-500' },
];

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch, t, colorTheme, setColorTheme, resetData, language, setLanguage } = useApp();
    const importInputRef = useRef<HTMLInputElement>(null);
    
    // Confirmation States
    const [confirmAction, setConfirmAction] = useState<{ type: 'reset' | 'import', file?: File } | null>(null);

    // Reset confirmation state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setConfirmAction(null);
        }
    }, [isOpen]);

    const handleResetClick = () => {
        setConfirmAction({ type: 'reset' });
    };

    const confirmResetData = () => {
        resetData();
        setConfirmAction(null);
        onClose();
    };

    const handleExport = () => {
        exportData(state);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setConfirmAction({ type: 'import', file });
        if (e.target) {
            e.target.value = ''; // Reset file input
        }
    };

    const confirmImportData = async () => {
        if (confirmAction?.type === 'import' && confirmAction.file) {
            try {
                const importedData = await importData(confirmAction.file);
                const finalState = {
                    ...state, // keep current theme settings
                    ...importedData,
                };
                dispatch({ type: 'SET_STATE', payload: finalState });
                setConfirmAction(null);
                onClose();
            } catch (error) {
                console.error("Import failed:", error);
                alert(t('importError'));
                setConfirmAction(null);
            }
        }
    };

    const cancelConfirmation = () => {
        setConfirmAction(null);
    };

    const renderContent = () => {
        if (confirmAction) {
            const isReset = confirmAction.type === 'reset';
            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg border border-border">
                        <AlertTriangleIcon className="w-12 h-12 text-danger mb-3" />
                        <h3 className="text-lg font-bold text-danger mb-2">
                            {isReset ? t('deleteAllDataButton') : t('importData')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {isReset ? t('deleteAllDataConfirmation') : t('importConfirmation')}
                        </p>
                        <div className="flex gap-3 w-full justify-center">
                            <button 
                                onClick={cancelConfirmation} 
                                className="px-4 py-2 bg-bkg border border-border rounded-md hover:bg-muted transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={isReset ? confirmResetData : confirmImportData} 
                                className="px-4 py-2 bg-danger text-bkg rounded-md hover:bg-danger/90 transition-colors shadow-sm"
                            >
                                {isReset ? t('delete') : t('update')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                 <div>
                    <h3 className="text-md font-semibold mb-2">{t('language')}</h3>
                    <div className="flex gap-2">
                         <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-md text-sm font-semibold ${language === 'en' ? 'bg-primary text-bkg' : 'bg-muted hover:bg-border'}`}>English</button>
                         <button onClick={() => setLanguage('es')} className={`px-4 py-2 rounded-md text-sm font-semibold ${language === 'es' ? 'bg-primary text-bkg' : 'bg-muted hover:bg-border'}`}>Español</button>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold mb-3">{t('colorTheme')}</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 mb-4">
                        {THEMES.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => setColorTheme(theme.name)}
                                className={`w-8 h-8 rounded-full ${theme.color} transition-transform hover:scale-110 ${colorTheme === theme.name ? 'ring-2 ring-offset-2 ring-offset-bkg ring-primary' : ''}`}
                                aria-label={`Set ${theme.name} theme`}
                                title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                            />
                        ))}
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <h3 className="text-md font-semibold mb-2">{t('importExport')}</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{t('exportDescription')}</p>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-border text-sm font-semibold"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>{t('exportData')}</span>
                            </button>
                        </div>
                         <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{t('importDescription')}</p>
                            <input
                                type="file"
                                ref={importInputRef}
                                onChange={handleImportFile}
                                accept=".json"
                                className="hidden"
                            />
                            <button
                                onClick={handleImportClick}
                                className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-border text-sm font-semibold"
                            >
                                <UploadCloudIcon className="w-4 h-4" />
                                <span>{t('importData')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-4">
                    <h3 className="text-md font-semibold text-danger">{t('dangerZone')}</h3>
                    <div className="mt-2 flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">{t('deleteAllData')}</p>
                        <button
                            onClick={handleResetClick}
                            className="flex items-center gap-2 px-3 py-2 bg-danger/10 text-danger rounded-md hover:bg-danger/20 text-sm font-semibold"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>{t('deleteAllDataButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('settings')}>
            {renderContent()}
        </Modal>
    );
};

const AppContent: React.FC = () => {
    const [page, setPage] = useState<Page>('dashboard');
    const { theme, toggleTheme, t } = useApp();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <DashboardPage />;
            case 'accounts':
                return <AccountsPage />;
            case 'trades':
                return <TradesPage />;
            case 'strategies':
                return <StrategiesPage />;
            case 'analytics':
                return <AnalyticsPage />;
            case 'markets':
                return <MarketsPage />;
            default:
                return <DashboardPage />;
        }
    };

    const navItems = useMemo(() => [
        { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboardIcon /> },
        { id: 'accounts', label: t('accounts'), icon: <WalletIcon /> },
        { id: 'trades', label: t('trades'), icon: <TradesIcon /> },
        { id: 'strategies', label: t('strategies'), icon: <StrategiesIcon /> },
        { id: 'analytics', label: t('analytics'), icon: <BarChart3Icon /> },
        { id: 'markets', label: t('markets'), icon: <ActivityIcon /> },
    ], [t]);

    return (
        <div className={`flex h-screen bg-bkg text-content ${theme}`}>
            <aside className={`bg-muted/50 border-r border-border flex-col p-3 hidden md:flex no-print transition-all duration-300 ${isSidebarCollapsed ? 'w-20 items-center' : 'w-64'}`}>
                <div className={`flex items-center w-full mb-8 h-10 ${isSidebarCollapsed ? 'justify-center' : 'justify-between pl-2'}`}>
                    <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0' : 'w-full'}`}>
                         <EclipseIcon className="text-primary h-8 w-8 flex-shrink-0" />
                        <h1 className="text-xl font-bold whitespace-nowrap">{t('appName')}</h1>
                    </div>
                    <button
                        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        className={`p-2 rounded-md text-sm font-medium transition-colors hover:bg-border`}
                        title={isSidebarCollapsed ? t('expand') : t('collapse')}
                    >
                        <PanelLeftCloseIcon className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <nav className="flex-grow w-full">
                    <ul className="space-y-2">
                        {navItems.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setPage(item.id as Page)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                                        page === item.id ? 'bg-primary text-bkg shadow-sm' : 'hover:bg-muted'
                                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                                    title={isSidebarCollapsed ? item.label : undefined}
                                >
                                    {React.cloneElement(item.icon, { className: 'w-5 h-5 flex-shrink-0' })}
                                    {!isSidebarCollapsed && <span className="transition-opacity duration-200">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="w-full space-y-2">
                     <button
                        onClick={() => setSettingsOpen(true)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        title={t('settings')}
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        title={theme === 'light' ? t('darkMode') : t('lightMode')}
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>
            </aside>
             <main className="flex-1 flex flex-col overflow-hidden">
                 <header className="h-14 flex items-center justify-between border-b border-border px-6 no-print md:hidden">
                    <div className="flex items-center gap-2">
                         <EclipseIcon className="text-primary h-7 w-7" />
                         <h1 className="text-lg font-bold">{t('appNameShort')}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-muted">
                           <SettingsIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted">
                            {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {renderPage()}
                </div>
                <footer className="md:hidden flex justify-around p-2 border-t border-border bg-bkg no-print">
                     {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id as Page)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors w-16 ${
                                page === item.id ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                            {item.label}
                        </button>
                    ))}
                </footer>
            </main>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
