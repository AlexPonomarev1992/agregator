import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { LogoTicker } from '@/components/landing/LogoTicker'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { ModelsShowcase } from '@/components/landing/ModelsShowcase'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FAQSection } from '@/components/landing/FAQSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect('/ai')
  }

  return (
    <main className="min-h-screen bg-black">
      <LandingHeader />
      <HeroSection />
      <LogoTicker />
      <FeaturesSection />
      <ModelsShowcase />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <LandingFooter />
    </main>
  )
}
