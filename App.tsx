
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AccountsPage from './pages/AccountsPage';
import TradesPage from './pages/TradesPage';
import StrategiesPage from './pages/StrategiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChatPage from './pages/ChatPage';
import { EclipseIcon, WalletIcon, TradesIcon, StrategiesIcon, BarChart3Icon, SunIcon, MoonIcon, SettingsIcon, TrashIcon, PanelLeftCloseIcon, DownloadIcon, UploadCloudIcon, MessageSquareIcon } from './components/Icons';
import Modal from './components/Modal';
import { exportData, importData } from './services/export';

type Page = 'accounts' | 'trades' | 'strategies' | 'analytics' | 'chat';

const THEMES = [
    { name: 'zinc', color: 'bg-slate-500' },
    { name: 'rose', color: 'bg-rose-500' },
    { name: 'blue', color: 'bg-blue-500' },
    { name: 'green', color: 'bg-green-500' },
    { name: 'violet', color: 'bg-violet-500' },
    { name: 'orange', color: 'bg-orange-500' },
];

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch, t, colorTheme, setColorTheme, customColor, setCustomColor, resetData, language, setLanguage } = useApp();
    const [hexColor, setHexColor] = useState(customColor || '#000000');
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setHexColor(customColor || '#000000');
    }, [customColor]);

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setHexColor(newColor);
        if (/^#[0-9A-F]{6}$/i.test(newColor)) {
            setColorTheme('custom');
            setCustomColor(newColor);
        }
    };
    
    const handleResetData = () => {
        if (window.confirm(t('deleteAllDataConfirmation'))) {
            resetData();
            onClose();
        }
    };

    const handleExport = () => {
        exportData(state);
    };

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (window.confirm(t('importConfirmation'))) {
            try {
                const importedData = await importData(file);
                const finalState = {
                    ...state, // keep current theme settings
                    ...importedData,
                };
                dispatch({ type: 'SET_STATE', payload: finalState });
                onClose();
            } catch (error) {
                console.error("Import failed:", error);
                alert(t('importError'));
            }
        }
        if (e.target) {
            e.target.value = ''; // Reset file input
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('settings')}>
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
                    <div className="grid grid-cols-6 gap-3 mb-4">
                        {THEMES.map(theme => (
                            <button
                                key={theme.name}
                                onClick={() => setColorTheme(theme.name)}
                                className={`w-8 h-8 rounded-full ${theme.color} transition-transform hover:scale-110 ${colorTheme === theme.name ? 'ring-2 ring-offset-2 ring-offset-bkg ring-primary' : ''}`}
                                aria-label={`Set ${theme.name} theme`}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={hexColor}
                            onChange={handleCustomColorChange}
                            className="w-10 h-10 p-1 bg-bkg border border-border rounded-md cursor-pointer"
                        />
                        <input
                            type="text"
                            value={hexColor}
                            onChange={handleCustomColorChange}
                            placeholder="#RRGGBB"
                            className="w-full p-2 bg-muted border border-border rounded-md font-mono"
                        />
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
                            onClick={handleResetData}
                            className="flex items-center gap-2 px-3 py-2 bg-danger/10 text-danger rounded-md hover:bg-danger/20 text-sm font-semibold"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>{t('deleteAllDataButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const AppContent: React.FC = () => {
    const [page, setPage] = useState<Page>('accounts');
    const { theme, toggleTheme, t } = useApp();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

    const renderPage = () => {
        switch (page) {
            case 'accounts':
                return <AccountsPage />;
            case 'trades':
                return <TradesPage />;
            case 'strategies':
                return <StrategiesPage />;
            case 'analytics':
                return <AnalyticsPage />;
            case 'chat':
                return <ChatPage />;
            default:
                return <AccountsPage />;
        }
    };

    const navItems = useMemo(() => [
        { id: 'accounts', label: t('accounts'), icon: <WalletIcon /> },
        { id: 'trades', label: t('trades'), icon: <TradesIcon /> },
        { id: 'strategies', label: t('strategies'), icon: <StrategiesIcon /> },
        { id: 'analytics', label: t('analytics'), icon: <BarChart3Icon /> },
        { id: 'chat', label: t('chat'), icon: <MessageSquareIcon /> },
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
