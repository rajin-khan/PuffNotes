import { motion } from 'framer-motion';
import { Wand2, Eye, Focus, FileText, Key } from 'lucide-react';
import WarmVideo from './WarmVideo';

const FeatureShowcase = () => {
  const features = [
    {
      icon: Wand2,
      title: "From chaos to clarity",
      description: "Stop fighting with formatting. Write naturally, hit the wand, and watch AI structure your thoughts without losing your voice.",
      video: "/videos/2.mp4",
      variant: "cream",
      iconColor: "text-terracotta",
      highlights: [
        "AI-structured outlines",
        "Keeps your original tone",
        "One-click polish"
      ]
    },
    {
      icon: Eye,
      title: "See what you mean",
      description: "Write in clean markdown. Toggle preview anytime. No guessing what your final note looks like.",
      video: "/videos/3.mp4",
      variant: "peach",
      iconColor: "text-amber",
      highlights: [
        "Markdown-friendly",
        "Live preview",
        "No surprises"
      ]
    },
    {
      icon: Focus,
      title: "Disappear into your thoughts",
      description: "When you need deep focus, everything else fades away. Just you, your words, and a calm space to think.",
      video: "/videos/5.mp4",
      variant: "amber",
      iconColor: "text-warm-brown",
      highlights: [
        "Distraction-free",
        "Space to Breathe",
        "Relaxing Backgrounds"
      ]
    },
    {
      icon: FileText,
      title: "Share professionally",
      description: "Export any note as a polished PDF. Perfect for sharing, printing, or archiving.",
      video: "/videos/4.mp4",
      variant: "cream",
      iconColor: "text-terracotta",
      highlights: [
        "Crisp PDF export",
        "Consistent styles",
        "Print perfect"
      ]
    },
    {
      icon: Key,
      title: "Unlimited power (literally free)",
      description: "Add your own Groq API key. No daily limits. Complete control. Still free.",
      video: "/videos/6.mp4",
      variant: "peach",
      iconColor: "text-amber",
      highlights: [
        "Bring your own key",
        "Unlimited usage",
        "Private by default"
      ]
    }
  ];

  return (
    <div className="py-32 px-6" style={{ backgroundColor: '#F5E6D3' }}>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-serif text-[#362112]/90 mb-6">Everything you need to write beautifully</h2>
          <p className="text-xl font-mono text-[#362112]/80 max-w-3xl mx-auto leading-relaxed">
            From messy thoughts to polished content. Every feature designed to make your writing process effortless and enjoyable.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="space-y-24">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`relative ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex flex-col lg:flex items-center gap-16 lg:gap-20`}
              >
                {/* Content Card */}
                <div className={`flex-1 ${isEven ? 'lg:pr-8' : 'lg:pl-8'}`}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="bg-[#362112] rounded-3xl p-10 shadow-2xl border border-[#8B4513] relative overflow-hidden group"
                  >
                    <div className="relative z-10">
                      {/* Icon and Title */}
                      <div className="flex items-center gap-6 mb-8">
                        <motion.div
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          className="w-16 h-16 rounded-2xl bg-[#F5E6D3] flex items-center justify-center shadow-lg border border-[#8B4513]"
                        >
                          <IconComponent className="w-8 h-8 text-[#362112]" />
                        </motion.div>
                        <h3 className="text-3xl font-serif font-medium text-[#E8D5C4]">{feature.title}</h3>
                      </div>
                      
                      {/* Description */}
                      <p className="text-lg font-mono leading-relaxed text-[#E8D5C4]/90 mb-8">
                        {feature.description}
                      </p>

                      {/* Feature Highlights */}
                      <div className="space-y-3">
                        {feature.highlights?.map((h, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#8B4513]"></div>
                            <span className="text-sm font-mono text-[#E8D5C4]/80">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Video Container */}
                <div className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative group"
                  >
                    {/* Video Frame */}
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#8B4513]">
                      <WarmVideo
                        src={feature.video}
                        className="aspect-video"
                        autoPlay
                        muted
                        loop
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-16 h-16 rounded-full bg-[#F5E6D3] flex items-center justify-center shadow-xl"
                        >
                          <svg className="w-6 h-6 text-[#362112] ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;
