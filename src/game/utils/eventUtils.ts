// src/game/utils/eventUtils.ts
import EventBus from '../EventBus';

export interface EventHandler {
    event: string;
    handler: (...args: unknown[]) => void;
    context?: unknown;
}

/**
 * Registers multiple event handlers at once
 */
export function registerEventHandlers(handlers: EventHandler[]): void {
    handlers.forEach(({ event, handler, context }) => {
        EventBus.on(event, handler, context);
    });
}

/**
 * Unregisters multiple event handlers at once
 */
export function unregisterEventHandlers(handlers: EventHandler[]): void {
    handlers.forEach(({ event, handler, context }) => {
        EventBus.off(event, handler, context);
    });
}

/**
 * Common event patterns used across the application
 */
export const COMMON_EVENTS = {
    SCENE_CHANGED: 'scene:changed',
    GAME_SET_INPUT_ACTIVE: 'game:set-input-active',
    UI_GAME_ACTIVE: 'ui:game-active',
    UI_MODAL_CLOSED: 'ui:modal-closed',
    UI_HIDE_MODAL: 'ui:hide-modal',
    UI_UPDATE_TIMER: 'ui:update-timer',
    UPDATE_SCORE: 'update-score',
    DPAD: 'dpad',
    GAME_UPDATE_SCORE: 'game:update-score',
    GAME_UPDATE_TIMER: 'game:update-timer',
} as const;

/**
 * Creates a cleanup function for event handlers
 */
export function createEventCleanup(handlers: EventHandler[]): () => void {
    return () => unregisterEventHandlers(handlers);
}
