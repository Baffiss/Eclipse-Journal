
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Strategy } from '../types';
import Modal from '../components/Modal';
import { 
    PlusIcon, EditIcon, TrashIcon, ChevronLeftIcon, 
    UploadCloudIcon, XIcon, AlertTriangleIcon, 
    TargetIcon, ActivityIcon, ZapIcon, InfoIcon,
    PieChartIcon, LayoutGridIcon
} from '../components/Icons';
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
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
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
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('strategyName')}</label>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Break of Structure" className="w-full p-3 bg-muted border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all" required />
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('description')}</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What is the logic behind this strategy?" className="w-full p-3 bg-muted border border-border rounded-xl h-32 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"></textarea>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('examples')}</label>
                     <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="space-y-2 text-center">
                            <UploadCloudIcon className="mx-auto h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors"/>
                            <div className="flex text-xs text-muted-foreground">
                                <label htmlFor="image-upload" className="relative cursor-pointer rounded-md font-black text-primary hover:underline transition-all">
                                    <span>{t('addExampleImages')}</span>
                                    <input id="image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" multiple />
                                </label>
                            </div>
                        </div>
                    </div>
                    {formData.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-3">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <img src={img} alt={`Example ${index + 1}`} className="w-full h-full object-cover rounded-xl border border-border" />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute -top-1 -right-1 bg-danger text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg shadow-primary/20">{strategy ? t('update') : t('create')}</button>
                </div>
            </form>
        </Modal>
    );
};

const StrategyCard: React.FC<{ strategy: Strategy; onSelect: () => void }> = ({ strategy, onSelect }) => {
    const { trades, t } = useApp();
    const strategyTrades = useMemo(() => trades.filter(t => t.strategyId === strategy.id), [trades, strategy.id]);
    const stats = useMemo(() => calculateAnalytics(strategyTrades, 0), [strategyTrades]);

    const isHighPerformer = stats.winRate > 60 && stats.totalTrades > 5;

    return (
        <div 
            onClick={onSelect} 
            className="group relative bg-muted/20 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 cursor-pointer hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 flex flex-col justify-between min-h-[320px] animate-slide-in-up"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full bg-primary`} />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-bkg rounded-2xl border border-border shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <ZapIcon className={`w-5 h-5 ${isHighPerformer ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isHighPerformer && (
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-primary/10 text-primary rounded-full animate-pulse">Alpha System</span>
                        )}
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                            {strategy.images?.length || 0} Images
                        </span>
                    </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-8 leading-relaxed">
                    {strategy.description || 'No description provided for this setup.'}
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-border/50 pt-6">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('trades')}</p>
                    <p className="text-lg font-black tracking-tight">{stats.totalTrades}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('winRate')}</p>
                    <p className={`text-lg font-black tracking-tight ${stats.winRate >= 50 ? 'text-success' : 'text-content'}`}>
                        {stats.winRate.toFixed(0)}%
                    </p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">P. Factor</p>
                    <p className="text-lg font-black tracking-tight">
                        {stats.profitFactor?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>
            
            {/* Visual Win-Rate Gauge (Bottom Bar) */}
            <div className="absolute bottom-0 left-8 right-8 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${stats.winRate >= 50 ? 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-primary'}`}
                    style={{ width: `${stats.winRate}%` }}
                />
            </div>
        </div>
    );
};

