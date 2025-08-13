import React from 'react';

const TextBlock = ({ content }) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p
        style={{
          fontSize: "0.95rem",
          color: "#fff",
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0"
        }}
      >
        {content}
      </p>
    </div>
  );
};

export default TextBlock;
