import React from 'react';
import { motion } from 'framer-motion';

// Constantes para evitar recrear objetos en cada render
const CARD_STYLES = {
  container: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "8px",
    padding: "20px",
    color: "#333",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    maxWidth: "350px",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    position: "relative"
  },
  title: {
    marginBottom: "12px",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#2c3e50"
  },
  description: {
    lineHeight: "1.5",
    fontSize: "0.95rem",
    margin: "0",
    color: "#34495e"
  },
  metricsContainer: {
    marginTop: "12px"
  },
  metricItem: {
    margin: "0 8px 0 0"
  },
  metricValue: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    color: "#27ae60"
  },
  metricLabel: {
    fontSize: "0.8rem",
    color: "#7f8c8d"
  }
};

// Componente para métricas individuales
const MetricItem = React.memo(({ metric }) => (
  <div className="metric-item" style={CARD_STYLES.metricItem}>
    <div style={CARD_STYLES.metricValue}>
      {metric.value}
    </div>
    <div style={CARD_STYLES.metricLabel}>
      {metric.label}
    </div>
  </div>
));

MetricItem.displayName = 'MetricItem';

// Componente principal InfoCard optimizado
const InfoCard = React.memo(({ data, isActive }) => {
  if (!isActive || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ 
        duration: 0.4,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 }
      }}
      className="info-card"
      style={CARD_STYLES.container}
    >
      <motion.h3 
        style={CARD_STYLES.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {data.title}
      </motion.h3>
      
      {data.description && (
        <motion.p 
          style={CARD_STYLES.description}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {data.description}
        </motion.p>
      )}
      
      {data.metrics && data.metrics.length > 0 && (
        <motion.div 
          className="card-metrics" 
          style={CARD_STYLES.metricsContainer}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          {data.metrics.map((metric, index) => (
            <motion.div
              key={`${metric.value}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.4 + (index * 0.1), 
                duration: 0.3,
                ease: "easeOut"
              }}
            >
              <MetricItem metric={metric} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
});

InfoCard.displayName = 'InfoCard';

export default InfoCard;