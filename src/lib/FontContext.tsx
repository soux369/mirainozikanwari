import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from './types';

interface FontContextType {
    currentFont: string;
}

const FontContext = createContext<FontContextType>({ currentFont: 'System' });

export const FontProvider: React.FC<{ settings: Settings; children: React.ReactNode }> = ({ settings, children }) => {
    // We can derive it directly from settings
    return (
        <FontContext.Provider value={{ currentFont: settings.fontFamily }}>
            {children}
        </FontContext.Provider>
    );
};

export const useFont = () => useContext(FontContext);
