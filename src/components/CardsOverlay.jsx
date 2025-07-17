import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import InfoCard from "./InfoCard";

const CardsOverlay = ({ cards, isCompleted, onAllCardsCompleted, onCardsHidden }) => {
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [isHiding, setIsHiding] = useState(false);
    const scrollContainerRef = useRef(null);
  
    // Reset cuando el componente se vuelve a mostrar
    useEffect(() => {
      if (!isCompleted) {
        setHasScrolledToEnd(false);
        setIsHiding(false);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }
    }, [isCompleted]);
  
    const handleScroll = useCallback((e) => {
      const container = e.target;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Verificar si llegó al final del scroll (con un pequeño margen de tolerancia)
      const hasReachedEnd = scrollTop + clientHeight >= scrollHeight - 10;
      
      if (hasReachedEnd && !hasScrolledToEnd) {
        setHasScrolledToEnd(true);
        // Esperar un poco antes de marcar como completado para que el usuario vea el final
        setTimeout(() => {
          setIsHiding(true);
          setTimeout(() => {
            // Notificar al padre que las cards están ocultas
            onCardsHidden();
            // onAllCardsCompleted(); // Comentado como tenías
          }, 500); // Tiempo para la animación de salida
        }, 2000);
      }
    }, [hasScrolledToEnd, onAllCardsCompleted, onCardsHidden]);
  
    const handleBackgroundClick = useCallback((e) => {
      // Solo activar si el click es directamente en el fondo, no en los elementos hijos
      if (e.target === e.currentTarget) {
        setIsHiding(true);
        setTimeout(() => {
          onCardsHidden();
        }, 500);
      }
    }, [onCardsHidden]);
  
    if (isCompleted) return null;
  
    return (
      <motion.div
        className="cards-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: isHiding ? 0 : 1 }}
        transition={{ duration: 0.5 }}
        onClick={handleBackgroundClick}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          pointerEvents: "auto",
          cursor: "pointer", // Indicar que es clickeable
          background: "rgba(0, 0, 0, 0.1)", // Fondo muy sutil para indicar área clickeable
        }}
      >
        {/* Contenedor de scroll para las cards */}
        <motion.div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onClick={(e) => e.stopPropagation()} // Prevenir cierre del overlay
          initial={{ opacity: 1, x: 0 }}
          animate={{ 
            opacity: isHiding ? 0 : 1,
            x: isHiding ? -50 : 0
          }}
          transition={{ duration: 0.5 }}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "400px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 10px 20px 0",
            // Estilos del scrollbar
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
            cursor: "default", // Cambiar cursor para indicar que no es clickeable para cerrar
          }}
          className="cards-scroll-container"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ 
                opacity: isHiding ? 0 : 1, 
                y: isHiding ? -20 : 0,
                scale: isHiding ? 0.95 : 1
              }}
              transition={{ 
                duration: 0.4, 
                delay: isHiding ? index * 0.05 : index * 0.1 
              }}
              style={{ marginBottom: "20px" }}
            >
              <InfoCard data={card} isActive={true} />
            </motion.div>
          ))}
          
          {/* Indicador de que debe seguir haciendo scroll */}
          {!hasScrolledToEnd && !isHiding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => e.stopPropagation()} // Prevenir cierre del overlay
              style={{
                background: "rgba(52, 152, 219, 0.9)",
                color: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                textAlign: "center",
                marginTop: "10px",
                position: "sticky",
                bottom: "10px",
                cursor: "default"
              }}
            >
              ↓ Continúa haciendo scroll para ver más información
            </motion.div>
          )}
        </motion.div>
  
        {/* Indicador de progreso basado en scroll */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: isHiding ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()} // Prevenir cierre del overlay
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "4px",
            height: "calc(100vh - 120px)",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "2px",
            overflow: "hidden",
            cursor: "default"
          }}
        >
          <motion.div
            style={{
              width: "100%",
              background: "linear-gradient(to bottom, #3498db, #27ae60)",
              borderRadius: "2px",
              transformOrigin: "top",
            }}
            initial={{ scaleY: 0 }}
            animate={{ 
              scaleY: hasScrolledToEnd ? 1 : 0,
              transition: { duration: 0.3 }
            }}
          />
        </motion.div>
  
        {/* Mensaje de finalización */}
        {hasScrolledToEnd && !isHiding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => e.stopPropagation()} // Prevenir cierre del overlay
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(39, 174, 96, 0.95)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "25px",
              fontSize: "1rem",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              cursor: "default"
            }}
          >
            ✓ ¡Perfecto! Ahora puedes interactuar con el mapa
          </motion.div>
        )}
      </motion.div>
    );
  }

  export default CardsOverlay;