import { AppState } from '../context/AppContext';

/**
 * Triggers a browser download of the entire application state as a JSON file.
 * UI-specific settings like theme are excluded from the backup.
 * @param state The current application state to be exported.
 */
export const exportData = (state: AppState) => {
    try {
        const backupState = { ...state };
        // Don't export UI theme settings, as they are device-specific preferences.
        delete (backupState as Partial<AppState>).theme;
        delete (backupState as Partial<AppState>).colorTheme;
        delete (backupState as Partial<AppState>).customColor;
        delete (backupState as Partial<AppState>).activePage;
        delete (backupState as Partial<AppState>).focusedTradeId;

        const jsonString = JSON.stringify(backupState, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.download = `eclipse-journal-backup-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data", error);
        alert("An error occurred while exporting your data.");
    }
};

/**
 * Reads a JSON file selected by the user, parses it, and returns the application state.
 * @param file The file selected by the user.
 * @returns A promise that resolves with the parsed AppState or rejects with an error.
 */
export const importData = (file: File): Promise<Omit<AppState, 'theme' | 'colorTheme' | 'customColor'>> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (event.target?.result && typeof event.target.result === 'string') {
                    const parsed = JSON.parse(event.target.result);
                    
                    // Basic validation of core structures
                    const hasCoreData = Array.isArray(parsed.accounts) && Array.isArray(parsed.trades);
                    
                    if (hasCoreData) {
                        // Ensure required fields exist even if importing an old file
                        const sanitizedResult = {
                            ...parsed,
                            strategies: Array.isArray(parsed.strategies) ? parsed.strategies : [],
                            presets: Array.isArray(parsed.presets) ? parsed.presets : [],
                            withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
                            language: parsed.language || 'en'
                        };
                        resolve(sanitizedResult);
                    } else {
                        reject(new Error('Invalid file format: Missing core account or trade data.'));
                    }
                } else {
                     reject(new Error('Failed to read file.'));
                }
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};