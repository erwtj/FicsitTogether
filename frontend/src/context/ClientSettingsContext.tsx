import { createContext } from "react";
import useLocalStorage from "../hooks/useLocalStorage.ts";

export type ClientSettings = {
    /* Editor */
    // Minimap
    minimapEnabled: boolean;
    minimapColors: boolean;
    // Dragging
    snappingEnabled: boolean;
    snapSize: number;

    /* Overview */
    showWaterUsage: boolean;
    showPhotonUsage: boolean;
}

const defaultClientSettings: ClientSettings = {
    minimapEnabled: true,
    minimapColors: true,
    snappingEnabled: true,
    snapSize: 20,
    showWaterUsage: true,
    showPhotonUsage: true,
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


