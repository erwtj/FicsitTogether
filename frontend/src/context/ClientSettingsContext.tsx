import { createContext } from "react";
import useLocalStorage from "../hooks/useLocalStorage.ts";

export type ClientSettings = {
    /* Editor */
    // Minimap
    minimapEnabled: boolean;
    minimapColors: boolean;

    // Control overlay
    showControls: boolean;

    // Handle ToolTips
    showToolTips: boolean;

    // Throughput editing
    autoBackPropagation: boolean;

    // Dragging
    snappingEnabled: boolean;
    snapSize: number;

    /* Side Panel */
    enableIONetto: boolean;

    /* Overview */
    showWaterUsage: boolean;
    showPhotonUsage: boolean;

    /* Personal */
    showUsernames: boolean;
    showEmail: boolean;
}

const defaultClientSettings: ClientSettings = {
    minimapEnabled: true,
    minimapColors: true,
    showControls: true,
    autoBackPropagation: false,
    snappingEnabled: false,
    snapSize: 20,
    showToolTips: true,
    enableIONetto: false,
    showWaterUsage: true,
    showPhotonUsage: true,
    showUsernames: true,
    showEmail: true,
};

type ClientSettingsContextType = {
    clientSettings: ClientSettings;
    updateClientSettings: (updates: Partial<ClientSettings>) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ClientSettingsContext = createContext<ClientSettingsContextType | null>(null);

export function ClientSettingsProvider({ children }: { children: React.ReactNode }) {
    const [clientSettings, setClientSettings] = useLocalStorage<ClientSettings>(
        'clientsettings',
        defaultClientSettings
    );

    function updateClientSettings(updates: Partial<ClientSettings>) {
        setClientSettings((prev: ClientSettings) => ({ ...prev, ...updates } as ClientSettings));
    }

    return (
        <ClientSettingsContext.Provider value={{ clientSettings, updateClientSettings }}>
            {children}
        </ClientSettingsContext.Provider>
    );
}


