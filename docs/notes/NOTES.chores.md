# Stealth and chores — iteration 2

## Move

Holding E now tiptoes on approach and automatically brakes inside the nearest chore's
reachable area, even with movement keys held. Progress survives a 1.5-second grace period,
then slowly decays. A small reach hysteresis prevents tiny slips from changing a partial
chore. Replay clears progress and restores the original night. Furniture physics and the
accepted quiet-win route are unchanged.

TIPTOE / RUSHING / STEADY HANDS canvas feedback shows the real footstep noise rates and
uses small mint dots versus large orange noise rings. All items share the existing HUD.
The new `tiptoe-vs-rush` and `steady-hands` demos drive real ctx inputs and expose the
quietness, automatic brake, retained progress and resumed hold results.

## Identity and seams

The quiet-win return now contains `state: {phase, tasksCompleted, noise}` from the actual
final simulation, retaining won/route/noise. The input route is unchanged.
The periodic event is named `toy-alarm` for audio/presentation; the events log is retained.
Fallback requires explicit presentation kind/name/id or handlesHud. A character bindHud
alone does not suppress gameplay controls. A presentation extension removes all fallback
markers rather than drawing both sets. State identity and the four ordered task IDs stay stable.

## Fixed by looking

The accepted frame hid the tiny pacifier under its label. Fallback target labels now sit
above their anchors so the object remains visible on the rug. The initial new frame shows
the quiet-slippers panel and E approach instruction in the primary camera.
Character wake reactions and the home worker's pacifier meshes await integration; no
character/world geometry, room expansion or generated assets were added by this facet.

## Verification

Final stepped quiet-win finishes all four at ~18 noise; wake/replay returns both flags true.
New movement comparison: 1.2 seconds gives quiet 9.33 versus rush 14.28 noise from equal seeds.
Steady-hands reports braked=true, progressRetained=true and resumed=true at ~80.6% progress.
Rendered browser assertions passed the exact nested quiet-win result state, HUD handoff
(character bindHud keeps fallback; presentation id removes it), 1 HUD/0 DOM UI, saved progress
completion, and the toy-alarm event mapping. Primary-camera captures show the preserved 81%
pacifier hold and orange rush noise rings. Live D reached stirring and 100-noise loss; R
restored spawn, tasks, baby mood and an unstarted night. The final tension regression also
checks pre-action reading, continuing timers while idle, boundary loss/replay, and quiet win. Git metadata is read-only, so checkpoint commits are kept
in the writable temporary bare repository, with the workspace edits left for Studio integration.

## Playtest boundary issue and correction

Read director/play_1/playtest.json: all four chores won at noise 42 and R worked, but a
25-second edge hold drained noise to zero. The old loop used actual displacement as the
rest/urgency gate. It now separates movementIntent from moving: blocked holds generate effort
noise, cannot rest, and count blockedTime. E's auto-brake still permits quiet work.

nightStarted gates reading safety until the first action. Afterwards nightTime and unanswered
toy/door timers advance by dt while idle. Ongoing toy noise exceeds resting settlement;
silencing it cuts 12 noise and restores stronger settlement. The unresolved door keeps a
small source and floor during rest. Audio events stay toy-alarm and door-knock; events is retained.

Probes expose nightStarted/nightTime, movementIntent/blockedMovement/blockedTime/resting,
toyTimer/doorTimer, toyAlarmIn/doorKnockIn, sourceNoiseRate and noiseFloor. Loss/replay demo
holds D for 25 seconds via the same update/input functions and reports real stirred/blocked
loss evidence, then presses R. No optional rooms, tasks, geometry or assets were added.

Final rendered regression passed with no console errors: quiet-win returns truthful
state.phase=won, tasksCompleted=4, noise=17.9107 and matches live state. Boundary loss/replay
reports woke=true/replayed=true with a real stirring event and blocked time. Pre-action
120-second reading remains safe; after first movement, stationary timers emitted toy-alarm
and door-knock while noise rose. Repeating the same seeded input route gave identical results.
All temporary index.html test runners were removed; main.js, studio.js, character/world
files and assets remain unchanged. Final source has one canvas HUD, no DOM UI, and ctx-only
input. Primary-camera win/loss/progress/rush frames were inspected. Local checkpoint bundle
is /tmp/chores-iteration2.bundle, based on accepted commit 198f18b; workspace edits remain
ready for Studio's merge because external worktree Git metadata is read-only here.
