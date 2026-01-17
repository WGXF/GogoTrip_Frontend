import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MapPin, Search, Plus, Star, Globe, MoreHorizontal, 
  Pencil, Trash2, X, Save, AlertTriangle, CheckCircle, AlertCircle,
  Loader2, ExternalLink, Phone, Clock, DollarSign, Navigation,
  Sparkles, FileEdit, ChevronRight, Building2, RefreshCw
} from 'lucide-react';

// ============================================
// Type Definitions
// ============================================
interface Place {
  id: number;
  name: string;
  address: string;
  category?: string;
  rating: number | null;
  google_place_id: string;
  phone?: string;
  website?: string;
  price_level?: string;
  business_status?: string;
  coordinates?: { lat: number; lng: number } | null;
  is_manual?: boolean;
}

interface GoogleSearchResult {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  types: string[];
  photo_reference?: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

type AddMode = 'select' | 'google' | 'manual';

// ============================================
// Main Component
// ============================================
export const PlaceList: React.FC = () => {
  // --- Core State ---
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Modal State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('select');
  
  // --- Editing State (New) ---
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);

  // --- Google Search State ---
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState<GoogleSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGooglePlace, setSelectedGooglePlace] = useState<GoogleSearchResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Manual Input State ---
  const [manualForm, setManualForm] = useState({
    name: '',
    address: '',
    rating: '',
    phone: '',
    website: '',
    price_level: '',
    lat: '',
    lng: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- UI State ---
  const [notification, setNotification] = useState<Notification | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    fetchPlaces();
  }, []);

  // Debounced Google Search
  useEffect(() => {
    if (addMode !== 'google' || googleQuery.length < 2) {
      setGoogleResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchGooglePlaces(googleQuery);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [googleQuery, addMode]);

  // ============================================
  // API Functions
  // ============================================
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchPlaces = async () => {
    try {
      const res = await fetch(`/api/admin/places?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPlaces(data.places || data);
      }
    } catch(e) { 
      console.error(e);
      showNotification('error', 'Failed to load places');
    } finally { 
      setIsLoading(false); 
    }
  };

  const searchGooglePlaces = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/places/google/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setGoogleResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const importGooglePlace = async () => {
    if (!selectedGooglePlace) return;
    
    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/places/google/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: selectedGooglePlace.place_id })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showNotification('success', data.is_new ? 'Place imported successfully!' : 'Place already exists');
        closeAddModal();
        fetchPlaces();
      } else {
        showNotification('error', data.error || 'Import failed');
      }
    } catch (e) {
      showNotification('error', 'Network error during import');
    } finally {
      setIsImporting(false);
    }
  };

  // 🔥 Handle Edit Click (Pre-fill Form)
  const handleEditClick = (place: Place) => {
    setEditingPlace(place);
    setAddMode('manual'); // Reuse manual form
    setManualForm({
      name: place.name,
      address: place.address,
      rating: place.rating?.toString() || '',
      phone: place.phone || '',
      website: place.website || '',
      price_level: place.price_level || '',
      lat: place.coordinates?.lat.toString() || '',
      lng: place.coordinates?.lng.toString() || ''
    });
    setIsAddModalOpen(true);
  };

  // 🔥 Update Existing Place
  const updateExistingPlace = async () => {
    if (!editingPlace) return;

    if (!manualForm.name.trim() || !manualForm.address.trim()) {
      showNotification('error', 'Name and Address are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: manualForm.name.trim(),
        address: manualForm.address.trim(),
        is_manual: true, // <--- CRITICAL: Triggers backend conversion logic
        rating: manualForm.rating ? parseFloat(manualForm.rating) : null,
        phone: manualForm.phone ? manualForm.phone.trim() : null,
        website: manualForm.website ? manualForm.website.trim() : null,
        price_level: manualForm.price_level || null,
      };

      if (manualForm.lat && manualForm.lng) {
        payload.coordinates = {
          lat: parseFloat(manualForm.lat),
          lng: parseFloat(manualForm.lng)
        };
      }

      const res = await fetch(`/api/admin/places/${editingPlace.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification('success', 'Place updated successfully!');
        closeAddModal();
        fetchPlaces();
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'Update failed');
      }
    } catch (e) {
      showNotification('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const createManualPlace = async () => {
    if (!manualForm.name.trim() || !manualForm.address.trim()) {
      showNotification('error', 'Name and Address are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: manualForm.name.trim(),
        address: manualForm.address.trim(),
        is_manual: true
      };

      if (manualForm.rating) payload.rating = parseFloat(manualForm.rating);
      if (manualForm.phone) payload.phone = manualForm.phone.trim();
      if (manualForm.website) payload.website = manualForm.website.trim();
      if (manualForm.price_level) payload.price_level = manualForm.price_level;
      if (manualForm.lat && manualForm.lng) {
        payload.coordinates = {
          lat: parseFloat(manualForm.lat),
          lng: parseFloat(manualForm.lng)
        };
      }

      const res = await fetch('/api/admin/places/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', 'Place created successfully!');
        closeAddModal();
        fetchPlaces();
      } else {
        showNotification('error', data.error || 'Creation failed');
      }
    } catch (e) {
      showNotification('error', 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/admin/places/${deleteTargetId}`, { method: 'DELETE' });
      if (res.ok) {
        setPlaces(places.filter(p => p.id !== deleteTargetId));
        showNotification('success', 'Place deleted successfully');
      } else {
        showNotification('error', 'Failed to delete place');
      }
    } catch (e) {
      showNotification('error', 'Network error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  // ============================================
  // Helper Functions
  // ============================================
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddMode('select');
    setEditingPlace(null); // <--- Reset editing state
    setGoogleQuery('');
    setGoogleResults([]);
    setSelectedGooglePlace(null);
    setManualForm({ name: '', address: '', rating: '', phone: '', website: '', price_level: '', lat: '', lng: '' });
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      'Food & Drink': 'bg-orange-100 text-orange-700',
      'Accommodation': 'bg-purple-100 text-purple-700',
      'Culture': 'bg-indigo-100 text-indigo-700',
      'Nature': 'bg-emerald-100 text-emerald-700',
      'Shopping': 'bg-pink-100 text-pink-700',
      'Landmark': 'bg-amber-100 text-amber-700',
    };
    return colors[category || ''] || 'bg-slate-100 text-slate-600';
  };

  const filtered = places.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================
  // Render
  // ============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm">Loading places...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 ${
          notification.type === 'success' 
            ? 'bg-white border-emerald-200 text-emerald-800' 
            : 'bg-white border-red-200 text-red-800'
        }`}>
          <div className={`p-1.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          </div>
          <p className="text-sm font-medium">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex justify-between items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building2 size={20} className="text-blue-600" />
            Places Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{places.length} destinations in database</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search places..." 
              className="pl-9 pr-4 py-2.5 w-64 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} /> Add Place
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="p-4">Place Name</th>
              <th className="p-4">Address</th>
              <th className="p-4">Category</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Source</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No places found</p>
                </td>
              </tr>
            ) : (
              filtered.map((place) => (
                <tr key={place.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4">
                    <span className="font-medium text-slate-800">{place.name}</span>
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={13} className="shrink-0 text-slate-400" /> 
                      <span className="truncate">{place.address}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(place.category)}`}>
                      {place.category || 'General'}
                    </span>
                  </td>
                  <td className="p-4">
                    {place.rating ? (
                      <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                        <Star size={13} fill="currentColor" />
                        <span>{place.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {place.is_manual === true || place.google_place_id?.startsWith('manual_') ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        <FileEdit size={11} /> Manual
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        <Globe size={11} /> Google
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 🔥 EDIT BUTTON */}
                      <button 
                        onClick={() => handleEditClick(place)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Pencil size={14}/>
                      </button>
                      <button 
                        onClick={() => setDeleteTargetId(place.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={26} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Place?</h3>
              <p className="text-sm text-slate-500 mb-6">
                This action cannot be undone. The place will be permanently removed.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Enhanced Add/Edit Place Modal               */}
      {/* ============================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingPlace ? 'Edit Place' : 'Add New Place'}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingPlace ? 'Update place details manually' : 'Choose how you want to add a place'}
                </p>
              </div>
              <button 
                onClick={closeAddModal} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-all"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Mode Selection (Only show if NOT editing) */}
            {addMode === 'select' && !editingPlace && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Google Search Option */}
                  <button
                    onClick={() => setAddMode('google')}
                    className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                      <Globe size={22} className="text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">Google Places</h4>
                    <p className="text-sm text-slate-500">Search and import from Google Maps with full details</p>
                    <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Manual Input Option */}
                  <button
                    onClick={() => setAddMode('manual')}
                    className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                      <FileEdit size={22} className="text-white" />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">Manual Entry</h4>
                    <p className="text-sm text-slate-500">Enter place details manually without API</p>
                    <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>
            )}

            {/* Google Search Mode */}
            {addMode === 'google' && (
              <div className="p-6">
                {/* Back Button */}
                <button 
                  onClick={() => setAddMode('select')}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                >
                  ← Back to options
                </button>

                {/* Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search Google Places..."
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    autoFocus
                  />
                  {isSearching ? (
                    <Loader2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                  ) : (
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                </div>

                {/* Search Results */}
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {googleResults.length === 0 && googleQuery.length >= 2 && !isSearching && (
                    <p className="text-center text-slate-400 py-8 text-sm">No results found</p>
                  )}
                  {googleResults.map((result) => (
                    <button
                      key={result.place_id}
                      onClick={() => setSelectedGooglePlace(result)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedGooglePlace?.place_id === result.place_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedGooglePlace?.place_id === result.place_id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <MapPin size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-slate-800 truncate">{result.name}</h5>
                          <p className="text-sm text-slate-500 truncate">{result.address}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {result.rating && (
                              <span className="flex items-center gap-1 text-xs text-amber-600">
                                <Star size={11} fill="currentColor" /> {result.rating}
                              </span>
                            )}
                            {result.types[0] && (
                              <span className="text-xs text-slate-400">{result.types[0].replace(/_/g, ' ')}</span>
                            )}
                          </div>
                        </div>
                        {selectedGooglePlace?.place_id === result.place_id && (
                          <CheckCircle size={20} className="text-blue-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Import Button */}
                {selectedGooglePlace && (
                  <button
                    onClick={importGooglePlace}
                    disabled={isImporting}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Import "{selectedGooglePlace.name}"
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Manual Entry Mode (Shared for Create & Edit) */}
            {addMode === 'manual' && (
              <div className="p-6">
                {/* Back Button (Only if not editing) */}
                {!editingPlace && (
                  <button 
                    onClick={() => setAddMode('select')}
                    className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
                  >
                    ← Back to options
                  </button>
                )}

                <div className="space-y-4">
                  {/* Name (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Place Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Petronas Twin Towers"
                      value={manualForm.name}
                      onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Address (Required) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full address"
                      value={manualForm.address}
                      onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {/* Two columns */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="0.0 - 5.0"
                        value={manualForm.rating}
                        onChange={(e) => setManualForm({ ...manualForm, rating: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Price Level</label>
                      <select
                        value={manualForm.price_level}
                        onChange={(e) => setManualForm({ ...manualForm, price_level: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="Free">Free</option>
                        <option value="$">$ Budget</option>
                        <option value="$$">$$ Moderate</option>
                        <option value="$$$">$$$ Expensive</option>
                        <option value="$$$$">$$$$ Luxury</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        placeholder="+60 12-345 6789"
                        value={manualForm.phone}
                        onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={manualForm.website}
                        onChange={(e) => setManualForm({ ...manualForm, website: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Coordinates <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={manualForm.lat}
                        onChange={(e) => setManualForm({ ...manualForm, lat: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={manualForm.lng}
                        onChange={(e) => setManualForm({ ...manualForm, lng: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={editingPlace ? updateExistingPlace : createManualPlace}
                    disabled={isSubmitting || !manualForm.name.trim() || !manualForm.address.trim()}
                    className="mt-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {editingPlace ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingPlace ? 'Update Place' : 'Save Place'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default PlaceList;