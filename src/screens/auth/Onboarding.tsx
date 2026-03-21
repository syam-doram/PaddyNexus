import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Sprout, ArrowRight, Tractor, Briefcase } from 'lucide-react';
import agritechImg from '../../assets/onboarding/agritech.png';
import fleetImg from '../../assets/onboarding/fleet.png';
import inventoryImg from '../../assets/onboarding/inventory.png';

const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Empowering Your",
    subtitle: "Paddy Business",
    description: "Seamlessly connect with direct markets and simplify your logistics today.",
    tag: "Agri-Tech Solutions",
    icon: Sprout,
    image: agritechImg
  },
  {
    id: 2,
    title: "Trader Dashboard",
    subtitle: "Machine Management",
    description: "Manage your fleet of harvesting machines, track operators, and monitor real-time earnings.",
    tag: "Fleet Control",
    icon: Tractor,
    image: fleetImg
  },
  {
    id: 3,
    title: "Isolated Data",
    subtitle: "Paddy Inventory",
    description: "Keep track of unique paddy lots, batches, and settlements for each trader account.",
    tag: "Multi-Trader Support",
    icon: Briefcase,
    image: inventoryImg
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/login');
  };

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark font-display">
      <AnimatePresence mode="wait">
        <motion.div
           key={currentStep}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.5 }}
           className="absolute inset-0 flex flex-col"
        >
          {/* Hero Image Section */}
          <div className="relative w-full h-[60%] overflow-hidden rounded-b-[2.5rem]">
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url("${step.image}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-light/90 via-transparent to-transparent dark:from-background-dark/90 dark:to-black/20" />
            <div className="absolute top-14 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/30 shadow-lg">
              <step.icon className="text-white w-6 h-6" />
            </div>
          </div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-end px-6 pb-8 pt-2 z-10"
          >
            <div className="w-full flex flex-col items-center text-center space-y-4 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-black uppercase tracking-wider">
                <step.icon className="w-3 h-3" />
                {step.tag}
              </span>
              <h1 className="text-slate-900 dark:text-slate-50 text-[32px] font-black leading-[1.1] tracking-tighter uppercase">
                {step.title} <br /><span className="text-primary italic underline decoration-4 underline-offset-4">{step.subtitle}</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed max-w-[300px] uppercase tracking-wide">
                {step.description}
              </p>
            </div>

            {/* Pagination Dots */}
            <div className="flex w-full flex-row items-center justify-center gap-3 py-6">
              {ONBOARDING_STEPS.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-2.5 rounded-full transition-all duration-300 ${currentStep === idx ? 'w-8 bg-primary shadow-sm shadow-primary/50' : 'w-2.5 bg-slate-200 dark:bg-slate-700'}`}
                />
              ))}
            </div>

            {/* Action Button */}
            <div className="w-full flex justify-center mt-2">
              <button
                onClick={handleNext}
                className="group relative flex w-full max-w-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="font-black text-lg uppercase tracking-tight z-10">
                  {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next Step'}
                </span>
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                <ArrowRight className="absolute right-5 group-hover:translate-x-1 transition-transform w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Footer/Skip Link */}
            <div className="mt-5 h-5 flex items-center justify-center">
              <button
                onClick={handleComplete}
                className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
