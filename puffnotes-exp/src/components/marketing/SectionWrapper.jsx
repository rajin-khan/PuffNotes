import { motion } from 'framer-motion';

const SectionWrapper = ({ 
  children, 
  variant = 'cream',
  className = '',
  ...props 
}) => {
  const variants = {
    cream: 'warm-bg-cream',
    white: 'warm-bg-white',
    peach: 'warm-bg-peach',
    amber: 'warm-bg-amber',
    gradient: 'warm-bg-gradient',
    gradientReverse: 'warm-bg-gradient-reverse',
    coffee: 'warm-bg-darkest',
    espresso: 'warm-bg-darkest',
    dark: 'warm-bg-darkest'
  };
  
  const sectionClasses = `${variants[variant]} ${className}`;
  
  return (
    <motion.section
      className={`py-20 px-6 ${sectionClasses}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-100px' }}
      {...props}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </motion.section>
  );
};

export default SectionWrapper;
