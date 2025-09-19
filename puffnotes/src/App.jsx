// src/App.jsx
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import OfflineApp from './components/OfflineApp';
import OnlineApp from './components/OnlineApp';
import LandingPage from './components/LandingPage';
import OnlineSetupModal from './components/OnlineSetupModal';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOut } from './lib/firebase';
import { findOrCreatePuffnotesFolder } from './lib/googleDrive';

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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setAccessToken(null);
        setFolderId(null);
        if (mode === 'online') {
            setMode('landing');
        }
      }
    });
    return () => unsubscribe();
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
    try {
      const { user, accessToken } = await signInWithGoogle();
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
      await signOut();
      setShowSetupModal(false);
      setIsOnlineLoading(false);
    }
  };
  
  const handleSignOut = async () => {
      try {
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
            user={user} 
            accessToken={accessToken} 
            folderId={folderId} 
            onSignOut={handleSignOut}
            // --- THE FIX: Pass the function here ---
            onGoToLanding={handleGoToLanding} 
          />
        ) : null;
      case 'offline':
        return <OfflineApp onGoToLanding={handleGoToLanding} />;
      case 'landing':
      default:
        return (
          <LandingPage
            onStartOffline={handleStartOffline}
            onStartOnline={handleStartOnline}
            isOnlineLoading={isOnlineLoading}
          />
        );
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSetupModal && <OnlineSetupModal steps={setupSteps} />}
      </AnimatePresence>
      {renderContent()}
    </>
  );
}