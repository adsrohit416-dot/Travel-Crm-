import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  BookmarkCheck,
  Trash2,
  Save,
} from 'lucide-react';
import {
  DESTINATION_IMAGE_CATALOG,
  DestinationImage,
  getImagesForDestination,
  getSavedCustomImages,
  saveCustomDestinationImage,
  deleteSavedCustomImage,
} from '../../data/destinationImages';

interface ImageUploadModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  currentImageUrl?: string;
  currentCaption?: string;
  destinationContext?: string;
  defaultFallback?: { url: string; caption: string };
  onClose: () => void;
  onApply: (imageUrl: string, caption: string) => void;
}

/**
 * Resizes and compresses uploaded images client-side to ensure:
 * 1. Fast, instant rendering.
 * 2. Safe localStorage footprint (< 150KB per image instead of 10MB raw camera files).
 * 3. Razor-sharp A4 PDF export clarity.
 */
function optimizeUploadedImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 960,
  quality = 0.86
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        // White backdrop in case of transparent png
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  title,
  subtitle,
  currentImageUrl,
  currentCaption,
  destinationContext,
  defaultFallback,
  onClose,
  onApply,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'saved' | 'library'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  const [caption, setCaption] = useState<string>(currentCaption || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [savedImages, setSavedImages] = useState<DestinationImage[]>(() => getSavedCustomImages());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImageUrl || '');
      setCaption(currentCaption || '');
      setUrlInput(currentImageUrl && !currentImageUrl.startsWith('data:') ? currentImageUrl : '');
      setErrorMsg(null);
      setSaveSuccessNotice(null);
      setIsProcessing(false);
      setSavedImages(getSavedCustomImages());
    }
  }, [isOpen, currentImageUrl, currentCaption]);

  // Listen to custom-images-updated event to keep library fresh
  useEffect(() => {
    const refresh = () => setSavedImages(getSavedCustomImages());
    window.addEventListener('custom-images-updated', refresh);
    return () => window.removeEventListener('custom-images-updated', refresh);
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP, or SVG).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const optimized = await optimizeUploadedImage(file);
      setPreviewUrl(optimized);
      let newCaption = caption.trim();
      if (!newCaption) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        newCaption = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        setCaption(newCaption);
      }

      // Automatically save to custom image library for future use
      saveCustomDestinationImage({
        url: optimized,
        caption: newCaption || 'Tour Sightseeing Photo',
        destination: destinationContext || 'General',
        title: newCaption || 'Tour Sightseeing Photo',
      });
      setSavedImages(getSavedCustomImages());
      setSaveSuccessNotice('✓ Photo saved to your Destination Library for future itineraries!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Failed to process image:', err);
      setErrorMsg('Could not process the selected image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a valid image web address (URL).');
      return;
    }
    setErrorMsg(null);
    const cleanUrl = urlInput.trim();
    setPreviewUrl(cleanUrl);
    let newCap = caption.trim();
    if (!newCap) {
      newCap = 'Custom Tour Destination Photo';
      setCaption(newCap);
    }

    // Automatically save to custom image library for future use
    saveCustomDestinationImage({
      url: cleanUrl,
      caption: newCap,
      destination: destinationContext || 'General',
      title: newCap,
    });
    setSavedImages(getSavedCustomImages());
    setSaveSuccessNotice('✓ Image link saved to your Library for future use!');
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleSelectFromLibrary = (img: DestinationImage) => {
    setPreviewUrl(img.url);
    setCaption(img.caption || img.title);
    setErrorMsg(null);
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSavedCustomImage(id);
    setSavedImages(getSavedCustomImages());
  };

  const handleResetToDefault = () => {
    if (defaultFallback) {
      setPreviewUrl(defaultFallback.url);
      setCaption(defaultFallback.caption);
      setUrlInput('');
      setErrorMsg(null);
    }
  };

  const handleSaveAndApply = () => {
    if (!previewUrl) {
      setErrorMsg('Please upload, paste a URL, or choose a photo first.');
      return;
    }
    // Ensure image is permanently saved for future use
    saveCustomDestinationImage({
      url: previewUrl,
      caption: caption || 'Custom Tour Photo',
      destination: destinationContext || 'General',
      title: caption || 'Custom Tour Photo',
    });
    onApply(previewUrl, caption);
    onClose();
  };

  // Predefined library filtering
  const allLibraryImages = DESTINATION_IMAGE_CATALOG;
  const filteredLibrary =
    selectedDestinationFilter === 'all'
      ? destinationContext
        ? getImagesForDestination(destinationContext)
        : allLibraryImages
      : allLibraryImages.filter((img) =>
          img.destination.toLowerCase().includes(selectedDestinationFilter.toLowerCase())
        );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle || 'Upload your own custom photo (auto-saved for future use) or choose from library.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload from Device</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'saved'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Access your previously uploaded destination pictures"
          >
            <BookmarkCheck className={`w-3.5 h-3.5 ${activeTab === 'saved' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>My Saved Uploads</span>
            {savedImages.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'saved' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              }`}>
                {savedImages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Web Link (URL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'library'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Predefined Gallery</span>
          </button>

          {defaultFallback && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Reset image to system default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Default</span>
            </button>
          )}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[220px]">
          {/* TAB 1: Upload from device */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/40 scale-[0.99]'
                    : 'border-slate-700 bg-slate-950/50 hover:border-emerald-500 hover:bg-slate-950'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white block">
                  Click to Browse or Drag & Drop Image Here
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP, SVG · Automatically saved to your library for future use
                </span>
                <button
                  type="button"
                  className="mt-3 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Choose File from Computer
                </button>
              </div>

              {saveSuccessNotice && (
                <div className="text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 p-2.5 rounded-lg flex items-center justify-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessNotice}</span>
                </div>
              )}

              {isProcessing && (
                <div className="text-xs text-emerald-400 flex items-center justify-center gap-2 py-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Optimizing and saving photo to persistent destination library...</span>
                </div>
              )}
            </div>
          )}

          {/* TAB: MY SAVED UPLOADS (User requirement: keep image saved for future use) */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    My Saved Destination Images ({savedImages.length})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Uploaded photos are automatically preserved here and can be reused on any tour day or future quotation.
                  </span>
                </div>
              </div>

              {savedImages.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-2">
                  <BookmarkCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No custom photos saved yet</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    When you upload photos from your device or paste web links, they are permanently stored in this library so you never have to re-upload them.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="mt-2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Upload First Photo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[240px] overflow-y-auto p-1">
                  {savedImages.map((img) => {
                    const isSelected = previewUrl === img.url;
                    return (
                      <div
                        key={img.id}
                        onClick={() => handleSelectFromLibrary(img)}
                        className={`group relative text-left rounded-lg overflow-hidden border transition-all bg-slate-950 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                            : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="h-20 w-full overflow-hidden bg-slate-800 relative">
                          <img
                            src={img.url}
                            alt={img.title || img.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            crossOrigin="anonymous"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSaved(e, img.id)}
                            className="absolute bottom-1 right-1 bg-slate-950/80 hover:bg-rose-900 text-slate-400 hover:text-white p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete this saved image from library"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="p-1.5">
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block truncate">
                            {img.destination || 'Custom'}
                          </span>
                          <span className="text-[11px] font-semibold text-white block truncate" title={img.caption || img.title}>
                            {img.caption || img.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Image Web Link (URL) */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Paste Direct Image Web Link (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/images/kanchenjunga-view.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Load Image
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Provide any public web link from Unsplash, Wikimedia, or your cloud storage.
              </p>
            </div>
          )}

          {/* TAB 3: Predefined Gallery */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              {/* Destination Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'Sikkim', 'Darjeeling', 'North Sikkim', 'Meghalaya', 'Arunachal', 'Assam', 'Bhutan'].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setSelectedDestinationFilter(dest)}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      selectedDestinationFilter === dest
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {dest === 'all' ? 'All Destinations' : dest}
                  </button>
                ))}
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto p-1">
                {filteredLibrary.map((img) => {
                  const isSelected = previewUrl === img.url;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => handleSelectFromLibrary(img)}
                      className={`group relative text-left rounded-lg overflow-hidden border transition-all bg-slate-950 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="h-20 w-full overflow-hidden bg-slate-800 relative">
                        <img
                          src={img.url}
                          alt={img.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          crossOrigin="anonymous"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                          {img.destination}
                        </span>
                        <span className="text-[11px] font-semibold text-white block truncate">
                          {img.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Preview & Caption Box */}
          {previewUrl && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Live Image Preview & Caption
              </span>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:w-44 h-28 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative shadow-sm">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute top-1 right-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[9px] text-emerald-400 font-bold">
                    Selected
                  </div>
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Display Caption / Subtitle (Appears in Itinerary & PDF)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Scenic Viewpoint / Deluxe Hotel Room / Private SUV"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    A clear caption explains the picture clearly to clients in the downloaded proposal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-xs text-rose-300 bg-rose-950/50 border border-rose-500/40 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndApply}
            disabled={!previewUrl || isProcessing}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply Image to Itinerary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
