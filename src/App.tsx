import React, { useState } from 'react';
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

// استيراد شاشة اختيار الدور التي أنشأناها سابقاً
import RoleSelection from './RoleSelection';
import { auth } from './firebaseConfig';

const AppContent: React.FC = () => {
  const { currentRole, setRole } = useApp(); // افترضنا أن setRole موجودة لتحديث الدور، أو سنعدلها حسب الكونتكست
  const [activeTab, setActiveTab] = useState('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  // إذا لم يحدد المستخدم دوره بعد، نعرض له شاشة اختيار الدور
  if (!currentRole) {
    const currentUser = auth.currentUser;
    return (
      <RoleSelection 
        user={currentUser} 
        onComplete={(role: string) => {
          // إذا كانت دالة تحديث الدور متوفرة في الكونتكست، نقوم بتحديثها
          if (setRole) setRole(role);
          window.location.reload(); // إعادة تحميل خفيفة لضمان تحديث الواجهة
        }} 
      />
    );
  }

  // Render Passenger Tabs
  const renderPassengerView = () => {
    switch (activeTab) {
      case 'home':
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
      {/* Global Application Header */}
      <Header onOpenSOS={() => setIsSOSOpen(true)} />

      {/* Main View Area */}
      <main className="flex-1">
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
