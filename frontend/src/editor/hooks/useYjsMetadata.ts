import { useState, useEffect, useCallback } from "react";
import { useYjsDoc } from "../context/YjsContext";

export type DocumentMetadata = {
    name: string;
    description: string;
};

/**
 * Reads and writes the "metadata" Y.Map in the shared Yjs doc.
 * Polls until the doc is ready (the ref is populated asynchronously by
 * useYjsSync), then subscribes via Y.Map.observe so updates are reactive.
 */
export function useYjsMetadata() {
    const ydocRef = useYjsDoc();
    const [metadata, setMetadata] = useState<DocumentMetadata>({ name: "", description: "" });

    useEffect(() => {
        let unobserve: (() => void) | null = null;

        function attach(doc: import("yjs").Doc) {
            const map = doc.getMap<string>("metadata");
            const observer = () => {
                setMetadata({
                    name: map.get("name") ?? "",
                    description: map.get("description") ?? "",
                });
            };
            map.observe(observer);
            observer(); // read initial value
            unobserve = () => map.unobserve(observer);
        }

        // Doc may already be available (e.g. hot-reload)
        if (ydocRef.current) {
            attach(ydocRef.current);
            return () => unobserve?.();
        }

        // Otherwise poll until the doc is assigned by useYjsSync
        const interval = setInterval(() => {
            if (ydocRef.current) {
                clearInterval(interval);
                attach(ydocRef.current);
            }
        }, 50);

        return () => {
            clearInterval(interval);
            unobserve?.();
        };
    }, [ydocRef]);

    const setName = useCallback(
        (name: string) => {
            const doc = ydocRef.current;
            if (!doc) return;
            doc.getMap<string>("metadata").set("name", name);
        },
        [ydocRef],
    );

    const setDescription = useCallback(
        (description: string) => {
            const doc = ydocRef.current;
            if (!doc) return;
            doc.getMap<string>("metadata").set("description", description);
        },
        [ydocRef],
    );

    return { metadata, setTitle: setName, setDescription };
}
