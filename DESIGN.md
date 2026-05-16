# Design System Specification: Academic Agency & Editorial Vitality

## 1. Overview & Creative North Star
**The Creative North Star: "The Civic Catalyst"**

This design system moves away from the sterile, bureaucratic feel of traditional government portals and leans into the high-energy, editorial aesthetic of modern student life. We are building "The Civic Catalyst"—a system that treats democratic engagement with the same visual prestige as a premium lifestyle brand or a high-end digital magazine.

The system breaks the "template" look through **intentional asymmetry** and **tonal depth**. Instead of rigid grids, we use breathing room and overlapping elements (like candidate photos breaking the bounds of their containers) to create a sense of movement and urgency. We are not just collecting votes; we are facilitating a movement.

---

## 2. Colors & Surface Philosophy

The palette is anchored in authoritative purples and blues, but energized by a "Tertiary" orange that signals action and warmth.

### The "No-Line" Rule
To maintain a high-end, editorial feel, **1px solid borders are strictly prohibited** for sectioning or containment. Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` section against a `background` fill.
- **Subtle Tonal Transitions:** Using depth to imply edges rather than ink.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of fine paper.
- **Layer 0 (Base):** `background` (#fff3fe)
- **Layer 1 (Main Content Area):** `surface-container` (#f9e0ff)
- **Layer 2 (Feature Cards):** `surface-container-lowest` (#ffffff) to provide a "pop" of clarity.

### The "Glass & Gradient" Rule
For "floating" interactive elements (like navigation bars or action sheets), use **Glassmorphism**. Apply a semi-transparent `surface` color with a `backdrop-blur(20px)` effect. This allows the vibrant brand colors to bleed through, ensuring the UI feels integrated rather than pasted on. 

**Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (#7244a8) to `primary-container` (#c392fc) at a 135-degree angle to provide "visual soul."

---

### 3. Typography: The Editorial Voice

We utilize a high-contrast pairing: **Space Grotesk** for impact and **Manrope** for clarity.

*   **Display (Space Grotesk):** Large, tight tracking, and bold. Used for election titles and major candidate names. This conveys "Modern Democratic Engagement."
*   **Body (Manrope):** Geometric and highly legible. Used for candidate manifestos and instructions.

**Hierarchy as Identity:**
- **Display-LG (3.5rem):** Reserved for "The Big Question" (e.g., "Who will lead?").
- **Headline-MD (1.75rem):** Used for candidate names on cards to give them individual "brand" status.
- **Label-MD (0.75rem):** Set in all-caps with increased letter spacing for category tags (e.g., "FACULTY OF SCIENCE").

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#fdebff) background to create a soft, natural lift.
*   **Ambient Shadows:** When a card must float (e.g., a selected candidate), use a shadow with a blur of 32px and 6% opacity. The shadow color should be a tinted version of `on-surface` (#3d2549) to mimic natural light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use a 100% opaque border.
*   **Glassmorphism Depth:** Elements using backdrop blur should have a `surface-container-highest` highlight on the top edge (0.5px) to simulate the catch-light on glass.

---

## 5. Components

### Candidate Cards
*   **Layout:** Forbid divider lines. Use `xl` (1.5rem) rounded corners.
*   **Interaction:** On hover, the card should scale (1.02x) and transition from `surface-container` to `surface-container-lowest`.
*   **The "Party Accent":** Use a 4px vertical "accent stripe" on the left side using the `secondary` (Blue) or `tertiary` (Orange) tokens to denote party affiliation.

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`) with `on-primary` text. No border. `full` (9999px) roundedness for a friendly, modern feel.
*   **Secondary:** `surface-container-highest` background with `primary` text.

### Chips (Affiliation Tags)
*   **Style:** Use `surface-variant` with `on-surface-variant` text. Roundedness: `md`. 
*   **Context:** Use these for "Year Level" or "Department" tags.

### Progress Bars (Live Results)
*   **Visuals:** Forbid a standard grey background. Use `surface-container-high`. The "fill" should be a vibrant gradient of the party's color.

### Input Fields
*   **Style:** Soft-filled. Use `surface-container-low` with no border. On focus, transition the background to `surface-container-lowest` and add a "Ghost Border" of `primary` at 20% opacity.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins to create an editorial, magazine-like feel.
*   **Do** allow candidate images to "break the frame" of their containers for a 3D effect.
*   **Do** use large amounts of white space (32px+) between content blocks to maintain a premium feel.
*   **Do** ensure the `on-background` text (#3d2549) maintains a high contrast against `surface` colors for accessibility.

### Don't
*   **Don't** use 1px solid black or grey borders. They break the "frosted glass" aesthetic.
*   **Don't** use standard Material Design "Drop Shadows." Use the Ambient Shadow rule.
*   **Don't** use more than three font weights. Let the scale (size) do the work, not the thickness.
*   **Don't** crowd the candidate cards. If there are 6 candidates, use a staggered 2-column layout rather than a cramped 3-column grid.