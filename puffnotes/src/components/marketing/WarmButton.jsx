import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const WarmButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'font-mono font-semibold rounded-2xl cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-warm-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variants = {
    primary: 'bg-black/80 text-[#A8A29A] hover:bg-black/90 border-2 border-[#D4A574] hover:border-[#D4A574]/80 shadow-lg hover:shadow-xl',
    secondary: 'bg-black/80 text-[#A8A29A] hover:bg-black/90 border-2 border-[#D4A574] hover:border-[#D4A574]/80 shadow-lg hover:shadow-xl',
    ghost: 'bg-transparent text-warm-gold hover:bg-warm-gold/10 border-none'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };
  
  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <motion.button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={!disabled && !loading ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default WarmButton;
