import { useState, useEffect, useCallback } from 'react';
import type {SloopData} from "../../types.ts";

export type OpenSloopModalDetails = {
    nodeId: string;
}


export function useSloopModal(onSubmitCallback: (nodeId: string, data: SloopData[] | null) => void) {
    const [show, setShow] = useState(false);
    const [details, setDetails] = useState<OpenSloopModalDetails | null>(null);

    useEffect(() => {
        const onCustomEvent = (event: Event) => {
            const customEventDetails = (event as CustomEvent).detail as OpenSloopModalDetails;
            setShow(true);
            setDetails(customEventDetails);
        }

        window.addEventListener('openSloopModal', onCustomEvent);
        return () => {
            window.removeEventListener('openSloopModal', onCustomEvent);
        }
    }, [])

    const onModalSubmit = useCallback((data: SloopData[] | null | undefined) => {
        if (data !== undefined && details?.nodeId) {
            onSubmitCallback(details.nodeId, data);
        }
        setShow(false);
        setDetails(null);
    }, [details, onSubmitCallback])

    return {show, details, onModalSubmit}
}