import React from 'react';

const ImageBlock = ({ src, title, alt, caption }) => {
  return (
    <div style={{ marginTop: "25px", marginBottom: "25px" }}>
      <div
        style={{
          borderRadius: "8px",
          padding: "15px",
        }}
      >
        {title && (
          <h4
            style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#495057",
              margin: "0 0 12px 0",
              textAlign: "center"
            }}
          >
            {title}
          </h4>
        )}
        <img
          src={src}
          alt={alt || title || "Imagen"}
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "6px",
            display: "block"
          }}
        />
        {caption && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#6c757d",
              margin: "8px 0 0 0",
              textAlign: "center",
              fontStyle: "italic"
            }}
          >
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageBlock;
