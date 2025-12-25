
import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useContext, useCallback } from 'react';
import { Account, Trade, Strategy, Currency, TradePreset } from '../types';

// Internationalization (i18n)
const translations: Record<string, Record<string, string>> = {
    en: {
        accounts: 'Accounts', trades: 'Trades', strategies: 'Strategies', analytics: 'Analytics', markets: 'Markets', dashboard: 'Dashboard',
        settings: 'Settings', lightMode: 'Light Mode', darkMode: 'Dark Mode',
        colorTheme: 'Color Theme', dangerZone: 'Danger Zone', deleteAllData: 'Delete all accounts, trades, and strategies.',
        deleteAllDataButton: 'Delete All Data', deleteAllDataConfirmation: 'Are you sure you want to delete all data? This action cannot be undone.',
        areYouSure: 'Are you sure?', cancel: 'Cancel', create: 'Create', update: 'Update', delete: 'Delete', edit: 'Edit',
        newAccount: 'New Account', editAccount: 'Edit Account', createAccount: 'Create Account', accountName: 'Account Name',
        initialCapital: 'Initial Capital', profitTarget: 'Profit Target', drawdownType: 'Drawdown Type',
        drawdownValue: 'Drawdown Value', maximumDrawdown: 'Maximum Drawdown', trailingDrawdown: 'Trailing Drawdown',
        noStrategy: 'No Strategy', allAccounts: 'All Accounts', netPL: 'Net P/L', currentCapital: 'Current Capital',
        equityCurve: 'Equity Curve', recentTrades: 'Recent Trades', noTradesYet: 'No trades yet.',
        noAccountsYet: 'No Accounts Yet', createYourFirstAccount: 'Create your first trading account to get started.',
        registerTrade: 'Register Trade', editTrade: 'Edit Trade', selectAccount: 'Select Account', date: 'Date',
        asset: 'Asset (e.g., EURUSD)', direction: 'Direction', buy: 'Buy', sell: 'Sell', lotSize: 'Lot Size',
        takeProfitPips: 'TP (pips)', stopLossPips: 'SL (pips)', resultInDollars: 'Result ($)', notes: 'Notes',
        uploadScreenshot: 'Upload a screenshot', allStrategies: 'All Strategies', filterByAsset: 'Filter by asset...',
        tradesOn: 'Trades on', noTradesOnThisDay: 'No trades on this day.', selectDayToViewTrades: 'Select a day from the calendar to view trades.',
        addTradeToDate: 'Add to', newStrategy: 'New Strategy', editStrategy: 'Edit Strategy', createStrategy: 'Create Strategy',
        strategyName: 'Strategy Name', description: 'Description', performanceAnalytics: 'Performance Analytics', noStrategiesDefined: 'No Strategies Defined',
        createYourFirstStrategy: 'Create your first strategy to analyze its performance.', totalTrades: 'Total Trades',
        winRate: 'Win Rate', profitFactor: 'Profit Factor', avgWinLoss: 'Avg. Win / Loss', payoffRatio: 'Payoff Ratio',
        expectedValue: 'Expected Value', maxDrawdown: 'Max Drawdown', sharpeRatio: 'Sharpe Ratio',
        notEnoughData: 'Not Enough Data', selectAccountOrStrategyForAnalytics: 'Select an account or strategy with trades to see analytics.',
        language: 'Language', customColor: 'Custom Color',
        backToStrategies: 'Back to Strategies', backToAccounts: 'All Accounts',
        deleteAccountConfirmation: 'Are you sure? This will delete the account and all associated trades.',
        deleteStrategyConfirmation: 'Are you sure? This will not delete trades.',
        deleteTradeConfirmation: 'Are you sure?',
        appName: 'Eclipse Journal', appNameShort: 'Eclipse',
        collapse: 'Collapse', expand: 'Expand', toggleFilters: 'Toggle Filters',
        examples: 'Examples', addExampleImages: 'Add Example Images',
        createAccountFirst: 'You must create an account before adding a trade.',

        importExport: 'Import / Export Data',
        exportData: 'Export Data',
        importData: 'Import Data',
        exportDescription: 'Download all your journal data as a JSON file.',
        importDescription: 'Import data from a JSON backup file. This will overwrite all current data.',
        importConfirmation: 'Are you sure you want to import data? This will overwrite all your current data and cannot be undone.',
        importError: 'The selected file is not a valid backup file or is corrupted.',

        // Dashboard
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        todaysPnL: "Today's P&L",
        todaysWinRate: "Today's Win Rate",
        tradesToday: 'Trades Today',
        upcomingEvents: 'Upcoming Events',
        dailyOverview: 'Daily Overview',
        noTradesToday: 'No trades recorded today.',
        viewAllTrades: 'View All Trades',

        // Markets
        economicCalendar: 'Economic Calendar',
        marketOverview: 'Market Overview',
        forexHeatmap: 'Forex Heatmap',
        cryptoHeatmap: 'Crypto Heatmap',
        stockHeatmap: 'Stock Heatmap',
        marketNews: 'Market News',

        // New Account fields
        currency: 'Currency',
        usd: 'USD', eur: 'EUR', gbp: 'GBP', jpy: 'JPY',
        profitTargetType: 'Profit Target Type',
        profitTargetValue: 'Profit Target Value',
        drawdownValueType: 'Drawdown Value Type',
        fixed: 'Fixed',
        percentage: 'Percentage',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        accountType: 'Account Type',
        evaluation: 'Evaluation',
        demo: 'Demo',
        real: 'Real',
        proprietary: 'Proprietary Account',

        // Account Filtering
        allStatuses: 'All Statuses',
        allTypes: 'All Types',
        noAccountsFound: 'No accounts found matching your filters.',
        clearFilters: 'Clear Filters',

        // Visual enhancements
        progressToTarget: 'Progress to Target',
        drawdownLimit: 'Drawdown Limit',
        
        // New Analytics
        totalProfit: 'Total Profit',
        totalProfitCurve: 'Total Profit Curve',
        hourlyDistribution: 'Hourly P/L Distribution',
        dailyDistribution: 'Daily P/L Distribution',
        performanceByAsset: 'Performance by Asset',
        notableTrades: 'Notable Trades',
        maxWin: 'Maximum Win',
        maxLoss: 'Maximum Loss',
        winLossDistribution: 'Win/Loss Distribution',
        hour: 'Hour',
        wins: 'Wins',
        losses: 'Losses',
        noProfitableAssets: 'No profitable assets to display.',

        // Analytics Descriptions
        totalProfit_desc: 'The cumulative sum of all profits and losses across the selected trades.',
        winRate_desc: 'The percentage of trades that resulted in a profit out of the total number of trades closed.',
        profitFactor_desc: 'The ratio of gross profit to gross loss. A value greater than 1.0 indicates a profitable system.',
        payoffRatio_desc: 'Average Risk to Reward ratio. It measures the relationship between your average winning trade and your average losing trade. A value over 1.0 means your wins are larger than your losses.',
        expectedValue_desc: 'The average amount you can expect to win or lose per trade based on historical performance.',
        maxDrawdown_desc: 'The maximum peak-to-trough decline in equity, expressed as a percentage of the peak value.',

        // Presets
        tradePresets: 'Trade Presets',
        saveAsPreset: 'Save as Preset',
        presetName: 'Preset Name',
        selectPreset: 'Apply Preset',
        noPresets: 'No presets saved.',
        save: 'Save',
        viewScreenshot: 'View Screenshot'
    },
    es: {
        accounts: 'Cuentas', trades: 'Operaciones', strategies: 'Estrategias', analytics: 'Analíticas', markets: 'Mercados', dashboard: 'Panel Principal',
        settings: 'Configuración', lightMode: 'Modo Claro', darkMode: 'Modo Oscuro',
        colorTheme: 'Color del Tema', dangerZone: 'Zona de Peligro', deleteAllData: 'Eliminar todas las cuentas, operaciones y estrategias.',
        deleteAllDataButton: 'Eliminar Todos los Datos', deleteAllDataConfirmation: '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.',
        areYouSure: '¿Estás seguro?', cancel: 'Cancelar', create: 'Crear', update: 'Actualizar', delete: 'Eliminar', edit: 'Editar',
        newAccount: 'Nueva Cuenta', editAccount: 'Editar Cuenta', createAccount: 'Crear Cuenta', accountName: 'Nombre de la Cuenta',
        initialCapital: 'Capital Inicial', profitTarget: 'Objetivo de Ganancia', drawdownType: 'Tipo de Drawdown',
        drawdownValue: 'Valor de Drawdown', maximumDrawdown: 'Drawdown Máximo', trailingDrawdown: 'Drawdown Trailing',
        noStrategy: 'Sin Estrategia', allAccounts: 'Todas las Cuentas', netPL: 'G/P Neto', currentCapital: 'Capital Actual',
        equityCurve: 'Curva de Capital', recentTrades: 'Operaciones Recientes', noTradesYet: 'Aún no hay operaciones.',
        noAccountsYet: 'Aún no hay cuentas', createYourFirstAccount: 'Crea tu primera cuenta de trading para comenzar.',
        registerTrade: 'Registrar Operación', editTrade: 'Editar Operación', selectAccount: 'Seleccionar Cuenta', date: 'Fecha',
        asset: 'Activo (ej. EURUSD)', direction: 'Dirección', buy: 'Compra', sell: 'Venta', lotSize: 'Lotaje',
        takeProfitPips: 'TP (pips)', stopLossPips: 'SL (pips)', resultInDollars: 'Resultado ($)', notes: 'Notas',
        uploadScreenshot: 'Sube una captura de pantalla', allStrategies: 'Todas las Estrategias', filterByAsset: 'Filtrar por activo...',
        tradesOn: 'Operaciones del', noTradesOnThisDay: 'No hay operaciones en este día.', selectDayToViewTrades: 'Selecciona un día del calendario para ver las operaciones.',
        addTradeToDate: 'Añadir a', newStrategy: 'Nueva Estrategia', editStrategy: 'Editar Estrategia', createStrategy: 'Crear Estrategia',
        strategyName: 'Nombre de Estrategia', description: 'Descripción', performanceAnalytics: 'Analíticas de Rendimiento', noStrategiesDefined: 'No hay Estrategias Definidas',
        createYourFirstStrategy: 'Crea tu primera estrategia para analizar su rendimiento.', totalTrades: 'Operaciones Totales',
        winRate: 'Tasa de Acierto', profitFactor: 'Factor de Beneficio', avgWinLoss: 'Ganancia / Pérdida Promedio', payoffRatio: 'Ratio de Pago',
        expectedValue: 'Valor Esperado', maxDrawdown: 'Drawdown Máximo', sharpeRatio: 'Ratio de Sharpe',
        notEnoughData: 'No Hay Datos Suficientes', selectAccountOrStrategyForAnalytics: 'Selecciona una cuenta o estrategia con operaciones para ver las analíticas.',
        language: 'Idioma', customColor: 'Color Personalizado',
        backToStrategies: 'Volver a Estrategias', backToAccounts: 'Todas las Cuentas',
        deleteAccountConfirmation: '¿Estás seguro? Esto eliminará la cuenta y todas las operaciones asociadas.',
        deleteStrategyConfirmation: '¿Estás seguro? Esto no eliminará las operaciones.',
        deleteTradeConfirmation: '¿Estás seguro?',
        appName: 'Eclipse Journal', appNameShort: 'Eclipse',
        collapse: 'Colapsar', expand: 'Expandir', toggleFilters: 'Alternar Filtros',
        examples: 'Ejemplos', addExampleImages: 'Añadir Imágenes de Ejemplo',
        createAccountFirst: 'Debes crear una cuenta antes de añadir una operación.',
        
        importExport: 'Importar / Exportar Datos',
        exportData: 'Exportar Datos',
        importData: 'Importar Datos',
        exportDescription: 'Descarga todos los datos de tu diario como un archivo JSON.',
        importDescription: 'Importa datos desde un archivo de respaldo JSON. Esto sobrescribirá todos los datos actuales.',
        importConfirmation: '¿Estás seguro de que quieres importar los datos? Esto sobrescribirá todos tus datos actuales y no se puede deshacer.',
        importError: 'El archivo seleccionado no es un archivo de respaldo válido o está dañado.',

        // Dashboard
        goodMorning: 'Buenos Días',
        goodAfternoon: 'Buenas Tardes',
        goodEvening: 'Buenas Noches',
        todaysPnL: "P&L de Hoy",
        todaysWinRate: "Tasa de Acierto Hoy",
        tradesToday: 'Operaciones Hoy',
        upcomingEvents: 'Próximos Eventos',
        dailyOverview: 'Resumen Diario',
        noTradesToday: 'No se registraron operaciones hoy.',
        viewAllTrades: 'Ver Todas',

        // Markets
        economicCalendar: 'Calendario Económico',
        marketOverview: 'Resumen de Mercado',
        forexHeatmap: 'Mapa de Calor Forex',
        cryptoHeatmap: 'Mapa de Calor Cripto',
        stockHeatmap: 'Mapa de Calor Acciones',
        marketNews: 'Noticias del Mercado',

        // New Account fields
        currency: 'Moneda',
        usd: 'USD', eur: 'EUR', gbp: 'GBP', jpy: 'JPY',
        profitTargetType: 'Tipo de Objetivo de Ganancia',
        profitTargetValue: 'Valor del Objetivo de Ganancia',
        drawdownValueType: 'Tipo de Valor de Drawdown',
        fixed: 'Fijo',
        percentage: 'Porcentaje',
        status: 'Estado',
        active: 'Activo',
        inactive: 'Inactivo',
        accountType: 'Tipo de Cuenta',
        evaluation: 'Evaluación',
        demo: 'Demo',
        real: 'Real',
        proprietary: 'Cuenta Financiada',

        // Account Filtering
        allStatuses: 'Todos los Estados',
        allTypes: 'Todos los Tipos',
        noAccountsFound: 'No se encontraron cuentas con esos filtros.',
        clearFilters: 'Limpiar Filtros',

        // Visual enhancements
        progressToTarget: 'Progreso al Objetivo',
        drawdownLimit: 'Límite de Drawdown',

        // New Analytics
        totalProfit: 'Beneficio Total',
        totalProfitCurve: 'Curva de Beneficio Total',
        hourlyDistribution: 'Distribución G/P por Hora',
        dailyDistribution: 'Distribución G/P Diaria',
        performanceByAsset: 'Rendimiento por Activo',
        notableTrades: 'Operaciones Notables',
        maxWin: 'Máxima Ganancia',
        maxLoss: 'Máxima Pérdida',
        winLossDistribution: 'Distribución de Gan./Pérd.',
        hour: 'Hora',
        wins: 'Ganadas',
        losses: 'Perdidas',
        noProfitableAssets: 'No hay activos con ganancias para mostrar.',

        // Analytics Descriptions
        totalProfit_desc: 'La suma acumulativa de todas las ganancias y pérdidas de las operaciones seleccionadas.',
        winRate_desc: 'El porcentaje de operaciones que resultaron en ganancia del total de operaciones cerradas.',
        profitFactor_desc: 'La relación entre el beneficio bruto y la pérdida bruta. Un valor superior a 1.0 indica un sistema rentable.',
        payoffRatio_desc: 'Ratio Riesgo/Beneficio promedio. Mide la relación entre tu ganancia promedio y tu pérdida promedio. Un valor superior a 1.0 significa que tus ganancias son mayores que tus pérdidas.',
        expectedValue_desc: 'La cantidad promedio que puedes esperar ganar o perder por operación basada en el rendimiento histórico.',
        maxDrawdown_desc: 'La caída máxima de pico a valle en el capital, expresada como un porcentaje del valor máximo.',

        // Presets
        tradePresets: 'Presets de Operación',
        saveAsPreset: 'Guardar como Preset',
        presetName: 'Nombre del Preset',
        selectPreset: 'Aplicar Preset',
        noPresets: 'No hay presets guardados.',
        save: 'Guardar',
        viewScreenshot: 'Ver Captura'
    },
};

