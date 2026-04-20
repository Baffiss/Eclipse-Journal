import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useContext, useCallback } from 'react';
import { Account, Trade, Strategy, Currency, TradePreset, Withdrawal, AccountStatus } from '../types';

const translations: Record<string, Record<string, string>> = {
  en: {
    accounts: `Accounts`,
    trades: `Trades`,
    strategies: `Strategies`,
    analytics: `Analytics`,
    markets: `Markets`,
    dashboard: `Dashboard`,
    settings: `Settings`,
    lightMode: `Light Mode`,
    darkMode: `Dark Mode`,
    colorTheme: `Color Theme`,
    sidebarPosition: `Navigation Position`,
    left: `Left`,
    right: `Right`,
    top: `Top`,
    bottom: `Bottom`,
    dangerZone: `Danger Zone`,
    deleteAllData: `Delete all accounts, trades, and strategies.`,
    deleteAllDataButton: `Delete All Data`,
    deleteAllDataConfirmation: `Are you sure you want to delete all data? This action cannot be undone.`,
    areYouSure: `Are you sure?`,
    cancel: `Cancel`,
    create: `Create`,
    update: `Update`,
    delete: `Delete`,
    edit: `Edit`,
    newAccount: `New Account`,
    editAccount: `Edit Account`,
    createAccount: `Create Account`,
    accountName: `Account Name`,
    initialCapital: `Initial Capital`,
    profitTarget: `Profit Target`,
    drawdownType: `Drawdown Type`,
    drawdownValue: `Drawdown Value`,
    maximumDrawdown: `Maximum Drawdown`,
    trailingDrawdown: `Trailing Drawdown`,
    noStrategy: `No Strategy`,
    allAccounts: `All Accounts`,
    netPL: `Net P/L`,
    currentCapital: `Current Capital`,
    equityCurve: `Equity Curve`,
    recentTrades: `Recent Trades`,
    noTradesYet: `No trades yet.`,
    noAccountsYet: `No Accounts Yet`,
    createYourFirstAccount: `Create your first trading account to get started.`,
    registerTrade: `Register Trade`,
    editTrade: `Edit Trade`,
    selectAccount: `Select Account`,
    date: `Date`,
    asset: `Asset (e.g., EURUSD)`,
    direction: `Direction`,
    buy: `Buy`,
    sell: `Sell`,
    lotSize: `Lot Size`,
    takeProfitPips: `TP (pips)`,
    stopLossPips: `SL (pips)`,
    resultInDollars: `Result ($)`,
    notes: `Notes`,
    uploadScreenshot: `Upload a screenshot`,
    allStrategies: `All Strategies`,
    filterByAsset: `Filter by asset...`,
    tradesOn: `Trades on`,
    noTradesOnThisDay: `No trades on this day.`,
    selectDayToViewTrades: `Select a day from the calendar to view trades.`,
    addTradeToDate: `Add to`,
    newStrategy: `New Strategy`,
    editStrategy: `Edit Strategy`,
    createStrategy: `Create Strategy`,
    strategyName: `Strategy Name`,
    description: `Description`,
    performanceAnalytics: `Performance Analytics`,
    noStrategiesDefined: `No Strategies Defined`,
    createYourFirstStrategy: `Create your first strategy to analyze its performance.`,
    totalTrades: `Total Trades`,
    winRate: `Win Rate`,
    profitFactor: `Profit Factor`,
    avgWinLoss: `Avg. Win / Loss`,
    payoffRatio: `Payoff Ratio`,
    expectedValue: `Expected Value`,
    maxDrawdown: `Max Drawdown`,
    sharpeRatio: `Sharpe Ratio`,
    notEnoughData: `Not Enough Data`,
    selectAccountOrStrategyForAnalytics: `Select an account or strategy with trades to see analytics.`,
    language: `Language`,
    customColor: `Custom Color`,
    backToStrategies: `Back to Strategies`,
    backToAccounts: `All Accounts`,
    deleteAccountConfirmation: `Are you sure? This will delete the account and all associated trades.`,
    deleteStrategyConfirmation: `Are you sure? This will not delete trades.`,
    deleteTradeConfirmation: `Are you sure?`,
    appName: `Eclipse Journal`,
    appNameShort: `Eclipse`,
    collapse: `Collapse`,
    expand: `Expand`,
    toggleFilters: `Toggle Filters`,
    examples: `Examples`,
    addExampleImages: `Add Example Images`,
    createAccountFirst: `You must create an account before adding a trade.`,
    importExport: `Import / Export Data`,
    exportData: `Export Data`,
    exportExcel: `Export to Excel`,
    importData: `Import Data`,
    exportDescription: `Download all your journal data as a JSON file.`,
    exportExcelDescription: `Download your trades in Excel format for external analysis.`,
    importDescription: `Import data from a JSON backup file. This will overwrite all current data.`,
    importConfirmation: `Are you sure you want to import data? This will overwrite all your current data and cannot be undone.`,
    importError: `The selected file is not a valid backup file or is corrupted.`,
    import: `Import`,
    export: `Export`,
    back: `Back`,
    exportOptions: `Export Options`,
    goodMorning: `Good Morning`,
    goodAfternoon: `Good Afternoon`,
    goodEvening: `Good Evening`,
    todaysPnL: `Today's P&L`,
    todaysWinRate: `Today's Win Rate`,
    tradesToday: `Trades Today`,
    upcomingEvents: `Upcoming Events`,
    dailyOverview: `Daily Overview`,
    noTradesToday: `No trades recorded today.`,
    viewAllTrades: `View All Trades`,
    economicCalendar: `Economic Calendar`,
    marketOverview: `Market Overview`,
    forexHeatmap: `Forex Heatmap`,
    cryptoHeatmap: `Crypto Heatmap`,
    stockHeatmap: `Stock Heatmap`,
    marketNews: `Market News`,
    currency: `Currency`,
    usd: `USD`,
    eur: `EUR`,
    gbp: `GBP`,
    jpy: `JPY`,
    profitTargetType: `Profit Target Type`,
    profitTargetValue: `Profit Target Value`,
    drawdownValueType: `Drawdown Value Type`,
    fixed: `Fixed`,
    percentage: `Percentage`,
    status: `Status`,
    active: `Active`,
    inactive: `Inactive`,
    accountType: `Account Type`,
    evaluation: `Evaluation`,
    demo: `Demo`,
    real: `Real`,
    proprietary: `Proprietary Account`,
    allStatuses: `All Statuses`,
    allTypes: `All Types`,
    noAccountsFound: `No accounts found matching your filters.`,
    clearFilters: `Clear Filters`,
    progressToTarget: `Progress to Target`,
    drawdownLimit: `Drawdown Limit`,
    totalProfit: `Total Profit`,
    totalProfitCurve: `Total Profit Curve`,
    hourlyDistribution: `Hourly P/L Distribution`,
    dailyDistribution: `Daily P/L Distribution`,
    performanceByAsset: `Performance by Asset`,
    notableTrades: `Notable Trades`,
    maxWin: `Maximum Win`,
    maxLoss: `Maximum Loss`,
    winLossDistribution: `Win/Loss Distribution`,
    hour: `Hour`,
    wins: `Wins`,
    losses: `Losses`,
    noProfitableAssets: `No profitable assets to display.`,
    totalProfit_desc: `The cumulative sum of all profits and losses across the selected trades.`,
    winRate_desc: `The percentage of trades that resulted in a profit out of the total number of trades closed.`,
    profitFactor_desc: `The ratio of gross profit to gross loss. A value greater than 1.0 indicates a profitable system.`,
    payoffRatio_desc: `Average Risk to Reward ratio. It measures the relationship between your average winning trade and your average losing trade.`,
    expectedValue_desc: `The average amount you can expect to win or lose per trade based on historical performance.`,
    maxDrawdown_desc: `The maximum peak-to-trough decline in equity, expressed as a percentage of the peak value.`,
    tradePresets: `Trade Presets`,
    saveAsPreset: `Save as Preset`,
    presetName: `Preset Name`,
    selectPreset: `Apply Preset`,
    noPresets: `No presets saved.`,
    save: `Save`,
    managePresets: `Manage Presets`,
    deletePreset: `Delete Preset`,
    updatePreset: `Update Preset`,
    presetUpdated: `Preset updated successfully`,
    presetDeleted: `Preset deleted successfully`,
    newPreset: `New Preset`,
    viewScreenshot: `View Screenshot`,
    withdraw: `Withdraw`,
    withdrawAmount: `Withdrawal Amount`,
    totalWithdrawn: `Total Withdrawn`,
    insufficientFunds: `Insufficient funds for this withdrawal.`,
    withdrawalLog: `Withdrawal Log`,
    noWithdrawalsYet: `No withdrawals recorded yet.`,
    monthPerformance: `Month Performance`,
    weeklyBreakdown: `Weekly Breakdown`,
    week: `Week`,
    noTradesRecorded: `No trades recorded`,
    selectDayForDetails: `Select a day for details`,
    performanceCurve: `Performance Curve`,
    economicEvents: `Economic Events`,
    watchlist: `Watchlist`,
    addSymbol: `Add symbol`,
    chat: `AI Chat`,
    aiOnline: `AI Online`,
    poweredByGemini: `Powered by Gemini Pro • Focus on Psychology`,
    askTheAI: `Ask the AI...`,
    clearChat: `Clear chat`,
    aiWelcomeMessage: `Hello! I am Eclipse AI. I am here to help you manage the psychology of your performance. How are you feeling about your trading today?`,
    annualPnL: `Annual P&L`,
    imageNotesPlaceholder: `Add some thoughts about this chart setup...`,
    noActiveAccounts: `No active accounts found. Create or activate an account to register trades.`,
    discipline: `Discipline`,
    consistency: `Consistency`,
    disciplineRules: `Discipline Rules`,
    dailyDiscipline: `Daily Discipline`,
    addRule: `Add Rule`,
    editRule: `Edit Rule`,
    deleteRule: `Delete Rule`,
    ruleText: `Rule Description`,
    category: `Category`,
    existingRules: `Existing Rules`,
    risk: `Risk`,
    strategy: `Strategy`,
    psychology: `Psychology`,
    routine: `Routine`,
    adherence: `Adherence`,
    emotionalState: `Emotional State`,
    calm: `Calm`,
    anxious: `Anxious`,
    greedy: `Greedy`,
    fearful: `Fearful`,
    neutral: `Neutral`,
    noRulesYet: `No rules yet.`,
    createYourFirstRule: `Create your first discipline rule to start tracking.`,
    disciplineStats: `Discipline Stats`,
    adherenceRate: `Adherence Rate`,
    streak: `Streak`,
    days: `Days`,
    rulesMet: `Rules Met`,
    history: `History`,
    automatedRules: `Automated Rules`,
    maxLossPerDay: `Max Loss Per Day`,
    maxTradesPerDay: `Max Trades Per Day`,
    dailyProfitTarget: `Daily Profit Target`,
    maxConsecutiveLosses: `Max Consecutive Losses`,
    stopAfterProfitTarget: `Stop After Profit Target`,
    globalRules: `Global Rules`,
    accountRules: `Account Rules`,
    strategyRules: `Strategy Rules`,
    disciplinePanel: `Discipline Panel`,
    ruleViolationDetected: `Rule Violation Detected`,
    stopTradingRecommended: `Stop trading recommended.`,
    disciplineScore: `Discipline Score`,
    noHistoryYet: `No history recorded yet.`,
    perfectDiscipline: `Perfect Discipline`,
    notesPlaceholder: `Add some notes about your day...`,
    violations: `Violations`,
    ruleBroken: `Rule Broken`,
    daysWithViolations: `Days with Violations`,
    perfectDays: `Perfect Days`,
    feedbackText: `For any complaints or suggestions, please send an email to:`,
    menu: `Menu`,
    system: `System`,
    selectAtLeastOneAccount: `Please select at least one account.`,
    availableDD: `Available DD`,
    distanceToTarget: `Distance to Target`,
    equityCurveActive: `Equity Curve (Active Only)`,
    cumulativeResultProgression: `Cumulative Result Progression`,
    dailyFlux: `Daily Flux`,
    profitLossDistribution: `Profit/Loss distribution per day.`,
    alphaDominance: `Alpha Dominance`,
    topPerformingAssets: `Identification of top performing assets.`,
    peakExecution: `Peak Execution`,
    bottomOut: `Bottom Out`,
    impact: `Impact`,
    currencies: `Currencies`,
    all: `All`,
    clear: `Clear`,
    strategyIdentity: `Strategy Identity (Icon)`,
    pFactor: `P. Factor`,
    noObservations: `No Observations<br/>Recorded For This Setup`,
    systematicEdgeRepository: `Systematic Edge Repository`,
    egAsset: `e.g. NAS100`,
    psychologyContext: `Psychology, context...`,
    egStrategy: `e.g. Break of Structure`,
    strategyLogic: `What is the logic behind this strategy?`,
    editWatchlist: `Edit Watchlist`,
  },
  es: {
    accounts: `Cuentas`,
    trades: `Operaciones`,
    strategies: `Estrategias`,
    analytics: `Analíticas`,
    markets: `Mercados`,
    dashboard: `Panel Principal`,
    settings: `Configuración`,
    lightMode: `Modo Claro`,
    darkMode: `Modo Oscuro`,
    colorTheme: `Color del Tema`,
    sidebarPosition: `Posición de Navegación`,
    left: `Izquierda`,
    right: `Derecha`,
    top: `Arriba`,
    bottom: `Abajo`,
    dangerZone: `Zona de Peligro`,
    deleteAllData: `Eliminar todas las cuentas, operaciones y estrategias.`,
    deleteAllDataButton: `Eliminar Todos los Datos`,
    deleteAllDataConfirmation: `¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.`,
    areYouSure: `¿Estás seguro?`,
    cancel: `Cancelar`,
    create: `Crear`,
    update: `Actualizar`,
    delete: `Eliminar`,
    edit: `Editar`,
    newAccount: `Nueva Cuenta`,
    editAccount: `Editar Cuenta`,
    createAccount: `Crear Cuenta`,
    accountName: `Nombre de la Cuenta`,
    initialCapital: `Capital Inicial`,
    profitTarget: `Objetivo de Ganancia`,
    drawdownType: `Tipo de Drawdown`,
    drawdownValue: `Valor de Drawdown`,
    maximumDrawdown: `Drawdown Máximo`,
    trailingDrawdown: `Drawdown Trailing`,
    noStrategy: `Sin Estrategia`,
    allAccounts: `Todas las Cuentas`,
    netPL: `G/P Neto`,
    currentCapital: `Capital Actual`,
    equityCurve: `Curva de Capital`,
    recentTrades: `Operaciones Recientes`,
    noTradesYet: `Aún no hay operaciones.`,
    noAccountsYet: `Aún no hay cuentas`,
    createYourFirstAccount: `Crea tu primera cuenta de trading para comenzar.`,
    registerTrade: `Registrar Operación`,
    editTrade: `Editar Operación`,
    selectAccount: `Seleccionar Cuenta`,
    date: `Fecha`,
    asset: `Activo (ej. EURUSD)`,
    direction: `Dirección`,
    buy: `Compra`,
    sell: `Venta`,
    lotSize: `Lotaje`,
    takeProfitPips: `TP (pips)`,
    stopLossPips: `SL (pips)`,
    resultInDollars: `Resultado ($)`,
    notes: `Notas`,
    uploadScreenshot: `Sube una captura de pantalla`,
    allStrategies: `Todas las Estrategias`,
    filterByAsset: `Filtrar por activo...`,
    tradesOn: `Operaciones del`,
    noTradesOnThisDay: `No hay operaciones en este día.`,
    selectDayToViewTrades: `Selecciona un día del calendario para ver las operaciones.`,
    addTradeToDate: `Añadir a`,
    newStrategy: `Nueva Estrategia`,
    editStrategy: `Editar Estrategia`,
    createStrategy: `Crear Estrategia`,
    strategyName: `Nombre de Estrategia`,
    description: `Descripción`,
    performanceAnalytics: `Analíticas de Rendimiento`,
    noStrategiesDefined: `No hay Estrategias Definidas`,
    createYourFirstStrategy: `Crea tu primera estrategia para analizar su rendimiento.`,
    totalTrades: `Operaciones Totales`,
    winRate: `Tasa de Acierto`,
    profitFactor: `Factor de Beneficio`,
    avgWinLoss: `Ganancia / Pérdida Promedio`,
    payoffRatio: `Ratio de Pago`,
    expectedValue: `Valor Esperado`,
    maxDrawdown: `Drawdown Máximo`,
    sharpeRatio: `Ratio de Sharpe`,
    notEnoughData: `No Hay Datos Suficientes`,
    selectAccountOrStrategyForAnalytics: `Selecciona una cuenta o estrategia con operaciones para ver las analíticas.`,
    language: `Idioma`,
    customColor: `Color Personalizado`,
    backToStrategies: `Volver a Estrategias`,
    backToAccounts: `Todas las Cuentas`,
    deleteAccountConfirmation: `¿Estás seguro? Esto eliminará la cuenta y todas las operaciones asociadas.`,
    deleteStrategyConfirmation: `¿Estás seguro? Esto no eliminará las operaciones.`,
    deleteTradeConfirmation: `¿Estás seguro?`,
    appName: `Eclipse Journal`,
    appNameShort: `Eclipse`,
    collapse: `Colapsar`,
    expand: `Expandir`,
    toggleFilters: `Alternar Filtros`,
    examples: `Ejemplos`,
    addExampleImages: `Añadir Imágenes de Ejemplo`,
    createAccountFirst: `Debes crear una cuenta antes de añadir una operación.`,
    importExport: `Importar / Exportar Datos`,
    exportData: `Exportar Datos`,
    exportExcel: `Exportar a Excel`,
    importData: `Importar Datos`,
    exportDescription: `Descarga todos los datos de tu diario como un archivo JSON.`,
    exportExcelDescription: `Descarga tus operaciones en formato Excel para análisis externo.`,
    importDescription: `Importa datos desde un archivo de respaldo JSON. Esto sobrescribirá todos los datos actuales.`,
    importConfirmation: `¿Estás seguro de que quieres importar los datos? Esto sobrescribirá todos tus datos actuales y no se puede deshacer.`,
    importError: `El archivo seleccionado no es un archivo de respaldo válido o está dañado.`,
    import: `Importar`,
    export: `Exportar`,
    back: `Volver`,
    exportOptions: `Opciones de Exportación`,
    goodMorning: `Buenos Días`,
    goodAfternoon: `Buenas Tardes`,
    goodEvening: `Buenas Noches`,
    todaysPnL: `P&L de Hoy`,
    todaysWinRate: `Tasa de Acierto Hoy`,
    tradesToday: `Operaciones Hoy`,
    upcomingEvents: `Próximos Eventos`,
    dailyOverview: `Resumen Diario`,
    noTradesToday: `No se registraron operaciones hoy.`,
    viewAllTrades: `Ver Todas`,
    economicCalendar: `Calendario Económico`,
    marketOverview: `Resumen de Mercado`,
    forexHeatmap: `Mapa de Calor Forex`,
    cryptoHeatmap: `Mapa de Calor Cripto`,
    stockHeatmap: `Mapa de Calor Acciones`,
    marketNews: `Noticias del Mercado`,
    currency: `Moneda`,
    usd: `USD`,
    eur: `EUR`,
    gbp: `GBP`,
    jpy: `JPY`,
    profitTargetType: `Tipo de Objetivo de Ganancia`,
    profitTargetValue: `Valor del Objetivo de Ganancia`,
    drawdownValueType: `Tipo de Valor de Drawdown`,
    fixed: `Fijo`,
    percentage: `Porcentaje`,
    status: `Estado`,
    active: `Activo`,
    inactive: `Inactivo`,
    accountType: `Tipo de Cuenta`,
    evaluation: `Evaluación`,
    demo: `Demo`,
    real: `Real`,
    proprietary: `Cuenta Financiada`,
    allStatuses: `Todos los Estados`,
    allTypes: `Todos los Tipos`,
    noAccountsFound: `No se encontraron cuentas con esos filtros.`,
    clearFilters: `Limpiar Filtros`,
    progressToTarget: `Progreso al Objetivo`,
    drawdownLimit: `Límite de Drawdown`,
    totalProfit: `Beneficio Total`,
    totalProfitCurve: `Curva de Beneficio Total`,
    hourlyDistribution: `Distribución G/P por Hora`,
    dailyDistribution: `Distribución G/P Diaria`,
    performanceByAsset: `Rendimiento por Activo`,
    notableTrades: `Operaciones Notables`,
    maxWin: `Máxima Ganancia`,
    maxLoss: `Máxima Péridda`,
    winLossDistribution: `Distribución de Gan./Pérd.`,
    hour: `Hora`,
    wins: `Ganadas`,
    losses: `Perdidas`,
    noProfitableAssets: `No hay activos con ganancias para mostrar.`,
    totalProfit_desc: `La suma acumulativa de todas las ganancias y pérdidas de las operaciones seleccionadas.`,
    winRate_desc: `El porcentaje de operaciones que resultaron en ganancia del total de operaciones cerradas.`,
    profitFactor_desc: `La relación entre el beneficio bruto y la pérdida bruta. Un valor superior a 1.0 indica un sistema rentable.`,
    payoffRatio_desc: `Ratio Riesgo/Beneficio promedio. Mide la relación entre tu ganancia promedio y tu pérdida promedio.`,
    expectedValue_desc: `La cantidad promedio que puedes esperar ganar o perder por operación basada en el rendimiento histórico.`,
    maxDrawdown_desc: `La caída máxima de pico a valle en el capital, expresada como un porcentaje del valor máximo.`,
    tradePresets: `Presets de Operación`,
    saveAsPreset: `Guardar como Preset`,
    presetName: `Nombre del Preset`,
    selectPreset: `Aplicar Preset`,
    noPresets: `No hay presets guardados.`,
    save: `Guardar`,
    managePresets: `Gestionar Presets`,
    deletePreset: `Eliminar Preset`,
    updatePreset: `Actualizar Preset`,
    presetUpdated: `Preset actualizado con éxito`,
    presetDeleted: `Preset eliminado con éxito`,
    newPreset: `Nuevo Preset`,
    viewScreenshot: `Ver Captura`,
    withdraw: `Retirar`,
    withdrawAmount: `Monto del Retiro`,
    totalWithdrawn: `Total Retirado`,
    insufficientFunds: `Fondos insuficientes para este retiro.`,
    withdrawalLog: `Registro de Retiros`,
    noWithdrawalsYet: `Aún no hay retiros registrados.`,
    monthPerformance: `Rendimiento Mensual`,
    weeklyBreakdown: `Resumen Semanal`,
    week: `Semana`,
    noTradesRecorded: `Sin operaciones registradas`,
    selectDayForDetails: `Selecciona un día para ver detalles`,
    performanceCurve: `Curva de Rendimiento`,
    economicEvents: `Eventos Económicos`,
    watchlist: `Lista de Seguimiento`,
    addSymbol: `Añadir símbolo`,
    chat: `Chat de IA`,
    aiOnline: `IA en Línea`,
    poweredByGemini: `Potenciado por Gemini Pro • Enfoque Psicológico`,
    askTheAI: `Pregúntale a la IA...`,
    clearChat: `Borrar chat`,
    aiWelcomeMessage: `¡Hola! Soy Eclipse AI. Estoy aquí para ayudarte a gestionar la psicología de tu rendimiento. ¿Cómo te sientes respecto a tu trading hoy?`,
    annualPnL: `P&L Anual`,
    imageNotesPlaceholder: `Añade tus observaciones sobre este gráfico...`,
    noActiveAccounts: `No hay cuentas activas. Crea o activa una cuenta para registrar operaciones.`,
    discipline: `Disciplina`,
    consistency: `Consistencia`,
    disciplineRules: `Reglas de Disciplina`,
    dailyDiscipline: `Disciplina Diaria`,
    addRule: `Añadir Regla`,
    editRule: `Editar Regla`,
    deleteRule: `Eliminar Regla`,
    ruleText: `Descripción de la Regla`,
    category: `Categoría`,
    existingRules: `Reglas Existentes`,
    risk: `Riesgo`,
    strategy: `Estrategia`,
    psychology: `Psicología`,
    routine: `Rutina`,
    adherence: `Adherencia`,
    emotionalState: `Estado Emocional`,
    calm: `Calma`,
    anxious: `Ansioso`,
    greedy: `Codicioso`,
    fearful: `Temeroso`,
    neutral: `Neutral`,
    noRulesYet: `No hay reglas aún.`,
    createYourFirstRule: `Crea tu primera regla de disciplina para empezar a rastrear.`,
    disciplineStats: `Estadísticas de Disciplina`,
    adherenceRate: `Tasa de Adherencia`,
    streak: `Racha`,
    days: `Días`,
    rulesMet: `Reglas Cumplidas`,
    history: `Historial`,
    automatedRules: `Reglas Automáticas`,
    maxLossPerDay: `Pérdida Máxima Diaria`,
    maxTradesPerDay: `Trades Máximos Diarios`,
    dailyProfitTarget: `Objetivo de Ganancia Diaria`,
    maxConsecutiveLosses: `Pérdidas Consecutivas Máximas`,
    stopAfterProfitTarget: `Parar después del Objetivo de Ganancia`,
    globalRules: `Reglas Globales`,
    accountRules: `Reglas de Cuenta`,
    strategyRules: `Reglas de Estrategia`,
    disciplinePanel: `Panel de Disciplina`,
    ruleViolationDetected: `Violación de Regla Detectada`,
    stopTradingRecommended: `Se recomienda dejar de operar.`,
    disciplineScore: `Puntaje de Disciplina`,
    noHistoryYet: `Aún no hay historial registrado.`,
    perfectDiscipline: `Disciplina Perfecta`,
    notesPlaceholder: `Añade algunas notas sobre tu día...`,
    violations: `Violaciones`,
    ruleBroken: `Regla Rota`,
    daysWithViolations: `Días con Violaciones`,
    perfectDays: `Días Perfectos`,
    feedbackText: `Para cualquier queja o sugerencia, envía un correo a:`,
    menu: `Menú`,
    system: `Sistema`,
    selectAtLeastOneAccount: `Por favor, seleccione al menos una cuenta.`,
    availableDD: `DD Disponible`,
    distanceToTarget: `Distancia al Objetivo`,
    equityCurveActive: `Curva de Capital (Solo Activas)`,
    cumulativeResultProgression: `Progresión de Resultado Acumulado`,
    dailyFlux: `Flujo Diario`,
    profitLossDistribution: `Distribución de Ganancias/Pérdidas por día.`,
    alphaDominance: `Dominancia Alfa`,
    topPerformingAssets: `Identificación de los activos con mejor rendimiento.`,
    peakExecution: `Ejecución Máxima`,
    bottomOut: `Punto Más Bajo`,
    impact: `Impacto`,
    currencies: `Divisas`,
    all: `Todo`,
    clear: `Limpiar`,
    strategyIdentity: `Identidad de Estrategia (Icono)`,
    pFactor: `F. de Beneficio`,
    noObservations: `No hay observaciones<br/>registradas para esta configuración`,
    systematicEdgeRepository: `Repositorio de Ventaja Sistemática`,
    egAsset: `ej. NAS100`,
    psychologyContext: `Psicología, contexto...`,
    egStrategy: `ej. Quiebre de Estructura`,
    strategyLogic: `¿Cuál es la lógica detrás de esta estrategia?`,
    editWatchlist: `Editar Lista de Seguimiento`,
  }
};

