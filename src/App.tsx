import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/shared/Header';
import { BottomNav } from './components/shared/BottomNav';
import { SOSModal } from './components/shared/SOSModal';

// Passenger Views
import { PassengerHome } from './pages/passenger/PassengerHome';
import { PassengerTrips } from './pages/passenger/PassengerTrips';
import { PassengerProfile } from './pages/passenger/PassengerProfile';

// Driver Views
import { DriverHome } from './pages/driver/DriverHome';
import { DriverEarnings } from './pages/driver/DriverEarnings';
import { DriverDocumentsUpload } from './pages/driver/DriverDocumentsUpload';
import { DriverTrips } from './pages/driver/DriverTrips';
import { DriverProfile } from './pages/driver/DriverProfile';

// Admin Views
import { AdminPanel } from './pages/admin/AdminPanel';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDuDN99dHL1RK2H6pTn3oLaQM8JmQgkA4o';

const AppContent: React.FC = () => {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Render Passenger Tabs (محدث لدعم تبويب الخريطة والأزرار السفلية بالكامل)
  const renderPassengerView = () => {
    switch (activeTab) {
      case 'home':
        return <PassengerHome />;
      case 'map':
        return <PassengerHome />; // توجيه تبويب الخريطة للرئيسية أو شاشة الخريطة المخصصة
      case 'trips':
        return <PassengerTrips />;
      case 'profile':
        return <PassengerProfile />;
      default:
        return <PassengerHome />;
    }
  };

  // Render Driver Tabs
  const renderDriverView = () => {
    switch (activeTab) {
      case 'home':
        return <DriverHome />;
      case 'earnings':
        return <DriverEarnings />;
      case 'documents':
        return <DriverDocumentsUpload />;
      case 'trips':
        return <DriverTrips />;
      case 'profile':
        return <DriverProfile />;
      default:
        return <DriverHome />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      {/* Tier 2 Quota Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Global Application Header */}
      <Header onOpenSOS={() => setIsSOSOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1 pb-20">
        {currentRole === 'passenger' && renderPassengerView()}
        {currentRole === 'driver' && renderDriverView()}
        {currentRole === 'admin' && <AdminPanel />}
      </main>

      {/* Bottom Navigation for Mobile / Handheld View */}
      {currentRole !== 'admin' && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Algerian Emergency SOS Modal */}
      {isSOSOpen && <SOSModal onClose={() => setIsSOSOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['marker', 'routes', 'places', 'geometry']}
      language="ar"
      region="DZ"
    >
      <AppProvider>
        <AppContent />
      </AppProvider>
    </APIProvider>
  );
}
