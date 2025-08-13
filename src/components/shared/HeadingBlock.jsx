import React from 'react';

const HeadingBlock = ({ content }) => {
  return (
    <div style={{ marginTop: "20px", marginBottom: "16px" }}>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#FFC107",
          margin: "0",
          lineHeight: "1.3",
          borderBottom: "2px solid #3498db",
          paddingBottom: "8px"
        }}
      >
        {content}
      </h3>
    </div>
  );
};

export default HeadingBlock;
