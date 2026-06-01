'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Circle, Zap } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Experiment } from '@/types';

interface ExperimentDetailProps {
  experiment: Experiment | null;
  status: 'not_started' | 'started' | 'completed';
  onClose: () => void;
  onComplete: (experiment: Experiment) => void;
}

const STEPS = [
  'Прочитайте описание и подготовьте идею',
  'Создайте генерацию по теме эксперимента',
  'Поделитесь результатом и получите XP',
];

export function ExperimentDetail({ experiment, status, onClose, onComplete }: ExperimentDetailProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleOpen = (open: boolean) => {
    if (!open) {
      onClose();
      // Reset state on close
      setCurrentStep(0);
      setShowXpAnimation(false);
      setIsCompleted(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (experiment) {
      // Complete the experiment
      setShowXpAnimation(true);
      setIsCompleted(true);
      onComplete(experiment);
      setTimeout(() => setShowXpAnimation(false), 2000);
    }
  };

  const alreadyCompleted = status === 'completed';
  const buttonLabel =
    alreadyCompleted || isCompleted
      ? 'Завершён'
      : currentStep === 0
        ? 'Начать эксперимент'
        : currentStep < STEPS.length - 1
          ? 'Далее'
          : 'Завершить';

  return (
    <Dialog open={!!experiment} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg">
        {experiment && (
          <>
            <DialogHeader>
              <DialogTitle>{experiment.title}</DialogTitle>
              <DialogDescription>{experiment.description}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Шаги эксперимента
              </p>
              {STEPS.map((step, index) => {
                const isDone = index < currentStep || alreadyCompleted || isCompleted;
                const isCurrent = index === currentStep && !alreadyCompleted && !isCompleted;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      isCurrent ? 'bg-white/10 border border-white/20' : 'bg-white/5'
                    }`}
                  >
                    {isDone ? (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Circle className="h-3.5 w-3.5 text-white/40" />
                      </div>
                    )}
                    <span className={`text-sm ${isDone ? 'text-white/60' : isCurrent ? 'text-white' : 'text-white/40'}`}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="relative mt-4 flex justify-end">
              <AnimatePresence>
                {showXpAnimation && (
                  <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -60 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute right-0 -top-8 flex items-center gap-1 text-white font-bold text-lg"
                  >
                    <Zap className="h-5 w-5" />
                    +{experiment.xp_reward} XP
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={handleNext}
                disabled={alreadyCompleted || isCompleted}
              >
                {buttonLabel}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
