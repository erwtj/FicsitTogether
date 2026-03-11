import { useContext } from "react";
import { ClientSettingsContext } from "../context/ClientSettingsContext.tsx";

export function useClientSettings() {
    const ctx = useContext(ClientSettingsContext);
    if (!ctx) throw new Error('useClientSettings must be used within ClientSettingsProvider');
    return ctx;
}

