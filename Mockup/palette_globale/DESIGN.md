# Design System Document: Botanical Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Apothecary."** 

Moving away from the sterile, rigid grids of standard e-commerce, this system adopts an editorial-first approach. We treat the interface as a curated collection of botanical knowledge. We break the "template" look through intentional whitespace, asymmetric card layouts, and a "soft-touch" philosophy where elements feel like they are resting on organic surfaces rather than being bolted to a screen. The goal is to evoke the tactile sensation of heavy-stock cream paper and the soothing presence of a forest canopy.

## 2. Colors
Our palette is rooted in nature, using a spectrum of greens to establish hierarchy and cream tones to provide a warm, premium alternative to stark white.

*   **Primary (`#234428`) & Primary Container (`#3a5c3e`):** These represent the deep Forest Green. Use these for high-emphasis actions and key brand moments.
*   **Secondary (`#4c6450`):** A muted Sage used for secondary actions and supporting information.
*   **Tertiary (`#2a423a`):** A deep Mint/Teal variant for accents that need to stand out from the primary green flow.
*   **Surface & Background (`#fcf9f4`):** Our signature "Cream/Off-White." This is the foundation of the entire PWA.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or containers. Visual separation must be achieved through:
1.  **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
2.  **Negative Space:** Using the Spacing Scale to let elements breathe.
3.  **Color Blocking:** Utilizing the subtle difference between `surface-container` (`#f0ede9`) and `surface` (`#fcf9f4`).

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper.
*   **Base:** `surface` (`#fcf9f4`).
*   **Sectioning:** Use `surface-container-low` for large background areas.
*   **Cards:** Use `surface-container-lowest` (`#ffffff`) for cards to make them "pop" against the cream background without needing heavy shadows.

### The "Glass & Gradient" Rule
For floating navigation bars or premium product overlays, utilize Glassmorphism. Apply a `backdrop-blur` of 10px-15px with a semi-transparent `surface` color. For main Hero CTAs, use a subtle linear gradient transitioning from `primary` to `primary_container` to add depth and "soul" to the visual weight.

## 3. Typography
We use **Manrope** across all scales. It is a modern, geometric sans-serif that maintains high readability while feeling sophisticated.

*   **Display (L/M/S):** Reserved for editorial moments and hero headers. These should be set with tight letter-spacing (-0.02em) to feel like a premium magazine title.
*   **Headline & Title:** Used for product categories and card titles. The hierarchy is established through weight and color (using `on_surface` for high contrast).
*   **Body (L/M/S):** Optimized for readability. Use `on_surface_variant` (`#424842`) for long-form herbal descriptions to reduce eye strain and maintain the "soft" aesthetic.
*   **Labels:** For technical data (e.g., botanical names, dosages), use `label-md` in all-caps with a slight letter-spacing (+0.05em).

## 4. Elevation & Depth
Depth in this design system is "felt," not "seen." We avoid the "floating in space" look of traditional Material Design.

*   **The Layering Principle:** Place a card of `surface-container-lowest` on top of a section of `surface-container-high`. This creates a natural elevation transition through pigment rather than light.
*   **Ambient Shadows:** If a shadow is required for a floating action button or a modal, use an extra-diffused shadow. 
    *   *Blur:* 24px-32px.
    *   *Opacity:* 5%.
    *   *Color:* Use a tinted version of `on_surface` (a deep green-grey) instead of pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline_variant` token at **15% opacity**. It should be a suggestion of a line, not a hard stop.

## 5. Components

### Buttons
*   **Primary:** Filled with `primary`, text in `on_primary`. Roundedness: `full`.
*   **Secondary:** Filled with `secondary_container`, text in `on_secondary_container`. No border.
*   **Tertiary:** Text-only in `primary` weight, with a `surface_variant` hover state.

### Cards & Lists
*   **Cards:** Use `xl` (1.5rem) roundedness. Cards should never have a border. 
*   **Lists:** **Forbid dividers.** To separate list items, use a background color shift on hover or increase the vertical spacing (`spacing-4` or `spacing-5`). Refer to the "People" list in the screenshots; notice how the white cards on the grey-white background provide enough separation.

### Input Fields
*   **Styling:** Use a "pill" shape (`rounded-full`). 
*   **Background:** `surface-container-high`. 
*   **State:** When focused, use a 2px "Ghost Border" of `primary` at 40% opacity.

### Chips (Filter & Action)
*   As seen in the reference images, chips should have `md` roundedness.
*   **Unselected:** `surface-container-highest` background.
*   **Selected:** `primary` background with `on_primary` text.

### Progressive Web App (PWA) Navigation
*   **Bottom Bar:** Use the Glassmorphism rule. A `backdrop-blur` with `surface` at 80% opacity. Icons should use `secondary` for inactive and `primary` for active states.

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins (e.g., a wider left margin for a headline than the body text) to create an editorial feel.
*   **Do** use high-quality botanical photography with soft, natural lighting.
*   **Do** leverage the Spacing Scale to ensure no two elements feel "cluttered."

### Don't:
*   **Don't** use pure black (`#000000`) for text; always use `on_surface`.
*   **Don't** use the `none` or `sm` roundedness tokens for containers. This system is organic; corners should be soft.
*   **Don't** use standard "drop shadows" with high opacity. They break the "Digital Apothecary" illusion of natural light.
*   **Don't** use 1px dividers. If content feels merged, add more whitespace or a subtle background tone change.