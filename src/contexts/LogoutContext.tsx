import React, { createContext, useContext } from 'react';

interface LogoutContextType {
  onLogout: () => void;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export const LogoutProvider: React.FC<{ 
  onLogout: () => void; 
  children: React.ReactNode 
}> = ({ onLogout, children }) => {
  return (
    <LogoutContext.Provider value={{ onLogout }}>
      {children}
    </LogoutContext.Provider>
  );
};

export const useLogout = () => {
  const context = useContext(LogoutContext);
  if (!context) {
    throw new Error('useLogout must be used within LogoutProvider');
  }
  return context;
};
