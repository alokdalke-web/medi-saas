---
name: Emerald Health Systems
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#6d3bd7'
  on-tertiary: '#ffffff'
  tertiary-container: '#b090ff'
  on-tertiary-container: '#4600a7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  container-max: 1440px
  sidebar-width: 260px
  sidebar-collapsed: 72px
  gutter: 24px
---

## Brand & Style
The brand personality is authoritative yet approachable, blending clinical precision with modern SaaS fluidity. It targets enterprise healthcare providers and health-tech administrators who require high-density information without cognitive overload. 

The design style is **Corporate Modern with Glassmorphic accents**. It draws inspiration from high-end toolsets like Linear and Stripe, utilizing expansive whitespace, refined typography, and subtle depth. The emotional response should be one of "calm control"—an interface that feels stable, premium, and technologically advanced.

## Colors
This design system utilizes a sophisticated palette centered on **Emerald Green (#10B981)** to represent health and vitality. **Blue (#3B82F6)** and **Purple (#8B5CF6)** serve as functional accents for data visualization and secondary actions, ensuring the UI remains dynamic.

The palette is optimized for a **Light Mode** focus, using a "Cool Slate" neutral scale to maintain a crisp, medical-grade aesthetic. High contrast (meeting WCAG AA standards) is prioritized for all functional text and iconography against the white surfaces.

## Typography
**Inter** is the foundational typeface, selected for its exceptional legibility in data-heavy environments. The typographic scale uses tight letter-spacing for headlines to evoke a "premium editorial" feel, while body copy maintains generous line heights to ensure readability during long shifts.

Small labels and status indicators use increased letter-spacing and semi-bold weights to maintain hierarchy at small scales. For specialized data like Patient IDs or clinical codes, **JetBrains Mono** is utilized to provide a clear technical distinction.

## Layout & Spacing
The layout employs a **12-column fixed grid** centered on the screen for desktop views, transitioning to a fluid model for tablets. A key architectural feature is the **fixed collapsible sidebar**, which provides a consistent anchor for navigation.

Spacing follows a strict 4px/8px baseline rhythm. Large "Section Margins" (40px+) are used to separate major content blocks, creating the "High-End" feel associated with modern SaaS tools. On mobile, gutters shrink to 16px, and complex data tables transition to card-based stacks.

## Elevation & Depth
Depth is created through **Tonal Layering and Glassmorphism**. The base background is a soft off-white (`#F8FAFC`), while primary cards and containers use pure white (`#FFFFFF`) with a 1px subtle border (`#E2E8F0`).

**Glassmorphism** is applied to floating elements like tooltips, dropdown menus, and the sidebar to give a sense of lightness. These elements use a backdrop-blur (12px-20px) and a semi-transparent white fill (80% opacity). Shadows are "Ambient"—extremely diffused, using low-opacity indigo/slate tints rather than pure black to keep the UI looking clean and modern.

## Shapes
The design system uses a **Rounded** shape language to soften the clinical nature of the software. Primary containers and cards utilize a `16px` (1rem) radius to create a friendly, modern silhouette. Interactive components like buttons use an `8px` radius, while status badges and "pills" use a fully rounded (999px) radius to differentiate them from actionable containers.

## Components
- **Buttons:** Primary buttons use the Emerald Green gradient with a subtle inner-glow. Secondary buttons are "Ghost" style with a 1px border.
- **Cards:** The core of the UI. Cards have a 16px corner radius, a 1px border, and a soft ambient shadow on hover.
- **Data Tables:** High-density with "Zebra-striping" removed in favor of subtle hover states. Column headers are `label-md` style for clear categorization.
- **Status Badges:** Small pills using high-contrast backgrounds (e.g., light green background with dark green text) to indicate patient status or system health.
- **Sidebar:** A collapsible panel using a slight glassmorphic blur. Icons are 20px, stroke-based, with a "Primary Emerald" active state.
- **Interactive Charts:** Utilize the secondary (Blue) and tertiary (Purple) colors. Use soft-edged paths for line charts and rounded corners for bar charts.
- **Input Fields:** Large tap targets (44px height) with a 1px border that glows Emerald on focus.