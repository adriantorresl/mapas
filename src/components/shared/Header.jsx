import React, { memo, useMemo } from "react";
import { Typography, Space, Drawer } from "antd";
import { RightOutlined } from "@ant-design/icons";
import PropTypes from 'prop-types';
import { findSectionById } from "../../constants/navigationData";
import { useHeaderNavigation } from "../../hooks/useHeaderNavigation";
import { useNavigationState } from "../../contexts/NavigationContext";
import LazyMenuSection from "./LazyMenuSection";

/**
 * Componente Header optimizado con memoización y separación de responsabilidades
 * - Utiliza custom hook para lógica de navegación
 * - Memoización para prevenir re-renders innecesarios
 * - PropTypes para mejor debugging
 * - Componentes internos memoizados
 */

// Componente memoizado para el logo
const HeaderLogo = memo(({ logo, onClick }) => (
  <img 
    src={logo} 
    alt="Logo Tierra de Agaves" 
    className="header-logo" 
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  />
));

HeaderLogo.propTypes = {
  logo: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

// Componente memoizado para el título del header
const HeaderTitle = memo(({ title }) => {
  if (!title) return null;
  
  return (
    <Typography.Title 
      level={3} 
      style={{ 
        color: '#FFF2CC', 
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        padding: '1rem'
      }}
    >
      {title}
    </Typography.Title>
  );
});

HeaderTitle.propTypes = {
  title: PropTypes.string
};

// Componente memoizado para items del menú
const MenuItem = memo(({ 
  item, 
  section, 
  isSelected, 
  isExpanded, 
  onItemClick, 
  onExpandClick 
}) => {
  const hasSubsections = section?.subsecciones?.length > 0;

  return (
    <li key={item.key} className="header-menu-item">
      <div className="header-menu-item-container">
        <Typography.Link
          className={`header-menu-item-link ${isSelected ? 'selected' : ''}`}
          onClick={() => onItemClick(item.key)}
          style={{
            color: '#1E3C20',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '5px',
            fontSize: '1.5rem',
            lineHeight: '1.166',
            flex: 1,
          }}
        >
          <Space>{item.label}</Space>
        </Typography.Link>
        
        {hasSubsections && (
          <Typography.Link
            className="header-menu-expand-button"
            onClick={(event) => onExpandClick(item.key, event)}
            style={{
              padding: '4px',
              color: '#1E3C20',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          >
            <RightOutlined />
          </Typography.Link>
        )}
      </div>
      
      {/* Submenús colapsables con lazy loading */}
      <LazyMenuSection
        sectionId={item.key}
        subsections={section?.subsecciones}
        selectedSubSection={item.selectedSubSection}
        onSubmenuClick={item.onSubmenuClick}
        isVisible={hasSubsections && isExpanded}
      />
    </li>
  );
});

MenuItem.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    selectedSubSection: PropTypes.string,
    onSubmenuClick: PropTypes.func
  }).isRequired,
  section: PropTypes.object,
  isSelected: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onItemClick: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func.isRequired
};

// Componente memoizado para la lista de submenús
const SubmenuList = memo(({ subsections, selectedSubSection, onSubmenuClick }) => (
  <ul className="header-submenu">
    {subsections.map((subItem) => (
      <li key={subItem.id} className="header-submenu-item">
        <Typography.Link
          className={`header-submenu-item-link ${selectedSubSection === subItem.id ? 'selected' : ''}`}
          onClick={() => onSubmenuClick(subItem)}
          style={{
            color: '#1E3C20',
            padding: '8px 16px',
            borderRadius: '4px',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1.2rem',
            lineHeight: '1.166',
          }}
        >
          <Space>{subItem.titulo}</Space>
        </Typography.Link>
      </li>
    ))}
  </ul>
));

SubmenuList.propTypes = {
  subsections: PropTypes.array.isRequired,
  selectedSubSection: PropTypes.string,
  onSubmenuClick: PropTypes.func.isRequired
};

// Componente memoizado para el contenido del drawer
const DrawerContent = memo(({ 
  dropdownItems, 
  selectedHeaderItem, 
  selectedSubSection,
  expandedItems,
  onHeaderItemClick,
  onExpandClick,
  onSubmenuClick
}) => (
  <nav className="header-nav">
    <ul className="header-menu">
      {dropdownItems.map((item) => {
        const section = findSectionById(item.key);
        const isExpanded = expandedItems.has(item.key);
        
        return (
          <MenuItem
            key={item.key}
            item={{
              ...item,
              selectedSubSection,
              onSubmenuClick
            }}
            section={section}
            isSelected={selectedHeaderItem === item.key}
            isExpanded={isExpanded}
            onItemClick={onHeaderItemClick}
            onExpandClick={onExpandClick}
          />
        );
      })}
    </ul>
  </nav>
));

