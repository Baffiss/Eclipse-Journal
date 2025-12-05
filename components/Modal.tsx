
import React, { ReactNode } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-bkg rounded-lg shadow-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
