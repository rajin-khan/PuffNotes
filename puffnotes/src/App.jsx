// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import OfflineApp from './components/OfflineApp';
import OnlineApp from './components/OnlineApp';
import LandingPage from './components/LandingPage';
import MarketingLanding from './components/MarketingLanding';
import OnlineSetupModal from './components/OnlineSetupModal';
import PageMetadata from './components/PageMetadata';
import { findOrCreatePuffnotesFolder } from './lib/googleDrive';
import { getStoredTheme } from './lib/themeManager';

export default function App() {
  const [mode, setMode] = useState('landing');
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [isOnlineLoading, setIsOnlineLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupSteps, setSetupSteps] = useState([
    { label: 'Authenticating...', status: 'loading' },
    { label: 'Accessing Google Drive...', status: 'loading' },
    { label: 'Finding puffnotes folder...', status: 'loading' },
  ]);

  useEffect(() => {
    if (mode !== 'online') return undefined;

    let isActive = true;
    let unsubscribe;
    import('./lib/firebase').then(({ subscribeToAuthChanges }) => {
      if (!isActive) return;
      unsubscribe = subscribeToAuthChanges((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
          setAccessToken(null);
          setFolderId(null);
          setMode('landing');
        }
      });
    }).catch((error) => {
      console.error('Firebase initialization failed:', error);
    });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [mode]);

  const handleStartOffline = () => {
    setMode('offline');
  };

  const handleStartOnline = async () => {
    setIsOnlineLoading(true);
    setShowSetupModal(true);
    setSetupSteps([
        { label: 'Authenticating...', status: 'loading' },
        { label: 'Accessing Google Drive...', status: 'loading' },
        { label: 'Finding puffnotes folder...', status: 'loading' },
    ]);
    let firebaseClient;
    try {
      firebaseClient = await import('./lib/firebase');
      const { user, accessToken } = await firebaseClient.signInWithGoogle();
      if (!user || !accessToken) {
        setShowSetupModal(false);
        setIsOnlineLoading(false);
        return;
      }
      setSetupSteps(prev => {
        const newSteps = [...prev];
        newSteps[0].status = 'complete';
        return newSteps;
      });
      setUser(user);
      setAccessToken(accessToken);
      setSetupSteps(prev => {
          const newSteps = [...prev];
          newSteps[1].status = 'complete';
          return newSteps;
      });
      const driveFolderId = await findOrCreatePuffnotesFolder(accessToken);
      setFolderId(driveFolderId);
      setSetupSteps(prev => {
        const newSteps = [...prev];
        newSteps[2].status = 'complete';
        return newSteps;
      });
      setTimeout(() => {
        setShowSetupModal(false);
        setMode('online');
        setIsOnlineLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Online setup failed:", error);
      alert(`Error during setup: ${error.message}`);
      await firebaseClient?.signOut();
      setUser(null);
      setAccessToken(null);
      setFolderId(null);
      setShowSetupModal(false);
      setIsOnlineLoading(false);
    }
  };
  
  const handleSignOut = async () => {
      try {
          const { signOut } = await import('./lib/firebase');
          await signOut();
      } catch (error) {
          console.error("Sign out error", error);
      }
  };

  const handleGoToLanding = () => {
    setMode('landing');
  };

  const renderContent = () => {
    switch (mode) {
      case 'online':
        return user && accessToken && folderId ? (
          <OnlineApp 
            key="online"
            user={user} 
            accessToken={accessToken} 
            folderId={folderId} 
            onSignOut={handleSignOut}
            // --- THE FIX: Pass the function here ---
            onGoToLanding={handleGoToLanding} 
          />
        ) : null;
      case 'offline':
        return <OfflineApp key="offline" onGoToLanding={handleGoToLanding} />;
      case 'landing':
      default:
        return (
          <LandingPage
            key="landing"
            onStartOffline={handleStartOffline}
            onStartOnline={handleStartOnline}
            isOnlineLoading={isOnlineLoading}
          />
        );
    }
  };

  return (
    <Router>
      <PageMetadata />
      <AnimatePresence>
        {showSetupModal && (
          <OnlineSetupModal
            steps={setupSteps}
            theme={getStoredTheme()}
          />
        )}
      </AnimatePresence>
      
      <Routes>
        <Route path="/welcome" element={
          <MarketingLanding 
            onStartOffline={handleStartOffline}
            onStartOnline={handleStartOnline}
          />
        } />
        <Route path="/" element={
          <AnimatePresence mode="sync" initial={false}>
            {renderContent()}
          </AnimatePresence>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
