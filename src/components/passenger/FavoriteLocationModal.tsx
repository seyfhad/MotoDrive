import React, { useState, useEffect, useMemo } from 'react';
import { Coordinates } from '../../types';
import { LeafletMap } from '../Map/LeafletMap';
import {
  searchAlgeriaPlaces,
  reverseGeocodeCoords,
  getRobustUserLocation,
  findNearestAlgerianWilaya,
  findNearestLocalLocation,
} from '../../utils/geo';
import {
  X,
  Home,
  Briefcase,
  Search,
  MapPin,
  Navigation,
  Check,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface FavoriteLocationModalProps {
  isOpen: boolean;
  type: 'home' | 'work';
  initialLocation?: Coordinates | null;
  defaultCenter?: Coordinates | null;
  onClose: () => void;
  onSave: (type: 'home' | 'work', location: Coordinates | null) => Promise<void>;
}

export const FavoriteLocationModal: React.FC<FavoriteLocationModalProps> = ({
  isOpen,
  type,
  initialLocation,
  defaultCenter,
  onClose,
  onSave,
}) => {
  const isHome = type === 'home';
  const titleLabel = isHome ? 'عنوان المنزل' : 'عنوان العمل';
  const defaultPoint: Coordinates = useMemo(
    () =>
      initialLocation ||
      defaultCenter || {
        lat: 36.1652,
        lng: 1.3345,
        name: 'ساحة التضامن - وسط مدينة الشلف',
        address: 'وسط مدينة الشلف، الجزائر',
      },
    [initialLocation, defaultCenter]
  );

  const [selectedCoords, setSelectedCoords] = useState<Coordinates>(defaultPoint);
  const [customAddressText, setCustomAddressText] = useState<string>(
    initialLocation?.name || initialLocation?.address || ''
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<
    { name: string; wilaya: string; coords: Coordinates }[]
  >([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [isGeocodingMap, setIsGeocodingMap] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const startCoords = initialLocation || defaultPoint;
      setSelectedCoords(startCoords);
      setCustomAddressText(
        initialLocation?.name || initialLocation?.address || startCoords.name || ''
      );
      setSearchQuery('');
    }
  }, [isOpen, initialLocation, defaultPoint]);

  const currentWilaya = useMemo(() => {
    const nearest = findNearestAlgerianWilaya(selectedCoords.lat, selectedCoords.lng);
    return nearest?.name || 'الشلف';
  }, [selectedCoords.lat, selectedCoords.lng]);

  // Real-time place search across Algerian cities, streets & landmarks
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const trimmed = searchQuery.trim();

    if (trimmed.length >= 2) {
      setIsSearching(true);
    }

    searchAlgeriaPlaces(trimmed, trimmed ? 'الكل' : currentWilaya).then((results) => {
      if (!cancelled) {
        setSearchResults(results.slice(0, 12));
        setIsSearching(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, currentWilaya, isOpen]);

  if (!isOpen) return null;

  const handleMapClick = async (coords: Coordinates) => {
    setIsGeocodingMap(true);
    setSelectedCoords({
      lat: coords.lat,
      lng: coords.lng,
      name: 'جاري تحديد اسم الشارع...',
      address: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
    });

    try {
      const address = await reverseGeocodeCoords(coords.lat, coords.lng);
      const nearest = findNearestLocalLocation(coords.lat, coords.lng);
      const resolvedName =
        address ||
        (nearest ? `${nearest.item.name} (${nearest.item.wilaya})` : 'موقع محدد على الخريطة');

      const updated: Coordinates = {
        lat: coords.lat,
        lng: coords.lng,
        name: resolvedName,
        address: resolvedName,
      };
      setSelectedCoords(updated);
      setCustomAddressText(resolvedName);
    } catch {
      const fallback = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
      setSelectedCoords({
        lat: coords.lat,
        lng: coords.lng,
        name: fallback,
        address: fallback,
      });
      setCustomAddressText(fallback);
    } finally {
      setIsGeocodingMap(false);
    }
  };

  const handleUseCurrentGps = async () => {
    setIsLocatingGps(true);
    try {
      const res = await getRobustUserLocation();
      setSelectedCoords(res.coords);
      setCustomAddressText(res.coords.name || res.coords.address || 'موقعي الحالي');
    } catch {
      // Ignore error
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleSelectSearchResult = (item: {
    name: string;
    wilaya: string;
    coords: Coordinates;
  }) => {
    const fullLabel = item.name.includes(item.wilaya)
      ? item.name
      : `${item.name} (${item.wilaya})`;
    const nextCoords: Coordinates = {
      lat: item.coords.lat,
      lng: item.coords.lng,
      name: fullLabel,
      address: item.coords.address || fullLabel,
    };
    setSelectedCoords(nextCoords);
    setCustomAddressText(fullLabel);
    setSearchQuery('');
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const cleanLabel =
        customAddressText.trim() ||
        selectedCoords.name ||
        selectedCoords.address ||
        (isHome ? 'المنزل' : 'العمل');

      const finalLocation: Coordinates = {
        lat: Number(selectedCoords.lat),
        lng: Number(selectedCoords.lng),
        name: cleanLabel,
        address: selectedCoords.address || cleanLabel,
      };

      await onSave(type, finalLocation);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async () => {
    setIsSaving(true);
    try {
      await onSave(type, null);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-right text-slate-100">
        {/* Top Accent Line */}
        <div
          className={`h-1.5 w-full ${
            isHome
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600'
              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600'
          }`}
        />

        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isHome
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isHome ? <Home className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-white">تعديل وحفظ {titleLabel}</h3>
              <p className="text-[11px] text-slate-400">
                ابحث عن العنوان أو انقر مباشرة على الخريطة لتحديده بدقة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Search Input & GPS Quick Button */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`ابحث عن حي، شارع، أو بلدية لـ${titleLabel}...`}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl pr-9 pl-8 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleUseCurrentGps}
                disabled={isLocatingGps}
                className="px-3 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                title="تحديد موقعي الحالي عبر GPS"
              >
                {isLocatingGps ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>موقعي</span>
              </button>
            </div>

            {/* Search Suggestions Dropdown List */}
            {searchQuery.trim().length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-800/60 shadow-xl">
                {isSearching ? (
                  <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>جاري البحث عن الأماكن...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    لا توجد نتائج مطابقة، يمكنك النقر مباشرة على الخريطة بالأسفل.
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full p-2.5 hover:bg-slate-900 flex items-center justify-between text-right transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        {item.wilaya}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Interactive Map Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>أو انقر على الخريطة لتحديد الموقع بدقة:</span>
              </span>
              {isGeocodingMap && (
                <span className="text-amber-400 flex items-center gap-1 text-[10px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  جاري جلب العنوان...
                </span>
              )}
            </div>

            <div className="h-52 w-full rounded-2xl overflow-hidden border border-slate-800 relative">
              <LeafletMap
                center={[selectedCoords.lat, selectedCoords.lng]}
                zoom={15}
                destination={selectedCoords}
                interactive={true}
                onMapClick={handleMapClick}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Editable Address Name / Label */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2">
            <label className="block text-[11px] font-bold text-amber-400">
              العنوان المحفوظ ({isHome ? 'المنزل' : 'العمل'}):
            </label>
            <input
              type="text"
              value={customAddressText}
              onChange={(e) => setCustomAddressText(e.target.value)}
              placeholder={
                isHome ? 'مثال: حي السلام، الشلف (المنزل)' : 'مثال: المنطقة الصناعية، الشلف (العمل)'
              }
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none"
            />
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
              <span>
                الإحداثيات: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
              </span>
              <span className="text-emerald-400 font-semibold">يُحفظ تلقائياً في حسابك</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2">
          {initialLocation && (
            <button
              type="button"
              onClick={handleDeleteSaved}
              disabled={isSaving}
              className="px-3.5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="حذف العنوان المحفوظ"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirmSave}
            disabled={isSaving}
            className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98] ${
              isHome
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>حفظ {titleLabel} بشكل دائم</span>
          </button>
        </div>
      </div>
    </div>
  );
};
