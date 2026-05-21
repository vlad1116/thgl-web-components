# Reusable Page Components

This directory contains reusable components for building consistent, productive page layouts across the TH.GL website.

## Components Overview

### 1. PageHero
Hero section with badge, title, description, CTA buttons, and meta info.

```tsx
import { PageHero } from "@/components/sections";
import { Download } from "lucide-react";

<PageHero
  badge="20+ Games Supported"
  title={
    <>
      Interactive Maps
      <br />
      <span className="text-primary">For Your Favorite Games</span>
    </>
  }
  description="Get real-time overlays and interactive maps for 20+ games."
  ctaButtons={[
    {
      label: "Get Companion App",
      href: "/companion-app",
      icon: Download,
    },
    {
      label: "Browse Games",
      href: "/apps",
      variant: "outline",
    },
  ]}
  metaInfo="Windows 10/11 • Free Download • ~7MB"
/>
```

### 2. SectionHeader
Section title with optional description.

```tsx
import { SectionHeader } from "@/components/sections";

<SectionHeader
  title="Why Choose TH.GL?"
  description="Everything you need for an enhanced gaming experience"
  centered={true}
/>
```

### 3. FeatureGrid + FeatureCard
Grid layout with feature cards (supports 2, 3, or 4 columns).

```tsx
import { FeatureGrid, FeatureCard } from "@/components/sections";
import { Gamepad2, Shield } from "lucide-react";

<FeatureGrid columns={3}>
  <FeatureCard
    icon={Gamepad2}
    title="In-Game Overlays"
    description="Interactive maps directly in your game"
    variant="bordered"
  />
  <FeatureCard
    icon="🗺️" // Emoji icons work too
    title="Interactive Maps"
    description="Track nodes and collectibles"
    variant="default"
  />
  <FeatureCard
    icon={Shield}
    title="Safe & Approved"
    description="Officially permitted by game developers"
    variant="bordered"
  />
</FeatureGrid>
```

**Variants:**
- `bordered`: Card wrapper with border (used on companion-app page)
- `default`: Simple bordered div with hover effect (used on landing page)

### 4. ImageShowcase
Image with optional badge overlay.

```tsx
import { ImageShowcase } from "@/components/sections";

<ImageShowcase
  src="/images/overlay-palworld.webp"
  alt="TH.GL Companion App"
  width={600}
  height={400}
  priority
  badge={{
    primary: "10 Games Supported",
    secondary: "Palworld, Dune, Once Human & more",
  }}
/>
```

### 5. ComparisonCards
Two-column comparison cards (e.g., Companion App vs Web Tools).

```tsx
import { ComparisonCards } from "@/components/sections";
import { Gamepad2, Monitor } from "lucide-react";

<ComparisonCards
  cards={[
    {
      icon: Gamepad2,
      title: "Companion App",
      features: [
        { text: "In-game overlays", enabled: true },
        { text: "Position tracking", enabled: true },
        { text: "Windows 10/11 only", enabled: true },
      ],
      cta: { label: "Learn More", href: "/companion-app" },
      highlighted: true,
    },
    {
      icon: Monitor,
      title: "Web-Based Tools",
      features: [
        { text: "Works on any device", enabled: true },
        { text: "No download required", enabled: true },
        { text: "No overlay support", enabled: false },
      ],
      cta: { label: "Browse Games", href: "/apps", variant: "outline" },
    },
  ]}
/>
```

### 6. FAQItem
FAQ card with question and answer.

```tsx
import { FAQItem } from "@/components/sections";
import Link from "next/link";

<div className="max-w-3xl mx-auto space-y-6">
  <FAQItem
    question="Is the companion app safe to use?"
    answer={
      <>
        Yes! The app only reads local memory. <Link href="/faq/apps-bannable" className="underline">Learn more</Link>
      </>
    }
  />
  <FAQItem
    question="What are the system requirements?"
    answer="Windows 10 or 11 (64-bit) with WebView2 Runtime."
  />
</div>
```

### 7. CTASection
Call-to-action section with title, description, button, and optional footer.

```tsx
import { CTASection } from "@/components/sections";

<CTASection
  title="Support Development"
  description="TH.GL is free to use and ad-supported. You can unlock a better experience by becoming a supporter."
  ctaLabel="Support Me on Patreon"
  ctaHref="/support-me"
  footer="Built and maintained by a solo developer — thank you for your support!"
  className="pt-10"
/>
```

## Usage Pattern

Typical page structure:

```tsx
import {
  PageHero,
  SectionHeader,
  FeatureGrid,
  FeatureCard,
  ImageShowcase,
  ComparisonCards,
  FAQItem,
  CTASection,
} from "@/components/sections";

export default function MyPage() {
  return (
    <section className="space-y-16 px-4 pt-10 pb-20 mx-auto max-w-7xl">
      {/* Hero */}
      <PageHero {...heroProps} />

      {/* Feature Showcase */}
      <div>
        <SectionHeader title="Key Features" />
        <FeatureGrid columns={3}>
          <FeatureCard {...feature1} />
          <FeatureCard {...feature2} />
          <FeatureCard {...feature3} />
        </FeatureGrid>
      </div>

      {/* Comparison */}
      <div>
        <SectionHeader title="Choose Your Experience" />
        <ComparisonCards cards={comparisonData} />
      </div>

      {/* FAQ */}
      <div>
        <SectionHeader title="FAQ" />
        <div className="max-w-3xl mx-auto space-y-6">
          <FAQItem {...faq1} />
          <FAQItem {...faq2} />
        </div>
      </div>

      {/* CTA */}
      <CTASection {...ctaProps} />
    </section>
  );
}
```

## Benefits

- **Consistency**: All pages use the same components
- **Productivity**: Build new pages faster
- **Maintainability**: Update styling in one place
- **Type Safety**: Full TypeScript support
- **Flexibility**: Props allow customization while maintaining structure
