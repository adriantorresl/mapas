// components/FadeInBox.jsx
import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "./FadeInBox.css";

const FadeInBox = ({ children, delay = 0, position = "left", index = 0 }) => {
  const [ref, inView] = useInView({
    threshold: 0.6,
    triggerOnce: false,
  });

  const positions = {
    left: { left: "5%", top: `${20 + index * 10}%` },
    right: { right: "5%", top: `${20 + index * 10}%` },
    center: {
      left: "50%",
      top: `${20 + index * 10}%`,
      transform: "translateX(-50%)",
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay }}
      className="fade-in-box"
      style={{
        position: "absolute",
        zIndex: 1000,
        maxWidth: "40%",
        background: "#fff8e6",
        padding: "1rem",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        pointerEvents: "auto",
        ...positions[position],
      }}
    >
      {children}
    </motion.div>
  );
};

export default FadeInBox;
