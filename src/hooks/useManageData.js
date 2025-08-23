import { useState, useEffect, useCallback, useMemo } from "react";
import { dataPages } from "../constants/dataPages";

export const useManageData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [currentPageId, setCurrentPageId] = useState("0");

    // Función memoizada para cargar datos por ID de página
    const loadPageData = useCallback((pageId) => {
        setLoading(true);
        setError(null);
        console.log('Loading page:', pageId);
        
        // Usar setTimeout para hacer la carga asíncrona y mejorar la responsividad
        setTimeout(() => {
            try {
                const pageData = dataPages.pages.find(page => page.id === pageId);
                
                if (pageData) {
                    setData(pageData);
                    setBlocks(pageData.data || []);
                    setCurrentPageId(pageId);
                    console.log('Page loaded successfully:', pageData);
                } else {
                    console.warn(`Page not found: ${pageId}`);
                    setError(`No se encontró la página con ID: ${pageId}`);
                    setData(null);
                    setBlocks([]);
                }
            } catch (err) {
                console.error('Error loading page:', err);
                setError(`Error al cargar la página: ${err.message}`);
                setData(null);
                setBlocks([]);
            } finally {
                setLoading(false);
            }
        }, 0);
    }, []);

    // Función memoizada para obtener la página actual
    const getCurrentPage = useCallback(() => {
        return dataPages.pages.find(page => page.id === currentPageId);
    }, [currentPageId]);

    // Función memoizada para navegar a una página específica
    const navigateToPage = useCallback((pageId) => {
        loadPageData(pageId);
    }, [loadPageData]);

    // Cargar página inicial por defecto
    useEffect(() => {
        loadPageData("0");
    }, [loadPageData]);

    // Memoizar el objeto de retorno para evitar re-renders innecesarios
    return useMemo(() => ({ 
        // getters
        blocks, 
        data, 
        error, 
        loading,
        currentPageId,
        // setters
        setBlocks,
        setData,
        setError,
        setLoading,
        // functions
        loadPageData,
        navigateToPage,
        getCurrentPage
    }), [
        blocks, 
        data, 
        error, 
        loading,
        currentPageId,
        loadPageData,
        navigateToPage,
        getCurrentPage
    ]);
};