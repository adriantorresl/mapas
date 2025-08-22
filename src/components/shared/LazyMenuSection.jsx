import { memo, Suspense, lazy, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente de lazy loading para secciones del menú
 * Carga las subsecciones solo cuando son necesarias
 */

// Simulador de carga dinámica para subsecciones
const createLazySubsection = (sectionId) => {
  return lazy(() => {
    // Simular carga asíncrona de datos de subsección
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          default: ({ subsections, selectedSubSection, onSubmenuClick }) => (
            <ul className="header-submenu">
              {subsections.map((subItem) => (
                <li key={subItem.id} className="header-submenu-item">
                  <span
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
                      cursor: 'pointer'
                    }}
                  >
                    {subItem.titulo}
                  </span>
                </li>
              ))}
            </ul>
          )
        });
      }, 80); // Simular 100ms de carga
    });
  });
};

// Cache de componentes lazy para evitar recargas
const subsectionCache = new Map();

const LazyMenuSection = memo(({ 
  sectionId, 
  subsections, 
  selectedSubSection, 
  onSubmenuClick,
  isVisible 
}) => {
  const [LazySubsectionComponent, setLazySubsectionComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isVisible || !subsections?.length) {
      return;
    }

    // Verificar si ya está en cache
    if (subsectionCache.has(sectionId)) {
      setLazySubsectionComponent(() => subsectionCache.get(sectionId));
      return;
    }

    // Cargar componente lazy
    setIsLoading(true);
    const LazyComponent = createLazySubsection(sectionId);
    
    // Precargar el componente
    LazyComponent.preload?.();
    
    // Cachear el componente
    subsectionCache.set(sectionId, LazyComponent);
    setLazySubsectionComponent(() => LazyComponent);
    setIsLoading(false);
  }, [sectionId, subsections, isVisible]);

  if (!isVisible || !subsections?.length) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="header-submenu-loading" style={{ 
        padding: '8px 16px', 
        fontSize: '0.9rem', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Cargando...
      </div>
    );
  }

  if (!LazySubsectionComponent) {
    return null;
  }

  return (
    <Suspense fallback={
      <div className="header-submenu-loading" style={{ 
        padding: '8px 16px', 
        fontSize: '0.9rem', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        Cargando subsecciones...
      </div>
    }>
      <LazySubsectionComponent
        subsections={subsections}
        selectedSubSection={selectedSubSection}
        onSubmenuClick={onSubmenuClick}
      />
    </Suspense>
  );
});

LazyMenuSection.propTypes = {
  sectionId: PropTypes.string.isRequired,
  subsections: PropTypes.array,
  selectedSubSection: PropTypes.string,
  onSubmenuClick: PropTypes.func.isRequired,
  isVisible: PropTypes.bool.isRequired
};

LazyMenuSection.defaultProps = {
  subsections: [],
  selectedSubSection: null
};

LazyMenuSection.displayName = 'LazyMenuSection';

export default LazyMenuSection;
