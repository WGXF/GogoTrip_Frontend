import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  // Local preview URL for immediate feedback during upload
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview with external value if it changes and we're not uploading
  React.useEffect(() => {
    if (value && !isUploading) {
      setPreviewUrl(value);
    }
  }, [value, isUploading]);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setIsUploading(true);
    
    // Create temporary preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_BASE_URL}/api/blogs/upload-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.url) {
          onChange(data.url);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload image. Please try again.');
      setPreviewUrl(''); // Clear preview on failure
      onChange(''); // Clear value on failure
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  if (previewUrl || value) {
    return (
      <div className={`relative group aspect-video rounded-2xl overflow-hidden ${className}`}>
        <img src={previewUrl || value} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="Change image"
          >
            <Upload className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
            title="Remove image"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        {isUploading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800'
        }`}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
            <p className="text-sm font-medium text-slate-500">Uploading...</p>
          </div>
        ) : showUrlInput ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  Add Image
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <ImageIcon className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Drop an image here or click to upload
            </p>
            <p className="text-xs text-slate-400">JPEG, PNG, GIF, WebP up to 5MB</p>
            
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUrlInput(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                URL
              </button>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ImageUpload;