export type ActivePage = 'dashboard' | 'accounts' | 'trades' | 'strategies' | 'analytics' | 'markets';

export interface AppState {
    accounts: Account[];
    trades: Trade[];
    strategies: Strategy[];
    presets: TradePreset[];
    theme: 'light' | 'dark';
    colorTheme: string;
    customColor: string | null;
    language: 'en' | 'es';
    activePage: ActivePage;
    focusedTradeId: string | null;
}

type Action =
    | { type: 'ADD_ACCOUNT'; payload: Account }
    | { type: 'UPDATE_ACCOUNT'; payload: Account }
    | { type: 'DELETE_ACCOUNT'; payload: string }
    | { type: 'ADD_TRADE'; payload: Trade }
    | { type: 'UPDATE_TRADE'; payload: { oldTrade: Trade; newTrade: Trade } }
    | { type: 'DELETE_TRADE'; payload: Trade }
    | { type: 'ADD_STRATEGY'; payload: Strategy }
    | { type: 'UPDATE_STRATEGY'; payload: Strategy }
    | { type: 'DELETE_STRATEGY'; payload: string }
    | { type: 'ADD_PRESET'; payload: TradePreset }
    | { type: 'DELETE_PRESET'; payload: string }
    | { type: 'TOGGLE_THEME' }
    | { type: 'SET_COLOR_THEME'; payload: string }
    | { type: 'SET_CUSTOM_COLOR'; payload: string | null }
    | { type: 'SET_LANGUAGE'; payload: 'en' | 'es' }
    | { type: 'RESET_DATA' }
    | { type: 'SET_PAGE'; payload: ActivePage }
    | { type: 'FOCUS_TRADE'; payload: string | null }
    | { type: 'SET_STATE'; payload: AppState };

