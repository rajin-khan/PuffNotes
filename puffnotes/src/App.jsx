import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import MarketingLanding from './components/MarketingLanding';
import OnlineSetupModal from './components/OnlineSetupModal';
import PageMetadata from './components/PageMetadata';
import UnsupportedOfflineNotice from './components/UnsupportedOfflineNotice';
import { supportsOfflineMode } from './lib/deviceSupport';
import { findOrCreatePuffnotesFolder } from './lib/googleDrive';
import { getStoredTheme } from './lib/themeManager';

const OfflineApp = lazy(() => import('./components/OfflineApp'));
const OnlineApp = lazy(() => import('./components/OnlineApp'));

function LoadingScreen() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#17130f] text-[#fff8f0]"><p className="font-serif text-3xl">puffnotes</p></div>;
}

function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[#f7efe5] px-6 text-center text-[#34251c]">
      <p className="font-mono text-xs uppercase tracking-[0.18em]">404</p>
      <h1 className="text-balance font-serif text-5xl">This page wandered off.</h1>
      <a className="rounded-full bg-[#34251c] px-6 py-3 font-mono text-sm text-[#fff8f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" href="/">Return home</a>
    </main>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
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
    if (location.pathname !== '/app/online') return undefined;
    let isActive = true;
    let unsubscribe;
    import('./lib/firebase').then(({ subscribeToAuthChanges }) => {
      if (!isActive) return;
      unsubscribe = subscribeToAuthChanges((currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          return;
        }
        setUser(null);
        setAccessToken(null);
        setFolderId(null);
        navigate('/app', { replace: true });
      });
    }).catch((error) => console.error('Firebase initialization failed:', error));
    return () => { isActive = false; unsubscribe?.(); };
  }, [location.pathname, navigate]);

  const startOffline = () => navigate('/app/offline');

  const startOnline = async () => {
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
      const session = await firebaseClient.signInWithGoogle();
      if (!session.user || !session.accessToken) {
        setShowSetupModal(false);
        setIsOnlineLoading(false);
        return;
      }
      setSetupSteps((steps) => steps.map((step, index) => index === 0 ? { ...step, status: 'complete' } : step));
      setUser(session.user);
      setAccessToken(session.accessToken);
      setSetupSteps((steps) => steps.map((step, index) => index === 1 ? { ...step, status: 'complete' } : step));
      const driveFolderId = await findOrCreatePuffnotesFolder(session.accessToken);
      setFolderId(driveFolderId);
      setSetupSteps((steps) => steps.map((step, index) => index === 2 ? { ...step, status: 'complete' } : step));
      window.setTimeout(() => {
        setShowSetupModal(false);
        setIsOnlineLoading(false);
        navigate('/app/online');
      }, shouldReduceMotion ? 0 : 700);
    } catch (error) {
      console.error('Online setup failed:', error);
      alert(`Error during setup: ${error.message}`);
      await firebaseClient?.signOut();
      setUser(null);
      setAccessToken(null);
      setFolderId(null);
      setShowSetupModal(false);
      setIsOnlineLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { signOut: firebaseSignOut } = await import('./lib/firebase');
      await firebaseSignOut();
    } catch (error) {
      console.error('Sign out error', error);
    } finally {
      navigate('/app', { replace: true });
    }
  };

  return (
    <>
      <PageMetadata />
      <AnimatePresence>{showSetupModal && <OnlineSetupModal steps={setupSteps} theme={getStoredTheme()} />}</AnimatePresence>
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname} initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}>
            <Routes location={location}>
              <Route path="/" element={<MarketingLanding onOpenApp={() => navigate('/app')} />} />
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="/app" element={<LandingPage onStartOffline={startOffline} onStartOnline={startOnline} isOnlineLoading={isOnlineLoading} />} />
              <Route path="/app/offline" element={supportsOfflineMode() ? <OfflineApp onGoToLanding={() => navigate('/app')} /> : <UnsupportedOfflineNotice onBack={() => navigate('/app')} onUseOnline={startOnline} />} />
              <Route path="/app/offline/unsupported" element={<Navigate to="/app/offline" replace />} />
              <Route path="/app/online" element={user && accessToken && folderId ? <OnlineApp user={user} accessToken={accessToken} folderId={folderId} onSignOut={signOut} onGoToLanding={() => navigate('/app')} /> : <Navigate to="/app" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
