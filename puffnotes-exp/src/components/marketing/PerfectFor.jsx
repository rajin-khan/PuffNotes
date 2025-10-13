import { motion } from 'framer-motion';
import { GraduationCap, PenTool, Code, Moon } from 'lucide-react';

const PerfectFor = () => {
  const personas = [
    {
      icon: GraduationCap,
      title: "Students",
      description: "Lecture notes that actually make sense later"
    },
    {
      icon: PenTool,
      title: "Writers",
      description: "Draft freely. Polish instantly."
    },
    {
      icon: Code,
      title: "Developers",
      description: "Markdown-native docs. Offline or synced."
    },
    {
      icon: Moon,
      title: "Night Thinkers",
      description: "Capture fleeting thoughts before they vanish"
    }
  ];

  return (
    <div className="py-24 px-6" style={{ backgroundColor: '#F5E6D3' }}>
      <div className="text-center space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-4xl font-serif text-[#362112]/90">Made for minds that wander</h2>
          <p className="text-lg font-mono max-w-2xl mx-auto leading-relaxed text-[#362112]/80">
            Whether you're taking notes in class, drafting your next novel, or capturing midnight thoughts.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {personas.map((persona, index) => {
            const IconComponent = persona.icon;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5, 
                  ease: 'easeOut', 
                  delay: index * 0.1 
                }}
                viewport={{ once: true }}
              >
                <div className="bg-[#362112] rounded-2xl shadow-lg border border-[#8B4513] p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                  <div className="space-y-4 flex-1 flex flex-col justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F5E6D3] flex items-center justify-center mx-auto shadow-md border border-[#8B4513]">
                      <IconComponent className="w-7 h-7 text-[#362112]" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-serif font-medium text-[#E8D5C4]">{persona.title}</h3>
                      <p className="text-sm font-mono text-[#E8D5C4]/80 leading-relaxed">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerfectFor;
