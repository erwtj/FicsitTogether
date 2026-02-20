import { createContext, useContext } from "react";
import * as Y from "yjs";

/**
 * Provides the shared Y.Doc ref to all node and edge components.
 * Wrap your ReactFlow provider with <YjsProvider ydocRef={...}>.
 */
export const YjsContext = createContext<React.RefObject<Y.Doc | null> | null>(null);

export function useYjsDoc(): React.RefObject<Y.Doc | null> {
    const ctx = useContext(YjsContext);
    if (!ctx) throw new Error("useYjsDoc must be used inside <YjsProvider>");
    return ctx;
}