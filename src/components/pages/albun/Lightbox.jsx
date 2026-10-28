import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types'; 

const Lightbox = ({ photos, initialIndex, onClose }) => {
    if (!photos || photos.length === 0) return null;

    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const totalPhotos = photos.length;
    const currentPhoto = photos[currentIndex < totalPhotos ? currentIndex : 0]; 

    // 📱 MEJORA TÁCTIL: Estado para manejar el inicio del deslizamiento (swipe)
    const [touchStart, setTouchStart] = useState(null);

    // Lógica de navegación (mantenida y mejorada para evitar re-creaciones en useEffect)
    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPhotos);
    };

    const goToPrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPhotos) % totalPhotos);
    };

    // 📱 MANEJO DE SWIPE: Función al tocar/hacer clic
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches ? e.targetTouches[0].clientX : e.clientX);
    };

    // 📱 MANEJO DE SWIPE: Función al soltar
    const handleTouchEnd = (e) => {
        if (touchStart === null) return;
        
        // Obtiene la posición final del toque
        const touchEnd = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const diff = touchStart - touchEnd; // Si es positivo, es SWIPE hacia la izquierda (Next)
        const SWIPE_THRESHOLD = 50; // Mínimo de píxeles para considerarse swipe

        if (diff > SWIPE_THRESHOLD) {
            goToNext();
        } else if (diff < -SWIPE_THRESHOLD) {
            goToPrev();
        }
        
        setTouchStart(null); // Resetea el estado
    };

    // ⌨️ Cerrar con tecla ESC y navegar con flechas (mantenido)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            // 🚀 MEJORA: Usar las funciones goToNext/Prev en las dependencias evita el warning de linting.
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, totalPhotos]); 
    // NOTA: goToNext y goToPrev no necesitan estar en las dependencias si usan la forma funcional de `setCurrentIndex`

    return (
        <motion.div
            className="lightbox-overlay"
            onClick={onClose} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            {/* Botón de cerrar (X) */}
            <button className="lightbox-close" onClick={onClose} aria-label="Cerrar visor">
                <FaTimes />
            </button>

            {/* Contenedor de la imagen */}
            <motion.div
                className="lightbox-content"
                onClick={(e) => e.stopPropagation()} 
                // 📱 MEJORA TÁCTIL: Añadimos los eventos de toque
                onTouchStart={handleTouchStart} 
                onTouchEnd={handleTouchEnd}
                
                key={currentPhoto.id || currentIndex} 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
            >
                <img 
                    src={currentPhoto.imgUrl} 
                    alt={currentPhoto.alt} 
                    className="lightbox-image" 
                />
            </motion.div>

            {/* Botón Anterior y Siguiente (Mantenidos) */}
            {/* 🚀 MEJORA: Las animaciones de flechas hacen que el diseño sea más profesional */}
            <motion.button 
                className="lightbox-nav prev" 
                onClick={(e) => { e.stopPropagation(); goToPrev(); }} 
                aria-label="Foto anterior"
               
               
                
            >
                <FaChevronLeft />
            </motion.button>

            <motion.button 
                className="lightbox-nav next" 
                onClick={(e) => { e.stopPropagation(); goToNext(); }} 
                aria-label="Foto siguiente"
                
               
            >
                <FaChevronRight />
            </motion.button>
            
            {/* 💅 MEJORA VISUAL: Contador más estilizado */}
            <div className="lightbox-counter">
                {currentIndex + 1} / {totalPhotos}
            </div>
        </motion.div>
    );
};

Lightbox.propTypes = {
    photos: PropTypes.array.isRequired,
    initialIndex: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default Lightbox;