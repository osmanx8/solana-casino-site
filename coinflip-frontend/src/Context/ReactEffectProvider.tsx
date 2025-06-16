import React, { createContext, useContext, useEffect, useState } from 'react';

interface WebSocketContextProps {
    confetti: boolean;
    setConfetti: (selection: boolean) => void
}
const ReactEffectContext = createContext<WebSocketContextProps | undefined>(undefined);

const ReactEffectPrivder: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [confetti, showConfetti] = useState(false);

    const setConfetti = (selection: boolean) => {
        showConfetti(selection);
    }
    
    return (
        <ReactEffectContext.Provider value={{ confetti, setConfetti }}>
            {children}
        </ReactEffectContext.Provider>
    );
}

const useEffectContext = () => {
    const context = useContext(ReactEffectContext);
    if (!context) {
        throw new Error('useEffectContext must be used within a ReactEffectPrivder');
    }
    return context;
};

export { ReactEffectPrivder, useEffectContext }