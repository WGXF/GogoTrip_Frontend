
import React, { useState, useEffect } from 'react';
import { MOCK_TRIPS, UPCOMING_APPOINTMENTS } from '../../constants';
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Hotel, 
  Luggage, 
  CloudSun, 
  ArrowRight,
  Star,
  Plus,
  Navigation,
  X,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Locate
} from 'lucide-react';

const TravelView: React.FC = () => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  const [newTripData, setNewTripData] = useState({ destination: '', dates: '' });
  
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const upcomingTrip = MOCK_TRIPS[0];

  useEffect(() => {
    // Attempt to get location on mount
    handleLocateMe();
  }, []);

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

  const markers = [
    {
      id: 'hotel-1',
      type: 'hotel',
      title: upcomingTrip.hotel?.name || 'Luxury Hotel',
      subtitle: upcomingTrip.hotel?.address || 'Kyoto',
      rating: upcomingTrip.hotel?.rating || 5,
      top: '40%',
      left: '45%',
      icon: Hotel,
      color: 'emerald', // tailwind color name
      description: "Experience luxury living in the heart of Kyoto. Featuring traditional tea ceremonies, zen gardens, and Michelin-starred dining options directly within the resort.",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
      tags: ['Luxury', 'Spa', 'River View']
    },
    {
      id: 'activity-1',
      type: 'activity',
      title: 'Kichi Kichi Omurice',
      subtitle: 'Reservation: 7:00 PM',
      rating: 4.8,
      top: '30%',
      left: '60%',
      icon: MapPin,
      color: 'amber',
      description: "The viral sensation of Kyoto. Watch Chef Motokichi prepare his famous fluffy omurice with a theatrical performance that's as delightful as the food itself.",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
      tags: ['Dining', 'Must-Visit', 'Casual']
    }
  ];

  const packingListItems = [
    "Passport & Visa", "Travel Insurance", "Universal Adapter", "Light Jacket (Evening)", 
    "Comfortable Walking Shoes", "Portable Charger", "Japanese Yen (Cash)", "Toiletries", 
    "Camera", "Prescription Meds"
  ];

  const activeMarker = markers.find(m => m.id === activeMarkerId);

  const handlePlanClick = () => {
    setShowPlanModal(true);
  };

  const handleInitialSave = () => {
    setShowPlanModal(false);
    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    setShowConfirmModal(false);
    // Logic to save trip would go here
    setNewTripData({ destination: '', dates: '' });
  };

  // Mock Map Component
  const TripMap = () => {
    // Default to Kyoto if no user location
    const defaultLat = 35.0116;
    const defaultLng = 135.7681;
    
    const displayLat = userLocation ? userLocation.lat : defaultLat;
    const displayLng = userLocation ? userLocation.lng : defaultLng;
    
    return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 hover:border-sky-400 dark:hover:border-indigo-400 rounded-[2rem] p-1.5 shadow-sm relative group overflow-hidden isolate h-[450px] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
      
      {/* Detail Overlay Modal */}
      {activeMarker && (
        <div className="absolute inset-2 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[1.7rem] overflow-hidden shadow-2xl animate-scale-in origin-center transition-all duration-300 isolate">
            <div className="h-full flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="w-full md:w-5/12 h-48 md:h-full relative shrink-0">
                      <img src={activeMarker.image} alt={activeMarker.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMarkerId(null); }}
                        className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md hover:bg-black/40 text-white rounded-full transition-colors md:hidden"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-4 left-4 md:hidden">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 bg-white/90 text-slate-900`}>
                              {activeMarker.type}
                        </span>
                        <h3 className="text-xl font-bold text-white">{activeMarker.title}</h3>
                      </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col relative overflow-y-auto custom-scrollbar">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMarkerId(null); }}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors hidden md:block hover:rotate-90 duration-300"
                      >
                        <X className="w-5 h-5" />
                      </button>

                    <div className="hidden md:block mb-1">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3 ${
                              activeMarker.color === 'emerald' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          }`}>
                              {activeMarker.type}
                          </span>
                    </div>
                    
                    <h3 className="hidden md:block text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{activeMarker.title}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">{activeMarker.subtitle}</p>

                    <div className="flex items-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < (Math.floor(activeMarker.rating || 0)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                        ))}
                        <span className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">{activeMarker.rating}</span>
                        <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-sm text-sky-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">128 Reviews</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-sm">
                        {activeMarker.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-auto">
                        {activeMarker.tags?.map(tag => (
                            <span key={tag} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button 
                            onClick={() => window.open('https://maps.google.com', '_blank')}
                            className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-xl"
                        >
                            <Navigation className="w-4 h-4" />
                            Get Directions
                        </button>
                        <button 
                            onClick={() => window.open('https://example.com', '_blank')}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hover:-translate-y-1 hover:shadow-md"
                        >
                            Website
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="absolute top-5 right-5 z-20 flex gap-2">
        <button 
            onClick={() => alert("Navigation mode started.")}
            className="p-2.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-xl shadow-lg shadow-black/5 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 hover:border-sky-300 dark:hover:border-indigo-500 hover:-translate-y-1 hover:shadow-xl"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Google Maps Iframe */}
      <div className="w-full h-full relative bg-slate-100 dark:bg-slate-800 rounded-[1.7rem] overflow-hidden">
        <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }} 
            src={`https://maps.google.com/maps?q=${displayLat},${displayLng}&z=14&output=embed`}
            allowFullScreen
            className="grayscale-[20%] hover:grayscale-0 transition-all duration-700"
        ></iframe>
        
        {/* Only show markers if using default mock location, otherwise hide them to avoid overlay issues on dynamic map */}
        {!userLocation && !activeMarker && markers.map((marker) => {
            const Icon = marker.icon;
            const isHotel = marker.type === 'hotel';
            const colorClass = isHotel ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-amber-500 shadow-amber-500/40';
            
            return (
              <button 
                key={marker.id}
                onClick={() => setActiveMarkerId(marker.id)}
                className="absolute group/marker cursor-pointer focus:outline-none"
                style={{ top: marker.top, left: marker.left }}
              >
                <div className="relative">
                  <div className={`w-10 h-10 ${colorClass} text-white rounded-full flex items-center justify-center shadow-xl transform group-hover/marker:-translate-y-3 group-hover/marker:scale-125 transition-all duration-300 ease-spring border-4 border-white dark:border-slate-800 z-10 relative`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-black/20 blur-sm rounded-full group-hover/marker:scale-75 transition-transform duration-300"></div>
                </div>
                
                {/* Hover Tooltip (Only visible when NOT active) */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700 p-3 opacity-0 group-hover/marker:opacity-100 translate-y-4 group-hover/marker:translate-y-0 transition-all duration-300 ease-apple pointer-events-none z-30">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate text-center">{marker.title}</p>
                  <p className="text-[10px] text-sky-600 dark:text-indigo-400 text-center font-bold mt-1">Click for details</p>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200/50 dark:border-slate-700 rotate-45 transform"></div>
                </div>
              </button>
            );
        })}
      </div>
    </div>
  )};

  return (
    <div className="p-6 md:p-8 w-full mx-auto space-y-10 animate-fade-in-up relative">
      
      {/* Packing List Modal */}
      {showPackingList && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Luggage className="w-6 h-6 text-sky-500" />
                  Packing List
                </h3>
                <button onClick={() => setShowPackingList(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors hover:scale-105">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-500 mb-6 text-sm">Suggested items for Kyoto in Autumn based on 18°C weather.</p>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                 {packingListItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-sky-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group">
                       <div className="text-slate-300 group-hover:text-sky-500 dark:group-hover:text-indigo-400">
                          <CheckSquare className="w-5 h-5" />
                       </div>
                       <span className="font-medium text-slate-700 dark:text-slate-300">{item}</span>
                    </div>
                 ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                 <button onClick={() => setShowPackingList(false)} className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-600/20 hover:bg-sky-500 active:scale-95 transition-all">
                    Done
                 </button>
              </div>
           </div>
         </div>
      )}

      {/* Plan New Trip Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Plan New Adventure</h3>
                <button onClick={() => setShowPlanModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors hover:scale-105 hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</label>
                 <div className="relative group">
                   <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="e.g. Paris, France"
                      value={newTripData.destination}
                      onChange={(e) => setNewTripData({...newTripData, destination: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-indigo-500 transition-all hover:border-sky-300 dark:hover:border-indigo-500/50 hover:shadow-md"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Travel Dates</label>
                 <div className="relative group">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                   <input 
                      type="text" 
                      placeholder="e.g. Oct 15 - Oct 22"
                      value={newTripData.dates}
                      onChange={(e) => setNewTripData({...newTripData, dates: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:focus:border-indigo-500 transition-all hover:border-sky-300 dark:hover:border-indigo-500/50 hover:shadow-md"
                   />
                 </div>
               </div>

               <div className="pt-4">
                 <button 
                    onClick={handleInitialSave}
                    disabled={!newTripData.destination || !newTripData.dates}
                    className="w-full py-4 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-sky-600/30 dark:shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-transparent hover:border-sky-300 hover:-translate-y-1 hover:shadow-xl"
                 >
                    Continue to Confirmation
                    <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-white/20 dark:border-slate-700 text-center animate-scale-in hover:shadow-2xl transition-shadow">
              <div className="w-16 h-16 bg-sky-100 dark:bg-indigo-900/30 text-sky-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Confirm New Trip?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                You are about to create a new trip to <span className="text-slate-900 dark:text-white font-bold">{newTripData.destination}</span>. 
                This will add a new entry to your travel scheduler.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalConfirm}
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-600/20 dark:shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 border border-transparent hover:border-sky-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Save
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Travel Hub</h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-1">Manage your trips, itineraries, and bookings.</p>
        </div>
        <button 
          onClick={handlePlanClick}
          className="px-6 py-3 bg-sky-600 dark:bg-indigo-600 text-white rounded-2xl text-sm font-semibold hover:bg-sky-500 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-sky-600/30 dark:shadow-indigo-600/30 flex items-center gap-2 active:scale-95 border border-transparent hover:border-sky-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Plan New Trip
        </button>
      </div>

      {/* Trip Hero Card */}
      <div className="relative h-80 rounded-[2.5rem] overflow-hidden isolate group shadow-2xl shadow-slate-200 dark:shadow-black/50 border border-transparent hover:border-sky-500/30 transition-all duration-500 hover:scale-[1.01] hover:shadow-sky-900/10">
        <img 
          src={upcomingTrip.imageUrl} 
          alt={upcomingTrip.destination} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-apple group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <div className="flex justify-between items-end">
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-bold text-white mb-4 shadow-lg uppercase tracking-wider">
                <Plane className="w-3.5 h-3.5" />
                Upcoming Trip
              </div>
              <h3 className="text-5xl font-bold text-white mb-4 tracking-tighter shadow-sm">{upcomingTrip.destination}</h3>
              <div className="flex items-center gap-4 text-slate-200">
                <div className="flex items-center gap-2.5 text-sm font-medium bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-black/50 transition-all hover:scale-105">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  {upcomingTrip.dates}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 hover:border-white/30 hover:bg-black/50 transition-all hover:scale-105">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  {upcomingTrip.weather}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Logistics & Details */}
        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
           <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-slate-800 flex items-center justify-center">
                <Luggage className="w-5 h-5 text-sky-600 dark:text-indigo-400" />
             </div>
             Travel Logistics
           </h3>

          {/* Flight Card */}
          {upcomingTrip.flight && (
            <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 hover:border-sky-400 dark:hover:border-indigo-400/80 rounded-[2rem] p-7 relative overflow-hidden isolate group hover:bg-white dark:hover:bg-slate-800/60 transition-all duration-300 ease-out shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01]">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                    <Plane className="w-6 h-6 text-sky-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Flight</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{upcomingTrip.flight.airline}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-1.5">{upcomingTrip.flight.code}</span>
              </div>
              
              <div className="flex justify-between items-center mb-8 px-2">
                <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{upcomingTrip.flight.origin}</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{upcomingTrip.flight.departureTime}</p>
                </div>
                <div className="flex flex-col items-center px-4 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">6h 15m</p>
                  <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-700 relative flex items-center justify-center">
                    <div className="absolute w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 left-0"></div>
                    <Plane className="w-4 h-4 text-slate-400 absolute rotate-90" />
                    <div className="absolute w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 right-0"></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{upcomingTrip.flight.destination}</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{upcomingTrip.flight.arrivalTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gate</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{upcomingTrip.flight.gate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seat</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{upcomingTrip.flight.seat}</p>
                </div>
              </div>
            </div>
          )}

          {/* Hotel Card */}
          {upcomingTrip.hotel && (
            <div className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 hover:border-emerald-400 dark:hover:border-emerald-400/80 rounded-[2rem] p-7 relative overflow-hidden isolate group hover:bg-white dark:hover:bg-slate-800/60 transition-all duration-300 ease-out shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01]">
               <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg">
                    <Hotel className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Accommodation</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{upcomingTrip.hotel.name}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 bg-amber-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                  {[...Array(upcomingTrip.hotel.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-base font-medium text-slate-600 dark:text-slate-300 leading-relaxed">{upcomingTrip.hotel.address}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Check-in</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{upcomingTrip.hotel.checkIn}</p>
                  </div>
                  <button 
                    onClick={() => window.open('https://maps.google.com', '_blank')}
                    className="text-xs font-bold bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-white px-4 py-2.5 rounded-xl transition-all border border-slate-200 dark:border-transparent shadow-sm hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Map & AI */}
        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-slate-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-sky-600 dark:text-indigo-400" />
                </div>
                Trip Map
             </h3>
             <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{markers.length} Locations</span>
          </div>

          {/* Interactive Map Component */}
          <TripMap />

          {/* AI Suggestion Box */}
          <div 
            onClick={() => setShowPackingList(true)}
            className="bg-gradient-to-br from-sky-500 to-blue-600 dark:from-indigo-600 dark:to-violet-900 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-sky-500/20 dark:shadow-indigo-500/30 group cursor-pointer transition-all duration-300 ease-out border border-transparent hover:border-white/30 hover:scale-[1.03] hover:-translate-y-1 hover:shadow-sky-500/40"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                 <Luggage className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Travel Tips</h3>
            </div>
            
            <p className="text-lg text-white font-medium mb-8 leading-relaxed relative z-10">
              "Kyoto in October can be chilly in the evenings. I've prepared a packing list including light layers."
            </p>
            
            <button className="w-full py-4 bg-white/95 dark:bg-white/10 dark:backdrop-blur-md dark:border dark:border-white/20 hover:bg-white text-sky-700 dark:text-white text-sm font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group-hover:shadow-xl border border-transparent hover:border-sky-100 hover:scale-[1.02]">
              View Packing List
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TravelView;
