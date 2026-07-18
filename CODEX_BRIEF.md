# CafeCanopy Codex Brief

> Codex: Read this entire file before responding. Perform Phase 0 audit and planning only. Do not edit any project files until the user explicitly approves the plan.

---

# CafeCanopy Design Gita
## Cinematic 3D Scroll Homepage — Visual, Motion & Codex Implementation Specification

**Version:** 1.0  
**Primary implementation target:** `client/` — React + TypeScript + Vite  
**Primary purpose:** Give this entire document to Codex before implementation.  
**Core rule:** Preserve every existing API, route, authentication flow, database behavior, and application feature. Redesign the public homepage first.

---

# 1. The North Star

CafeCanopy must not feel like a college-project landing page with animated cards.

It must feel like a premium café-tech product launch:

- Warm enough to belong in a café.
- Precise enough to feel like serious software.
- Cinematic without becoming slow or confusing.
- Memorable within the first five seconds.
- Functional and readable even when 3D or animation is unavailable.

### One-line positioning

> CafeCanopy turns the chaos of running a café into one beautifully connected flow.

### Emotional target

The user should feel:

1. **Curiosity** — “What is this?”
2. **Delight** — “That scroll interaction is smooth.”
3. **Clarity** — “I understand what the product does.”
4. **Trust** — “This feels complete and professional.”
5. **Action** — “I want to enter the application.”

---

# 2. Mandatory Guardrails

Codex must follow these without exception.

1. Modify the **public homepage only** during the initial implementation.
2. Do not change server code, API contracts, auth, database schema, or business logic.
3. Do not replace existing routes.
4. Do not rewrite the entire frontend.
5. Do not introduce horizontal page overflow.
6. Do not use 3D merely as decoration; every movement must support product storytelling.
7. Keep text readable over motion.
8. Provide reduced-motion and non-WebGL fallbacks.
9. Clean up GSAP timelines, ScrollTriggers, resize observers, and event listeners.
10. Keep the existing application accessible from the final CTA.
11. Do not use multiple animation systems for the same scroll timeline.
12. Use GSAP for the cinematic scroll experience. Use CSS for small hover states.
13. Do not install additional packages without reporting why they are needed.
14. Run build, type-check, and lint after each implementation phase.
15. If the current project architecture conflicts with this document, inspect first and adapt while preserving the visual intent.

---

# 3. Existing Project Assumptions

From the current repository structure:

```text
CafeCanopy/
├── client/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig*.json
│   └── vite.config.ts
└── server/
    ├── src/
    ├── uploads/
    ├── package.json
    └── tsconfig.json
```

The homepage implementation belongs inside `client/`.

The following packages are expected or approved:

```bash
npm install gsap @gsap/react three @react-three/fiber @react-three/drei
```

Do not assume a routing library, CSS framework, or component library. Inspect `client/package.json` and `client/src` first.

---

# 4. Audience and Conversion Goal

### Primary audience

- Café owner
- Café manager
- Cashier
- Kitchen operator
- Evaluator, recruiter, hackathon judge, or faculty reviewer

### Primary CTA

**Enter CafeCanopy**

This should navigate to the existing login/dashboard/application route.

### Secondary CTA

**See the workflow**

This scrolls to the order-flow section.

### Conversion rule

The page should communicate the core value before the user has scrolled past 35% of the experience.

---

# 5. Brand World

## Personality

- Premium
- Warm
- Intelligent
- Calm
- Modern
- Operational
- Human

## Visual metaphor

A café begins with a cup, but succeeds through a connected system behind the cup.

The homepage therefore begins with a cup and gradually reveals the operational system behind it.

## Do

- Rich dark surfaces
- Soft warm highlights
- Cream typography
- Controlled green accents
- Subtle grain
- Layered depth
- Real product UI

## Avoid

- Generic purple SaaS gradients
- Neon cyberpunk
- Excessive glassmorphism
- Random floating cards
- Overly realistic heavy 3D scenes
- Cartoon coffee-shop illustrations
- Huge blocks of marketing copy
- Stock photos in the cinematic section

---

# 6. Design Tokens

## Core palette

