# Presentation facet — iteration 1

## Visible move

Added `src/presentation.js`, exporting `createPresentation(app)` with `name` and `id`
both `presentation`, and bindHud/update/reset/probes hooks. Main changed by exactly one
import and one extension push within FACET WIRING. No other game module changed.

The existing single canvas HUD now frames the dollhouse with a warm title, four midnight
errands, completion checkmarks/count/bar, labeled 0–100 noise meter (mint/amber/coral),
baby mood, nearest-task Hold E prompt and progress, movement/tiptoe/replay hints, and brief
comic feedback. Won: “PARENT OF THE NIGHT.” Lost: “YOU WOKE THE BOSS.” Both show R replay.
The three base HUD IDs are removed consistently during bindHud. No title screen blocks input.

## Shared integration contract

Reads only `app.gameplay.state`; no state shape changes, input handlers, or gameplay writes.
`tasks` retains ordered ID semantics. Optional `completedTasks` takes precedence over the
ordered `tasksCompleted` fallback. Missing state renders defensively. Noise is clamped and
rounded; interactionProgress is clamped and quantized to 1%. Completed nearest tasks hide
their interaction prompt. `eventId` gates a 3.5 simulated-second caption from `lastEvent.text`,
or completion/noise comic copy. Completion gives a very subtle cream flash, never a red wash.
Gameplay should suppress its fallback HUD when a presentation extension exists.

Identical text/bar payloads do not call the HUD API again. Viewport changes invalidate the
cache once, including size changes that keep the same rounded font size. Reset clears only
presentation transients and rerenders the freshly reset shared state. Probes are nested under
`presentation` and do not override gameplay keys.

## Fixed by looking

- Compared the initial reference/live frame with captures c1/c2: the previously empty margin
  now carries four readable chores, while the entire dollhouse remains visible.
- Checked actual canvas/camera resize captures: c3 at 640×400, c7 at 480×320, and c8 at
  800×600. Smaller layouts reduce type sizes and compact the control line; the narrow layout
  puts noise below the title. No prompt, control, or task text is clipped in these frames.
- Presentation-only input fixtures showed out-of-order checkmarks, highlighted pacifier,
  63% Hold E progress, coral 76% noise and stirring mood in c4; won copy/checkmarks in c5;
  lost copy/awake mood in c6. These fixtures replaced the presentation reader only, never
  gameplay state, and are absent from the shipped module. After looking, replaced the
  future-tense danger label on outcomes with phase-appropriate copy.
- c9 inspected the real live studio graph: `count('hud') === 1` and `domUi().length === 0`.
  The temporary inspection was removed. Final c10 is the restored production module at
  960×600, with no fixtures or forced dimensions; console errors: none.

Capture root:
`/Users/usamabinshahid/Library/Application Support/Genex/runs/run_muy4m15o5n23/facet_presentation/self/iter_001/`
All referenced cN frames are `cN_default.jpg`, from the registered primary `default` camera.

## Checks and validation

- hud-reads: visually verified controls, four chores and labeled noise at every tested size.
- single-display / no-dom-ui / single-hud: live graph inspection reported one HUD and zero
  visible DOM UI elements. No scene objects or additional overlay canvases were created here.
- Node syntax check passes. Mock-HUD assertions pass for idle/missing state safety, 100
  unchanged updates making zero additional HUD writes, out-of-order completions, warning
  color, mood, progress, event expiry, outcome/replay copy, and shared-state immutability.
- Required W 1.2s / A 0.8s / Space input sequence was driven in the live window. In this
  isolated copy the idle gameplay stub leaves parent position (-0.4, 0.1, 1.25) unchanged.
  Movement remains the gameplay facet's responsibility.

## Remaining integration validation

Actual task interactions, naturally rising noise, baby animation transitions, achievable
win/loss and R replay cannot be played through against the idle `phase: 'scene'` gameplay
stub. Outcome screenshots prove presentation handling of the agreed state values only.
Retest real completion/events/outcomes after gameplay merges. No assets were needed for
this canvas-only facet; the existing dollhouse and characters remain the visual foundation.
