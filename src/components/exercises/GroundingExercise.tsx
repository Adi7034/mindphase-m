import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Hand, Ear, Heart, Sparkles, ArrowRight, RotateCcw, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

const STEPS = [
  { count: 5, sense: 'see', icon: Eye, color: 'from-blue-400 to-blue-600' },
  { count: 4, sense: 'touch', icon: Hand, color: 'from-green-400 to-green-600' },
  { count: 3, sense: 'hear', icon: Ear, color: 'from-purple-400 to-purple-600' },
  { count: 2, sense: 'smell', icon: Heart, color: 'from-pink-400 to-pink-600' },
  { count: 1, sense: 'taste', icon: Sparkles, color: 'from-amber-400 to-amber-600' },
];

export function GroundingExercise() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [items, setItems] = useState<string[][]>(STEPS.map(() => []));
  const [inputValue, setInputValue] = useState('');

  const step = STEPS[currentStep];
  const Icon = step?.icon;
  const currentItems = items[currentStep] || [];
  const isFilled = currentItems.length >= step?.count;

  const addItem = () => {
    if (!inputValue.trim() || isFilled) return;
    const updated = [...items];
    updated[currentStep] = [...currentItems, inputValue.trim()];
    setItems(updated);
    setInputValue('');
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated[currentStep] = currentItems.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setInputValue('');
    } else {
      setIsComplete(true);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setIsComplete(false);
    setItems(STEPS.map(() => []));
    setInputValue('');
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 my-3 border border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t('exercise.grounding.title')}</h3>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`w-20 h-20 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-4 shadow-lg`}
            >
              <Icon className="w-8 h-8" />
            </motion.div>

            <p className="text-2xl font-bold text-foreground mb-1">{step.count}</p>
            <p className="text-center text-muted-foreground mb-4">
              {t(`exercise.grounding.${step.sense}` as any)}
            </p>

            {/* Items list */}
            <div className="w-full max-w-xs space-y-2 mb-4">
              {currentItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5 text-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-foreground truncate">{item}</span>
                  <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}

              {/* Input for adding items */}
              {!isFilled && (
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    placeholder={`${currentItems.length + 1} / ${step.count}`}
                    className="text-sm h-9"
                    autoFocus
                  />
                  <Button size="sm" variant="outline" onClick={addItem} disabled={!inputValue.trim()} className="h-9 px-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Counter */}
            <p className="text-xs text-muted-foreground mb-3">
              {currentItems.length} / {step.count}
            </p>

            <Button onClick={handleNext} className="gap-2" disabled={!isFilled}>
              {currentStep < STEPS.length - 1 ? (
                <>
                  {t('exercise.next')} <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                t('exercise.finish')
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 2, duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white mb-4"
            >
              <Sparkles className="w-8 h-8" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {t('exercise.grounding.complete')}
            </p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {t('exercise.grounding.completeMessage')}
            </p>
            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('exercise.tryAgain')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
