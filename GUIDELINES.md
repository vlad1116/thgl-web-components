# Development Guidelines

This document outlines best practices for performance, accessibility, SEO, and code style across the TH.GL monorepo.

## Table of Contents

- [Performance](#performance)
  - [Image Optimization](#image-optimization)
  - [JavaScript Bundle Size](#javascript-bundle-size)
  - [Network Performance](#network-performance)
- [Accessibility](#accessibility)
- [SEO](#seo)
- [Code Style](#code-style)
- [Component Patterns](#component-patterns)

---

## Performance

### Image Optimization

#### Always Use Next.js Image Component

Use Next.js `Image` component instead of `<img>` tags for automatic optimization.

```tsx
import Image from "next/image";

// ✅ Good
<Image src="/image.jpg" alt="Description" width={600} height={400} />

// ❌ Bad
<img src="/image.jpg" alt="Description" />
```

#### Always Provide `sizes` Prop

The `sizes` prop tells Next.js which image sizes to generate based on viewport breakpoints.

**Fixed-size images:**
```tsx
<Image
  src={game.logo}
  width={64}
  height={64}
  sizes="64px"  // Image is always 64px
  alt="Game logo"
/>
```

**Responsive images in grid layouts:**
```tsx
// Grid: 1 col on mobile, 2 on tablet, 3 on desktop
<Image
  src={preview}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
  alt="Preview"
/>
```

**Images in flexible containers:**
```tsx
// Image takes half the viewport on larger screens
<Image
  src={showcase}
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Showcase"
/>
```

**Common `sizes` patterns:**
- Full width: `"100vw"`
- Fixed carousel: `"(max-width: 1024px) 100vw, 1024px"`
- 3-column grid: `"(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"`
- Small logos: `"32px"`, `"64px"`, `"80px"`

#### Prevent Image Overflow

Always add responsive constraints to prevent horizontal scroll on mobile:

```tsx
<Image
  src={src}
  width={600}
  height={400}
  className="rounded-lg max-w-full h-auto"  // Prevents overflow
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

#### Prioritize Above-the-Fold Images

Use `priority` prop for images visible on initial page load:

```tsx
<Image
  src="/hero.jpg"
  width={1200}
  height={600}
  priority  // Loads immediately, not lazy-loaded
  alt="Hero image"
/>
```

### JavaScript Bundle Size

#### Target Modern Browsers

Add `browserslist` to `package.json` to prevent unnecessary transpilation:

```json
{
  "browserslist": [
    "chrome >= 91",
    "edge >= 91",
    "firefox >= 90",
    "safari >= 15",
    "and_chr >= 91",
    "and_ff >= 90",
    "ios_saf >= 15"
  ]
}
```

**WebView2 apps (thgl-app):**
```json
{
  "browserslist": ["chrome >= 91"]
}
```

#### Isolate Heavy Dependencies

Prevent heavy dependencies from being bundled in apps that don't use them:

1. **Enable tree-shaking in shared packages:**
```json
// packages/lib/package.json
{
  "sideEffects": false
}
```

2. **Create separate export paths for heavy features:**
```json
// packages/ui/package.json
{
  "exports": {
    "./controls": "./src/components/(controls)/index.tsx",
    "./peer": "./src/components/(peer)/index.tsx"  // Isolates peerjs
  }
}
```

3. **Use type-only imports when possible:**
```tsx
// ✅ Good - doesn't bundle peerjs at runtime
import type { DataConnection } from "peerjs";

// ❌ Bad - bundles peerjs even if only types are used
import { type DataConnection } from "peerjs";
```

4. **Remove unused exports from barrel files:**
```tsx
// Don't export heavy components from main index if not needed everywhere
export * from "./actions";
export * from "./toaster";
// Removed: export * from "./streaming-receiver";  // Now in separate export
```

### Network Performance

#### Use Preconnect for Third-Party Domains

Add `<link rel="preconnect">` for domains you'll fetch from early:

```tsx
export function AnalyticsTracker({ apiHost }: { apiHost: string }) {
  return <link rel="preconnect" href={apiHost} />;
}
```

**Common preconnect candidates:**
- Analytics servers (Plausible, Google Analytics)
- CDN domains
- API endpoints
- Font providers

---

## Accessibility

### Link Accessibility

#### Always Provide Descriptive Link Text

Screen readers need context about where links lead.

```tsx
// ✅ Good - descriptive text
<Link href="/companion-app">
  Learn More About Companion App
</Link>

// ❌ Bad - generic text
<Link href="/companion-app">
  Learn More
</Link>
```

#### Use aria-label for Generic Links

When link text must be generic (e.g., "Read more" in cards):

```tsx
<Link
  href={`/blog/${post.id}`}
  aria-label={`Read more about ${post.title}`}
>
  <h3>{post.title}</h3>
  <p>{post.description}</p>
  <span aria-hidden="true">Read more →</span>
</Link>
```

### Viewport and Zoom

**Never disable user scaling:**

```tsx
// ✅ Good
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// ❌ Bad
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,  // Don't prevent zooming
  userScalable: false,  // Don't disable scaling
};
```

### Color Contrast

Ensure sufficient contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text).

```tsx
// ✅ Good - sufficient contrast
<span className="text-muted-foreground">
  Muted text
</span>

// ❌ Bad - insufficient contrast
<span className="text-muted-foreground/70">
  Muted text with opacity
</span>
```

**Testing contrast:**
- Use browser DevTools Lighthouse
- Check design system color tokens in Tailwind config
- Avoid low-opacity text overlays on images without backgrounds

---

## SEO

### Meta Tags

Every page should have descriptive metadata:

```tsx
export const metadata = {
  title: "Specific Page Title – Site Name",
  description: "Detailed description (150-160 characters) for search engines",
  keywords: "relevant, keywords, for, the, page",
  alternates: {
    canonical: "/canonical-url",
  },
};
```

### Semantic HTML

Use proper heading hierarchy and semantic elements:

```tsx
// ✅ Good - semantic structure
<article>
  <h1>Main Page Title</h1>
  <section>
    <h2>Section Title</h2>
    <p>Content...</p>
  </section>
</article>

// ❌ Bad - div soup
<div>
  <div className="text-4xl font-bold">Title</div>
  <div>
    <div className="text-2xl font-bold">Section</div>
    <div>Content...</div>
  </div>
</div>
```

### Image Alt Text

Every image needs descriptive alt text:

```tsx
// ✅ Good - descriptive
<Image
  src="/overlay-palworld.webp"
  alt="Palworld overlay showing minimap with nearby Pals and resource locations"
  width={600}
  height={400}
/>

// ❌ Bad - not descriptive
<Image
  src="/overlay-palworld.webp"
  alt="Overlay"
  width={600}
  height={400}
/>
```

**Decorative images:**
```tsx
// Use empty alt for purely decorative images
<Image src="/background-pattern.svg" alt="" width={100} height={100} />
```

---

## Code Style

### Component Organization

#### File Structure

```
components/
├── (category)/          # Group related components
│   ├── component.tsx
│   └── index.tsx       # Barrel export
└── component.tsx       # Standalone components
```

#### Import Order

```tsx
// 1. External dependencies
import { useState } from "react";
import Image from "next/image";

// 2. Internal packages
import { Game } from "@repo/lib";
import { Button, Card } from "@repo/ui/controls";

// 3. Local imports
import { GameCard } from "./game-card";
import { cn } from "@/lib/utils";
```

### TypeScript

#### Prefer Type-Only Imports

When only using types, use type-only imports:

```tsx
// ✅ Good
import type { Game } from "@repo/lib";

// ❌ Bad (when only using the type)
import { Game } from "@repo/lib";
```

#### Explicit Return Types for Exported Functions

```tsx
// ✅ Good
export function GameCard({ game }: { game: Game }): JSX.Element {
  return <div>...</div>;
}

// ⚠️ Acceptable for simple components
export function GameCard({ game }: { game: Game }) {
  return <div>...</div>;
}
```

### Tailwind CSS

#### Responsive Design Pattern

Mobile-first approach with progressive enhancement:

```tsx
// ✅ Good - mobile first
<div className="flex flex-col sm:flex-row gap-3">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>

// ❌ Bad - can cause horizontal scroll on mobile
<div className="flex gap-3">
  <Button>Long Button Text</Button>
  <Button>Another Long Button</Button>
</div>
```

#### Responsive Grid Patterns

```tsx
// 1 column mobile, 2 tablet, 3 desktop
<div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">

// 2 columns mobile, 3 tablet, 4 desktop
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

// Equal columns with auto-fit
<div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
```

#### Common Responsive Utilities

```tsx
// Spacing
className="p-4 md:p-8"           // Padding
className="gap-4 md:gap-6"       // Gap

// Typography
className="text-xl md:text-3xl"  // Font size
className="space-y-4 md:space-y-6" // Vertical spacing

// Display
className="hidden md:block"      // Hide on mobile
className="block md:hidden"      // Show only on mobile
```

---

## Component Patterns

### Reusable Components

#### Props Interface

Always define explicit props interface:

```tsx
interface GameCardProps {
  game: Game;
  priority?: boolean;
  className?: string;
}

export function GameCard({ game, priority = false, className }: GameCardProps) {
  // Implementation
}
```

#### Default Props

Use default parameters instead of `defaultProps`:

```tsx
// ✅ Good
export function ImageShowcase({
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: ImageShowcaseProps) {
  // ...
}

// ❌ Deprecated pattern
ImageShowcase.defaultProps = {
  sizes: "(max-width: 768px) 100vw, 50vw",
  priority: false,
};
```

### Client Components

Mark client components explicitly:

```tsx
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  // ...
}
```

**When to use "use client":**
- Components using React hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- Third-party client libraries

### Server Components (Default)

Keep components as server components when possible:

```tsx
// No "use client" - this is a server component
import { games } from "@repo/lib";

export function GameList() {
  return (
    <div>
      {games.map(game => <GameCard key={game.id} game={game} />)}
    </div>
  );
}
```

**Benefits:**
- Smaller JavaScript bundle
- Better SEO (rendered on server)
- Direct database/API access

---

## Monorepo Best Practices

### Shared Package Updates

When updating shared packages (`@repo/lib`, `@repo/ui`):

1. **Consider breaking changes** - affects all apps
2. **Update package.json exports** when adding new module paths
3. **Run typecheck across all packages**:
   ```bash
   bun run typecheck
   ```

### Creating New Apps

When creating a new `-web` app:

1. **Copy browserslist** from existing web app
2. **Add to workspace** in root `package.json`
3. **Configure in turbo.json** if needed
4. **Add appropriate metadata** in layout.tsx

### Dependency Management

- **Use workspace protocol**: `"@repo/lib": "workspace:*"`
- **Use catalog**: `"next": "catalog:"` for shared versions
- **Update dependencies**: `bun run update-deps`

---

## Testing Checklist

Before committing changes:

### Performance
- [ ] All images have `sizes` prop
- [ ] No images cause horizontal scroll on mobile
- [ ] Heavy dependencies are isolated (if applicable)
- [ ] Preconnect hints for third-party domains

### Accessibility
- [ ] All links have descriptive text or aria-label
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Viewport allows user scaling
- [ ] Semantic HTML elements used

### SEO
- [ ] Page has title and description metadata
- [ ] Images have descriptive alt text
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Canonical URLs set when needed

### Code Quality
- [ ] TypeScript compiles: `bun run typecheck`
- [ ] ESLint passes: `bun run lint`
- [ ] Follows established patterns in codebase
- [ ] Mobile-first responsive design

---

## Useful Commands

```bash
# Development
bun run dev:web              # Run all web apps
bun run dev:palworld         # Run specific game apps
bunx turbo run dev --filter=thgl-web...  # Run single app

# Quality checks
bun run typecheck            # TypeScript compilation
bun run lint                 # ESLint
bun run build                # Production build

# Lighthouse testing
# 1. Build the app: bun run build
# 2. Run in production mode: bun run start
# 3. Open Chrome DevTools → Lighthouse
# 4. Run audit for Performance, Accessibility, Best Practices, SEO
```

---

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev Performance](https://web.dev/performance/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Lighthouse Docs](https://developer.chrome.com/docs/lighthouse/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## Version History

- **2025-01**: Initial guidelines based on Lighthouse optimization work for thgl-web
