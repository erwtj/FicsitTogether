import { useState, useEffect, useCallback } from 'react';

export type openHelpModalDetails = {
    openPage: string | null;
}


export function useHelpModal() {
    const [show, setShow] = useState(false);
    const [details, setDetails] = useState<openHelpModalDetails | null>(null);

    useEffect(() => {
        const onCustomEvent = (event: Event) => {
            const customEventDetails = (event as CustomEvent).detail as openHelpModalDetails;
            setShow(true);
            setDetails(customEventDetails);
        }

        window.addEventListener('openHelpModal', onCustomEvent);
        return () => {
            window.removeEventListener('openHelpModal', onCustomEvent);
        }
    }, [])

    const onModalClose = useCallback(() => {
        setShow(false);
        setDetails(null);
    }, [])

    return {show, details, onModalClose}
}