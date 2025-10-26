
const TextBlock = ({ content }) => {
  return (
    <div style={{ marginBottom: "16px", padding: "0 10px" }}>
      <p
        style={{
          fontSize: "0.95rem",
          color: "#fff",
          // color: "#ffe699",
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0",
          whiteSpace: "pre-line"
        }}
      >
        {content}
      </p>
    </div>
  );
};

export default TextBlock;
