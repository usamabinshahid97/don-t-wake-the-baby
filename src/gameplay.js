/**
 * Shared gameplay seam, intentionally idle until the gameplay facet implements the loop.
 * State identity is stable across reset; tasks are ordered IDs, completed count starts at 0.
 * phase: 'scene' initially (future phases belong to gameplay); noise: 0..100;
 * nearestTask: task ID or null; interactionProgress: 0..1; moving/sneaking: booleans.
 * eventId: monotonic counter within a run, reset to 0; lastEvent: null or a gameplay event.
 * Consumers react when eventId changes, without writing gameplay state.
 * babyMood starts as 'sleeping'; gameplay owns future mood values and event payloads.
 * Read input only from update(dt, ctx), using studio's ctx.keys/look/wheel and ctx.rng.
 */
export function createGameplay(app) {
  const state = {};
  function reset(seed = 1) {
    Object.assign(state, {
      phase: "scene", noise: 0, tasksCompleted: 0, tasks: ["water", "pacifier", "toy", "door"],
      sneaking: false, moving: false, nearestTask: null, interactionProgress: 0,
      eventId: 0, lastEvent: null, babyMood: "sleeping",
    });
  }
  reset();
  return {
    state,
    reset,
    update(dt, ctx) { /* Gameplay facet owns movement, interactions, noise and outcomes. */ },
    probes() { return { ...state, tasks: [...state.tasks] }; },
  };
}
