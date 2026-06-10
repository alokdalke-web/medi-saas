# UI IMPLEMENTATION SPECIFICATION

# File Name

UI.md

Project: ClinicFlow

Version: 1.0

---

# IMPORTANT INSTRUCTION

The project UI has already been fully designed.

The following assets already exist in ui folder:

* UI Screens
* Screen Images
* Design References
* HTML Prototype
* Layout Structure
* Design System

These assets are the source of truth.

The AI must follow the provided UI exactly.

DO NOT redesign screens.

DO NOT introduce new layouts.

DO NOT change navigation structure.

DO NOT change color system.

DO NOT change spacing system.

DO NOT replace components without explicit instruction.

The goal is implementation, not redesign.

---

# PRIMARY OBJECTIVE

Convert the existing UI into production-ready React components and pages.

The implementation must visually match the provided designs.

---

# DESIGN AUTHORITY

Priority Order:

1. Screen Images
2. Figma Design
3. HTML Prototype
4. Existing Components
5. This Document

If there is any conflict:

Always follow the screen design.

---

# UI CONSISTENCY RULES

Maintain:

* Existing layout
* Existing spacing
* Existing typography
* Existing color palette
* Existing icon placement
* Existing component hierarchy

Do not:

* Add new sections
* Remove sections
* Change visual hierarchy
* Reposition elements
* Replace components

---

# PAGE IMPLEMENTATION RULE

Every page must be implemented exactly as designed.

Before generating code:

1. Analyze the screen.
2. Identify layout structure.
3. Identify reusable components.
4. Implement using React.
5. Match design precisely.

---

# RESPONSIVE RULES

Maintain design consistency across:

Desktop:

* 1440px+

Laptop:

* 1024px+

Tablet:

* 768px+

Mobile:

* 375px+

Responsiveness should preserve the original design intent.

---

# COMPONENT REUSE RULE

Before creating a new component:

Check existing components.

Examples:

Patient Table
Doctor Table
Appointment Table

Should share common table structure.

Cards should share common card component.

Forms should share common form components.

Buttons should share common button component.

---

# STYLING RULES

Use:

* Tailwind CSS

Do not:

* Use inline styles
* Use custom CSS unless necessary

Prefer:

* Reusable utility classes
* Design tokens

---

# ANIMATION RULES

Maintain existing animations.

If animations are not specified:

Use subtle transitions only.

Examples:

* Hover effects
* Fade transitions
* Modal transitions

Avoid excessive animations.

---

# ICON RULES

Maintain existing icon positions.

Do not:

* Replace icons
* Change icon sizes

Unless explicitly instructed.

---

# FORM IMPLEMENTATION RULES

All forms must:

* Match design exactly
* Preserve field order
* Preserve labels
* Preserve placeholders

Validation errors must not break layout.

---

# TABLE IMPLEMENTATION RULES

Maintain:

* Column order
* Actions placement
* Filters placement
* Search placement
* Pagination placement

Do not redesign tables.

---

# MODAL IMPLEMENTATION RULES

Maintain:

* Width
* Layout
* Actions
* Button positions

Use existing design as reference.

---

# SIDEBAR RULES

Sidebar is fixed.

Maintain:

* Width
* Menu order
* Active states
* Icons
* Collapse behavior

Do not modify navigation structure.

---

# HEADER RULES

Maintain:

* Search placement
* User menu placement
* Notification placement

Do not redesign header.

---

# DASHBOARD RULES

Dashboard cards must match design.

Maintain:

* Card layout
* Card order
* Statistics placement
* Chart placement

Do not add or remove widgets.

---

# ACCESSIBILITY RULES

All components must:

* Support keyboard navigation
* Include aria labels
* Support focus states

Without changing UI appearance.

---

# IMPLEMENTATION WORKFLOW

For every page:

1. Analyze provided screen.
2. Create page structure.
3. Create reusable components.
4. Implement exact UI.
5. Add responsiveness.
6. Add accessibility.
7. Connect APIs.
8. Test visual consistency.

---

# AI CODE GENERATION INSTRUCTIONS

When generating UI code:

DO:

* Follow design exactly.
* Match spacing exactly.
* Match layout exactly.
* Match component hierarchy exactly.
* Reuse components.

DO NOT:

* Improve design.
* Modernize design.
* Simplify design.
* Change layout.
* Add new sections.
* Remove sections.
* Change color palette.

Implementation accuracy is more important than creativity.

---

# FINAL RULE

The provided screen designs, images, and HTML prototypes are the single source of truth.

The AI acts as an implementation engineer, not a UI designer.

The objective is pixel-accurate implementation of the provided designs.
