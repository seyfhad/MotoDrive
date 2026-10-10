import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/shared/Header';
import { BottomNav } from './components/shared/BottomNav';
import { SOSModal } from './components/shared/SOSModal';
import { LegalModal } from './components/legal/LegalModal';
import { UserGuideModal } from './components/guide/UserGuideModal';
import { AndroidAppModal } from './components/android/AndroidAppModal';
import { ContactUsModal } from './components/support/ContactUsModal';
import { WelcomeScreen } from './components/landing/WelcomeScreen';
import { AuthModal } from './components/auth/AuthModal';
import { PushNotificationToast } from './components/shared/PushNotificationToast';

import { getRobustUserLocation } from './utils/geo';

// Passenger Views
import { PassengerHome } from './pages/passenger/PassengerHome';
import { PassengerTrips } from './pages/passenger/PassengerTrips';
import { PassengerProfile } from './pages/passenger/PassengerProfile';

// Driver Views
import { DriverHome } from './pages/driver/DriverHome';
import { DriverEarnings } from './pages/driver/DriverEarnings';
import { DriverTrips } from './pages/driver/DriverTrips';
import { DriverProfile } from './pages/driver/DriverProfile';
import { DriverPendingApprovalView } from './pages/driver/DriverPendingApprovalView';

// Admin Views
import { AdminPanel } from './pages/admin/AdminPanel';

import { signInQuickGuest } from './services/authService';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBqJIpB6lQZNXKY_N6ptrBVV5_R84FpRWM';

const AppContent: React.FC = () => {
  const { currentRole, currentUser, setCurrentUser, activeDriver, logout } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Function to retry fetching high accuracy GPS position
  const handleRetryGps = async () => {
    setIsGpsLoading(true);
    setGpsErrorMsg(null);
    try {
      const res = await getRobustUserLocation();
      if (res.isFallback) {
        setGpsErrorMsg(res.message || 'تعذر الحصول على إشارة GPS دقيقة. يرجى تفعيل "الموقع" من شريط الإشعارات للهاتف.');
      } else {
        setIsGpsModalOpen(false);
      }
    } catch (e: any) {
      setGpsErrorMsg('خطأ في الاتصال بنظام GPS. تأكد من إتاحة الإذن وتفعيل زر الموقع.');
    } finally {
      setIsGpsLoading(false);
    }
  };

  // Legal content (Privacy, Terms) - Directly accessible for Google Cloud verification
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'gcp-guide'>('privacy');

  // Check URL parameters on mount (?page=privacy & ?mode=admin support)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const mode = params.get('mode') || params.get('admin');

    if (page === 'privacy' || page === 'terms' || page === 'gcp-guide') {
      setLegalTab(page as any);
      setIsLegalOpen(true);
    }

    if (mode === 'admin' || mode === '1') {
      const savedRole = localStorage.getItem('motodrive_v3_role');
      if (savedRole === 'admin') {
        // Auto-open AdminPanel for Owner
      }
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

  // User Guide modal state & event listener
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [userGuideTab, setUserGuideTab] = useState<'passenger' | 'driver' | 'reviewer'>('passenger');

  useEffect(() => {
    const handleOpenGuide = (e: any) => {
      setUserGuideTab(e?.detail?.tab || 'passenger');
      setIsUserGuideOpen(true);
    };
    window.addEventListener('open-user-guide', handleOpenGuide);
    return () => {
      window.removeEventListener('open-user-guide', handleOpenGuide);
    };
  }, []);

  // Android Native App modal state & event listener
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAndroidModal = () => {
      setIsAndroidModalOpen(true);
    };
    window.addEventListener('open-android-modal', handleOpenAndroidModal);
    return () => {
      window.removeEventListener('open-android-modal', handleOpenAndroidModal);
    };
  }, []);

  // Contact Us & Support modal state & event listener
  const [isContactUsOpen, setIsContactUsOpen] = useState(false);

  useEffect(() => {
    const handleOpenContactUs = () => {
      setIsContactUsOpen(true);
    };
    window.addEventListener('open-contact-us', handleOpenContactUs);
    return () => {
      window.removeEventListener('open-contact-us', handleOpenContactUs);
    };
  }, []);

  // Listen to open-welcome events to reliably return to WelcomeScreen
  useEffect(() => {
    const handleOpenWelcome = async () => {
      await logout();
    };
    window.addEventListener('open-welcome', handleOpenWelcome);
    return () => {
      window.removeEventListener('open-welcome', handleOpenWelcome);
    };
  }, [logout]);

  // Request geolocation permission & check GPS status on app start
  useEffect(() => {
    getRobustUserLocation().then(res => {
      console.log('Location permission & position status acquired on startup:', res.coords);
      if (res.isFallback) {
        setIsGpsModalOpen(true);
      }
    }).catch(err => {
      console.warn('Geolocation startup notice:', err);
      setIsGpsModalOpen(true);
    });
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

  // Render Passenger Tabs
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
    // Strictly block access to ride requests / earnings if driver status is not approved by the owner
    if (activeDriver.status !== 'approved') {
      return <DriverPendingApprovalView />;
    }

    switch (activeTab) {
      case 'home':
      case 'requests':
        return <DriverHome />;
      case 'earnings':
        return <DriverEarnings />;
      case 'trips':
        return <DriverTrips />;
      case 'profile':
        return <DriverProfile />;
      default:
        return <DriverHome />;
    }
  };

  // Initial Welcome Screen (Quick guest entry or full login)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col items-center selection:bg-amber-500 selection:text-slate-950 w-full overflow-x-hidden" dir="rtl">
        <div className="w-full max-w-md min-h-screen flex flex-col bg-slate-950 shadow-2xl relative border-x border-slate-900/60">
          <WelcomeScreen
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onContinueAsGuest={async () => {
              try {
                const { user } = await signInQuickGuest('راكب MotoDrive', '0550123456', 'passenger');
                setCurrentUser(user);
              } catch (err) {
                console.error('Quick guest login error:', err);
                setIsAuthModalOpen(true);
              }
            }}
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

      {/* Main Responsive Frame (max-w-md for mobile passenger/driver, max-w-5xl for full admin management) */}
      <div className={`w-full ${currentRole === 'admin' ? 'max-w-5xl' : 'max-w-md'} min-h-screen flex flex-col bg-slate-950 shadow-2xl relative border-x border-slate-900/60 pb-20 transition-all duration-300`}>
        {/* Push Notification System Top Toast & Permission Banner */}
        <PushNotificationToast />

        {/* Global Application Header */}
        <Header onOpenSOS={() => setIsSOSOpen(true)} />

        {/* Main View Area */}
        <main className="flex-1 w-full">
          {currentRole === 'passenger' && renderPassengerView()}
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

        {/* Legal, Privacy Policy & Terms Modal (Google Cloud Verification) */}
        <LegalModal
          isOpen={isLegalOpen}
          onClose={() => setIsLegalOpen(false)}
          defaultTab={legalTab}
        />

        {/* Simplified User & Google Play Reviewers Guide Modal */}
        <UserGuideModal
          isOpen={isUserGuideOpen}
          onClose={() => setIsUserGuideOpen(false)}
          defaultTab={userGuideTab}
        />

        {/* Android Native App (WebAPK / Capacitor / Google Play Export) Modal */}
        <AndroidAppModal
          isOpen={isAndroidModalOpen}
          onClose={() => setIsAndroidModalOpen(false)}
        />

        {/* Contact Us & Technical Support Modal (0542524728 / Direct Message to Admin) */}
        <ContactUsModal
          isOpen={isContactUsOpen}
          onClose={() => setIsContactUsOpen(false)}
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