| Token | Hex | Usage |
|---|---:|---|
| `--cc-night` | `#0A100D` | Main background |
| `--cc-forest` | `#122019` | Secondary dark surface |
| `--cc-espresso` | `#2A1711` | Warm depth, coffee accents |
| `--cc-roast` | `#9A6035` | Primary warm highlight |
| `--cc-cream` | `#F2E8D8` | Main text |
| `--cc-oat` | `#D8C9B4` | Secondary text |
| `--cc-sage` | `#8FB79B` | Product and status accent |
| `--cc-lime` | `#C9F27B` | CTA/high-value accent |
| `--cc-danger` | `#F18A78` | Error status only |
| `--cc-line` | `rgba(242,232,216,.14)` | Borders and separators |

## Gradients

```css
--cc-hero-radial:
  radial-gradient(circle at 50% 35%, rgba(154,96,53,.22), transparent 42%);

--cc-canopy-glow:
  radial-gradient(circle at 65% 30%, rgba(143,183,155,.16), transparent 45%);

--cc-floor:
  linear-gradient(180deg, rgba(10,16,13,0) 0%, #0A100D 80%);
```

## Surface rules

- Main cards: `rgba(18, 32, 25, .72)`
- Border: `1px solid rgba(242,232,216,.12)`
- Backdrop blur: maximum `18px`
- Radius:
  - UI cards: `24px`
  - Small controls: `14px`
  - Pills: `999px`
- Shadows must be warm and soft, never black-heavy.

---

# 7. Typography

## Recommended pairing

- Display: **Instrument Serif** or **Fraunces**
- UI/body: **Manrope** or **Inter**

Use `@fontsource` packages only if the project has no existing brand typography. Otherwise map the existing font system to the roles below.

## Type scale

| Role | Desktop | Mobile |
|---|---:|---:|
| Hero display | `clamp(4rem, 9vw, 9rem)` | `clamp(3rem, 15vw, 5.2rem)` |
| Section display | `clamp(3rem, 6vw, 6rem)` | `clamp(2.3rem, 11vw, 4rem)` |
| Card heading | `1.5rem` | `1.25rem` |
| Body large | `1.125rem` | `1rem` |
| Label | `.76rem` | `.72rem` |

## Copy style

- Short sentences.
- Strong verbs.
- No corporate jargon.
- No more than 18 words in a hero support line.
- Product features should be demonstrated visually before being explained.

---

# 8. Spatial and Layout System

- Desktop content width: `min(1280px, calc(100vw - 64px))`
- Mobile content width: `calc(100vw - 32px)`
- 12-column desktop grid
- 4-column mobile grid
- Base spacing unit: `8px`
- Section text should sit within a readable max width of `620px`
- Keep safe zones for the 3D subject:
  - Desktop center: clear circular region of roughly `44vw`
  - Mobile center: clear region of roughly `70vw`

---

# 9. Motion Constitution

Motion must feel like a camera-directed product film.

## Principles

1. **One dominant movement at a time.**
2. **Depth before speed.**
3. **Text follows the object, never competes with it.**
4. **Scroll controls progress, not playback speed spikes.**
5. **Every scene must end in a stable readable state.**
6. **No bounce-heavy toy animation.**
7. **Do not animate everything.**

## Motion values

```ts
const motion = {
  easeCinematic: "power3.inOut",
  easeReveal: "power2.out",
  easeSettle: "expo.out",
  durationFast: 0.35,
  durationMedium: 0.8,
  durationSlow: 1.4,
  blurIn: 14,
  perspective: 1400,
};
```

## Scroll behavior

- Desktop cinematic journey: approximately `650vh`
- Tablet: approximately `520vh`
- Mobile: approximately `400–440vh`
- Use `scrub: 0.8` to `1.2` for major timelines
- Use pinned sections only where the user needs time to understand the transformation
- Avoid a single giant timeline that becomes impossible to maintain
- Use one persistent 3D Canvas with scene states driven by normalized page progress

---

# 10. Homepage Architecture

Recommended structure:

```text
HomePage
├── HomeNavigation
├── CinematicExperience
│   ├── StickySceneCanvas
│   │   ├── LightingRig
│   │   ├── ProceduralCoffeeCup
│   │   ├── SteamParticles
│   │   ├── CoffeeBeanField
│   │   ├── DashboardPortal
│   │   └── SceneEffects
│   ├── SceneHeroCopy
│   ├── SceneProductRevealCopy
│   ├── SceneFeatureCopy
│   ├── SceneWorkflowCopy
│   └── SceneFinalCopy
├── ProductProofSection
├── CapabilityGrid
├── FinalCTA
└── Footer
```

