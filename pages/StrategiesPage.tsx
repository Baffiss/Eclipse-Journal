import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Strategy } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, UploadCloudIcon, XIcon } from '../components/Icons';
import { calculateAnalytics } from '../services/analytics';
import AnalyticsPage from './AnalyticsPage';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const StrategyForm: React.FC<{ isOpen: boolean; onClose: () => void; strategy?: Strategy | null }> = ({ isOpen, onClose, strategy }) => {
    const { addStrategy, updateStrategy, t } = useApp();
    
    const getInitialState = () => ({
        name: strategy?.name || '',
        description: strategy?.description || '',
        images: strategy?.images || [],
    });

    const [formData, setFormData] = useState(getInitialState());

    React.useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
        }
    }, [isOpen, strategy]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Fix: The `file` argument in `map` was being inferred as `unknown`.
            // Using the spread operator to convert the FileList to an array of Files
            // ensures correct type inference.
            const files = [...e.target.files];
            const base64Promises = files.map(file => fileToBase64(file));
            try {
                const base64Images = await Promise.all(base64Promises);
                setFormData(prev => ({ ...prev, images: [...prev.images, ...base64Images] }));
            } catch (error) {
                console.error("Error converting files to base64", error);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (strategy) {
            updateStrategy({ ...strategy, ...formData });
        } else {
            addStrategy({ id: crypto.randomUUID(), ...formData });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={strategy ? t('editStrategy') : t('createStrategy')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder={t('strategyName')} className="w-full p-2 bg-muted border border-border rounded-md" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder={t('description')} className="w-full p-2 bg-muted border border-border rounded-md h-24"></textarea>
                
                <div>
                    <label className="text-sm font-medium">{t('examples')}</label>
                     <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground"/>
                            <div className="flex text-sm text-muted-foreground">
                                <label htmlFor="image-upload" className="relative cursor-pointer bg-bkg rounded-md font-medium text-primary hover:text-primary-focus focus-within:outline-none">
                                    <span>{t('addExampleImages')}</span>
                                    <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" multiple />
                                </label>
                            </div>
                        </div>
                    </div>
                    {formData.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img src={img} alt={`Example ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-muted rounded-md hover:bg-border">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">{strategy ? t('update') : t('create')}</button>
                </div>
            </form>
        </Modal>
    );
};

const StrategyListItem: React.FC<{ strategy: Strategy; onSelect: () => void }> = ({ strategy, onSelect }) => {
    const { trades, t } = useApp();
    const strategyTrades = useMemo(() => trades.filter(t => t.strategyId === strategy.id), [trades, strategy.id]);
    const stats = useMemo(() => calculateAnalytics(strategyTrades, 0), [strategyTrades]);

    return (
        <div onClick={onSelect} className="flex justify-between items-center p-4 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors duration-200">
            <div>
                <h3 className="font-semibold text-lg">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-md">{strategy.description || 'No description provided.'}</p>
            </div>
            <div className="hidden md:flex gap-6 text-center">
                <div><p className="text-sm text-muted-foreground">{t('trades')}</p><p className="font-semibold text-lg">{stats.totalTrades}</p></div>
                <div><p className="text-sm text-muted-foreground">{t('winRate')}</p><p className="font-semibold text-lg">{stats.winRate.toFixed(1)}%</p></div>
                <div><p className="text-sm text-muted-foreground">{t('profitFactor').substring(0,8)}.</p><p className="font-semibold text-lg">{stats.profitFactor?.toFixed(2) || 'N/A'}</p></div>
            </div>
        </div>
    );
};

const StrategyDetailView: React.FC<{ strategy: Strategy; onBack: () => void }> = ({ strategy, onBack }) => {
    const { deleteStrategy, t } = useApp();
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

    const handleDelete = () => {
        if(confirm(t('deleteStrategyConfirmation'))) {
            deleteStrategy(strategy.id); 
            onBack(); 
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <button onClick={onBack} className="flex items-center text-sm hover:underline mb-2"><ChevronLeftIcon className="w-4 h-4"/> {t('backToStrategies')}</button>
                    <h2 className="text-3xl font-bold">{strategy.name}</h2>
                </div>
                 <div className="flex gap-2">
                    <button onClick={() => setEditingStrategy(strategy)} className="p-2 bg-muted rounded-md hover:bg-border"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={handleDelete} className="p-2 bg-muted rounded-md hover:bg-border text-danger"><TrashIcon className="w-5 h-5"/></button>
                </div>
            </div>
            
            {strategy.description && <div className="bg-muted p-4 rounded-lg mb-8"><p className="text-content/80 whitespace-pre-wrap">{strategy.description}</p></div>}
            
            {strategy.images && strategy.images.length > 0 && (
                <div className="mb-8">
                    <h3 className="font-semibold text-lg mb-4">{t('examples')}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {strategy.images.map((img, index) => (
                            <a href={img} key={index} target="_blank" rel="noopener noreferrer" className="block group rounded-lg overflow-hidden shadow-md">
                                <img src={img} alt={`Example ${index + 1}`} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h3 className="font-semibold text-xl mb-4">{t('performanceAnalytics')}</h3>
                <AnalyticsPage isComponent={true} defaultStrategyId={strategy.id} />
            </div>

            {editingStrategy && <StrategyForm isOpen={!!editingStrategy} onClose={() => setEditingStrategy(null)} strategy={editingStrategy} />}
        </div>
    );
};

const StrategiesPage: React.FC = () => {
    const { strategies, t } = useApp();
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

    if (selectedStrategy) {
        return <StrategyDetailView strategy={selectedStrategy} onBack={() => setSelectedStrategy(null)} />;
    }

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{t('strategies')}</h1>
                <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus shadow-sm transition-shadow hover:shadow-md">
                    <PlusIcon className="w-5 h-5"/>
                    <span>{t('newStrategy')}</span>
                </button>
            </div>
             <div className="bg-muted rounded-lg border border-border">
                {strategies.length > 0 ? (
                   strategies.map(s => <StrategyListItem key={s.id} strategy={s} onSelect={() => setSelectedStrategy(s)} />)
                ) : (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold">{t('noStrategiesDefined')}</h3>
                        <p className="text-muted-foreground mt-2">{t('createYourFirstStrategy')}</p>
                        <button onClick={() => setFormOpen(true)} className="mt-4 flex mx-auto items-center gap-2 px-4 py-2 bg-primary text-bkg rounded-md hover:bg-primary-focus">
                            <PlusIcon className="w-5 h-5"/>
                            <span>{t('createStrategy')}</span>
                        </button>
                    </div>
                )}
            </div>
            <StrategyForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
        </div>
    );
};

export default StrategiesPage;