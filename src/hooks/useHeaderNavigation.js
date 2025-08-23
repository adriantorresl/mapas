import { useState, useCallback, useMemo } from 'react';
import { findSectionById, navigationData } from '../constants/navigationData';
import { useNavigationActions } from '../contexts/NavigationContext';

// Constantes para evitar re-creaciones
const INITIAL_HEADER_ITEMS = [{ key: "home", label: "Home" }];
const INITIAL_SELECTED_SUB_ITEMS = {
  "home": { key: "localizacion", label: "Localización" }
};

/**
 * Custom hook para manejar la lógica de navegación del header
 * Separa la lógica de estado y navegación del componente UI
 */
export const useHeaderNavigation = (onNavigate) => {
  // Estados principales del header
  const [currentMainSection, setCurrentMainSection] = useState(null);
  const [currentSubSection, setCurrentSubSection] = useState(null);
  const [headerItems, setHeaderItems] = useState(INITIAL_HEADER_ITEMS);
  const [selectedSubItems, setSelectedSubItems] = useState(INITIAL_SELECTED_SUB_ITEMS);
  const [selectedHeaderItem, setSelectedHeaderItem] = useState(null);
  const [selectedSubSection, setSelectedSubSection] = useState(null);
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Contexto de navegación - solo las acciones para evitar re-renders innecesarios
  const { navigateToPage } = useNavigationActions();

  // Función memoizada para resetear al estado inicial
  const resetToInitialState = useCallback(() => {
    setCurrentMainSection(null);
    setCurrentSubSection(null);
    setSelectedHeaderItem(null);
    setHeaderItems(INITIAL_HEADER_ITEMS);
    setSelectedSubItems(INITIAL_SELECTED_SUB_ITEMS);
    setExpandedItems(new Set());
  }, []);

  // Función memoizada para navegar
  const navigate = useCallback((pageId, sectionKey = null) => {
    const key = sectionKey || pageId;
    onNavigate?.(key);
    navigateToPage(pageId);
  }, [onNavigate, navigateToPage]);

  // Función para procesar subsecciones y crear items del header
  const processSubsections = useCallback((subsections) => {
    return subsections.map(sub => ({
      key: sub.id,
      label: sub.titulo
    }));
  }, []);

  // Función para calcular items seleccionados por defecto
  const calculateDefaultSelectedItems = useCallback((headerItems) => {
    const newSelectedSubItems = {};
    headerItems.forEach(item => {
      const subsection = findSectionById(item.key);
      if (subsection?.subsecciones?.length > 0) {
        newSelectedSubItems[item.key] = subsection.subsecciones[0];
      } else {
        newSelectedSubItems[item.key] = item;
      }
    });
    return newSelectedSubItems;
  }, []);

  // Manejador principal para clics en secciones del dropdown
  const handleMainSectionClick = useCallback((sectionId) => {
    setIsDrawerOpen(prev => !prev);
    
    const section = findSectionById(sectionId);
    if (!section?.subsecciones) return;

    setCurrentMainSection(section);
    setCurrentSubSection(null);
    setSelectedHeaderItem(null);

    const newHeaderItems = processSubsections(section.subsecciones);
    setHeaderItems(newHeaderItems);

    const newSelectedSubItems = calculateDefaultSelectedItems(newHeaderItems);
    setSelectedSubItems(newSelectedSubItems);

    // Navegar al primer item por defecto
    const firstKey = Object.keys(newSelectedSubItems)[0];
    if (firstKey) {
      const firstItem = newSelectedSubItems[firstKey];
      setSelectedHeaderItem(firstKey);
      
      const hasNestedSubsections = section.subsecciones?.length > 1 && 
        section.subsecciones[0]?.subsecciones?.length > 0;
      
      if (hasNestedSubsections) {
        const firstSubsection = section.subsecciones[0].subsecciones[0];
        navigate(firstSubsection.id, firstSubsection.key);
      } else {
        navigate(firstItem.key);
      }
    }
  }, [processSubsections, calculateDefaultSelectedItems, navigate]);

  // Manejador para clics en items del header
  const handleHeaderItemClick = useCallback((itemKey) => {
    setExpandedItems(new Set([itemKey]));
    setSelectedHeaderItem(null);
    setSelectedSubSection(null);

    // Caso especial: volver al inicio
    if (itemKey === "0") {
      resetToInitialState();
      navigate("0", "localizacion");
      return;
    }

    const subsection = findSectionById(itemKey);
    if (!subsection) return;

    // Si tiene subsecciones, actualizar header items
    if (subsection.subsecciones?.length > 0) {
      setHeaderItems(processSubsections(subsection.subsecciones));
      setSelectedHeaderItem(itemKey);
      return;
    }

    // Navegar directamente si no hay más subsecciones
    setCurrentSubSection(subsection);
    setSelectedHeaderItem(itemKey);
    
    if (subsection.subsecciones?.length > 0) {
      const defaultSubItem = subsection.subsecciones[0];
      navigate(defaultSubItem.key);
    } else {
      navigate(itemKey);
    }
  }, [resetToInitialState, navigate, processSubsections]);

  // Manejador para cambios en subitems
  const handleSubItemChange = useCallback((subItem) => {
    setSelectedSubItem(subItem.key);
    navigate(subItem.key);
  }, [navigate]);

  // Manejador para toggle de expansión
  const toggleExpanded = useCallback((itemKey) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.clear();
        newSet.add(itemKey);
      }
      return newSet;
    });
  }, []);

  // Manejador para clics en botón expandir
  const handleExpandClick = useCallback((itemKey, event) => {
    event.stopPropagation();
    toggleExpanded(itemKey);
  }, [toggleExpanded]);

  // Manejador para clics en submenú
  const handleSubmenuClick = useCallback((subItem) => {
    setSelectedSubSection(null);
    setSelectedHeaderItem(null);
    setSelectedSubSection(subItem.id);
    setIsDrawerOpen(false);

    if (subItem.subsecciones?.length > 0) {
      setSelectedSubItems(processSubsections(subItem.subsecciones));
      setSelectedSubItem(subItem.subsecciones[0].id);
      navigate(subItem.subsecciones[0].id);
    } else {
      setSelectedSubItems([]);
      setSelectedHeaderItem(subItem.id);
      navigate(subItem.id);
    }
  }, [navigate, processSubsections]);

  // Función para cerrar el drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Estado computado para el dropdown - memoizado para evitar re-creaciones
  const dropdownItems = useMemo(() => {
    return navigationData.indice.map(section => ({
      key: section.id,
      label: section.titulo,
      onClick: () => handleMainSectionClick(section.id)
    }));
  }, [handleMainSectionClick]);

  return {
    // Estados
    currentMainSection,
    currentSubSection,
    headerItems,
    selectedSubItems,
    selectedHeaderItem,
    selectedSubSection,
    selectedSubItem,
    isDrawerOpen,
    expandedItems,
    dropdownItems,
    
    // Acciones
    handleMainSectionClick,
    handleHeaderItemClick,
    handleSubItemChange,
    handleExpandClick,
    handleSubmenuClick,
    closeDrawer,
    resetToInitialState
  };
};
