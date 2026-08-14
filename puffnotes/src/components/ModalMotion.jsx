import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';

const MODAL_EASE = [0.22, 1, 0.36, 1];

function getModalMotion(shouldReduceMotion = false) {
  if (shouldReduceMotion) {
    const reducedTransition = { duration: 0.15, ease: 'linear' };

    return {
      backdrop: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: reducedTransition,
      },
      panel: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: reducedTransition,
      },
    };
  }

  const transition = { duration: 0.4, ease: MODAL_EASE };

  return {
    backdrop: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition,
    },
    panel: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      transition,
    },
  };
}

export function ModalFrame({
  children,
  kind = 'modal',
  onBackdropClick,
  panelClassName = '',
  theme,
}) {
  const shouldReduceMotion = useReducedMotion();
  const modalMotion = getModalMotion(shouldReduceMotion);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      data-modal-backdrop
      data-modal-kind={kind}
      data-puffnotes-theme={theme}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      initial={modalMotion.backdrop.initial}
      animate={modalMotion.backdrop.animate}
      exit={modalMotion.backdrop.exit}
      transition={modalMotion.backdrop.transition}
      onClick={onBackdropClick}
    >
      <motion.div
        data-modal-panel
        data-modal-kind={kind}
        className={panelClassName}
        initial={modalMotion.panel.initial}
        animate={modalMotion.panel.animate}
        exit={modalMotion.panel.exit}
        transition={modalMotion.panel.transition}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export function ModalPresence({ isOpen, ...frameProps }) {
  return (
    <AnimatePresence>
      {isOpen && <ModalFrame {...frameProps} />}
    </AnimatePresence>
  );
}