DrawerContent.propTypes = {
  dropdownItems: PropTypes.array.isRequired,
  selectedHeaderItem: PropTypes.string,
  selectedSubSection: PropTypes.string,
  expandedItems: PropTypes.instanceOf(Set).isRequired,
  onHeaderItemClick: PropTypes.func.isRequired,
  onExpandClick: PropTypes.func.isRequired,
  onSubmenuClick: PropTypes.func.isRequired
};

// Componente memoizado para el bottom navigation
const BottomNavigation = memo(({ selectedSubItems, selectedSubItem, onSubItemChange }) => {
  if (!Array.isArray(selectedSubItems) || selectedSubItems.length === 0) {
    return null;
  }

  return (
    <div className="header-container-bottom">
      <nav className="header-container-bottom-nav">
        <ul className="header-container-bottom-list">
          {selectedSubItems.map((item) => (
            <li className="header-container-bottom-item" key={item.key}>
              <span 
                className={`header-container-bottom-item-link ${selectedSubItem === item.key ? 'selected' : ''}`}
                onClick={() => onSubItemChange(item)}
                style={{ cursor: 'pointer' }}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
});

BottomNavigation.propTypes = {
  selectedSubItems: PropTypes.array.isRequired,
  selectedSubItem: PropTypes.string,
  onSubItemChange: PropTypes.func.isRequired
};

// Componente principal del Header
const Header = memo(({ onNavigate, logo }) => {
  // Hook personalizado que contiene toda la lógica de navegación
  const {
    // Estados
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
    closeDrawer
  } = useHeaderNavigation(onNavigate);

  // Hook para obtener el ID de la página actual
  const { currentPageId } = useNavigationState();

  // Función memoizada para manejar click en logo (volver al inicio)
  const handleLogoClick = useMemo(() => 
    () => handleMainSectionClick("0"), 
    [handleMainSectionClick]
  );

  // Lógica para mostrar el título del subitem seleccionado del drawer
  const headerTitle = useMemo(() => {
    // Debug para verificar estados
    console.log('Header Title Debug:', {
      currentPageId,
      selectedSubSection,
      selectedHeaderItem,
      selectedSubItems,
      selectedSubItem
    });

    // Caso especial: página inicial
    if (currentPageId === "0") {
      return "Inicio";
    }

    // Buscar el subitem seleccionado en el drawer (selectedSubSection)
    if (selectedSubSection) {
      // Buscar la sección completa por ID para obtener el título
      const section = findSectionById(selectedSubSection);
      if (section?.titulo) {
        console.log('Title from selectedSubSection:', section.titulo);
        return section.titulo;
      }
    }

    // Si no hay selectedSubSection pero hay selectedHeaderItem, 
    // significa que estamos en una sección principal sin subsecciones
    if (selectedHeaderItem && !selectedSubSection) {
      const section = findSectionById(selectedHeaderItem);
      if (section?.titulo) {
        console.log('Title from selectedHeaderItem:', section.titulo);
        return section.titulo;
      }
    }

    // Fallback para el caso inicial
    console.log('Using fallback title');
    return "Tierra de Agaves";
  }, [currentPageId, selectedSubSection, selectedHeaderItem, selectedSubItems, selectedSubItem]);

  // Memoizar el contenido del drawer para evitar re-renders
  const drawerContent = useMemo(() => (
    <DrawerContent
      dropdownItems={dropdownItems}
      selectedHeaderItem={selectedHeaderItem}
      selectedSubSection={selectedSubSection}
      expandedItems={expandedItems}
      onHeaderItemClick={handleHeaderItemClick}
      onExpandClick={handleExpandClick}
      onSubmenuClick={handleSubmenuClick}
    />
  ), [
    dropdownItems,
    selectedHeaderItem,
    selectedSubSection,
    expandedItems,
    handleHeaderItemClick,
    handleExpandClick,
    handleSubmenuClick
  ]);
  
  return (
    <header className="header-pronatura">
      <div className="header-container">  
        <HeaderLogo 
          logo={logo} 
          onClick={handleLogoClick}
        />
        <HeaderTitle title={headerTitle} />
        <Drawer 
          placement="left" 
          onClose={closeDrawer} 
          open={isDrawerOpen}
        >
          {drawerContent}
        </Drawer>
      </div>
      
      <BottomNavigation
        selectedSubItems={selectedSubItems}
        selectedSubItem={selectedSubItem}
        onSubItemChange={handleSubItemChange}
      />
    </header>
  );
});

Header.propTypes = {
  onNavigate: PropTypes.func,
  logo: PropTypes.string.isRequired
};

Header.defaultProps = {
  onNavigate: () => {}
};

// Asignar displayName para mejor debugging
Header.displayName = 'Header';
HeaderLogo.displayName = 'HeaderLogo';
HeaderTitle.displayName = 'HeaderTitle';
MenuItem.displayName = 'MenuItem';
SubmenuList.displayName = 'SubmenuList';
DrawerContent.displayName = 'DrawerContent';
BottomNavigation.displayName = 'BottomNavigation';

export default Header;