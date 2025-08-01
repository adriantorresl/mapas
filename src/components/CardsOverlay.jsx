import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import InfoCard from "./InfoCard";

const CardsOverlay = ({ cards, isCompleted }) => {
  const [isHiding, setIsHiding] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // Determinar si debe centrarse verticalmente (menos de 3 cards)
  const shouldCenterVertically = cards.length < 3;
  
  // Calcular altura del contenedor basado en el número de cards
  const getContainerHeight = () => {
    if (shouldCenterVertically) {
      return "auto";
    }
    // Para más de 2 cards, usar altura fija
    return "93vh";
  };
  
  // Reset cuando el componente se vuelve a mostrar
  useEffect(() => {
    if (!isCompleted) {
      setIsHiding(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [isCompleted]);
  
  const handleBackgroundClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setIsHiding(true);
    }
  }, []);
  
  if (isCompleted || isHiding) return null;
  
  return (
    <motion.div
      className="cards-overlay"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.95,
        y: -20
      }}
      transition={{ 
        duration: 0.5,
        ease: "easeInOut"
      }}
      onClick={handleBackgroundClick}
      style={{
        pointerEvents: "auto",
        height: "100vh",
        width: "100%",
        cursor: "pointer",
        background: "rgba(0, 0, 0, 0.1)",
        transform: "translateZ(0)",
        willChange: "opacity, transform",
        display: "flex",
        alignItems: shouldCenterVertically ? "center" : "flex-start",
        justifyContent: "center",
      }}
    >
      <motion.div
        ref={scrollContainerRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 1, x: 0, y: 0 }}
        animate={{ 
          opacity: 1,
          x: 0,
          y: 0
        }}
        transition={{ 
          duration: 0.5,
          ease: "easeInOut"
        }}
        style={{
          width: "100%",
          height: getContainerHeight(),
          maxHeight: getContainerHeight(),
          minHeight: shouldCenterVertically ? "auto" : "93vh",
          padding: "20px",
          scrollbarWidth: "thin",
          cursor: "default",
          transform: "translateZ(0)",
          willChange: "opacity, transform",
          overflowY: shouldCenterVertically ? "hidden" : "auto",
          overflowX: "hidden",
          marginTop: shouldCenterVertically ? "0" : "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          justifyContent: shouldCenterVertically ? "center" : "flex-start",
          boxSizing: "border-box"
        }}
        className="cards-scroll-container"
      >
        {(() => {
          const cardsPerRow = 2;
          const rows = [];
          
          for (let i = 0; i < cards.length; i += cardsPerRow) {
            const rowCards = cards.slice(i, i + cardsPerRow);
            rows.push(
              <motion.div
                key={`row-${i}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                transition={{ 
                  duration: 0.4, 
                  delay: (i / cardsPerRow) * 0.1,
                  ease: "easeOut"
                }}
                style={{ 
                  width: "100%",
                  display: "flex",
                  gap: "20px",
                  justifyContent: "space-between",
                  transform: "translateZ(0)",
                  willChange: "opacity, transform"
                }}
              >
                {rowCards.map((card, cardIndex) => (
                  <motion.div
                    key={`card-${i + cardIndex}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: 1
                    }}
                    transition={{ 
                      duration: 0.4, 
                      delay: (i + cardIndex) * 0.1,
                      ease: "easeOut"
                    }}
                    style={{ 
                      flex: rowCards.length === 1 ? "0 0 auto" : "1",
                      maxWidth: "350px",
                      transform: "translateZ(0)",
                      willChange: "opacity, transform"
                    }}
                  >
                    <InfoCard data={card} isActive={true} />
                  </motion.div>
                ))}
              </motion.div>
            );
          }
          
          return rows;
        })()}
      </motion.div>
    </motion.div>
  );
};

export default CardsOverlay;