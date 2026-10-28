import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './Albun.css';
import Lightbox from "./Lightbox"; 
import PhotoCard from "./PhotoCard"; // 👈 Importamos el nuevo componente de tarjeta

// ======================================================================
// 🚨 DEFINICIÓN DE CATEGORÍAS Y CUENTA DE FOTOS
// (Se mantiene igual)
// ======================================================================
const BASE_ROUTE = "/Adriana/imagenes/"; 

const PHOTOS_DATA_MAP = {
    "Adri": { carpeta: 'Adri', count: 63 },
    "Familia": { carpeta: 'Familia', count: 81 }, 
    "Primos": { carpeta: 'Primos', count: 31 },
    "Amigos": { carpeta: 'Amigos', count: 35 },
};

const CATEGORIES = ["Todos", ...Object.keys(PHOTOS_DATA_MAP)];

// ======================================================================
// 🚀 FUNCIÓN: Generación del Array FOTOS_DE_ADRIANA
// (Se mantiene igual)
// ======================================================================
function generatePhotoArray() {
    const allPhotos = [];
    let idCounter = 1;

    for (const categoryName in PHOTOS_DATA_MAP) {
        const { carpeta, count } = PHOTOS_DATA_MAP[categoryName];
        const filePrefix = carpeta.split(' ')[0].toLowerCase(); 

        if (count > 0) {
            for (let i = 1; i <= count; i++) {
                const imgUrl = `${BASE_ROUTE}${carpeta}/${filePrefix}${i}.webp`;
                
                allPhotos.push({
                    id: idCounter++,
                    category: categoryName,
                    imgUrl: imgUrl,
                    alt: `Foto de Adriana en la categoría ${categoryName} #${i}`,
                });
            }
        }
    }
    return allPhotos;
}

const FOTOS_DE_ADRIANA = generatePhotoArray();

// ======================================================================
// 🖼️ COMPONENTE ALBUML
// ======================================================================
function Albun() {
    const [activeCategory, setActiveCategory] = useState("Todos");
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

    // Lógica de filtrado
    const filteredPhotos = useMemo(() => {
        if (activeCategory === "Todos") {
            return FOTOS_DE_ADRIANA;
        }
        return FOTOS_DE_ADRIANA.filter(foto => foto.category === activeCategory);
    }, [activeCategory]);

    // Funciones para el Lightbox
    const openLightbox = (index) => {
        setSelectedPhotoIndex(index);
    };

    const closeLightbox = () => {
        setSelectedPhotoIndex(null);
    };

    return (
        <div className="album-page">
            <motion.header 
                className="album-hero" 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* 🎨 MEJORA: Emojis más llamativos y titular profesional */}
                <h1 className="hero-title">💕 Mi Álbum de Recuerdos</h1>
                <p className="hero-sub">Un momento único rodeada de familia, amigos y recuerdos inolvidables.</p>
            </motion.header>

            {/* FILTROS (Mejora: Scroll táctil y visual) */}
            <motion.div 
                className="controls-row" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="filters-wrap">
                    {/* 📱 MEJORA TÁCTIL: Añadir 'tabindex="0"' al scroll wrapper para mejor accesibilidad y manejo táctil */}
                    <div className="categories-scroll" role="tablist" aria-label="Categorías de fotos" tabIndex="0"> 
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                role="tab"
                                aria-selected={activeCategory === cat}
                                onClick={() => setActiveCategory(cat)}
                                // 💅 MEJORA VISUAL: Añadiremos un estilo de botón más "chip" y con animación
                                className={`category-chip ${activeCategory === cat ? "active" : ""}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* GALERÍA DE FOTOS */}
            <motion.main 
                className="photos-grid-wrap" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.4 }}
            >
                {filteredPhotos.length === 0 ? (
                    <div className="empty-state">
                        <p>No hay fotos en la categoría **{activeCategory}**.</p>
                    </div>
                ) : (
                    <div className="cards-grid"> 
                        {filteredPhotos.map((photo, i) => (
                            // 🖼️ MEJORA: Usamos el nuevo componente PhotoCard con lógica de carga
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                index={i}
                                openLightbox={openLightbox}
                            />
                        ))}
                    </div>
                )}
            </motion.main>
            
            {/* VISOR DE PANTALLA COMPLETA (LIGHTBOX) */}
            <AnimatePresence>
                {selectedPhotoIndex !== null && (
                    <Lightbox 
                        photos={filteredPhotos}
                        initialIndex={selectedPhotoIndex}
                        onClose={closeLightbox}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default Albun;