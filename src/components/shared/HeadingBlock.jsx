import React from 'react';

const HeadingBlock = ({ content }) => {
  return (
    <div style={{ marginTop: "20px", marginBottom: "16px" }}>
      <h3
        style={{
          fontSize: "36px",
          fontWeight: "700",
          color: "#FFF2CC",
          margin: "0",
          lineHeight: "42px",
          textAlign: "center",
          fontFamily: "Roboto Serif",
        }}
      >
        {content}
      </h3>
    </div>
  );
};

export default HeadingBlock;