### Important architectural decision

Use **one persistent WebGL canvas** for the cinematic sequence.

Do not create a new Canvas for every section.

The DOM content should remain real HTML for accessibility and crisp text.

---

# 11. Full Scroll Story

## Scene allocation

| Progress | Scene |
|---|---|
| `0%–20%` | Hero: cup appears and rotates |
| `20%–40%` | Product reveal: cup shifts and dashboard emerges |
| `40%–66%` | Feature constellation: modules separate in depth |
| `66%–84%` | Order workflow: order travels through the system |
| `84%–100%` | Reassembly and final CTA |

---

# 12. Scene 1 — The First Pour

## Purpose

Create immediate visual impact while establishing the coffee metaphor.

## Visual

- Full viewport, dark canopy background.
- Central stylized coffee cup.
- Warm rim light from upper left.
- Soft sage fill from rear right.
- Slow steam ribbons.
- Five to nine low-poly coffee beans at varied depth.
- Minimal header floating above.

## Copy

Eyebrow:

> CAFE OPERATIONS, REIMAGINED

Hero:

> Brew brilliance.  
> Run everything.

Support:

> Orders, kitchen, inventory and insights—one beautifully connected flow.

Mantra:

> BREW. SERVE. GROW.

CTA:

- Enter CafeCanopy
- See the workflow

## Scroll choreography

### `0%–6%`
- Background glow fades in.
- Cup rises from `y: 0.35` world units.
- Cup opacity/scale resolves from `0.92` to `1`.

### `6%–14%`
- Headline reveals by line with slight upward movement.
- Steam begins.
- Beans drift into depth, not across the text.

### `14%–20%`
- Cup rotates approximately `18°` on Y and `-5°` on X.
- Camera dollies forward subtly.
- Hero text fades and shifts upward.
- Cup begins moving to the right, preparing the reveal.

## Interaction

- Pointer movement may add at most `±2.5°` rotational influence.
- Disable pointer parallax on touch devices.
- Never allow drag orbit controls.

---

# 13. Scene 2 — The System Behind the Cup

## Purpose

Reveal that CafeCanopy is not about coffee imagery; it is a real operating system.

## Visual

- Cup moves to the right third.
- A product dashboard plane appears from behind the cup.
- The dashboard is actual React UI, not a blurry screenshot.
- Perspective and slight tilt create depth.
- A subtle scan of live order statuses animates inside the product frame.

## Copy

Heading:

> The whole café, in one view.

Support:

> From the first order to the final report, every team stays in sync.

Micro labels:

- Live orders
- Kitchen queue
- Inventory pulse
- Revenue today

## Scroll choreography

### `20%–28%`
- Cup shifts from center to `x: 1.7`.
- Camera rotates slightly left.
- Dashboard enters from `z: -2.4` toward `z: 0`.

### `28%–34%`
- Dashboard resolves from blur.
- UI rows stagger into view.
- Warm cup light reflects on the dashboard edge.

### `34%–40%`
- Dashboard grows to occupy the main visual field.
- Four module markers appear at their relevant areas.
- Text settles on the left.

## Product UI content

Use plausible demo data only. Never make the homepage depend on live authenticated API data.

Example:

- Orders today: `184`
- Avg. prep time: `06:42`
- Low stock alerts: `3`
- Revenue: `₹42,860`

---

# 14. Scene 3 — Feature Constellation

## Purpose

Explain core product capabilities without a boring grid.

## Feature modules

1. **Orders** — Accept, track, and complete orders.
2. **Kitchen** — Keep the queue clear and the team aligned.
3. **Inventory** — Know what is running low before service slows down.
4. **Analytics** — Understand what sells, when, and why.

## Visual

The single dashboard separates into four floating interface modules.

- Orders: upper left
- Kitchen: upper right
- Inventory: lower left
- Analytics: lower right
- A thin luminous flow line links all modules
- The cup becomes a small anchor in the background rather than the hero

## Scroll choreography

### `40%–48%`
- Dashboard surface tilts backward.
- Modules detach with controlled depth.
- Background grid becomes faintly visible.

### `48%–60%`
- Each module comes forward as its associated copy becomes active.
- Inactive modules remain visible but dimmed.
- Use a gentle camera pan instead of moving every module wildly.

### `60%–66%`
- Modules begin aligning into the workflow path.
- Connection line intensifies.
- Copy transitions to the workflow setup.

