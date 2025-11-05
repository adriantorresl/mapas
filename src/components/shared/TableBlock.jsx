import React from "react";

const TableBlock = ({ title, header, body }) => {
  console.log(header);
  return (
    <div style={{ marginTop: "25px", marginBottom: "25px" }}>
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
            padding: "8px 12px",
            // backgroundColor: "rgba(255, 193, 7, 0.1)",
            // border: "1px solid rgba(255, 193, 7, 0.3)"
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: "#FFF2CC",
              fontWeight: "400",
              fontFamily: "sans-serif",
              lineHeight: "23px",
              textAlign: "center",
              letterSpacing: "1px",
              margin: "0",
              padding: "0",
            }}
          >
            {title}
          </span>
        </div>
      )}

      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "0px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          marginLeft: "2px",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {/* Allow header to be a single array (1 row) or an array of arrays (multi-row) */}
          {header && (
            <thead>
              {(Array.isArray(header[0]) ? header : [header]).map((headerRow, headerRowIdx) => (
                <tr key={headerRowIdx}>
                  {headerRow.map((headerCell, headerIndex) => {
                    // Handle both object format {content: "", colSpan: 2} and simple string format
                    const cellContent = typeof headerCell === 'object' && headerCell !== null 
                      ? (headerCell.content !== undefined ? headerCell.content : headerCell)
                      : headerCell;
                    const colSpan = typeof headerCell === 'object' && headerCell !== null && headerCell.colSpan
                      ? headerCell.colSpan
                      : 1;
                    const backgroundColor = typeof headerCell === 'object' && headerCell !== null && headerCell.backgroundColor
                      ? headerCell.backgroundColor
                      : "#FFE699";
                    return (
                      <th
                        key={headerIndex}
                        style={{
                          padding: "12px 8px",
                          backgroundColor: backgroundColor,
                          textAlign: "center",
                          fontWeight: "600",
                          fontSize: "0.8rem",
                          color: "#1E3620",
                        }}
                        colSpan={colSpan}
                      >
                        {cellContent}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
          )}

          {body && (
            <tbody>
              {body.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: "#fff2cc",
                  }}
                >
                  {row.map((cell, cellIndex) => {
                    const cellContent = typeof cell === 'object' && cell !== null 
                    ? (cell.content !== undefined ? cell.content : cell)
                    : cell;
                  const colSpan = typeof cell === 'object' && cell !== null && cell.colSpan
                    ? cell.colSpan
                    : 1;
                  const backgroundColor = typeof cell === 'object' && cell !== null && cell.backgroundColor
                    ? cell.backgroundColor
                    : "#fff2cc";
                  const borderBottom = typeof cell === 'object' && cell !== null && cell.borderBottom
                    ? cell.borderBottom
                    : "";
                    return (
                    <td
                      key={cellIndex}
                      style={{
                        padding: "10px 8px",
                        borderBottom,
                        textAlign: cellIndex === 0 ? "left" : "center",
                        fontSize: "0.7rem",
                        fontWeight: "normal",
                        color: "#000000",
                        backgroundColor,
                      }}
                      colSpan={colSpan}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
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
