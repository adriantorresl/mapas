import { motion } from "framer-motion";
import {
  TextBlock,
  TableBlock,
  ImageBlock,
  HeadingBlock,
  DividerBlock
} from "./shared";

const TextOverlay = ({ title, content, tables, images, blocks }) => {
  // Función para renderizar bloques dinámicos
  const renderBlock = (block, index) => {
    switch (block.type) {
      case 'text':
        return <TextBlock key={index} content={block.content} />;
      
      case 'table':
        return (
          <TableBlock
            key={index}
            title={block.title}
            header={block.header}
            body={block.body}
          />
        );
      
      case 'image':
        return (
          <ImageBlock
            key={index}
            src={block.src}
            title={block.title}
            alt={block.alt}
            caption={block.caption}
          />
        );
      
      case 'heading':
        return <HeadingBlock key={index} content={block.content} />;
      
      case 'divider':
        return <DividerBlock key={index} />;
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="text-overlay"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.8 }}
      style={{
        borderRadius: "12px",
        padding: "0",
        color: "#000",
        maxWidth: "100%",
        backdropFilter: "blur(10px)",
        margin: "10px 5px 2px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Título fijo en la parte superior */}
      {/* <div
        style={{
          padding: "5px 30px 20px 30px",
          flexShrink: 0
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: "700",
            color: "#FFC107",
            margin: "0",
            lineHeight: "1.3",
            borderBottom: "3px solid #3498db",
            paddingBottom: "10px"
          }}
        >
          {title}
        </h2>
      </div> */}

      {/* Contenido dinámico con scroll */}
      <div 
        style={{
          flex: 1,
        }}
      >
        {/* Si se usan bloques dinámicos, renderizar esos */}
        {blocks && blocks?.length > 0 ? (
          blocks?.map((block, index) => renderBlock(block, index))
        ) : (
          /* Mantener compatibilidad con el sistema anterior */
          <>
            <div style={{ lineHeight: "1.6" }}>
              {content && Array.isArray(content) && content.map((paragraph, index) => (
                <TextBlock key={index} content={paragraph} />
              ))}
              {content && !Array.isArray(content) && (
                <TextBlock content={content} />
              )}
            </div>

            {/* Tablas dinámicas (sistema anterior) */}
            {tables && Array.isArray(tables) && tables.map((table, tableIndex) => (
              <TableBlock
                key={tableIndex}
                title={table.title}
                header={table.header}
                body={table.body}
              />
            ))}

            {/* Imágenes dinámicas (sistema anterior) */}
            {images && Array.isArray(images) && images.map((image, imageIndex) => (
              <ImageBlock
                key={imageIndex}
                src={image.src}
                title={image.title}
                alt={image.alt}
                caption={image.caption}
              />
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TextOverlay;
