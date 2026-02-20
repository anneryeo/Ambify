import React, { createContext, useContext } from 'react';

interface TransitionContextType {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

export const TransitionContext = createContext<TransitionContextType>({
  navigate: () => {},
  goBack: () => {},
});

export const useTransition = () => useContext(TransitionContext);