export type ActivePage = `dashboard` | `accounts` | `trades` | `strategies` | `analytics` | `markets`;
export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

export interface AppState {
  accounts: Account[];
  trades: Trade[];
  withdrawals: Withdrawal[];
  strategies: Strategy[];
  presets: TradePreset[];
  theme: 'light' | 'dark';
  colorTheme: string;
  sidebarPosition: SidebarPosition;
  customColor: string | null;
  language: 'en' | 'es';
  activePage: ActivePage;
  focusedTradeId: string | null;
  selectedAccountId: string | null;
  selectedStrategyId: string | null;
}

type Action =
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'WITHDRAW_FUNDS'; payload: Withdrawal }
  | { type: 'DELETE_WITHDRAWAL'; payload: Withdrawal }
  | { type: 'ADD_TRADE'; payload: Trade }
  | { type: 'UPDATE_TRADE'; payload: { oldTrade: Trade; newTrade: Trade } }
  | { type: 'DELETE_TRADE'; payload: Trade }
  | { type: 'ADD_STRATEGY'; payload: Strategy }
  | { type: 'UPDATE_STRATEGY'; payload: Strategy }
  | { type: 'DELETE_STRATEGY'; payload: string }
  | { type: 'ADD_PRESET'; payload: TradePreset }
  | { type: 'UPDATE_PRESET'; payload: TradePreset }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_COLOR_THEME'; payload: string }
  | { type: 'SET_SIDEBAR_POSITION'; payload: SidebarPosition }
  | { type: 'SET_CUSTOM_COLOR'; payload: string | null }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'es' }
  | { type: 'RESET_DATA' }
  | { type: 'SET_PAGE'; payload: ActivePage }
  | { type: 'SELECT_ACCOUNT'; payload: string | null }
  | { type: 'SELECT_STRATEGY'; payload: string | null }
  | { type: 'FOCUS_TRADE'; payload: string | null }
  | { type: 'SET_STATE'; payload: AppState };

