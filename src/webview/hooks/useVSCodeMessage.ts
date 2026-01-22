import { useEffect } from 'react';

export function useVSCodeMessage(handlers: { [key: string]: (data: any) => void }) {
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (handlers[message.command]) {
                handlers[message.command](message);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handlers]);
}
