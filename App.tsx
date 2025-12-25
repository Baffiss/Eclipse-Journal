
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
    const { theme, toggleTheme, t, activePage, setPage } = useApp();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const renderPage = () => {
        switch (activePage) {
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
            {/* Improved Collapsible Sidebar */}
            <aside 
                className={`bg-muted/30 backdrop-blur-3xl border-r border-border/40 flex-col p-4 hidden md:flex no-print transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-40 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}
            >
                {/* Brand Logo & Collapse Trigger */}
                <div className={`flex items-center mb-10 h-10 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-2'}`}>
                    <div className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <EclipseIcon className="text-primary h-6 w-6 flex-shrink-0" />
                        </div>
                        <h1 className="text-lg font-black uppercase tracking-tighter whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-br from-content to-content/60">{t('appName')}</h1>
                    </div>
                    
                    {/* Collapsed Mini Logo */}
                    {isSidebarCollapsed && (
                        <div className="absolute inset-x-0 top-4 flex justify-center opacity-100 transition-opacity duration-300">
                             <div className="bg-primary/10 p-2 rounded-xl">
                                <EclipseIcon className="text-primary h-6 w-6" />
                             </div>
                        </div>
                    )}

                    <button
                        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        className={`p-2 rounded-xl text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-primary ${isSidebarCollapsed ? 'mt-14' : ''}`}
                        title={isSidebarCollapsed ? t('expand') : t('collapse')}
                    >
                        <PanelLeftCloseIcon className={`w-5 h-5 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Primary Navigation */}
                <nav className="flex-grow w-full space-y-1">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4 px-3 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        Menu
                    </div>
                    <ul className="space-y-1.5">
                        {navItems.map(item => {
                            const isActive = activePage === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setPage(item.id as any)}
                                        className={`relative group w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                            isActive 
                                                ? 'bg-primary text-bkg shadow-lg shadow-primary/20 scale-[1.02]' 
                                                : 'text-muted-foreground hover:bg-muted/60 hover:text-content'
                                        } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                        title={isSidebarCollapsed ? item.label : undefined}
                                    >
                                        {/* Active Indicator Bar */}
                                        {isActive && !isSidebarCollapsed && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-bkg rounded-r-full" />
                                        )}
                                        
                                        {React.cloneElement(item.icon, { className: `w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}` })}
                                        {!isSidebarCollapsed && <span className="transition-opacity duration-300">{item.label}</span>}
                                        
                                        {/* Collapsed Tooltip (Simulated) */}
                                        {isSidebarCollapsed && (
                                            <div className="absolute left-full ml-4 px-3 py-1.5 bg-content text-bkg rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap text-[10px] font-black tracking-widest z-50">
                                                {item.label}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* System Controls */}
                <div className="w-full pt-6 border-t border-border/20 space-y-2">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2 px-3 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        System
                    </div>
                     <button
                        onClick={() => setSettingsOpen(true)}
                        className={`group relative w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:bg-muted/60 text-muted-foreground hover:text-content ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        title={t('settings')}
                    >
                        <SettingsIcon className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-500" />
                        {!isSidebarCollapsed && <span>{t('settings')}</span>}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`group relative w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:bg-muted/60 text-muted-foreground hover:text-content ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        title={theme === 'light' ? t('darkMode') : t('lightMode')}
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:-rotate-12" />
                        ) : (
                            <SunIcon className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:rotate-45" />
                        )}
                        {!isSidebarCollapsed && <span>{theme === 'light' ? t('darkMode') : t('lightMode')}</span>}
                    </button>
                </div>
            </aside>

             <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                 <header className="h-16 flex items-center justify-between border-b border-border px-6 no-print md:hidden bg-bkg/80 backdrop-blur-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <EclipseIcon className="text-primary h-6 w-6" />
                        </div>
                        <h1 className="text-lg font-black uppercase tracking-tighter">{t('appNameShort')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSettingsOpen(true)} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                           <SettingsIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                            {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scrollbar-thin">
                    {renderPage()}
                </div>
                
                {/* Mobile Tab Bar */}
                <footer className="md:hidden flex justify-around p-3 border-t border-border bg-bkg/80 backdrop-blur-xl no-print">
                     {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id as any)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 w-16 ${
                                activePage === item.id ? 'text-primary scale-110' : 'text-muted-foreground'
                            }`}
                        >
                            {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                            <span className="text-[8px] font-black uppercase tracking-widest">{item.label.slice(0, 4)}</span>
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