const initialState: AppState = {
    accounts: [],
    trades: [],
    strategies: [],
    presets: [],
    theme: 'light',
    colorTheme: 'zinc',
    customColor: null,
    language: 'en',
    activePage: 'dashboard',
    focusedTradeId: null,
};

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

const appReducer = (prevState: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'ADD_ACCOUNT':
            return { ...prevState, accounts: [...prevState.accounts, action.payload] };
        case 'UPDATE_ACCOUNT':
            return { ...prevState, accounts: prevState.accounts.map(acc => acc.id === action.payload.id ? action.payload : acc) };
        case 'DELETE_ACCOUNT':
            return {
                ...prevState,
                accounts: prevState.accounts.filter(acc => acc.id !== action.payload),
                trades: prevState.trades.filter(t => t.accountId !== action.payload)
            };
        case 'ADD_TRADE': {
            const trade = action.payload;
            const result = parseFloat(String(trade.result)) || 0;
            const newAccounts = prevState.accounts.map(acc =>
                acc.id === trade.accountId
                    ? { ...acc, currentCapital: (acc.currentCapital || 0) + result }
                    : acc
            );
            return { ...prevState, trades: [...prevState.trades, trade], accounts: newAccounts };
        }
        case 'UPDATE_TRADE': {
            const { oldTrade, newTrade } = action.payload;
            const oldResult = parseFloat(String(oldTrade.result)) || 0;
            const newResult = parseFloat(String(newTrade.result)) || 0;

            const accountsAfterUpdate = prevState.accounts.map(acc => {
                let capitalChange = 0;

                // If this account is the old trade's account, revert the old result
                if (acc.id === oldTrade.accountId) {
                    capitalChange -= oldResult;
                }
                // If this account is the new trade's account, apply the new result
                if (acc.id === newTrade.accountId) {
                    capitalChange += newResult;
                }

                if (capitalChange !== 0) {
                    return { ...acc, currentCapital: (acc.currentCapital || 0) + capitalChange };
                }
                return acc;
            });

            return {
                ...prevState,
                trades: prevState.trades.map(t => (t.id === newTrade.id ? newTrade : t)),
                accounts: accountsAfterUpdate,
            };
        }
        case 'DELETE_TRADE': {
            const trade = action.payload;
            const result = parseFloat(String(trade.result)) || 0;
            const newAccounts = prevState.accounts.map(acc =>
                acc.id === trade.accountId
                    ? { ...acc, currentCapital: (acc.currentCapital || 0) - result }
                    : acc
            );
            return { ...prevState, trades: prevState.trades.filter(t => t.id !== trade.id), accounts: newAccounts };
        }
        case 'ADD_STRATEGY':
            return { ...prevState, strategies: [...prevState.strategies, action.payload] };
        case 'UPDATE_STRATEGY':
            return { ...prevState, strategies: prevState.strategies.map(s => s.id === action.payload.id ? action.payload : s) };
        case 'DELETE_STRATEGY':
            return {
                ...prevState,
                strategies: prevState.strategies.filter(s => s.id !== action.payload),
                accounts: prevState.accounts.map(a => a.strategyId === action.payload ? { ...a, strategyId: undefined } : a),
                trades: prevState.trades.map(t => t.strategyId === action.payload ? { ...t, strategyId: undefined } : t)
             };
        case 'ADD_PRESET':
            return { ...prevState, presets: [...prevState.presets, action.payload] };
        case 'DELETE_PRESET':
            return { ...prevState, presets: prevState.presets.filter(p => p.id !== action.payload) };
        case 'TOGGLE_THEME':
            return { ...prevState, theme: prevState.theme === 'light' ? 'dark' : 'light' };
        case 'SET_COLOR_THEME':
            return { ...prevState, colorTheme: action.payload, customColor: action.payload === 'custom' ? prevState.customColor : null };
        case 'SET_CUSTOM_COLOR':
            return { ...prevState, customColor: action.payload, colorTheme: 'custom' };
        case 'SET_LANGUAGE':
            return { ...prevState, language: action.payload };
        case 'RESET_DATA':
            return { ...prevState, accounts: [], trades: [], strategies: [], presets: [] };
        case 'SET_PAGE':
            return { ...prevState, activePage: action.payload };
        case 'FOCUS_TRADE':
            return { ...prevState, focusedTradeId: action.payload };
        case 'SET_STATE':
             return action.payload;
        default:
            return prevState;
    }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem('eclipseTradeJournal');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                if (parsedState && typeof parsedState === 'object') {
                    const accounts = Array.isArray(parsedState.accounts) ? parsedState.accounts : [];
                    const trades = Array.isArray(parsedState.trades) ? parsedState.trades : [];
                    const strategies = Array.isArray(parsedState.strategies) ? parsedState.strategies : [];
                    const presets = Array.isArray(parsedState.presets) ? parsedState.presets : [];
                    
                    const sanitizedTrades = trades.map((trade: any) => ({
                        ...trade,
                        result: parseFloat(String(trade.result)) || 0,
                        lotSize: parseFloat(String(trade.lotSize)) || 0,
                        takeProfitPips: parseFloat(String(trade.takeProfitPips)) || 0,
                        stopLossPips: parseFloat(String(trade.stopLossPips)) || 0,
                    }));

                    const sanitizedAccounts = accounts.map((account: any) => {
                        const initialCapital = parseFloat(String(account.initialCapital)) || 0;
                        const tradesForAccount = sanitizedTrades.filter((t: any) => t.accountId === account.id);
                        const totalProfit = tradesForAccount.reduce((sum: number, t: any) => sum + t.result, 0);
                        
                        return {
                            ...account,
                            initialCapital,
                            currentCapital: initialCapital + totalProfit,
                            profitTarget: parseFloat(String(account.profitTarget)) || 0,
                            drawdownValue: parseFloat(String(account.drawdownValue)) || 0,
                        };
                    });

                    const finalState = {
                        ...initialState,
                        ...parsedState,
                        accounts: sanitizedAccounts,
                        trades: sanitizedTrades,
                        strategies: strategies,
                        presets: presets,
                    };

                    dispatch({ type: 'SET_STATE', payload: finalState });
                }
            }
        } catch (error) {
            console.error("Failed to load or sanitize state from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('eclipseTradeJournal', JSON.stringify(state));
            
            if (state.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
             document.documentElement.classList.forEach(className => {
                if (className.startsWith('theme-')) {
                    document.documentElement.classList.remove(className);
                }
            });
            document.documentElement.classList.add(`theme-${state.colorTheme || 'zinc'}`);

            if (state.colorTheme === 'custom' && state.customColor) {
                const hex = state.customColor;
                let r = parseInt(hex.slice(1, 3), 16);
                let g = parseInt(hex.slice(3, 5), 16);
                let b = parseInt(hex.slice(5, 7), 16);
                r /= 255; g /= 255; b /= 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                let h=0, s=0, l = (max + min) / 2;
                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                        case g: h = (b - r) / d + 2; break;
                        case b: h = (r - g) / d + 4; break;
                    }
                    h /= 6;
                }
                const h_hsl = Math.round(h * 360);
                const s_hsl = Math.round(s * 100);
                const l_hsl = Math.round(l * 100);
                
                document.documentElement.style.setProperty('--primary', `${h_hsl} ${s_hsl}% ${l_hsl}`);
                document.documentElement.style.setProperty('--primary-focus', `${h_hsl} ${s_hsl}% ${l_hsl > 10 ? l_hsl-5 : l_hsl+5}%`);
            } else {
                 document.documentElement.style.removeProperty('--primary');
                 document.documentElement.style.removeProperty('--primary-focus');
            }

        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};


