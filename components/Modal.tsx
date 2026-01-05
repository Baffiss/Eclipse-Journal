
import React, { ReactNode, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
    // Estado para controlar si el componente debe estar en el DOM
    const [shouldRender, setShouldRender] = useState(isOpen);

    // Manejar la transición de montaje/desmontaje
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        } else if (shouldRender) {
            // Esperar a que la animación de cierre termine (300ms definido en index.html)
            const timeout = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timeout);
        }
    }, [isOpen, shouldRender]);
    
    // Función para manejar la tecla Escape
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            // Bloquear el scroll del cuerpo
            document.body.style.overflow = 'hidden';
            // Añadir escuchador de teclado
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        }

        // Limpieza al desmontar el componente
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!shouldRender) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 no-print"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop con desenfoque dinámico basado en el estado de apertura */}
            <div 
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
                    isOpen ? 'animate-fade-in' : 'animate-fade-out'
                }`}
                onClick={onClose}
            />
            
            {/* Contenedor del Modal con animación de entrada o salida */}
            <div
                className={`relative bg-bkg rounded-[2rem] shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden border border-border ${
                    isOpen ? 'animate-slide-in-up' : 'animate-slide-out-down'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-border bg-muted/5 flex-shrink-0">
                    <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors active:scale-90"
                        aria-label="Cerrar"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Contenido con scroll interno */}
                <div className="p-8 overflow-y-auto scrollbar-thin flex-grow">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
