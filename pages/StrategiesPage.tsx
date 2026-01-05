
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Strategy, StrategyImage } from '../types';
import Modal from '../components/Modal';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  UploadCloudIcon,
  XIcon,
  AlertTriangleIcon,
  ActivityIcon,
  ZapIcon,
  LayoutGridIcon,
  TargetIcon,
  CameraIcon,
  TrendingUpIcon,
  EyeIcon,
  NewspaperIcon,
  SaveIcon,
  StrategyIcons
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

const ExampleCard: React.FC<{ 
  img: StrategyImage; 
  strategy: Strategy; 
  onView: (img: StrategyImage) => void;
  index: number;
}> = ({ img, strategy, onView, index }) => {
  const { updateStrategy, t } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [noteValue, setNoteValue] = useState(img.notes || '');

  useEffect(() => {
    setNoteValue(img.notes || '');
  }, [img.notes]);

  const handleSave = () => {
    const updatedImages = strategy.images?.map(i => 
      i.id === img.id ? { ...i, notes: noteValue } : i
    ) || [];
    updateStrategy({ ...strategy, images: updatedImages });
    setIsEditing(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedImages = strategy.images?.filter(i => i.id !== img.id) || [];
    updateStrategy({ ...strategy, images: updatedImages });
  };

  return (
    <div className="group bg-bkg border border-border rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-sm hover:border-primary/30 transition-all duration-300">
      <div className="relative w-full md:w-72 lg:w-96 aspect-video md:aspect-auto overflow-hidden bg-muted/20 cursor-zoom-in flex-shrink-0" onClick={() => onView(img)}>
        <img src={img.url} alt={`Setup ${index + 1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            <EyeIcon className="w-4 h-4" /> {t('viewScreenshot')}
          </span>
        </div>
        <button 
          onClick={handleRemove}
          className="absolute top-4 right-4 p-2 bg-danger/90 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
          title={t('delete')}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-8 flex flex-col flex-grow bg-muted/5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <NewspaperIcon className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('notes')}</span>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button 
                onClick={handleSave} 
                className="p-2 bg-primary text-bkg rounded-lg shadow-sm hover:bg-primary-focus transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { setIsEditing(false); setNoteValue(img.notes || ''); }} 
                className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-border transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder={t('imageNotesPlaceholder')}
            className="w-full h-32 bg-bkg border border-border p-4 text-sm font-medium rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 resize-none animate-fade-in"
            autoFocus
          />
        ) : (
          <p className="text-sm font-medium text-content/80 leading-relaxed italic whitespace-pre-wrap">
            {img.notes || 'No observations recorded yet for this setup chart.'}
          </p>
        )}
      </div>
    </div>
  );
};

const StrategyForm: React.FC<{ isOpen: boolean; onClose: () => void; strategy?: Strategy | null; }> = ({ isOpen, onClose, strategy }) => {
  const { addStrategy, updateStrategy, t } = useApp();
  const getInitialState = () => ({ 
    name: strategy?.name || '', 
    description: strategy?.description || '', 
    images: strategy?.images || [], 
    iconId: strategy?.iconId || 'zap'
  });
  const [formData, setFormData] = useState(getInitialState());
  
  React.useEffect(() => { if (isOpen) { setFormData(getInitialState()); } }, [isOpen, strategy]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); 
  };

  const handleImageNoteChange = (id: string, notes: string) => {
    setFormData(prev => ({
        ...prev,
        images: prev.images.map(img => img.id === id ? { ...img, notes } : img)
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files && e.target.files.length > 0) { 
      const files = Array.from(e.target.files) as File[]; 
      const base64Promises = files.map(file => fileToBase64(file)); 
      try { 
        const base64Images = await Promise.all(base64Promises); 
        const newImages: StrategyImage[] = base64Images.map(url => ({
            id: crypto.randomUUID(),
            url,
            notes: ''
        }));
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] })); 
      } catch (error) { 
        console.error('Error converting files to base64', error); 
      } finally {
        e.target.value = '';
      }
    } 
  };
  
  const handleRemoveImage = (id: string) => { 
    setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) })); 
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
    <Modal isOpen={isOpen} onClose={onClose} title={strategy ? t('editStrategy') : t('createStrategy')} maxWidth="max-w-7xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('strategyName')}</label>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Break of Structure" className="w-full p-4 bg-muted border border-border rounded-2xl font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase" required />
                </div>
                
                {/* Icon Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Strategy Identity (Icon)</label>
                  <div className="grid grid-cols-4 gap-2 bg-muted/40 p-3 rounded-2xl border border-border">
                    {Object.entries(StrategyIcons).map(([id, Icon]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, iconId: id }))}
                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                          formData.iconId === id 
                            ? 'bg-primary text-bkg shadow-lg scale-105' 
                            : 'bg-bkg border border-border text-muted-foreground hover:border-primary/40'
                        }`}
                        title={id}
                      >
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{t('description')}</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="What is the logic behind this strategy?" className="w-full p-4 bg-muted border border-border rounded-2xl h-[280px] text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"></textarea>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="flex justify-between items-center mb-4 px-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block">{t('examples')}</label>
                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{formData.images.length} {t('examples')}</span>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                    <label htmlFor="form-image-upload" className="w-full h-24 flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-border rounded-[2rem] cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group order-first">
                      <div className="flex items-center gap-3">
                        <PlusIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">{t('addExampleImages')}</span>
                      </div>
                      <input id="form-image-upload" name="image-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" multiple />
                    </label>

                    {formData.images.map((img) => (
                      <div key={img.id} className="bg-muted/30 border border-border rounded-[2rem] overflow-hidden flex flex-col md:flex-row group animate-fade-in shadow-sm">
                        <div className="relative w-full md:w-60 lg:w-72 aspect-video md:aspect-auto border-b md:border-b-0 md:border-r border-border bg-black/5 flex-shrink-0">
                            <img src={img.url} alt="Example" className="w-full h-full object-cover" />
                            <button 
                                type="button" 
                                onClick={() => handleRemoveImage(img.id)} 
                                className="absolute top-3 right-3 bg-danger text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 z-10"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 bg-bkg/50 flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                                <NewspaperIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('notes')}</span>
                            </div>
                            <textarea 
                                value={img.notes} 
                                onChange={(e) => handleImageNoteChange(img.id, e.target.value)}
                                placeholder={t('imageNotesPlaceholder')}
                                className="w-full h-24 bg-muted/40 p-4 text-xs font-medium rounded-xl outline-none focus:ring-1 focus:ring-primary/20 resize-none placeholder:opacity-30 border border-transparent focus:border-border"
                            />
                        </div>
                      </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
          <button type="button" onClick={onClose} className="px-6 py-3 bg-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
          <button type="submit" className="px-8 py-3 bg-primary text-bkg rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-focus transition-all shadow-lg shadow-primary/20">{strategy ? t('update') : t('create')}</button>
        </div>
      </form>
    </Modal>
  );
};

const StrategyCard: React.FC<{ strategy: Strategy; onSelect: () => void }> = ({ strategy, onSelect }) => {
  const { trades, t } = useApp();
  const strategyTrades = useMemo(() => trades.filter(t => t.strategyId === strategy.id), [trades, strategy.id]);
  const stats = useMemo(() => calculateAnalytics(strategyTrades, 0), [strategyTrades]);
  
  const isHighPerformer = stats.winRate >= 60 && stats.totalTrades >= 5;
  const hasImages = strategy.images && strategy.images.length > 0;
  
  // Custom Icon Logic
  const StrategyIconComponent = strategy.iconId && StrategyIcons[strategy.iconId] ? StrategyIcons[strategy.iconId] : ZapIcon;
  
  return (
    <div 
      onClick={onSelect} 
      className={`
        group relative bg-muted/20 backdrop-blur-xl border border-border/50 rounded-[2.5rem] 
        overflow-hidden cursor-pointer hover:border-primary/40 transition-all duration-500 
        hover:shadow-2xl hover:shadow-primary/10 flex flex-col min-h-[400px] animate-slide-in-up
        ${isHighPerformer ? 'ring-2 ring-primary/20 ring-offset-4 ring-offset-bkg' : ''}
      `}
    >
      <div className="h-32 w-full relative overflow-hidden bg-muted/30">
        {hasImages ? (
          <>
            <img src={strategy.images![0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-muted/80 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TargetIcon className="w-12 h-12 text-muted-foreground/10" />
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex gap-2">
          {isHighPerformer && (
             <span className="px-3 py-1 bg-primary text-bkg text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/30 animate-pulse">
               Alpha Setup
             </span>
          )}
          <span className="px-3 py-1 bg-bkg/80 backdrop-blur-md text-muted-foreground text-[8px] font-black uppercase tracking-[0.2em] rounded-full">
            {strategy.images?.length || 0} Assets
          </span>
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl border border-border bg-bkg shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
            <StrategyIconComponent className={`w-6 h-6 ${isHighPerformer ? 'text-primary' : 'text-muted-foreground/40'}`} />
          </div>
        </div>

        <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors uppercase">{strategy.name}</h3>
        <p className="text-sm text-muted-foreground font-medium line-clamp-3 mb-8 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
          {strategy.description || 'Define your psychological and technical edge here.'}
        </p>

        <div className="mt-auto grid grid-cols-3 gap-3 border-t border-border/50 pt-6">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('trades')}</p>
            <p className="text-xl font-black tracking-tighter">{stats.totalTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('winRate')}</p>
            <p className={`text-xl font-black tracking-tighter ${stats.winRate >= 50 ? 'text-success' : 'text-content'}`}>{stats.winRate.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">P. Factor</p>
            <p className="text-xl font-black tracking-tighter">{stats.profitFactor?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-muted/20">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${stats.winRate >= 60 ? 'bg-gradient-to-r from-primary to-success shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-primary'}`} 
          style={{ width: `${stats.winRate}%` }} 
        />
      </div>
    </div>
  );
};

const StrategyDetailView: React.FC<{ strategy: Strategy; onBack: () => void }> = ({ strategy, onBack }) => {
  const { deleteStrategy, updateStrategy, t } = useApp();
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<StrategyImage | null>(null);
  
  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const base64Promises = files.map(file => fileToBase64(file));
      try {
        const base64Images = await Promise.all(base64Promises);
        const newImages: StrategyImage[] = base64Images.map(url => ({
            id: crypto.randomUUID(),
            url,
            notes: ''
        }));
        const updatedImages = [...(strategy.images || []), ...newImages];
        updateStrategy({ ...strategy, images: updatedImages });
      } catch (error) {
        console.error('Error uploading images', error);
      } finally {
        e.target.value = '';
      }
    }
  };

  const confirmDelete = () => { 
    deleteStrategy(strategy.id); 
    setShowDeleteConfirm(false); 
    onBack(); 
  };
  
  // Custom Icon Logic
  const StrategyIconComponent = strategy.iconId && StrategyIcons[strategy.iconId] ? StrategyIcons[strategy.iconId] : ZapIcon;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-20">
      <div className="relative bg-muted/10 border border-border/40 rounded-[3rem] p-8 lg:p-14 overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 blur-[150px] opacity-10 bg-primary rounded-full -mr-20 -mt-20" />
        
        <div className="relative z-10">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('backToStrategies')}
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-5 mb-4">
                 <div className="p-4 bg-primary/10 text-primary rounded-3xl border border-primary/20 shadow-sm">
                    <StrategyIconComponent className="w-8 h-8" />
                 </div>
                 <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">{strategy.name}</h2>
              </div>
              <p className="text-base md:text-lg text-content/70 font-medium leading-relaxed max-w-3xl whitespace-pre-wrap">
                {strategy.description || 'No detailed logic defined yet for this strategy.'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => setEditingStrategy(strategy)} className="p-4 bg-bkg border border-border rounded-2xl hover:bg-muted hover:scale-105 transition-all shadow-sm" title={t('edit')}>
                <EditIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="p-4 bg-danger/10 text-danger border border-danger/20 rounded-2xl hover:bg-danger hover:text-white hover:scale-105 transition-all shadow-sm" title={t('delete')}>
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-8">
           <div className="bg-muted/30 border border-border rounded-[2.5rem] p-8 lg:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                <ActivityIcon className="w-5 h-5" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t('performanceAnalytics')}</h3>
            </div>
            <AnalyticsPage isComponent={true} defaultStrategyId={strategy.id} />
          </div>

          <div className="bg-muted/10 border border-border rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <CameraIcon className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t('examples')}</h3>
              </div>
              <div className="flex items-center gap-4">
                <label 
                  htmlFor="quick-add-image-input" 
                  className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary border border-primary/20 rounded-lg cursor-pointer hover:bg-primary hover:text-bkg transition-all active:scale-95 shadow-sm" 
                  title={t('addExampleImages')}
                >
                  <PlusIcon className="w-4 h-4" />
                </label>
                <input 
                  id="quick-add-image-input"
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="sr-only" 
                  onChange={handleQuickImageUpload} 
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                  {strategy.images?.length || 0} Assets
                </span>
              </div>
            </div>
            
            {strategy.images && strategy.images.length > 0 ? (
              <div className="flex flex-col gap-6">
                {strategy.images.map((img, index) => (
                  <ExampleCard 
                    key={img.id} 
                    img={img} 
                    strategy={strategy} 
                    onView={setSelectedImage} 
                    index={index} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20 opacity-40">
                <UploadCloudIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">{t('noTradesYet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {editingStrategy && <StrategyForm isOpen={!!editingStrategy} onClose={() => setEditingStrategy(null)} strategy={editingStrategy} />}
      
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={t('delete')}>
        <div className="space-y-6 text-center">
          <div className="flex justify-center p-6 bg-danger/10 text-danger rounded-3xl w-fit mx-auto shadow-inner shadow-danger/5">
            <AlertTriangleIcon className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tight">{t('areYouSure')}</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">{t('deleteStrategyConfirmation')}</p>
          </div>
          <div className="flex gap-4 justify-center pt-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="px-8 py-3 bg-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-border transition-colors">{t('cancel')}</button>
            <button onClick={confirmDelete} className="px-8 py-3 bg-danger text-bkg rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-danger/90 transition-all shadow-xl shadow-danger/20">{t('delete')}</button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title={t('viewScreenshot')} maxWidth="max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
          <div className="flex-[2] justify-center items-center overflow-hidden bg-black/5 rounded-3xl p-3 flex">
            <img src={selectedImage?.url || ''} alt="Strategy Example" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-fade-in" />
          </div>
          <div className="flex-1 flex flex-col bg-muted/20 border border-border rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-6">
                <NewspaperIcon className="w-5 h-5 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{t('notes')}</h3>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {selectedImage?.notes ? (
                    <p className="text-sm font-medium leading-relaxed text-content/80 whitespace-pre-wrap">
                        {selectedImage.notes}
                    </p>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-10">
                        <EditIcon className="w-8 h-8 mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose">No Observations<br/>Recorded For This Setup</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const StrategiesPage: React.FC = () => {
  const { strategies, t } = useApp();
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  
  // Find the strategy in context so it's always up-to-date
  const selectedStrategy = useMemo(() => 
    selectedStrategyId ? strategies.find(s => s.id === selectedStrategyId) || null : null
  , [strategies, selectedStrategyId]);

  if (selectedStrategy) { 
    return <StrategyDetailView strategy={selectedStrategy} onBack={() => setSelectedStrategyId(null)} />; 
  }
  
  return (
    <div className="animate-fade-in flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/10 border border-border/50 rounded-[3rem] p-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{t('strategies')}</h1>
          <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] mt-3 opacity-60">Systematic Edge Repository</p>
        </div>
        <button 
          onClick={() => setFormOpen(true)} 
          className="flex items-center justify-center p-5 bg-primary text-bkg rounded-2xl hover:bg-primary-focus shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 active:translate-y-0 group"
          title={t('newStrategy')}
        >
          <PlusIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>
      
      {strategies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {strategies.map(s => <StrategyCard key={s.id} strategy={s} onSelect={() => setSelectedStrategyId(s.id)} />)}
        </div>
      ) : (
        <div 
          className="flex flex-col items-center justify-center py-40 bg-muted/10 border-2 border-dashed border-border rounded-[4rem] group hover:border-primary/40 transition-all duration-700 cursor-pointer" 
          onClick={() => setFormOpen(true)}
        >
          <div className="p-8 bg-bkg rounded-[2rem] border border-border shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700">
            <TargetIcon className="w-16 h-16 text-primary opacity-30" />
          </div>
          <h3 className="text-3xl font-black tracking-tight uppercase">{t('noStrategiesDefined')}</h3>
          <p className="text-muted-foreground font-black mt-3 max-w-xs text-center uppercase text-[10px] tracking-widest opacity-60 leading-relaxed">
            {t('createYourFirstStrategy')} to begin tracking technical confluences and performance metrics.
          </p>
          <div className="mt-10 flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/10 px-6 py-3 rounded-2xl group-hover:bg-primary group-hover:text-bkg transition-all">
            Begin Creation <PlusIcon className="w-4 h-4" />
          </div>
        </div>
      )}
      
      <StrategyForm isOpen={isFormOpen} onClose={() => setFormOpen(false)} strategy={null} />
    </div>
  );
};

export default StrategiesPage;
