import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types'; // 👈 ¡IMPORTANTE: Importar PropTypes!

const PhotoCard = ({ photo, index, openLightbox }) => {
    // ⏳ Estado para manejar si la imagen ha cargado
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageLoad = () => {
        setIsLoaded(true);
        // Pequeño retardo para que la animación de "esqueleto" se vea
        setTimeout(() => setIsLoading(false), 300); 
    };

    return (
        <motion.div
            key={photo.id}
            className="photo-card-wrapper"
            onClick={() => openLightbox(index)} 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            viewport={{ once: true }}
            tabIndex={0}
            role="button"
            aria-label={photo.alt}
        >
            {/* Placeholder/Esqueleto de Carga */}
            {isLoading && (
                <div className="photo-placeholder">
                    {/* Clase para el efecto de carga 'shimmer' en CSS */}
                </div>
            )}
            
            {/* Usamos la etiqueta <img> para capturar el evento de carga */}
            <img 
                src={photo.imgUrl} 
                alt={photo.alt} 
                onLoad={handleImageLoad}
                onError={() => { setIsLoaded(false); setIsLoading(false); }}
                className="photo-card-img"
                style={{ opacity: isLoaded ? 1 : 0 }}
                loading="lazy"
            />
        </motion.div>
    );
};

// ===============================================
// ✅ SOLUCIÓN: Definición de PropTypes
// ===============================================
PhotoCard.propTypes = {
    // 'photo' debe ser un objeto y es requerido. Definimos su forma.
    photo: PropTypes.shape({
        id: PropTypes.number.isRequired,
        category: PropTypes.string.isRequired,
        imgUrl: PropTypes.string.isRequired,
        alt: PropTypes.string.isRequired,
    }).isRequired,
    
    // 'index' debe ser un número y es requerido.
    index: PropTypes.number.isRequired,
    
    // 'openLightbox' debe ser una función y es requerida.
    openLightbox: PropTypes.func.isRequired,
};

export default PhotoCard;