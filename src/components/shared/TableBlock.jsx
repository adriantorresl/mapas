import React from 'react';

const TableBlock = ({ title, header, body }) => {
  return (
    <div style={{ marginTop: "25px", marginBottom: "25px" }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
            padding: "8px 12px",
            backgroundColor: "rgba(255, 193, 7, 0.1)",
            borderRadius: "6px",
            border: "1px solid rgba(255, 193, 7, 0.3)"
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              backgroundColor: "#6EC1E4",
              borderRadius: "20px",
              marginRight: "10px"
            }}
          />
          <span style={{ fontSize: "0.9rem", color: "#6EC1E4" }}>
            {title}
          </span>
        </div>
      )}
      
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.1)"
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {header && (
            <thead>
              <tr>
                {header.map((headerCell, headerIndex) => (
                  <th
                    key={headerIndex}
                    style={{
                      padding: "12px 8px",
                      backgroundColor: "#f8f9fa",
                      borderBottom: "2px solid #dee2e6",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.85rem",
                      color: headerIndex === 0 ? "#000" : headerIndex === 1 ? "#dc3545" : "#007bff"
                    }}
                  >
                    {headerCell}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          {body && (
            <tbody>
              {body.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? "rgba(255, 255, 255, 0.8)" : "rgba(248, 249, 250, 0.8)"
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{
                        padding: "10px 8px",
                        borderBottom: "1px solid #dee2e6",
                        textAlign: cellIndex === 0 ? "left" : "center",
                        fontSize: "0.8rem",
                        fontWeight: cellIndex === 0 ? "600" : "normal",
                        color: cellIndex === 0 ? "#495057" : "#6c757d"
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default TableBlock;