const initialState: AppState = {
  accounts: [],
  trades: [],
  withdrawals: [],
  strategies: [],
  presets: [],
  theme: 'dark',
  colorTheme: 'zinc',
  sidebarPosition: 'left',
  customColor: null,
  language: 'en',
  activePage: 'dashboard',
  focusedTradeId: null,
  selectedAccountId: null,
  selectedStrategyId: null,
};

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
        trades: prevState.trades.filter(t => t.accountId !== action.payload),
        withdrawals: prevState.withdrawals.filter(w => w.accountId !== action.payload)
      };
    case 'WITHDRAW_FUNDS': {
      const withdrawal = action.payload;
      return {
        ...prevState,
        accounts: prevState.accounts.map(acc =>
          acc.id === withdrawal.accountId
            ? {
              ...acc,
              totalWithdrawn: (acc.totalWithdrawn || 0) + withdrawal.amount,
              currentCapital: acc.currentCapital - withdrawal.amount
            }
            : acc
        ),
        withdrawals: [...prevState.withdrawals, withdrawal]
      };
    }
    case 'DELETE_WITHDRAWAL': {
      const withdrawal = action.payload;
      return {
        ...prevState,
        accounts: prevState.accounts.map(acc =>
          acc.id === withdrawal.accountId
            ? {
              ...acc,
              totalWithdrawn: Math.max(0, (acc.totalWithdrawn || 0) - withdrawal.amount),
              currentCapital: acc.currentCapital + withdrawal.amount
            }
            : acc
        ),
        withdrawals: prevState.withdrawals.filter(w => w.id !== withdrawal.id)
      };
    }
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
        if (acc.id === oldTrade.accountId) {
          capitalChange -= oldResult;
        }
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
    case 'UPDATE_PRESET':
      return { ...prevState, presets: prevState.presets.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRESET':
      return { ...prevState, presets: prevState.presets.filter(p => p.id !== action.payload) };
    case 'TOGGLE_THEME':
      return { ...prevState, theme: prevState.theme === 'light' ? 'dark' : 'light' };
    case 'SET_COLOR_THEME':
      return { ...prevState, colorTheme: action.payload, customColor: action.payload === 'custom' ? prevState.customColor : null };
    case 'SET_SIDEBAR_POSITION':
        return { ...prevState, sidebarPosition: action.payload };
    case 'SET_CUSTOM_COLOR':
      return { ...prevState, customColor: action.payload, colorTheme: 'custom' };
    case 'SET_LANGUAGE':
      return { ...prevState, language: action.payload };
    case 'RESET_DATA':
      return { ...prevState, accounts: [], trades: [], withdrawals: [], strategies: [], presets: [] };
    case 'SET_PAGE':
      return { ...prevState, activePage: action.payload, selectedAccountId: null, selectedStrategyId: null };
    case 'SELECT_ACCOUNT':
      return { ...prevState, selectedAccountId: action.payload };
    case 'SELECT_STRATEGY':
      return { ...prevState, selectedStrategyId: action.payload };
    case 'FOCUS_TRADE':
      return { ...prevState, focusedTradeId: action.payload };
    case 'SET_STATE':
      return action.payload;
    default:
      return prevState;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
} | undefined>(undefined);

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
          const withdrawals = Array.isArray(parsedState.withdrawals) ? parsedState.withdrawals : [];
          const strategies = Array.isArray(parsedState.strategies) ? parsedState.strategies : [];
          const presets = Array.isArray(parsedState.presets) ? parsedState.presets : [];

          const sanitizedTrades = trades.map((trade: any) => ({
            ...trade,
            result: parseFloat(String(trade.result)) || 0,
            lotSize: parseFloat(String(trade.lotSize)) || 0,
            takeProfitPips: parseFloat(String(trade.takeProfitPips)) || 0,
            stopLossPips: parseFloat(String(trade.stopLossPips)) || 0,
          }));

          const sanitizedWithdrawals = withdrawals.map((w: any) => ({
            ...w,
            amount: parseFloat(String(w.amount)) || 0,
          }));

          const sanitizedPresets = presets.map((p: any) => ({
            ...p,
            lotSize: parseFloat(String(p.lotSize)) || 0,
            takeProfitPips: parseFloat(String(p.takeProfitPips)) || 0,
            stopLossPips: parseFloat(String(p.stopLossPips)) || 0,
          }));

          const sanitizedStrategies = sanitizedStrategiesFromParsed(strategies);

          const sanitizedAccounts = sanitizedAccountsFromParsed(accounts, sanitizedTrades, sanitizedWithdrawals);

          const finalState = {
            ...initialState,
            ...parsedState,
            accounts: sanitizedAccounts,
            trades: sanitizedTrades,
            withdrawals: sanitizedWithdrawals,
            strategies: sanitizedStrategies,
            presets: sanitizedPresets,
            activePage: (parsedState.activePage === 'chat') ? 'dashboard' : (parsedState.activePage || 'dashboard'),
          };
          dispatch({ type: 'SET_STATE', payload: finalState });
        }
      }
    } catch (error) {
      console.error('Failed to load or sanitize state from localStorage', error);
    }
  }, []);

  function sanitizedStrategiesFromParsed(strategies: any[]) {
    return strategies.map((s: any) => {
      const images = Array.isArray(s.images) ? s.images.map((img: any) => {
        if (typeof img === 'string') {
          return { id: crypto.randomUUID(), url: img, notes: '' };
        }
        return img;
      }) : [];
      return { ...s, images };
    });
  }

  function sanitizedAccountsFromParsed(accounts: any[], sanitizedTrades: any[], sanitizedWithdrawals: any[]) {
    return accounts.map((account: any) => {
      const initialCapital = parseFloat(String(account.initialCapital)) || 0;
      const withdrawalsForAccount = sanitizedWithdrawals.filter((w: any) => w.accountId === account.id);
      const totalWithdrawn = withdrawalsForAccount.reduce((sum: number, w: any) => sum + w.amount, 0);
      const tradesForAccount = sanitizedTrades.filter((t: any) => t.accountId === account.id);
      const totalProfit = tradesForAccount.reduce((sum: number, t: any) => sum + t.result, 0);

      return {
        ...account,
        initialCapital,
        totalWithdrawn,
        currentCapital: initialCapital + totalProfit - totalWithdrawn,
        profitTarget: parseFloat(String(account.profitTarget)) || 0,
        drawdownValue: parseFloat(String(account.drawdownValue)) || 0,
      };
    });
  }

  function sanitizedAutomatedRulesFromParsed(rules: any) {
    if (!rules) return { global: {}, accounts: {}, strategies: {} };
    
    const sanitizedGlobal = { ...rules.global };
    if (sanitizedGlobal.maxLossPerDay !== undefined) sanitizedGlobal.maxLossPerDay = parseFloat(String(sanitizedGlobal.maxLossPerDay)) || 0;
    if (sanitizedGlobal.maxTradesPerDay !== undefined) sanitizedGlobal.maxTradesPerDay = parseInt(String(sanitizedGlobal.maxTradesPerDay)) || 0;
    if (sanitizedGlobal.dailyProfitTarget !== undefined) sanitizedGlobal.dailyProfitTarget = parseFloat(String(sanitizedGlobal.dailyProfitTarget)) || 0;
    if (sanitizedGlobal.maxConsecutiveLosses !== undefined) sanitizedGlobal.maxConsecutiveLosses = parseInt(String(sanitizedGlobal.maxConsecutiveLosses)) || 0;

    const sanitizedAccounts: any = {};
    if (rules.accounts) {
      Object.entries(rules.accounts).forEach(([id, accRules]: [string, any]) => {
        sanitizedAccounts[id] = { ...accRules };
        if (accRules.maxTradesPerDay !== undefined) sanitizedAccounts[id].maxTradesPerDay = parseInt(String(accRules.maxTradesPerDay)) || 0;
        if (accRules.maxLossPerDay !== undefined) sanitizedAccounts[id].maxLossPerDay = parseFloat(String(accRules.maxLossPerDay)) || 0;
      });
    }

    const sanitizedStrategies: any = {};
    if (rules.strategies) {
      Object.entries(rules.strategies).forEach(([id, stratRules]: [string, any]) => {
        sanitizedStrategies[id] = { ...stratRules };
        if (stratRules.maxTradesPerDay !== undefined) sanitizedStrategies[id].maxTradesPerDay = parseInt(String(stratRules.maxTradesPerDay)) || 0;
      });
    }

    return {
      global: sanitizedGlobal,
      accounts: sanitizedAccounts,
      strategies: sanitizedStrategies
    };
  }

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
        let h = 0, s = 0, l = (max + min) / 2;
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
        document.documentElement.style.setProperty('--primary-focus', `${h_hsl} ${s_hsl}% ${l_hsl > 10 ? l_hsl - 5 : l_hsl + 5}%`);
      } else {
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--primary-focus');
      }
    } catch (error) {
      console.error('Failed to save state to localStorage', error);
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
  const setSidebarPosition = useCallback((pos: SidebarPosition) => dispatch({ type: 'SET_SIDEBAR_POSITION', payload: pos }), [dispatch]);
  const setCustomColor = useCallback((color: string | null) => dispatch({ type: 'SET_CUSTOM_COLOR', payload: color }), [dispatch]);
  const setLanguage = useCallback((lang: 'en' | 'es') => dispatch({ type: 'SET_LANGUAGE', payload: lang }), [dispatch]);
  const resetData = useCallback(() => dispatch({ type: 'RESET_DATA' }), [dispatch]);
  const setPage = useCallback((page: ActivePage) => dispatch({ type: 'SET_PAGE', payload: page }), [dispatch]);
  const setSelectedAccount = useCallback((id: string | null) => dispatch({ type: 'SELECT_ACCOUNT', payload: id }), [dispatch]);
  const setSelectedStrategy = useCallback((id: string | null) => dispatch({ type: 'SELECT_STRATEGY', payload: id }), [dispatch]);
  const focusTrade = useCallback((tradeId: string | null) => dispatch({ type: 'FOCUS_TRADE', payload: tradeId }), [dispatch]);
  const addAccount = useCallback((account: Account) => dispatch({ type: 'ADD_ACCOUNT', payload: account }), [dispatch]);
  const updateAccount = useCallback((account: Account) => dispatch({ type: 'UPDATE_ACCOUNT', payload: account }), [dispatch]);
  const deleteAccount = useCallback((accountId: string) => dispatch({ type: 'DELETE_ACCOUNT', payload: accountId }), [dispatch]);
  const withdrawFunds = useCallback((withdrawal: Withdrawal) => dispatch({ type: 'WITHDRAW_FUNDS', payload: withdrawal }), [dispatch]);
  const deleteWithdrawal = useCallback((withdrawal: Withdrawal) => dispatch({ type: 'DELETE_WITHDRAWAL', payload: withdrawal }), [dispatch]);
  const addTrade = useCallback((trade: Trade) => dispatch({ type: 'ADD_TRADE', payload: trade }), [dispatch]);
  const updateTrade = useCallback((oldTrade: Trade, newTrade: Trade) => dispatch({ type: 'UPDATE_TRADE', payload: { oldTrade, newTrade } }), [dispatch]);
  const deleteTrade = useCallback((trade: Trade) => dispatch({ type: 'DELETE_TRADE', payload: trade }), [dispatch]);
  const addStrategy = useCallback((strategy: Strategy) => dispatch({ type: 'ADD_STRATEGY', payload: strategy }), [dispatch]);
  const updateStrategy = useCallback((strategy: Strategy) => dispatch({ type: 'UPDATE_STRATEGY', payload: strategy }), [dispatch]);
  const deleteStrategy = useCallback((strategyId: string) => dispatch({ type: 'DELETE_STRATEGY', payload: strategyId }), [dispatch]);
  const addPreset = useCallback((preset: TradePreset) => dispatch({ type: 'ADD_PRESET', payload: preset }), [dispatch]);
  const updatePreset = useCallback((preset: TradePreset) => dispatch({ type: 'UPDATE_PRESET', payload: preset }), [dispatch]);
  const deletePreset = useCallback((presetId: string) => dispatch({ type: 'DELETE_PRESET', payload: presetId }), [dispatch]);

  return {
    state,
    dispatch,
    ...state,
    t,
    getCurrencySymbol,
    toggleTheme,
    setColorTheme,
    setSidebarPosition,
    setCustomColor,
    setLanguage,
    resetData,
    setPage,
    setSelectedAccount,
    setSelectedStrategy,
    focusTrade,
    addAccount,
    updateAccount,
    deleteAccount,
    withdrawFunds,
    deleteWithdrawal,
    addTrade,
    updateTrade,
    deleteTrade,
    addStrategy,
    updateStrategy,
    deleteStrategy,
    addPreset,
    updatePreset,
    deletePreset,
  };
};
