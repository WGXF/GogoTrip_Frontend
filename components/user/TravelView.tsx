import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { Trip, User } from '../../types';
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Hotel, 
  Luggage, 
  ArrowRight,
  Plus,
  Navigation,
  X,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Download,
  Loader2,
  Trash2,
  Eye,
  AlertTriangle,
  Utensils, 
  ShoppingBag, 
  Landmark, 
  Sparkles, 
  Clock, 
  Edit2, 
  RefreshCw, 
  MoreHorizontal, 
  Coffee, 
  Moon, 
  Sun
} from 'lucide-react';
import GoogleLinkDialog from '../ui/GoogleLinkDialog';
import { useGoogleLink } from '../../hooks/useGoogleLink';

// Helper functions for Trip Details
const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

const getDayDate = (startDate: string | undefined, dayNumber: number) => {
  if (!startDate) return null;
  try {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (dayNumber - 1));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  } catch (e) {
    return null;
  }
};

const getActivityTypeInfo = (notes: string = '', type: string = '') => {
  const text = (notes + type).toLowerCase();
  
  if (['食', '吃', '餐', '饭', 'food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'buffet'].some(k => text.includes(k))) {
    return { 
      type: 'Food & Dining', 
      icon: Utensils, 
      color: 'text-orange-600 dark:text-orange-400', 
      bg: 'bg-orange-50 dark:bg-orange-500/10', 
      border: 'border-orange-100 dark:border-orange-500/20',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20'
    };
  }
  if (['参观', '游览', '景点', 'visit', 'tour', 'sightseeing', 'park', 'museum', 'attraction', 'ticket'].some(k => text.includes(k))) {
    return { 
      type: 'Attraction', 
      icon: Landmark, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-500/10', 
      border: 'border-blue-100 dark:border-blue-500/20',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20'
    };
  }
  if (['购物', '街', '逛', 'mall', 'shop', 'store', 'market', 'souvenir'].some(k => text.includes(k))) {
    return { 
      type: 'Shopping', 
      icon: ShoppingBag, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-50 dark:bg-emerald-500/10', 
      border: 'border-emerald-100 dark:border-emerald-500/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20'
    };
  }
  
  return { 
    type: type || 'Activity', 
    icon: MapPin, 
    color: 'text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-50 dark:bg-slate-800/50', 
    border: 'border-slate-200 dark:border-slate-700',
    iconBg: 'bg-slate-200 dark:bg-slate-700'
  };
};

interface TravelViewProps {
  user: User | null;
}

const TravelView: React.FC<TravelViewProps> = ({ user }) => {
  const navigate = useNavigate();
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [tripDetails, setTripDetails] = useState<any>(null);
  
  // 导出日期选择
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedTripForExport, setSelectedTripForExport] = useState<string | null>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // 🆕 自定义 Toast (Alert) 状态
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false, message: '', type: 'success'
  });

  // 🆕 自定义 Confirm Modal 状态
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDestructive?: boolean;
  }>({
    show: false, title: '', message: '', onConfirm: () => {}
  });

  const upcomingTrip = trips.length > 0 ? trips[0] : null;

  // 🆕 显示 Toast 辅助函数 (must be defined before useGoogleLink)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    // 3秒后自动消失
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // 🆕 Google Link hook for export gating
  const {
    showLinkDialog,
    pendingFeature,
    requireGoogleLink,
    handleGoToSettings,
    handleCancelLink
  } = useGoogleLink({ user, onShowWarning: (msg) => showToast(msg, 'info') });

  // 🆕 获取真实的用户行程数据
  const fetchTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/list`, { 
        credentials: 'include' 
      });
      
      if (res.ok) {
        const data = await res.json();
        const mappedTrips = data.map((t: any) => ({
          id: t.id,
          destination: t.destination || t.title,
          title: t.title,
          dates: t.dates || `${t.start_date || ''} - ${t.end_date || ''}`,
          status: t.status || 'planning',
          weather: '25°C',
          imageUrl: t.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=400',
          flight: t.flight || null,
          hotel: t.hotel || null,
          total_expenses: t.total_expenses || 0
        }));
        setTrips(mappedTrips);
      } else {
        console.error('Failed to fetch trips');
      }
    } catch (e) {
      console.error('Error fetching trips:', e);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // 获取单个行程的详细信息
  const fetchTripDetails = async (tripId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setTripDetails(data);
        setShowTripDetails(true);
      } else {
        showToast('Failed to load trip details', 'error');
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      showToast('Error loading trip details', 'error');
    }
  };

  const openExportModal = (tripId: string) => {
    // 🆕 Check Google linking before opening export modal
    if (!requireGoogleLink('Export trip to Google Calendar')) {
      return; // Dialog will be shown by the hook
    }
    
    setSelectedTripForExport(tripId);
    const today = new Date().toISOString().split('T')[0];
    setExportStartDate(today);
    setShowExportModal(true);
  };

  // 🔥 导出到 Google Calendar (已替换 Alert/Confirm)
  const exportToGoogleCalendar = async (tripId: string, startDate: string) => {
    setIsExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}/export_calendar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          showToast(`Successfully exported events to Calendar!`, 'success');
          setShowExportModal(false);
          fetchTrips();
        }
      } else if (res.status === 401) {
        // ⚠️ 替换原生的 confirm 为自定义 Modal
        setConfirmDialog({
          show: true,
          title: 'Authorization Required',
          message: 'You need to authorize Google Calendar first. Redirect to authorization page?',
          confirmText: 'Authorize',
          isDestructive: false,
          onConfirm: () => {
             window.location.href = `${API_BASE_URL}/auth/authorize`;
             setConfirmDialog(prev => ({ ...prev, show: false }));
          }
        });
      } else {
        const errorData = await res.json();
        showToast(`Export failed: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export to Google Calendar.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 🆕 删除点击处理 (打开确认框)
  const handleDeleteClick = (tripId: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Trip',
      message: 'Are you sure you want to delete this trip? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => handleDeleteConfirm(tripId)
    });
  };

  // 🆕 实际删除逻辑
  const handleDeleteConfirm = async (tripId: string) => {
    setConfirmDialog(prev => ({ ...prev, show: false })); // 先关闭弹窗
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok) {
        showToast('Trip deleted successfully', 'success');
        fetchTrips(); 
      } else {
        showToast('Failed to delete trip', 'error');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('Failed to delete trip', 'error');
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationError("Unable to retrieve your location");
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    handleLocateMe();
    fetchTrips();
  }, []);

  // Loading State
  if (isLoadingTrips) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 animate-fade-in">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading your adventures...</p>
      </div>
    );
  }

  // Empty State
  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6 animate-fade-in p-8">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Plane className="w-10 h-10 text-slate-400" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No trips yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Start planning your next adventure!</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="px-8 py-4 bg-sky-600 dark:bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-sky-500 dark:hover:bg-indigo-500 transition-all shadow-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Plan Your First Trip
      </button>
      </div>
    );
  }

  const markers = upcomingTrip?.hotel ? [
    {
      id: 'hotel-1',
      type: 'hotel',
      title: upcomingTrip.hotel.name || 'Luxury Hotel',
      subtitle: upcomingTrip.hotel.address || 'Location',
      rating: upcomingTrip.hotel.rating || 5,
      top: '40%',
      left: '45%',
      icon: Hotel,
      color: 'emerald',
      description: "Experience luxury accommodations with world-class amenities.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
      tags: ['Luxury', 'Spa', 'View']
    }
  ] : [];

  const packingListItems = [
    "Passport & Visa", "Travel Insurance", "Universal Adapter", "Light Jacket", 
    "Comfortable Walking Shoes", "Portable Charger", "Local Currency", "Toiletries", 
    "Camera", "Prescription Meds"
  ];

  const activeMarker = markers.find(m => m.id === activeMarkerId);

  // Mock Map Component
  const TripMap = () => {
    const defaultLat = 35.0116;
    const defaultLng = 135.7681;
    const displayLat = userLocation ? userLocation.lat : defaultLat;
    const displayLng = userLocation ? userLocation.lng : defaultLng;
    
    return (
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 hover:border-sky-400 dark:hover:border-indigo-400 rounded-[2rem] p-1.5 shadow-sm relative group overflow-hidden isolate h-[450px] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
        
        {activeMarker && (
          <div className="absolute inset-2 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[1.7rem] overflow-hidden shadow-2xl animate-scale-in">
            <div className="h-full flex flex-col md:flex-row">
              <div className="w-full md:w-5/12 h-48 md:h-full relative shrink-0">
                <img src={activeMarker.image} alt={activeMarker.title} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setActiveMarkerId(null)}
                  className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{activeMarker.title}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">{activeMarker.subtitle}</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-sm">{activeMarker.description}</p>
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => window.open('https://maps.google.com', '_blank')}
                    className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-full relative bg-slate-100 dark:bg-slate-800 rounded-[1.7rem] overflow-hidden">
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }} 
            src={`https://maps.google.com/maps?q=${displayLat},${displayLng}&z=14&output=embed`}
            allowFullScreen
            className="grayscale-[20%] hover:grayscale-0 transition-all duration-700"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-10 animate-fade-in-up relative">
      
      {/* 🆕 Global Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/10 ${
            toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 
            toast.type === 'error' ? 'bg-red-500/90 text-white' : 
            'bg-slate-800/90 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
             <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 🆕 Global Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                confirmDialog.isDestructive 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
                  : 'bg-sky-100 dark:bg-indigo-900/30 text-sky-500'
              }`}>
                {confirmDialog.isDestructive 
                  ? <Trash2 className="w-7 h-7" /> 
                  : <AlertTriangle className="w-7 h-7" />}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-2">
                <button 
                  onClick={() => setConfirmDialog(prev => ({...prev, show: false}))}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
                    confirmDialog.isDestructive 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  {confirmDialog.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Date Selection Modal */}
      {showExportModal && selectedTripForExport && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-sky-500" />
                Select Start Date
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors hover:scale-105"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm leading-relaxed">
              Choose when you want your trip to start. All itinerary items will be scheduled from this date.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Start Date</label>
                <input 
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-indigo-500 transition-all hover:border-sky-300 dark:hover:border-indigo-500/50"
                />
              </div>

              <div className="bg-sky-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-sky-100 dark:border-indigo-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sky-100 dark:bg-indigo-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-sky-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Trip Schedule Preview</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {exportStartDate ? (
                        <>Your trip will start on <span className="font-bold text-sky-600 dark:text-indigo-400">{new Date(exportStartDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></>
                      ) : (
                        'Please select a start date'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => exportToGoogleCalendar(selectedTripForExport, exportStartDate)}
                  disabled={!exportStartDate || isExporting}
                  className="flex-[2] py-3 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export to Calendar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      {showTripDetails && tripDetails && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-20 rounded-t-[2.5rem]">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{tripDetails.title}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {tripDetails.dates || 'Trip Itinerary'}
                </p>
              </div>
              <button 
                onClick={() => setShowTripDetails(false)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors hover:rotate-90 duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
              {tripDetails.items && tripDetails.items.length > 0 ? (
                <div className="p-8 space-y-10">
                  {Object.entries(tripDetails.items.reduce((acc: any, item: any) => {
                    const day = item.day_number;
                    if (!acc[day]) acc[day] = [];
                    acc[day].push(item);
                    return acc;
                  }, {})).map(([dayNum, items]: [string, any]) => {
                     const dayItems = items.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
                     return (
                      <div key={dayNum} className="relative">
                        {/* Day Header */}
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 py-3 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                              DAY {dayNum}
                              {tripDetails.start_date && (
                                <span className="text-sm font-medium text-slate-400 font-normal border-l border-slate-200 dark:border-slate-700 pl-3">
                                  {getDayDate(tripDetails.start_date, parseInt(dayNum))}
                                </span>
                              )}
                            </h4>
                          </div>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => showToast('AI Day Optimization coming soon!', 'info')}
                               className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                             >
                                <Sparkles className="w-3 h-3" /> Optimize Day
                             </button>
                             <button 
                               onClick={() => showToast('Relax Mode coming soon!', 'info')}
                               className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                             >
                                <Coffee className="w-3 h-3" /> Relax
                             </button>
                          </div>
                        </div>

                        {/* Timeline & Items */}
                        <div className="space-y-6 relative pl-4">
                          {/* Vertical Line */}
                          <div className="absolute left-[85px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-slate-800/50" />
                          
                          {dayItems.map((item: any, idx: number) => {
                             const { type, icon: Icon, color, bg, border, iconBg } = getActivityTypeInfo(item.notes, item.type);
                             return (
                              <div key={idx} className="flex gap-6 relative group">
                                {/* Time Pill */}
                                <div className="w-[70px] shrink-0 pt-1 text-right">
                                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
                                    {formatTime(item.start_time)}
                                  </span>
                                </div>
                                
                                {/* Dot on Line */}
                                <div className={`absolute left-[81px] top-3 w-2.5 h-2.5 rounded-full z-10 border-2 border-white dark:border-slate-900 transition-all duration-300 ${color.replace('text-', 'bg-')} group-hover:scale-125 shadow-sm`} />

                                {/* Card */}
                                <div className={`flex-1 ${bg} rounded-2xl p-4 border ${border} hover:shadow-lg hover:shadow-sky-100/50 dark:hover:shadow-none transition-all duration-300 group-hover:-translate-y-0.5 relative overflow-hidden`}>
                                   
                                   {/* Content */}
                                   <div className="relative z-10">
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                         <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${iconBg}`}>
                                               <Icon className={`w-4 h-4 ${color}`} />
                                            </div>
                                            <h5 className="font-bold text-slate-900 dark:text-white text-base">
                                               {item.place?.name || item.type || 'Activity'}
                                            </h5>
                                         </div>
                                         
                                         {/* Hover Actions */}
                                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform translate-x-2 group-hover:translate-x-0">
                                            <button 
                                              onClick={() => showToast('Edit item coming soon', 'info')}
                                              className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors" title="Edit"
                                            >
                                               <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                              onClick={() => showToast('AI Replace coming soon', 'info')}
                                              className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors" title="AI Replace"
                                            >
                                               <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                               onClick={() => showToast('Delete item coming soon', 'info')} 
                                               className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors" title="Delete"
                                            >
                                               <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                         </div>
                                      </div>
                                      
                                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-[34px]">
                                        {item.notes}
                                      </p>
                                   </div>
                                </div>
                              </div>
                             );
                          })}
                        </div>
                      </div>
                     );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12 space-y-4">
                   <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-slate-300" />
                   </div>
                   <p>No itinerary items yet</p>
                   <button className="text-sky-600 font-bold text-sm hover:underline">
                      Start Planning with AI
                   </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-[2.5rem] z-20">
              <button 
                onClick={() => openExportModal(tripDetails.id)}
                disabled={isExporting}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? 'Exporting to Calendar...' : 'Export Itinerary to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packing List Modal */}
      {showPackingList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Luggage className="w-6 h-6 text-sky-500" />
                Packing List
              </h3>
              <button onClick={() => setShowPackingList(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {packingListItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-sky-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group">
                  <CheckSquare className="w-5 h-5 text-slate-300 group-hover:text-sky-500 dark:group-hover:text-indigo-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setShowPackingList(false)} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-500 active:scale-95 transition-all">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Travel Hub</h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-1">
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </p>
        </div>
      </div>

      {/* All Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip, index) => (
          <div 
            key={trip.id}
            className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={trip.imageUrl} 
                alt={trip.destination} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md ${
                  trip.status === 'completed' ? 'bg-emerald-500/80 text-white' :
                  (trip.status === 'upcoming' || trip.status === 'planning') ? 'bg-sky-500/80 text-white' :
                  'bg-amber-500/80 text-white'
                }`}>
                  {trip.status}
                </span>
              </div>
              <div className="absolute bottom-4 left-4">
                <h3 className="text-2xl font-bold text-white tracking-tight">{trip.destination}</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{trip.dates}</span>
              </div>

              {trip.total_expenses > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Expenses</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${trip.total_expenses.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => fetchTripDetails(trip.id)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button 
                  onClick={() => openExportModal(trip.id)}
                  disabled={isExporting}
                  className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export
                </button>
                <button 
                  onClick={() => handleDeleteClick(trip.id)} // 🆕 更改这里调用自定义弹窗
                  className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trip Hero Card (First Trip) */}
      {upcomingTrip && (
        <div className="relative h-80 rounded-[2.5rem] overflow-hidden isolate group shadow-2xl border border-transparent hover:border-sky-500/30 transition-all duration-500 hover:scale-[1.01]">
          <img 
            src={upcomingTrip.imageUrl} 
            alt={upcomingTrip.destination} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white mb-4 uppercase tracking-wider">
              <Plane className="w-3.5 h-3.5" />
              Next Adventure
            </div>
            <h3 className="text-5xl font-bold text-white mb-4 tracking-tighter">{upcomingTrip.destination}</h3>
            <div className="flex items-center gap-4 text-slate-200">
              <div className="flex items-center gap-2.5 text-sm font-medium bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                <Calendar className="w-4 h-4 text-sky-400" />
                {upcomingTrip.dates}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Section */}
      {upcomingTrip && markers.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-slate-800 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-sky-600 dark:text-indigo-400" />
            </div>
            Trip Map
          </h3>
          <TripMap />
        </div>
      )}

      {/* 🆕 Google Link Dialog for export gating */}
      <GoogleLinkDialog
        isOpen={showLinkDialog}
        onClose={handleCancelLink}
        onGoToSettings={handleGoToSettings}
        featureName={pendingFeature}
      />
    </div>
  );
};

export default TravelView;