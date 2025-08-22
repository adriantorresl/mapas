import TextOverlay from "../TextOverlay";
import Header from "../shared/Header";
import logo from "../../assets/logo.png";
import { useNavigation } from "../../contexts/NavigationContext";
// import Footer from "../shared/Footer";
import "./../core.css";

export default function CoreTemplate({ onNavigate, children }) {
  // Usar el contexto de navegación
  const { data, blocks: currentBlocks, loading, error, currentPageId } = useNavigation();

  // Función para manejar navegación desde el header
  const handleHeaderNavigation = (pageId) => {
    onNavigate && onNavigate(pageId);
  };

  // Determinar qué datos mostrar
  const displayTitle = data?.id === "0" ? "Localización" : (data?.data?.[0]?.content || "Tierra de Agaves");
  const displayBlocks = currentBlocks && currentBlocks.length > 0 ? currentBlocks : [];
  const displayContent = data?.data ? undefined : data?.data?.[0]?.content; // Si tenemos bloques dinámicos, no usar content
  const displayTables = data?.data ? undefined : data?.data?.[0]?.tables; // Si tenemos bloques dinámicos, no usar tables
  const displayImages = data?.data ? undefined : data?.data?.[0]?.images; // Si tenemos bloques dinámicos, no usar images

  // Debug: mostrar qué datos se están pasando
  console.log('CoreTemplate Debug:', {
    data,
    currentBlocks,
    displayTitle,
    displayBlocks,
    displayContent,
    displayTables,
    displayImages
  });

  return (
    <div className="core-template">
        <div className="core-template-header">
            <div className="content-left-sidebar">
                <div className="content-header-sticky">
                    <Header onNavigate={handleHeaderNavigation} logo={logo}/>
                </div>
                <div className="core-template-content">
                    {loading ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <p>Cargando...</p>
                      </div>
                    ) : error ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
                        <p>Error: {error}</p>
                      </div>
                    ) : (
                      <TextOverlay
                        content={displayContent}
                        tables={displayTables}
                        images={displayImages}
                        blocks={displayBlocks}
                      />
                    )}
                </div>
            </div>
            <div className="core-template-map">
                {children}
            </div>
        </div>
        {/* <div className="core-template-footer">
            <Footer />
        </div> */}
    </div>
  );
}