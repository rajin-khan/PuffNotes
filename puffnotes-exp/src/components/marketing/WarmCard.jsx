import { motion } from 'framer-motion';

const WarmCard = ({ 
  children, 
  variant = 'default',
  hover = true,
  className = '',
  ...props 
}) => {
  const baseClasses = 'warm-card rounded-2xl';
  
  const variants = {
    default: '',
    cream: 'warm-card-cream',
    peach: 'warm-card-peach',
    amber: 'warm-card-amber'
  };
  
  const cardClasses = `${baseClasses} ${variants[variant]} ${className}`;
  
  return (
    <motion.div
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={hover ? {
        y: -4,
        transition: { duration: 0.3 }
      } : {}}
      viewport={{ once: true, margin: '-50px' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default WarmCard;
