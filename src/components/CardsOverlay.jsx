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
        style={{
          cursor: "pointer",
          background: "rgba(0, 0, 0, 0.1)",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          minHeight: "calc(100vh - 88px)",
          maxHeight: "calc(100vh - 88px)",
          height: "calc(100vh - 88px)",
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
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "20px 10px 20px 10px",
            // Estilos del scrollbar
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.3) transparent",
            cursor: "default",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
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
              style={{ 
                width: "100%",
                maxWidth: "100%"
              }}
            >
              <InfoCard data={card} isActive={true} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  export default CardsOverlay;