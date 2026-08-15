import { motion } from 'framer-motion';
import HeroSection from './marketing/HeroSection';
import MagicMoment from './marketing/MagicMoment';
import ModeChoice from './marketing/ModeChoice';
import FeatureShowcase from './marketing/FeatureShowcase';
import SocialProof from './marketing/SocialProof';
import PerfectFor from './marketing/PerfectFor';
import FinalCTA from './marketing/FinalCTA';
import WarmFooter from './marketing/WarmFooter';

const MarketingLanding = ({ onStartOffline, onStartOnline }) => {
  return (
    <div className="min-h-screen warm-bg-cream">
      {/* Main content */}
      <div className="relative z-20">
        <HeroSection 
          onStartOffline={onStartOffline}
          onStartOnline={onStartOnline}
        />
        
        <MagicMoment />
        
        <ModeChoice 
          onStartOffline={onStartOffline}
          onStartOnline={onStartOnline}
        />
        
        <FeatureShowcase />
        
        <SocialProof />
        
        <PerfectFor />
        
        <FinalCTA 
          onStartOffline={onStartOffline}
          onStartOnline={onStartOnline}
        />
        
        <WarmFooter />
      </div>
    </div>
  );
};

export default MarketingLanding;