const StrategyDetailView: React.FC<{ strategy: Strategy; onBack: () => void }> = ({ strategy, onBack }) => {
    const { deleteStrategy, t } = useApp();
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const confirmDelete = () => {
        deleteStrategy(strategy.id);
        setShowDeleteConfirm(false);
        onBack();
    }

    return (
        <div className="animate-fade-in flex flex-col gap-10">
            {/* Hero Section */}
            <div className="relative bg-muted/10 border border-border/50 rounded-[3rem] p-8 lg:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 blur-[120px] opacity-10 bg-primary rounded-full -mr-20 -mt-20" />
                
                <div className="relative z-10">
                    <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-8">
                        <ChevronLeftIcon className="w-4 h-4"/> {t('backToStrategies')}
                    </button>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-5xl font-black tracking-tighter uppercase mb-4">{strategy.name}</h2>
                            <p className="text-lg text-muted-foreground font-medium leading-relaxed italic">
                                {strategy.description || 'Define your psychological and technical edge here.'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setEditingStrategy(strategy)} className="p-4 bg-bkg border border-border rounded-2xl hover:bg-muted transition-all shadow-sm">
                                <EditIcon className="w-5 h-5"/>
                            </button>
                            <button onClick={() => setShowDeleteConfirm(true)} className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-2xl hover:bg-danger hover:text-white transition-all shadow-sm">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Left: Examples & Evidence */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-muted/5 border border-border rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <PieChartIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em]">{t('examples')}</h3>
                        </div>
                        
                        {strategy.images && strategy.images.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {strategy.images.map((img, index) => (
                                    <div 
                                        key={index} 
                                        onClick={() => setLightboxImage(img)}
                                        className="cursor-zoom-in group relative aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-lg"
                                    >
                                        <img src={img} alt={`Setup ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                <InfoIcon className="w-3 h-3" /> {t('viewScreenshot')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl opacity-40">
                                <UploadCloudIcon className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">{t('noTradesYet')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Hard Data Analytics */}
                <div className="space-y-8">
                    <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8 sticky top-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                <ActivityIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-[0.3em]">{t('performanceAnalytics')}</h3>
                        </div>
                        <AnalyticsPage isComponent={true} defaultStrategyId={strategy.id} />
                    </div>
                </div>
            </div>

            {editingStrategy && <StrategyForm isOpen={!!editingStrategy} onClose={() => setEditingStrategy(null)} strategy={editingStrategy} />}

            {/* Delete Confirmation Modal */}
             <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={t('delete')}>
                <div className="space-y-6 text-center">
                    <div className="flex justify-center p-5 bg-danger/10 text-danger rounded-3xl w-fit mx-auto">
                         <AlertTriangleIcon className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase tracking-tight">{t('areYouSure')}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{t('deleteStrategyConfirmation')}</p>
                    </div>
                    <div className="flex gap-3 justify-center pt-2">
                         <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 bg-muted rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
                         <button onClick={confirmDelete} className="px-6 py-2.5 bg-danger text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-danger/90 transition-all shadow-lg shadow-danger/20">{t('delete')}</button>
                    </div>
                </div>
            </Modal>

            {/* Lightbox Modal - Large size matching Trades page */}
            <Modal isOpen={!!lightboxImage} onClose={() => setLightboxImage(null)} title={t('viewScreenshot')} maxWidth="max-w-5xl">
                <div className="flex justify-center items-center overflow-hidden bg-black/5 rounded-2xl p-2 min-h-[400px]">
                    <img 
                        src={lightboxImage || ''} 
                        alt="Strategy Example Full View" 
                        className="w-full h-auto max-h-[75vh] object-contain rounded-xl shadow-2xl animate-fade-in"
                    />
                </div>
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={() => setLightboxImage(null)} 
                        className="px-6 py-2 bg-primary text-bkg rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg shadow-primary/20"
                    >
                        {t('cancel')}
                    </button>
                </div>
            </Modal>
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
        <div className="animate-fade-in flex flex-col gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase">{t('strategies')}</h1>
                </div>
                <button onClick={() => setFormOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-primary text-bkg rounded-2xl hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0 group">
                    <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">{t('newStrategy')}</span>
                </button>
            </div>

            {strategies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                   {strategies.map(s => <StrategyCard key={s.id} strategy={s} onSelect={() => setSelectedStrategy(s)} />)}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 bg-muted/10 border-2 border-dashed border-border rounded-[3rem] group hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setFormOpen(true)}>
                    <div className="p-6 bg-bkg rounded-full border border-border shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
                        <TargetIcon className="w-12 h-12 text-muted-foreground opacity-20" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">{t('noStrategiesDefined')}</h3>
                    <p className="text-muted-foreground font-bold mt-2 max-w-xs text-center">{t('createYourFirstStrategy')}</p>
                    <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                        Click to begin <PlusIcon className="w-4 h-4" />
                    </div>
                </div>
            )}
            
            <StrategyForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} />
        </div>
    );
};

export default StrategiesPage;