## Feature card visual language

- Real UI fragments.
- Clear title and one critical metric.
- Maximum two accent colors per module.
- No generic icon-only cards.

---

# 15. Scene 4 — From Order to Served

## Purpose

Show the operational workflow as one connected motion.

## Workflow

```text
Customer Order → Cashier Confirmation → Kitchen Queue → Ready → Served
```

## Visual

A single glowing order token travels through the four UI modules.

Token label:

> Order #C142

Example item:

> 2 × Cold Coffee  
> 1 × Paneer Wrap

## Scroll choreography

### `66%–71%`
- Order enters at the Orders module.
- Status changes to `Confirmed`.

### `71%–76%`
- Token follows the connection line to Kitchen.
- Prep timer begins.
- Status changes to `Preparing`.

### `76%–80%`
- Kitchen card highlights.
- Progress ring completes.
- Status changes to `Ready`.

### `80%–84%`
- Token arrives at final pickup point.
- A soft success pulse occurs.
- Status changes to `Served`.

## Copy

Heading:

> One order. Zero confusion.

Support:

> Every handoff is visible, timed and connected.

## Important

Do not gamify the flow. It should feel operational, not playful.

---

# 16. Scene 5 — Reassembly and Final Invitation

## Purpose

End the cinematic experience with clarity and action.

## Visual

- Modules return into a complete dashboard.
- Cup returns near the lower right as a visual signature.
- Dashboard faces the camera with minimal tilt.
- Background becomes calmer.
- Final CTA appears in real DOM above the canvas.

## Copy

Heading:

> Run your café smarter.

Support:

> Less chasing. Faster service. Better decisions.

Primary CTA:

> Enter CafeCanopy

Secondary CTA:

> Explore features

## Scroll choreography

### `84%–92%`
- Modules reassemble.
- Connection line collapses into the CafeCanopy mark.
- Camera settles.

### `92%–100%`
- Final copy reveals.
- CTA becomes active.
- 3D movement nearly stops.
- Scroll naturally continues into standard DOM sections.

---

# 17. Standard Sections After the Cinematic Sequence

The 3D sequence should not carry the entire page.

After the cinematic story, use lighter conventional sections.

## Product proof

Three concise proof cards:

- Faster order flow
- Clearer kitchen coordination
- Better stock visibility

## Capability grid

- Menu management
- Category management
- Order tracking
- Staff operations
- Inventory alerts
- Reports and insights

## Final CTA band

A quiet cream section with dark text can create contrast before the footer.

---

# 18. Header

## Desktop

- Transparent at page start.
- Becomes a dark translucent capsule after 8% scroll.
- Left: CafeCanopy wordmark.
- Center/right: Features, Workflow, About.
- CTA: Enter App.

## Mobile

- Wordmark.
- Single CTA or menu button.
- No complex expanding mega menu.
- Menu panel slides vertically with CSS transition.

---

# 19. Responsive Behavior

## Tablet

- Reduce bean count by 30%.
- Reduce camera travel by 25%.
- Keep feature modules in a tighter diamond formation.
- Keep text blocks at 44–52vw.

## Mobile

The mobile experience must be intentionally redesigned, not merely scaled.

### Mobile cinematic changes

- Cup remains central longer.
- Dashboard reveals below the cup rather than fully behind it.
- Feature constellation becomes a controlled vertical depth stack.
- Workflow token travels vertically.
- No pointer parallax.
- Steam particle count reduced by at least 50%.
- DPR capped at `1.5`.
- Total scroll distance reduced to `400–440vh`.

### Mobile copy

Use shorter headings and smaller support paragraphs.

### Mobile fallback

On low-power or WebGL-failed devices:

- Render a static premium cup illustration or CSS cup.
- Use DOM cards with GSAP opacity/translate transitions.
- Preserve the same story sequence and copy.

---

# 20. Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Disable pinned scrub timelines.
- Render scenes as regular vertical sections.
- Use opacity-only reveals of `150–220ms`.
- Keep the product dashboard fully accessible.
- Do not autoplay steam or bean motion.
- Keep CTA and navigation unchanged.

---

# 21. 3D Asset Strategy

## Phase 1 asset policy

Do not block implementation waiting for a `.glb` model.

Create a stylized procedural cup using Three.js primitives:

- Cylinder body
- Torus or curve-based handle
- Coffee surface disc
- Separate saucer
- Matte ceramic material
- Warm roughness
- No expensive transmission material

