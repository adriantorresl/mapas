
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
            // backgroundColor: "rgba(255, 193, 7, 0.1)",
            borderRadius: "6px",
            // border: "1px solid rgba(255, 193, 7, 0.3)"
          }}
        >
          <span style={{ 
            fontSize: "20px", 
            color: "#FFF2CC", 
            fontWeight: "400", 
            fontFamily: "Roboto Serif", 
            lineHeight: "23px", 
            textAlign: "center", 
            letterSpacing: "1px",
            margin: "0",
            padding: "0"
          }}>
            {title}
          </span>
        </div>
      )}
      
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid rgba(0, 0, 0, 0.1)",
          marginLeft: "2px"
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
                      backgroundColor: "#196b24",
                      borderBottom: "2px solid #dee2e6",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                      color: "#FFFF"
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
                    backgroundColor: rowIndex % 2 === 0 ? "#c1f0c8" : "#ffffff"
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      style={{
                        padding: "10px 8px",
                        borderBottom: "1px solid #dee2e6",
                        textAlign: cellIndex === 0 ? "left" : "center",
                        fontSize: "0.7rem",
                        fontWeight: "normal",
                        color: "#000000"
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
