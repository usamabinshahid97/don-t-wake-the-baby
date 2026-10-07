# Nighttime comedy audio

Built `createAudio(app)` in `src/audio.js`, wired with exactly one import and one init in the entry's FACET WIRING block. No other game code edited. Generated two SFX after authoritative status reported accountVerified true, accepted terms, no pause, spendable 165. Two creates only, 2 credits quoted each; waited using each remote generation ID. Both exact delivered MP3 paths are preserved in code and `assets/src/audio/generated.json`. Existing bunny untouched. No music, voices, SDK or publication work.

The subsystem starts muted, creates/resumes Web Audio only when ctx has held input AND navigator.userActivation.hasBeenActive proves a real browser gesture. No new listeners, no direct keyboard/mouse reads. A tiny quiet ready cue confirms unlock. M toggles mute through ctx; replay preserves browser permission and mute preference. `unlock()` is exposed for the integration owner if a browser needs a synchronous trusted-gesture hook; this preview did not need one. All gameplay scheduling uses dt and eventId. Seeded procedural noise uses an LCG, not Math.random. AudioContext.currentTime is only the output clock for envelopes, never simulation time. Reset cancels pending cues and stops sources. Locked/muted events are consumed and discarded without backlog. Generated files load only from local delivered URLs, no remote calls in game. While decode is pending or fails, disclosed procedural duck/toy fallbacks are available; final live probe showed no fallback needed.

Procedural sounds: walking/sneaking footsteps, water pour, three door knocks, small completion chirps, comic ascending wake sting, three-note win, quiet unlock cue. No ambient layer. Probes: audioLoaded (decoded generated count), audioGenerated, audioUnlocked, audioMuted, audioPlayedEvents, audioGeneratedPlayed, audioLastSound, audioPending, audioLoadError, audioContextState, audioProceduralFallback.

## Exact gameplay events for chores/integration

Read only app.gameplay.state. Increment eventId whenever lastEvent changes. Events normalize case, spaces and underscores to hyphens. Recommended events:

- `duck-squeak` (or `squeak`): generated duck; `hazard`/`noise`/`bump`/`task-fail` also works when task or text contains duck/squeak.
- `toy-alarm` (or `toy-beep`, `toy-trigger`, `alarm`): generated alarm; `hazard`, `noise`, or `task-start` with task `toy` also works. Emit once per alarm occurrence, not each frame.
- `task-start` with task `water` (or `water-pour`): water sound. `interact`/`interaction-start` with task `water` also works.
- `door-knock` (or `doorbell`): three knocks. `task-start`/`interact`/`interaction-start` with task `door` also works.
- `task-complete` with any task: completion chirps. Aliases task-completed/complete/chore-complete; a rising tasksCompleted also gives a completion cue when no complete event was emitted. `toy-off`, `toy-stopped`, `pacifier-found` also produce a chirp.
- `won`/`lost` or phase transitions to won/lost: win/wake motifs; events and same-frame phase transitions are deduplicated. Event aliases win/victory, lose/wake/baby-woke/baby-wake/game-over.

Footsteps require phase playing and moving; sneaking reduces cadence/volume, noise modestly raises walking volume. Only lastEvent is available: multiple events overwritten before a single update cannot all be reconstructed; integration should expose the desired audible event that frame. No audio mutates gameplay state.

## Fixed by looking

Opened baseline `c1_default.jpg`, live `s1_screen.jpg`, and asset inspection screenshot. Dollhouse composition, crib, parent, existing bunny and three original HUD labels remained visible. No added HUD or visual changes. Final camera capture also inspected; console had no errors.

## Verification and limits

- Syntax check passed. An ephemeral Node VM harness with mocked Web Audio passed genuine activation gating (injected keys alone cannot unlock), both generated sample mappings, eventId deduplication, identical seeded dt replay counts/queues, win motif, mute persistence, reset cancellation and no stale muted event replay. This is a scheduling test, not a speaker test.
- Actual preview: initial audioUnlocked false, audioMuted true. Real computer W hold unlocked; audioLoaded 2, audioGenerated 2, audioContextState running, audioLoadError null, audioProceduralFallback false, audioPlayedEvents 1, lastSound ready. M hold changed audioMuted to true exactly once. Unmuting checked again. No console errors.
- inspect_use for both delivery jobs confirmed exact local files loaded; both returned verification unavailable-audio: no matching HTML media element, Web Audio buffers not observed. No verify_use claim was made. Physical speaker output and generated effect playback were not certified.
- HARNESS: generated-audio-playback cannot be established by inspect_use for Web Audio buffers. The actual foundation is still idle: phase scene, moving false, eventId 0; W does not move and E cannot perform chores. Generated chore effects and full outcome audio therefore could not be triggered in this live copy. Integration must run the real chore loop with the events above. No out-of-scope foundation/gameplay edits were made.
- A concurrent reload/capture first aborted the preview navigation; sequential reload then succeeded. Final checks use the working sequential preview.

Stopped after useful audio subsystem. No commit.
