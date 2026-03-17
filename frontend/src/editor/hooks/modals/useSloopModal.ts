import { useState, useEffect, useCallback } from 'react';

export type OpenSloopModalDetails = {
    nodeId: string;
}

export function useSloopModal() {
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

    const onModalSubmit = useCallback(() => {
        setShow(false);
        setDetails(null);
    }, [])

    return {show, details, onModalSubmit}
}