## Later optional upgrade

Replace with an optimized `.glb` model only if:

- Under `500 KB` compressed
- Meshes are named
- Textures are WebP/AVIF where supported
- No unnecessary 4K textures
- Draco or Meshopt compression is configured

## Steam

Use one of:

1. Transparent shader planes
2. Lightweight sprite particles
3. Curved line meshes with animated opacity

Do not use volumetric fog.

## Coffee beans

Use instanced geometry.

---

# 22. Dashboard Representation

Recommended approach:

- Build a real React dashboard mockup.
- Place it as a DOM layer with CSS perspective, or use Drei `<Html transform>`.
- Keep text legible.
- Use semantic HTML.
- Ensure it can be hidden from screen readers if it is purely duplicated decorative content.

Do not use a screenshot as the main dashboard reveal unless time constraints require it.

---

# 23. Suggested File Structure

Codex should adapt paths to the existing project.

```text
client/src/
├── pages/
│   └── HomePage.tsx
├── components/
│   └── home/
│       ├── HomeNavigation.tsx
│       ├── CinematicExperience.tsx
│       ├── StickySceneCanvas.tsx
│       ├── SceneOverlay.tsx
│       ├── ProductDashboardMockup.tsx
│       ├── ProductProofSection.tsx
│       ├── CapabilityGrid.tsx
│       ├── FinalCTA.tsx
│       └── scene/
│           ├── ProceduralCoffeeCup.tsx
│           ├── SteamParticles.tsx
│           ├── CoffeeBeanField.tsx
│           ├── LightingRig.tsx
│           └── DashboardPortal.tsx
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useWebGLSupport.ts
│   └── useResponsiveQuality.ts
├── lib/
│   └── homeMotion.ts
└── styles/
    └── cafe-home.css
```

If the codebase uses feature folders, preserve its convention.

---

# 24. Component Responsibilities

## `CinematicExperience`

- Owns the scroll container.
- Registers GSAP ScrollTrigger.
- Converts scroll into normalized progress.
- Passes scene progress to the Canvas and overlays.
- Cleans up timeline on unmount.

## `StickySceneCanvas`

- Owns one R3F Canvas.
- Provides quality settings.
- Does not directly read window scroll on every frame.
- Receives normalized progress through refs or a lightweight state mechanism.

## `SceneOverlay`

- Real HTML copy.
- Active scene based on progress.
- Screen-reader friendly.
- No text rendered into WebGL textures.

## `ProductDashboardMockup`

- Reusable product interface.
- Demo data only.
- Scales from desktop to mobile.

## `useResponsiveQuality`

Returns settings such as:

```ts
{
  dpr: 1.5,
  beanCount: 7,
  steamCount: 4,
  enablePostProcessing: false,
  shadows: true
}
```

---

# 25. GSAP Integration Rules

Use `@gsap/react`.

Pattern:

```tsx
const root = useRef<HTMLDivElement>(null);

useGSAP(
  () => {
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    // timeline segments
  },
  { scope: root }
);
```

Rules:

- Register plugins once.
- Use `gsap.context()` or `useGSAP`.
- Kill ScrollTriggers on unmount.
- Refresh after fonts/assets load.
- Avoid calling React state setters on every scroll tick.
- Prefer refs for high-frequency 3D values.
- Recalculate on breakpoint changes carefully.
- Never create duplicate timelines in React Strict Mode.

---

# 26. React Three Fiber Rules

- One Canvas.
- `frameloop="demand"` is allowed only if animation invalidation is handled correctly.
- Otherwise use default frameloop with simple geometry.
- Cap DPR.
- Avoid expensive post-processing in Phase 1.
- Use `InstancedMesh` for beans.
- Reuse geometries and materials.
- Dispose assets on unmount.
- Avoid dynamic allocations inside `useFrame`.
- Do not use OrbitControls.
- Do not use real-time environment reflections if they hurt performance.

---

# 27. Performance Budget

## Targets

- Initial homepage JS added by the cinematic feature: ideally under `250 KB` gzip beyond existing app, excluding Three where unavoidable.
- First content visible within `2.5s` on a reasonable connection.
- Desktop animation target: stable `50–60 FPS`.
- Mobile target: stable `30–45 FPS`.
- No long task over `200ms` during scroll.
- No layout shift when Canvas mounts.

## Techniques

