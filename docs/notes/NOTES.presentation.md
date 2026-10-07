# Presentation facet — iteration 3

## Delivered against merged gameplay

The worktree is now integrated on 7096b02. Recovered the previous attempt's large comic
feedback layout, then replaced its caption consumption to work with actual gameplay events.
Progress, completion, noisy mistakes, quiet win, baby waking and replay are now verified by
real inputs and real gameplay demos. No authored state or fake HUD snapshots were used for
this iteration's screenshot evidence. Stop here at the prescribed feedback/outcome ladder.

Only `src/presentation.js` and this notes file changed. Main wiring remains the existing one
import/one push. No rooms, objects, task markers, meshes, world materials, gameplay, audio,
character rigs, input handlers or second HUD were added or modified.

## Feedback mechanism

- Each active chore gets a large named headline with percentage, Hold E instruction and
  progress bars in its task row and footer (`PACIFIER RESCUE · 50%`, for example).
- Completion gets a mint chore-specific punchline, completed-errand count, bold checkmark
  and brief mint underline. The nearest/current chore is named beside the task counter.
- Noisy mistakes get coral headlines and +noise context. Stomp: `THUMP. STEALTH: 0/10.`;
  duck: `QUACK. THE DUCK IS A SNITCH.`; other squeaks: `SQUEAK. BETRAYAL.`.
- Toy warning (`UNINVITED ENCORE.`), door knock (`WHO KNOCKS AT 2:13 AM?`) and baby stirring
  (`WAS THAT AN EYE TWITCH?`, amber) are separate messages. The baby status remains separate.
- Won/lost outcomes preserve the entire dollhouse and immediately show R replay plus M mute.
  M is also visible during play. The audio facet continues to own mute behavior.

The original problem was an event-consumption mechanism: every new event, including a
footstep with no text, erased the caption. Gameplay also emits noise and then mood in the
same step, so lastEvent alone can miss the noise. Presentation now reads the optional bounded
shared `events` history since its previous ID, selects the latest meaningful non-mood event,
and falls back to lastEvent when no history is available. Footsteps and empty events cannot
erase an existing caption. Mood is displayed on its own when no higher-priority event shares
that sample. State-only completion changes remain a defensive fallback.

One caption lasts four simulated seconds; there is no event queue or comic sequence system.
Repeated IDs do not replay flashes or captions. Noise uses an explicit gameplay event amount
when provided, otherwise the actual observed noise change; the event.noise total is not
misread as a delta. The existing text/bar cache still suppresses identical HUD API writes.
Timer changes alone do not repaint; progress is quantized to 1%; resize invalidates once.
Reset baselines the new source state and clears feedback. Won/lost copy overrides transients.
The shared state shape and eventId/lastEvent contract were not changed.

## Real deterministic review demos

Registered `presentation-chore-progress`, `presentation-chore-complete` and
`presentation-noisy-mistake` through the existing extension demos seam. The first two reuse
the actual quiet-win route and stop at an actual 50% interaction/first completion checkpoint.
They split fixed-step calls only during review, restore the original studio step method in
finally, and release held keys. The noise demo uses Space through studio's real held-key path.
No demo writes gameplay state, scores, noise, completion or transforms. Existing quiet-win,
wake-the-baby and wake-and-replay remain the full-loop outcome/replay tests.

## Fixed by looking — real screenshot evidence

All captures below used the integrated dollhouse and gameplay, viewed from the primary
camera's same position. Temporary capture camera aliases only invoked actual demos; they
were removed afterward. Temporary resize code only changed the existing canvas/camera size
and was also removed. There are no mock views or forced dimensions in the shipped module.

- c1_default: accepted presentation on merged world before changes.
- c2_default: updated default HUD with current/next chore and M hint; dollhouse remains clear.
- s1_screen: clicked/focused canvas, held W 1.2s, A 0.8s, tapped Space. Parent moved from
  (-0.4, 0.1, 1.25) to (-3.88438, 0.1, -0.43106), distanceTravelled 5.1079m. Noise rose from
  zero to about 23. The frame visibly shows the new THUMP punchline and +16 noise.
- c3_presentation-progress-shot: actual pacifier interaction at 50%, target reached by real
  tiptoe input. Both progress bars, percentage and Hold E instruction are visible.
- c3_presentation-complete-shot: real pacifier completion, 1/4 checkmark, mint underline,
  `PEACE PLUG: FOUND.` and actual `Tiny peace treaty secured.` event text.
- c3_presentation-noise-shot: actual Space stomp, 24 noise, THUMP/+16 feedback.
- c3_presentation-win-shot: real quiet-win completes all four chores at about 20 noise;
  parent relief pose, `PARENT OF THE NIGHT.` and R replay/M mute remain readable.
- c3_presentation-wake-shot: real wake-the-baby reaches 100 noise; visibly awake/crying baby,
  `YOU WOKE THE BOSS.` and R replay/M mute.
- c3_presentation-replay-shot: real wake-and-replay reports woke=true, replayed=true; HUD and
  characters return to sleeping, 0/4, about 8 noise, with all interaction bars cleared.
- c4_toy-warning / c5_door-warning: real Shift+W/S shuttling produces the game's timed toy
  and door warnings, each with its distinct headline and observed +4 noise.
- c6_progress-640 / c7_progress-480: actual 50% pacifier progress after resizing the existing
  canvas to 640×400 / 480×320. Headline, task bars, prompt and all controls fit below/beside
  the dollhouse without clipping. No new markers were added.
- c8_default: restored production module at 960×600, no test aliases or resize code;
  console errors none. Subsequent live M press changed audioMuted false→true after unlock.

Capture root:
`/Users/usamabinshahid/Library/Application Support/Genex/runs/run_muy4m15o5n23/facet_presentation/self/iter_003/`
Each named capture is a .jpg in that directory. All images were opened and inspected.

## Checks and validation

- hud-reads: four chores, labeled noise, controls and complete dollhouse remain readable.
- single-display / no-dom-ui / single-hud: actual integrated characterContract inspection
  reports hudObjects=1 and visibleDomElements=0; no additional scene objects exist here.
- The prior dead-input HARNESS flag described the old idle fork and is obsolete for these
  captures: clicked/focused scripted controls produced 5.1m of real movement and real noise.
  Input/mechanics remain owned by chores, not this facet.
- Node syntax and git diff whitespace checks pass.
- Mock-HUD assertions (separate from screenshot evidence) pass for completion surviving
  footsteps/empty events, same-step squeak+mood history consumption, distinct toy/door/mood
  messages, stomp and measured/explicit noise amounts, one-shot flash, lifetime/expiry/reset,
  named progress, terminal priority/M hints, no unchanged-state API churn, and no game-state
  mutation. Real gameplay demos additionally verify the actual triggers and outcomes above.

## Prior attempts

Iteration 1 established the accepted single-canvas presentation and passed all four identity
checks. Iteration 2 was rejected because its idle-fork reviews never delivered live feedback;
its mock layout proof did not establish gameplay behavior. This iteration replaces that gap
with merged gameplay and real input/demo captures, and fixes the event-erasure mechanism.
No additional optional system is required or planned.