export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    const { state, dispatch } = context;

    const t = useCallback((key: string) => {
        return translations[state.language][key] || translations['en'][key] || key;
    }, [state.language]);
    
    const getCurrencySymbol = useCallback((currency: Currency | undefined) => {
        switch (currency) {
            case Currency.USD: return '$';
            case Currency.EUR: return '€';
            case Currency.GBP: return '£';
            case Currency.JPY: return '¥';
            default: return '$';
        }
    }, []);

    const toggleTheme = useCallback(() => dispatch({ type: 'TOGGLE_THEME' }), [dispatch]);
    const setColorTheme = useCallback((themeName: string) => dispatch({ type: 'SET_COLOR_THEME', payload: themeName }), [dispatch]);
    const setCustomColor = useCallback((color: string | null) => dispatch({ type: 'SET_CUSTOM_COLOR', payload: color }), [dispatch]);
    const setLanguage = useCallback((lang: 'en' | 'es') => dispatch({ type: 'SET_LANGUAGE', payload: lang }), [dispatch]);
    const resetData = useCallback(() => dispatch({ type: 'RESET_DATA' }), [dispatch]);
    const setPage = useCallback((page: ActivePage) => dispatch({ type: 'SET_PAGE', payload: page }), [dispatch]);
    const focusTrade = useCallback((tradeId: string | null) => dispatch({ type: 'FOCUS_TRADE', payload: tradeId }), [dispatch]);
    
    const addAccount = useCallback((account: Account) => dispatch({ type: 'ADD_ACCOUNT', payload: account }), [dispatch]);
    const updateAccount = useCallback((account: Account) => dispatch({ type: 'UPDATE_ACCOUNT', payload: account }), [dispatch]);
    const deleteAccount = useCallback((accountId: string) => dispatch({ type: 'DELETE_ACCOUNT', payload: accountId }), [dispatch]);
    
    const addTrade = useCallback((trade: Trade) => dispatch({ type: 'ADD_TRADE', payload: trade }), [dispatch]);
    const updateTrade = useCallback((oldTrade: Trade, newTrade: Trade) => dispatch({ type: 'UPDATE_TRADE', payload: {oldTrade, newTrade}}), [dispatch]);
    const deleteTrade = useCallback((trade: Trade) => dispatch({ type: 'DELETE_TRADE', payload: trade }), [dispatch]);

    const addStrategy = useCallback((strategy: Strategy) => dispatch({ type: 'ADD_STRATEGY', payload: strategy }), [dispatch]);
    const updateStrategy = useCallback((strategy: Strategy) => dispatch({ type: 'UPDATE_STRATEGY', payload: strategy }), [dispatch]);
    const deleteStrategy = useCallback((strategyId: string) => dispatch({ type: 'DELETE_STRATEGY', payload: strategyId }), [dispatch]);

    const addPreset = useCallback((preset: TradePreset) => dispatch({ type: 'ADD_PRESET', payload: preset }), [dispatch]);
    const deletePreset = useCallback((presetId: string) => dispatch({ type: 'DELETE_PRESET', payload: presetId }), [dispatch]);

    return {
        state,
        dispatch,
        ...state,
        t,
        getCurrencySymbol,
        toggleTheme,
        setColorTheme,
        setCustomColor,
        setLanguage,
        resetData,
        setPage,
        focusTrade,
        addAccount,
        updateAccount,
        deleteAccount,
        addTrade,
        updateTrade,
        deleteTrade,
        addStrategy,
        updateStrategy,
        deleteStrategy,
        addPreset,
        deletePreset
    };
};
