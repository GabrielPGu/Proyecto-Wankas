'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/context/locale-context';
import { ShoppingBasket, UploadCloud, ChefHat } from 'lucide-react';

export default function HomePage() {
  const { translations } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-background to-yellow-50 dark:from-slate-900 dark:to-yellow-900 rounded-lg shadow-xl">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <Image
              src="https://rujqfdpeyoekhzesiorf.supabase.co/storage/v1/object/public/product-images/logo.jpeg"
              alt={translations.home.promoImageAlt}
              data-ai-hint="logo brand"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last animate-fadeIn shadow-lg"
              priority
            />
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary animate-slideUp [animation-delay:0.2s]">
                  {translations.home.welcome}
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl animate-slideUp [animation-delay:0.4s] font-body">
                  {translations.home.tagline}
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row animate-slideUp [animation-delay:0.6s]">
                <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                  <Link href="/products">
                    {translations.home.browseProducts} <ShoppingBasket className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="shadow-md hover:shadow-lg transition-shadow border-primary text-primary hover:bg-primary/10">
                  <Link href="/my-pantry">
                    {translations.home.smartPantry} <UploadCloud className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">{translations.home.keyFeatures}</div>
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">{translations.home.everythingYouNeed}</h2>
            <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed font-body">
              {translations.home.featuresTagline}
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
            <FeatureCard
              icon={<ShoppingBasket className="h-8 w-8 text-accent" />}
              title={translations.home.featureVastCatalogTitle}
              description={translations.home.featureVastCatalogDesc}
            />
            <FeatureCard
              icon={<UploadCloud className="h-8 w-8 text-accent" />}
              title={translations.home.featureAIFoodIdentifierTitle}
              description={translations.home.featureAIFoodIdentifierDesc}
            />
            <FeatureCard
              icon={<ChefHat className="h-8 w-8 text-accent" />}
              title={translations.home.featureRecipeSuggestionsTitle}
              description={translations.home.featureRecipeSuggestionsDesc}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group flex flex-col items-center text-center p-6 rounded-xl bg-card shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
      <div className="mb-4 rounded-full bg-accent/10 p-3 group-hover:bg-accent transition-colors">
        {React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8 text-accent group-hover:text-accent-foreground transition-colors"})}
      </div>
      <h3 className="font-headline text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground font-body">{description}</p>
    </div>
  );
}
