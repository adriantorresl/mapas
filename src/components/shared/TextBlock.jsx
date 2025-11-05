import React from "react";

const TextBlock = ({ content }) => {
  // Check if content is an array of paragraph objects
  const isArrayContent = Array.isArray(content) && content.length > 0 && content[0]?.type === "paragraph";
  
  // Helper function to render paragraph content (string or array of text objects)
  const renderParagraphContent = (paragraphContent) => {
    // If it's an array of text objects
    if (Array.isArray(paragraphContent) && paragraphContent.length > 0 && paragraphContent[0]?.type === "text") {
      return paragraphContent.map((textObj, textIndex) => (
        <span
          key={textIndex}
          style={{
            color: textObj.color || "#fff",
          }}
        >
          {textObj.text}
        </span>
      ));
    }
    // If it's a simple string
    return paragraphContent;
  };
  
  return (
    <div style={{ marginBottom: "16px", padding: "0 10px" }}>
      {isArrayContent ? (
        // Render array of paragraphs with dynamic colors
        <p
          style={{
            fontSize: "1rem",
            textAlign: "justify",
            lineHeight: "1.6",
            margin: "0",
            whiteSpace: "pre-line"
          }}
        >
          {content.map((paragraph, index) => (
            <span
              key={index}
              style={{
                color: paragraph.color || "#fff",
                fontSize: paragraph.fontSize || "1rem",
              }}
            >
              {renderParagraphContent(paragraph.content)}
            </span>
          ))}
        </p>
      ) : (
        // Render plain string (original behavior)
        <p
          style={{
            fontSize: "0.95rem",
            color: "#fff",
            textAlign: "justify",
            lineHeight: "1.6",
            margin: "0",
            whiteSpace: "pre-line"
          }}
        >
          {content}
        </p>
      )}
    </div>
  );
};

export default TextBlock;
