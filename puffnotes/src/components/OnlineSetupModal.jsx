// src/components/OnlineSetupModal.jsx
import { motion } from 'framer-motion';
import { Check, Loader } from 'lucide-react';

export default function OnlineSetupModal({ steps }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-[#fdf6ec] font-serif rounded-lg p-8 shadow-2xl text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className="text-2xl text-gray-800 mb-6">Setting up your space...</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              className="flex items-center space-x-4 text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.3 }}
            >
              {step.status === 'loading' && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader className="text-gray-400" size={20} />
                </motion.div>
              )}
              {step.status === 'complete' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="text-green-500" size={20} />
                </motion.div>
              )}
              <span>{step.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}