- Lazy-load the 3D experience after critical copy.
- Show immediate static hero shell.
- Dynamically import the Canvas component.
- Preload only essential assets.
- Use CSS containment where useful.
- Pause animation when tab is hidden.
- Reduce quality when device memory or viewport indicates a constrained device.
- Avoid smooth-scroll libraries until the native version is stable.

---

# 28. Accessibility

- All CTA controls must be native links or buttons.
- Maintain visible focus states.
- Contrast must meet WCAG AA.
- Provide a skip link.
- Do not trap focus in the cinematic section.
- Decorative Canvas must use `aria-hidden="true"`.
- Essential product explanation must exist in DOM text.
- Respect reduced motion.
- All navigation works by keyboard.
- The page must remain understandable with JavaScript-disabled fallback copy where feasible.

---

# 29. SEO and Semantics

- One clear `h1`.
- Each major section has an `h2`.
- Add homepage title and description.
- Product name appears naturally in copy.
- Do not hide critical copy inside Canvas.
- Add Open Graph metadata only if the project already has a metadata strategy.
- Avoid stuffing generic SaaS keywords.

Suggested description:

> CafeCanopy is a connected café management platform for orders, kitchen operations, inventory and business insights.

---

# 30. Audio Policy

No autoplay sound.

An optional muted sound toggle may be considered later, but it is outside the initial scope.

---

# 31. Implementation Phases

## Phase 0 — Audit and plan

Codex must:

- Inspect `client/package.json`.
- Locate homepage and routing.
- Identify styling system.
- Identify current brand assets and logo.
- List files to modify.
- Confirm current build commands.
- Report risks.
- Make no code changes.

## Phase 1 — Hero shell and procedural cup

Deliver:

- Static accessible hero.
- Lazy-loaded Canvas.
- Procedural cup.
- Basic light rig.
- Steam and beans.
- Hero scroll transformation.
- Reduced-motion fallback.
- Responsive behavior.

## Phase 2 — Product reveal

Deliver:

- Dashboard mockup.
- Cup side movement.
- Camera transition.
- Product metrics.
- Section copy.
- Mobile arrangement.

## Phase 3 — Feature constellation

Deliver:

- Four product modules.
- Connected flow line.
- Scroll-driven focus transitions.
- No generic feature grid inside the cinematic sequence.

## Phase 4 — Workflow

Deliver:

- Order token.
- Status changes.
- Kitchen timer.
- Ready and served states.
- Accessible DOM explanation.

## Phase 5 — Final CTA and standard sections

Deliver:

- Reassembly.
- CTA.
- Product proof.
- Capability grid.
- Footer transition.

## Phase 6 — Quality pass

Deliver:

- Build and lint fixes.
- Performance profiling.
- Reduced-motion review.
- Mobile review.
- Browser fallbacks.
- Final change log.

---

# 32. Acceptance Criteria

The homepage is complete only when all are true.

## Visual

- The first screen looks premium without scrolling.
- Cup, dashboard and text do not overlap at standard breakpoints.
- The cinematic story is understandable.
- The final CTA is obvious.
- The visual style feels café-specific and not generic SaaS.

## Motion

- Scroll progress feels smooth.
- No major snapping unless intentionally designed.
- No sudden text flashes.
- No repeated entrance animations when scrolling slightly.
- No horizontal overflow.
- Reduced-motion mode works.

## Technical

- `npm run build` passes.
- TypeScript passes.
- Lint passes or only pre-existing warnings remain.
- No console errors.
- GSAP and event listeners clean up.
- Existing routes and APIs still work.
- Server folder is untouched.

## Performance

- Canvas lazy-loads.
- DPR is capped.
- Mobile scene is simplified.
- No unnecessary 4K images or large models.
- No severe frame drops on normal devices.

---

# 33. Master Codex Prompt

Copy the full prompt below into Codex with this Design Gita attached.

---

## CODEX MASTER PROMPT

You are working inside the CafeCanopy repository.

The repository contains a React + TypeScript + Vite frontend in `client/` and a separate backend in `server/`.

Read the attached **CafeCanopy Design Gita** completely before doing anything.

### Your role

Act as a senior creative frontend engineer experienced with:

- React
- TypeScript
- Vite
- GSAP and ScrollTrigger
- React Three Fiber
- Three.js performance
- Responsive product design
- Accessibility
- Web performance

### Non-negotiable constraints

