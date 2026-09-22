import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/shared/Header';
import { BottomNav } from './components/shared/BottomNav';
import { SOSModal } from './components/shared/SOSModal';
import { LegalModal } from './components/legal/LegalModal';
import { WelcomeScreen } from './components/landing/WelcomeScreen';
import { AuthModal } from './components/auth/AuthModal';

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
import { DriverPendingApprovalView } from './pages/driver/DriverPendingApprovalView';

// Admin Views
import { AdminPanel } from './pages/admin/AdminPanel';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBqJIpB6lQZNXKY_N6ptrBVV5_R84FpRWM';

const AppContent: React.FC = () => {
  const { currentRole, currentUser, activeDriver } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Legal content (Privacy, Terms) - Directly accessible for Google Cloud verification
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'gcp-guide'>('privacy');

  // Check URL parameters on mount (Google Cloud Verification links support ?page=privacy & ?page=terms)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page === 'privacy' || page === 'terms' || page === 'gcp-guide') {
      setLegalTab(page as any);
      setIsLegalOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenLegal = (e: any) => {
      setLegalTab(e?.detail?.tab || 'privacy');
      setIsLegalOpen(true);
    };
    window.addEventListener('open-legal', handleOpenLegal);
    return () => {
      window.removeEventListener('open-legal', handleOpenLegal);
    };
  }, []);

  // Reset tab when switching roles
  useEffect(() => {
    setActiveTab('home');
  }, [currentRole]);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Render Passenger / Client Tabs
  const renderPassengerView = () => {
    switch (activeTab) {
      case 'home':
      case 'map':
        return <PassengerHome />;
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
    // Strictly block access if driver status is not approved by the owner
    if (!activeDriver || activeDriver.status !== 'approved') {
      return <DriverPendingApprovalView />;
    }

    switch (activeTab) {
      case 'home':
      case 'requests':
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

  // Initial Welcome Screen (Mandatory Login)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col items-center selection:bg-amber-500 selection:text-slate-950 w-full overflow-x-hidden" dir="rtl">
        <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-950 shadow-2xl relative border-x border-slate-900/60">
          <WelcomeScreen
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onContinueAsGuest={() => setIsAuthModalOpen(true)}
            onOpenLegal={(tab) => {
              setLegalTab(tab);
              setIsLegalOpen(true);
            }}
          />

          {/* Sign-In / Account Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              setIsAuthModalOpen(false);
            }}
          />

          {/* Legal Modal (Privacy Policy & Terms of Service) */}
          <LegalModal
            isOpen={isLegalOpen}
            onClose={() => setIsLegalOpen(false)}
            defaultTab={legalTab}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col items-center selection:bg-amber-500 selection:text-slate-950 w-full overflow-x-hidden" dir="rtl">
      {/* Tier 2 Quota Banner */}
      {quotaExceeded && (
        <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
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

      {/* Main Responsive Mobile Frame */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-950 shadow-2xl relative border-x border-slate-900/60 pb-20">
        {/* Global Application Header */}
        <Header onOpenSOS={() => setIsSOSOpen(true)} />

        {/* Main View Area */}
        <main className="flex-1 w-full">
          {(currentRole === 'passenger' || currentRole === 'client') && renderPassengerView()}
          {currentRole === 'driver' && renderDriverView()}
          {currentRole === 'admin' && <AdminPanel />}
        </main>

        {/* Bottom Navigation for Mobile / Handheld View */}
        {currentRole !== 'admin' && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onTabChange={setActiveTab}
          />
        )}

        {/* Algerian Emergency SOS Modal */}
        {isSOSOpen && <SOSModal onClose={() => setIsSOSOpen(false)} />}

        {/* Legal, Privacy Policy & Terms Modal */}
        <LegalModal
          isOpen={isLegalOpen}
          onClose={() => setIsLegalOpen(false)}
          defaultTab={legalTab}
        />
      </div>
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
      onError={(err) => {
        console.warn('Google Maps API notice:', err);
      }}
    >
      <AppProvider>
        <AppContent />
      </AppProvider>
    </APIProvider>
  );
}
