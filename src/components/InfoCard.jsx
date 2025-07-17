import { motion } from 'framer-motion'

const InfoCard = ({ data, isActive }) => {
    if (!isActive) return null;
  
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4 }}
        className="info-card"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "8px",
          padding: "20px",
          color: "#333",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          maxWidth: "350px",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          position: "relative"
        }}
      >
        <h3 style={{ 
          marginBottom: "12px", 
          fontSize: "1.2rem", 
          fontWeight: "600",
          color: "#2c3e50"
        }}>
          {data.title}
        </h3>
        <p style={{ 
          lineHeight: "1.5", 
          fontSize: "0.95rem", 
          margin: "0",
          color: "#34495e"
        }}>
          {data.description}
        </p>
        {data.metrics && (
          <div className="card-metrics" style={{ marginTop: "12px" }}>
            {data.metrics.map((metric, index) => (
              <div key={index} className="metric-item" style={{ margin: "0 8px 0 0" }}>
                <div style={{ 
                  fontSize: "1.4rem", 
                  fontWeight: "bold", 
                  color: "#27ae60"
                }}>
                  {metric.value}
                </div>
                <div style={{ 
                  fontSize: "0.8rem", 
                  color: "#7f8c8d"
                }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

export default InfoCard