- Work on the public homepage only.
- Do not modify backend code.
- Do not change API contracts, authentication, database logic, or existing application features.
- Do not replace existing routes.
- Preserve the current project architecture and style conventions where practical.
- Do not begin implementation immediately.

### First task: audit and plan only

Inspect:

1. `client/package.json`
2. `client/src`
3. Current homepage component
4. Routing configuration
5. Styling system
6. Existing logo and brand assets
7. Existing responsive patterns
8. Current build, type-check and lint commands
9. Whether the approved animation packages are installed
10. The route used to enter the existing application

Then return:

1. Current frontend architecture
2. Exact homepage file path
3. Existing dependencies relevant to the redesign
4. Conflicts between the current project and the Design Gita
5. Files you propose to create or modify
6. Implementation plan by phase
7. Performance plan
8. Mobile fallback plan
9. Accessibility plan
10. Any questions that genuinely block implementation

Do not edit files until I explicitly approve the plan.

### After approval

Implement only the phase I request.

After every phase:

- Run the relevant build command.
- Run TypeScript checks.
- Run lint.
- Fix errors introduced by your changes.
- Report all files changed.
- Explain major architectural choices.
- Report any remaining risks.
- Do not continue to the next phase without approval.

---

# 34. Phase Prompts for Codex

## Prompt A — Approve audit and begin Phase 1

Proceed with Phase 1 only.

Implement the accessible homepage shell and the cinematic hero described in the Design Gita:

- hero navigation
- hero copy
- lazy-loaded persistent R3F Canvas
- procedural coffee cup
- light rig
- subtle steam
- instanced coffee beans
- pinned/scrubbed hero transformation
- responsive layout
- reduced-motion fallback
- non-WebGL fallback

Do not build the dashboard reveal or feature constellation yet.

Use the existing project styling conventions where possible.

After implementation:

1. Run the development build or production build.
2. Run TypeScript checks.
3. Run lint.
4. Fix all errors introduced by the phase.
5. Report packages installed.
6. Report files created and changed.
7. Explain how to test the hero.
8. Stop and wait.

## Prompt B — Phase 2

Proceed with Phase 2 only.

Implement the product reveal:

- move the cup toward the right on desktop
- reveal a real React dashboard mockup
- animate dashboard depth, scale and blur
- show the demo metrics from the Design Gita
- add the “The whole café, in one view.” copy
- maintain mobile, reduced-motion and fallback behavior
- keep the existing Phase 1 architecture

Do not implement the feature constellation yet.

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt C — Phase 3

Proceed with Phase 3 only.

Implement the feature constellation:

- Orders
- Kitchen
- Inventory
- Analytics
- real UI fragments rather than generic icon cards
- controlled 3D separation and focus
- connected flow line
- responsive vertical depth stack on mobile
- accessible DOM descriptions

Do not implement the order token workflow yet.

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt D — Phase 4

Proceed with Phase 4 only.

Implement the scroll-driven order workflow:

- Order #C142
- Confirmed
- Preparing
- Ready
- Served
- visual connection through the four modules
- operational, premium motion
- no playful gamification
- accessible text explanation
- mobile vertical workflow

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt E — Phase 5

Proceed with Phase 5 only.

Implement:

- module reassembly
- final dashboard state
- “Run your café smarter.” CTA scene
- navigation to the existing application route
- product proof section
- capability grid
- final CTA band
- footer transition

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt F — Phase 6

Perform the final quality pass.

Audit and improve:

- responsive behavior
- reduced-motion behavior
- WebGL fallback
- keyboard navigation
- focus styles
- color contrast
- GSAP cleanup
- React Strict Mode behavior
- bundle size
- Canvas loading
- device quality settings
- horizontal overflow
- console warnings
- layout shift
- performance bottlenecks

Do not change product functionality.

Run all available checks and return a final release report.

---

# 35. Final Rule

The homepage succeeds when it feels like a product story, not an animation demo.

**Coffee is the opening image.  
Operations are the real subject.  
CafeCanopy is the system connecting both.**


---

# CafeCanopy Codex Handoff



Copy the full prompt below into Codex with this Design Gita attached.

---

## CODEX MASTER PROMPT

You are working inside the CafeCanopy repository.

The repository contains a React + TypeScript + Vite frontend in `client/` and a separate backend in `server/`.

Read the attached **CafeCanopy Design Gita** completely before doing anything.

