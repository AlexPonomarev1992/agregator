'use client';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export function AgentHero() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center text-center gap-3"
    >
      <motion.h1
        variants={itemVariants}
        className="text-3xl font-semibold text-white tracking-tight"
      >
        Что создаём сегодня?
      </motion.h1>
      <motion.p
        variants={itemVariants}
        className="text-sm text-white/50 max-w-md"
      >
        Опишите идею — агент подберёт нужную модель, улучшит промпт и запустит генерацию
      </motion.p>
    </motion.div>
  );
}
