import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AccountsPage from './pages/AccountsPage';
import TradesPage from './pages/TradesPage';
import StrategiesPage from './pages/StrategiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketsPage from './pages/MarketsPage';
import DashboardPage from './pages/DashboardPage';
import { 
    EclipseIcon, 
    WalletIcon, 
    TradesIcon, 
    StrategiesIcon, 
    BarChart3Icon, 
    SunIcon, 
    MoonIcon, 
    SettingsIcon, 
    TrashIcon, 
    PanelLeftCloseIcon, 
    DownloadIcon, 
    UploadCloudIcon, 
    ActivityIcon, 
    AlertTriangleIcon, 
    LayoutDashboardIcon
} from './components/Icons';
import Modal from './components/Modal';
import { exportData, importData } from './services/export';
import { SidebarPosition } from './context/AppContext';

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
    const { state, dispatch, t, colorTheme, setColorTheme, sidebarPosition, setSidebarPosition, resetData, language, setLanguage } = useApp();
    const importInputRef = useRef<HTMLInputElement>(null);
    
    const [confirmAction, setConfirmAction] = useState<{ type: 'reset' | 'import', file?: File } | null>(null);

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
            e.target.value = ''; 
        }
    };

    const confirmImportData = async () => {
        if (confirmAction?.type === 'import' && confirmAction.file) {
            try {
                const importedData = await importData(confirmAction.file);
                const finalState = {
                    ...state, 
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
                <div className={`space-y-4 animate-fade-in`}>
                    <div className={`flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg border border-border`}>
                        <AlertTriangleIcon className={`w-12 h-12 text-danger mb-3`} />
                        <h3 className={`text-lg font-bold text-danger mb-2`}>
                            {isReset ? t('deleteAllDataButton') : t('importData')}
                        </h3>
                        <p className={`text-sm text-muted-foreground mb-4`}>
                            {isReset ? t('deleteAllDataConfirmation') : t('importConfirmation')}
                        </p>
                        <div className={`flex gap-3 w-full justify-center`}>
                            <button 
                                onClick={cancelConfirmation} 
                                className={`px-4 py-2 bg-bkg border border-border rounded-md hover:bg-muted transition-colors`}
                            >
                                {t('cancel')}
                            </button>
                            <button 
                                onClick={isReset ? confirmResetData : confirmImportData} 
                                className={`px-4 py-2 bg-danger text-bkg rounded-md hover:bg-danger/90 transition-colors shadow-sm`}
                            >
                                {isReset ? t('delete') : t('update')}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`space-y-6`}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className={`text-xs font-black uppercase tracking-widest text-muted-foreground mb-3`}>{t('language')}</h3>
                        <div className={`flex gap-2`}>
                            <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${language === 'en' ? `bg-primary text-bkg` : `bg-muted hover:bg-border`}`}>EN</button>
                            <button onClick={() => setLanguage('es')} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${language === 'es' ? `bg-primary text-bkg` : `bg-muted hover:bg-border`}`}>ES</button>
                        </div>
                    </div>
                    <div>
                        <h3 className={`text-xs font-black uppercase tracking-widest text-muted-foreground mb-3`}>{t('sidebarPosition')}</h3>
                        <div className={`flex gap-1 bg-muted p-1 rounded-xl`}>
                            {(['left', 'top', 'right', 'bottom'] as SidebarPosition[]).map(pos => (
                                <button 
                                    key={pos}
                                    onClick={() => setSidebarPosition(pos)} 
                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${sidebarPosition === pos ? `bg-primary text-bkg shadow-sm` : `text-muted-foreground hover:bg-border/50`}`}
                                >
                                    {t(pos)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className={`text-xs font-black uppercase tracking-widest text-muted-foreground mb-3`}>{t('colorTheme')}</h3>
                    <div className={`grid grid-cols-5 sm:grid-cols-7 gap-3 mb-4`}>
                        {THEMES.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => setColorTheme(theme.name)}
                                className={`w-8 h-8 rounded-full ${theme.color} transition-transform hover:scale-110 ${colorTheme === theme.name ? `ring-2 ring-offset-2 ring-offset-bkg ring-primary` : ``}`}
                                aria-label={`Set ${theme.name} theme`}
                                title={theme.name.charAt(0).toUpperCase() + theme.name.slice(1)}
                            />
                        ))}
                    </div>
                </div>

                <div className={`border-t border-border pt-4`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest text-muted-foreground mb-3`}>{t('importExport')}</h3>
                    <div className={`space-y-3`}>
                        <div className={`flex justify-between items-center bg-muted/30 p-3 rounded-2xl`}>
                            <p className={`text-[10px] font-bold text-muted-foreground uppercase leading-tight`}>{t('exportDescription')}</p>
                            <button
                                onClick={handleExport}
                                className={`flex items-center gap-2 px-4 py-2 bg-bkg border border-border rounded-xl hover:bg-muted text-[10px] font-black uppercase tracking-widest transition-all`}
                            >
                                <UploadCloudIcon className={`w-4 h-4 text-primary`} />
                                <span>{t('exportData')}</span>
                            </button>
                        </div>
                         <div className={`flex justify-between items-center bg-muted/30 p-3 rounded-2xl`}>
                            <p className={`text-[10px] font-bold text-muted-foreground uppercase leading-tight`}>{t('importDescription')}</p>
                            <input
                                type="file"
                                ref={importInputRef}
                                onChange={handleImportFile}
                                accept=".json"
                                className={`hidden`}
                            />
                            <button
                                onClick={handleImportClick}
                                className={`flex items-center gap-2 px-4 py-2 bg-bkg border border-border rounded-xl hover:bg-muted text-[10px] font-black uppercase tracking-widest transition-all`}
                            >
                                <DownloadIcon className={`w-4 h-4 text-primary`} />
                                <span>{t('importData')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`border-t border-border pt-4`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest text-danger mb-3`}>{t('dangerZone')}</h3>
                    <div className={`mt-2 flex justify-between items-center bg-danger/5 p-3 rounded-2xl border border-danger/10`}>
                        <p className={`text-[10px] font-bold text-muted-foreground uppercase leading-tight`}>{t('deleteAllData')}</p>
                        <button
                            onClick={handleResetClick}
                            className={`flex items-center gap-2 px-4 py-2 bg-danger text-bkg rounded-xl hover:bg-danger/90 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-danger/20`}
                        >
                            <TrashIcon className={`w-4 h-4`} />
                            <span>{t('delete')}</span>
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
    const { theme, toggleTheme, t, activePage, setPage, sidebarPosition } = useApp();
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

    const isHorizontal = sidebarPosition === 'top' || sidebarPosition === 'bottom';
    const isVertical = sidebarPosition === 'left' || sidebarPosition === 'right';

    // Sidebar/Nav bar styles based on position
    const navBarClasses = useMemo(() => {
        const base = `bg-muted/30 backdrop-blur-3xl border-border/40 flex no-print transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-30`;
        if (sidebarPosition === 'left') {
            return `${base} flex-col border-r p-4 ${isSidebarCollapsed ? `w-24` : `w-72`}`;
        } else if (sidebarPosition === 'right') {
            return `${base} flex-col border-l p-4 ${isSidebarCollapsed ? `w-24` : `w-72`} order-last`;
        } else if (sidebarPosition === 'top') {
            return `${base} flex-row border-b px-6 h-20 items-center justify-between w-full`;
        } else {
            return `${base} flex-row border-t px-6 h-20 items-center justify-between w-full order-last`;
        }
    }, [sidebarPosition, isSidebarCollapsed]);

    const navContainerClasses = useMemo(() => {
        if (isVertical) return `flex-grow w-full space-y-1 transition-all duration-700`;
        return `flex items-center gap-1 overflow-x-auto no-scrollbar transition-all duration-700`;
    }, [isVertical]);

    const navItemClasses = (isActive: boolean) => {
        const base = `relative group flex items-center transition-all duration-300 rounded-2xl text-[10px] font-black uppercase tracking-widest`;
        const activeStyles = isActive 
            ? `bg-primary text-bkg shadow-lg shadow-primary/20 scale-[1.02]` 
            : `text-muted-foreground hover:bg-muted/60 hover:text-content`;

        if (isVertical) {
            return `${base} ${activeStyles} gap-4 px-4 py-3 w-full ${isSidebarCollapsed ? `justify-center px-0` : ``}`;
        }
        return `${base} ${activeStyles} gap-2 px-4 py-2.5`;
    };

    return (
        <div className={`flex h-screen bg-bkg text-content ${theme} ${isHorizontal ? 'flex-col' : 'flex-row'} transition-all duration-700 ease-in-out overflow-hidden`}>
            {/* Desktop Navigation */}
            <aside className={`hidden md:flex flex-shrink-0 ${navBarClasses}`}>
                <div className={`${isVertical ? (isSidebarCollapsed ? 'mb-12' : 'mb-10') : 'h-full'} flex ${isVertical && isSidebarCollapsed ? 'flex-col gap-6 items-center mt-2' : 'items-center justify-between'}`}>
                    <div className={`flex items-center gap-3 transition-all duration-500 ${isVertical && isSidebarCollapsed ? 'scale-100 opacity-100' : 'w-auto opacity-100'}`}>
                        <div className={`bg-primary/10 p-2 rounded-xl`}>
                            <EclipseIcon className={`text-primary h-6 w-6 flex-shrink-0`} />
                        </div>
                        {isVertical && !isSidebarCollapsed && (
                             <h1 className={`text-lg font-black uppercase tracking-tighter whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-br from-content to-content/60`}>{t('appName')}</h1>
                        )}
                    </div>
                    
                    {isVertical && (
                        <button
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                            className={`p-2 rounded-xl text-muted-foreground transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-muted hover:text-primary active:scale-90 hover:scale-110 shadow-sm group/collapse`}
                            title={isSidebarCollapsed ? t('expand') : t('collapse')}
                        >
                            <PanelLeftCloseIcon 
                                className={`w-5 h-5 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                    ${sidebarPosition === 'left' 
                                        ? (isSidebarCollapsed ? 'rotate-180 translate-x-0.5' : '-translate-x-0.5') 
                                        : (isSidebarCollapsed ? 'rotate-0 -translate-x-0.5' : 'rotate-180 translate-x-0.5')
                                    } group-hover/collapse:scale-110`} 
                            />
                        </button>
                    )}
                </div>

                <nav className={navContainerClasses}>
                    {isVertical && (
                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-4 px-3 transition-opacity duration-300 ${isSidebarCollapsed ? `opacity-0` : `opacity-100`}`}>
                            Menu
                        </div>
                    )}
                    <ul className={`${isVertical ? 'space-y-1.5' : 'flex gap-2'}`}>
                        {navItems.map(item => {
                            const isActive = activePage === item.id;
                            return (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setPage(item.id as any)}
                                        className={navItemClasses(isActive)}
                                        title={isVertical && isSidebarCollapsed ? item.label : undefined}
                                    >
                                        {isActive && sidebarPosition === 'left' && !isSidebarCollapsed && (
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-bkg rounded-r-full animate-fade-in`} />
                                        )}
                                        {isActive && sidebarPosition === 'right' && !isSidebarCollapsed && (
                                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-bkg rounded-l-full animate-fade-in`} />
                                        )}
                                        
                                        {React.cloneElement(item.icon as React.ReactElement, { className: `w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? `scale-110` : `group-hover:scale-110`}` })}
                                        {(isVertical ? !isSidebarCollapsed : true) && <span className={`transition-opacity duration-300`}>{item.label}</span>}
                                        
                                        {isVertical && isSidebarCollapsed && (
                                            <div className={`absolute ${sidebarPosition === 'left' ? 'left-full ml-4' : 'right-full mr-4'} px-3 py-1.5 bg-content text-bkg rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap text-[10px] font-black tracking-widest z-50`}>
                                                {item.label}
                                            </div>
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className={`${isVertical ? 'w-full pt-6 border-t space-y-2' : 'flex gap-2'} border-border/20 transition-all duration-700`}>
                    {isVertical && (
                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 mb-2 px-3 transition-opacity duration-300 ${isSidebarCollapsed ? `opacity-0` : `opacity-100`}`}>
                            System
                        </div>
                    )}
                     <button
                        onClick={() => setSettingsOpen(true)}
                        className={`group relative flex items-center transition-all duration-300 hover:bg-muted/60 text-muted-foreground hover:text-content rounded-2xl ${isVertical ? 'gap-4 px-4 py-3 w-full' : 'p-3'} ${isVertical && isSidebarCollapsed ? `justify-center px-0` : ``}`}
                        title={t('settings')}
                    >
                        <SettingsIcon className={`w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-500`} />
                        {isVertical && !isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">{t('settings')}</span>}
                    </button>
                    <button
                        onClick={toggleTheme}
                        className={`group relative flex items-center transition-all duration-300 hover:bg-muted/60 text-muted-foreground hover:text-content rounded-2xl ${isVertical ? 'gap-4 px-4 py-3 w-full' : 'p-3'} ${isVertical && isSidebarCollapsed ? `justify-center px-0` : ``}`}
                        title={theme === 'light' ? t('darkMode') : t('lightMode')}
                    >
                        {theme === 'light' ? (
                            <MoonIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:-rotate-12`} />
                        ) : (
                            <SunIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:rotate-45`} />
                        )}
                        {isVertical && !isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">{theme === 'light' ? t('darkMode') : t('lightMode')}</span>}
                    </button>
                </div>
            </aside>

             <main className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-700`}>
                 {/* Mobile Header */}
                 <header className={`h-16 flex items-center justify-between border-b border-border px-6 no-print md:hidden bg-bkg/80 backdrop-blur-lg z-40 flex-shrink-0`}>
                    <div className={`flex items-center gap-3`}>
                        <div className={`bg-primary/10 p-1.5 rounded-lg`}>
                            <EclipseIcon className={`text-primary h-6 w-6`} />
                        </div>
                        <h1 className={`text-lg font-black uppercase tracking-tighter`}>{t('appNameShort')}</h1>
                    </div>
                    <div className={`flex items-center gap-2`}>
                        <button onClick={() => setSettingsOpen(true)} className={`p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors`}>
                           <SettingsIcon className={`w-5 h-5`}/>
                        </button>
                        <button onClick={toggleTheme} className={`p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors`}>
                            {theme === 'light' ? <MoonIcon className={`w-5 h-5`}/> : <SunIcon className={`w-5 h-5`}/>}
                        </button>
                    </div>
                </header>

                <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scrollbar-thin`}>
                    <div className="max-w-[1600px] mx-auto w-full">
                        {renderPage()}
                    </div>
                </div>
                
                {/* Mobile Navigation Footer */}
                <footer className={`md:hidden flex justify-around p-3 border-t border-border bg-bkg/80 backdrop-blur-xl no-print z-40 flex-shrink-0`}>
                     {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setPage(item.id as any)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 w-16 ${
                                activePage === item.id ? `text-primary scale-110` : `text-muted-foreground`
                            }`}
                        >
                            {React.cloneElement(item.icon as React.ReactElement, { className: "h-5 w-5" })}
                            <span className={`text-[8px] font-black uppercase tracking-widest`}>{item.label.slice(0, 4)}</span>
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