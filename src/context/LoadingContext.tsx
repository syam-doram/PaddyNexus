import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingContextType {
  isActive: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const originalFetch = window.fetch;
    
    // Intercept all fetch calls to show global progress
    window.fetch = async (...args) => {
      setActiveCount(prev => prev + 1);
      try {
        const response = await originalFetch(...args);
        return response;
      } finally {
        // Add a tiny delay so very fast requests are still visible
        setTimeout(() => {
          setActiveCount(prev => Math.max(0, prev - 1));
        }, 120);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isActive: activeCount > 0 }}>
      {children}
      <GlobalProgress isActive={activeCount > 0} />
    </LoadingContext.Provider>
  );
}

function GlobalProgress({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Subtle Top Bar */}
          <motion.div
            key="progress-bar-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-1 bg-white/5 dark:bg-black/20 z-[10001] overflow-hidden"
          >
            <motion.div
              initial={{ left: "-40%" }}
              animate={{ left: "110%" }}
              transition={{ 
                  repeat: Infinity, 
                  duration: 1.2, 
                  ease: "linear"
              }}
              className="absolute top-0 bottom-0 w-[40%] bg-primary shadow-[0_0_15px_rgba(23,207,84,0.8)]"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useLoading must be used within LoadingProvider');
  return context;
};