### Your role

Act as a senior creative frontend engineer experienced with:

- React
- TypeScript
- Vite
- GSAP and ScrollTrigger
- React Three Fiber
- Three.js performance
- Responsive product design
- Accessibility
- Web performance

### Non-negotiable constraints

- Work on the public homepage only.
- Do not modify backend code.
- Do not change API contracts, authentication, database logic, or existing application features.
- Do not replace existing routes.
- Preserve the current project architecture and style conventions where practical.
- Do not begin implementation immediately.

### First task: audit and plan only

Inspect:

1. `client/package.json`
2. `client/src`
3. Current homepage component
4. Routing configuration
5. Styling system
6. Existing logo and brand assets
7. Existing responsive patterns
8. Current build, type-check and lint commands
9. Whether the approved animation packages are installed
10. The route used to enter the existing application

Then return:

1. Current frontend architecture
2. Exact homepage file path
3. Existing dependencies relevant to the redesign
4. Conflicts between the current project and the Design Gita
5. Files you propose to create or modify
6. Implementation plan by phase
7. Performance plan
8. Mobile fallback plan
9. Accessibility plan
10. Any questions that genuinely block implementation

Do not edit files until I explicitly approve the plan.

### After approval

Implement only the phase I request.

After every phase:

- Run the relevant build command.
- Run TypeScript checks.
- Run lint.
- Fix errors introduced by your changes.
- Report all files changed.
- Explain major architectural choices.
- Report any remaining risks.
- Do not continue to the next phase without approval.

---

# 34. Phase Prompts for Codex

## Prompt A — Approve audit and begin Phase 1

Proceed with Phase 1 only.

Implement the accessible homepage shell and the cinematic hero described in the Design Gita:

- hero navigation
- hero copy
- lazy-loaded persistent R3F Canvas
- procedural coffee cup
- light rig
- subtle steam
- instanced coffee beans
- pinned/scrubbed hero transformation
- responsive layout
- reduced-motion fallback
- non-WebGL fallback

Do not build the dashboard reveal or feature constellation yet.

Use the existing project styling conventions where possible.

After implementation:

1. Run the development build or production build.
2. Run TypeScript checks.
3. Run lint.
4. Fix all errors introduced by the phase.
5. Report packages installed.
6. Report files created and changed.
7. Explain how to test the hero.
8. Stop and wait.

## Prompt B — Phase 2

Proceed with Phase 2 only.

Implement the product reveal:

- move the cup toward the right on desktop
- reveal a real React dashboard mockup
- animate dashboard depth, scale and blur
- show the demo metrics from the Design Gita
- add the “The whole café, in one view.” copy
- maintain mobile, reduced-motion and fallback behavior
- keep the existing Phase 1 architecture

Do not implement the feature constellation yet.

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt C — Phase 3

Proceed with Phase 3 only.

Implement the feature constellation:

- Orders
- Kitchen
- Inventory
- Analytics
- real UI fragments rather than generic icon cards
- controlled 3D separation and focus
- connected flow line
- responsive vertical depth stack on mobile
- accessible DOM descriptions

Do not implement the order token workflow yet.

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt D — Phase 4

Proceed with Phase 4 only.

Implement the scroll-driven order workflow:

- Order #C142
- Confirmed
- Preparing
- Ready
- Served
- visual connection through the four modules
- operational, premium motion
- no playful gamification
- accessible text explanation
- mobile vertical workflow

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt E — Phase 5

Proceed with Phase 5 only.

Implement:

- module reassembly
- final dashboard state
- “Run your café smarter.” CTA scene
- navigation to the existing application route
- product proof section
- capability grid
- final CTA band
- footer transition

Run build, type-check and lint, fix introduced issues, report changes and stop.

## Prompt F — Phase 6

Perform the final quality pass.

Audit and improve:

- responsive behavior
- reduced-motion behavior
- WebGL fallback
- keyboard navigation
- focus styles
- color contrast
- GSAP cleanup
- React Strict Mode behavior
- bundle size
- Canvas loading
- device quality settings
- horizontal overflow
- console warnings
- layout shift
- performance bottlenecks

Do not change product functionality.

Run all available checks and return a final release report.

---

# 35. Final Rule

The homepage succeeds when it feels like a product story, not an animation demo.

**Coffee is the opening image.  
Operations are the real subject.  
CafeCanopy is the system connecting both.**
