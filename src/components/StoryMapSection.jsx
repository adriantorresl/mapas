import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import CardsOverlay from "./CardsOverlay";

const StoryMapSection = ({ children, id, cards = [] }) => {
  const [ref, inView] = useInView({
    threshold: 0,
  });
  
  const [cardsCompleted, setCardsCompleted] = useState(false);

  // Reset cuando la sección sale de vista
  useEffect(() => {
    if (!inView && cards.length > 0) {
      setCardsCompleted(false);
    }
  }, [inView, cards.length]);

  // Si no hay cards, marcar como completado inmediatamente
  useEffect(() => {
    if (cards.length === 0) {
      setCardsCompleted(true);
    }
  }, [cards.length]);

  // Condición para mostrar cards: tiene cards + en vista + no completadas
  const shouldShowCards = cards.length > 0 && inView && !cardsCompleted;

  return (
    <section
      ref={ref}
      id={id}
      className="story-section"
      style={{
        minHeight: "100vh",
        paddingTop: 40,
        paddingBottom: 40,
      }}
    >
      <motion.div
        className="section-content"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {shouldShowCards && cards && (
          <CardsOverlay
            cards={cards}
            isCompleted={cardsCompleted}
          />
        )}
        <div style={{ height: "100vh" }}>
          {children}
        </div>
      </motion.div>
    </section>
  );
};

export default StoryMapSection; 