'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Settings } from '@/components/ui/icons';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from './ProfileHeader';
import { ActivityGraph } from './ActivityGraph';
import { SubscriptionCard } from './SubscriptionCard';
import { CreditBalance } from './CreditBalance';
import { StatsGrid } from './StatsGrid';
import { PortfolioGallery } from './PortfolioGallery';
import { BillingHistory } from './BillingHistory';

export function ProfilePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with settings link */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white"
        >
          Профиль
        </motion.h1>
        <Link href="/profile/settings">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <ProfileHeader />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="portfolio">Портфолио</TabsTrigger>
          <TabsTrigger value="billing">Платежи</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ActivityGraph />
          <StatsGrid />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SubscriptionCard />
            <CreditBalance />
          </div>
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioGallery />
        </TabsContent>

        <TabsContent value="billing">
          <BillingHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
