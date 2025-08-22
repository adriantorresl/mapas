import React, { createContext, useContext, useMemo } from 'react';
import { useManageData } from '../hooks/useManageData';

const NavigationContext = createContext();

// Hook principal para acceder a todo el contexto
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Hooks especializados para acceder solo a partes específicas del contexto
// Esto previene re-renders innecesarios cuando solo se necesita una parte del estado

export const useNavigationActions = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationActions must be used within a NavigationProvider');
  }
  
  // Solo retorna las funciones de acción, no el estado
  return useMemo(() => ({
    navigateToPage: context.navigateToPage,
    loadPageData: context.loadPageData,
    getCurrentPage: context.getCurrentPage
  }), [context.navigateToPage, context.loadPageData, context.getCurrentPage]);
};

export const useNavigationState = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationState must be used within a NavigationProvider');
  }
  
  // Solo retorna el estado, no las funciones
  return useMemo(() => ({
    data: context.data,
    blocks: context.blocks,
    loading: context.loading,
    error: context.error,
    currentPageId: context.currentPageId
  }), [context.data, context.blocks, context.loading, context.error, context.currentPageId]);
};

export const useCurrentPage = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useCurrentPage must be used within a NavigationProvider');
  }
  
  // Solo retorna la página actual y su ID
  return useMemo(() => ({
    currentPageId: context.currentPageId,
    currentPage: context.data
  }), [context.currentPageId, context.data]);
};

export const NavigationProvider = ({ children }) => {
  const navigationData = useManageData();

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => navigationData, [navigationData]);

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};
