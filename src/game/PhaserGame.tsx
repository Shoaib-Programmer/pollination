// src/game/PhaserGame.tsx
import Phaser from 'phaser';
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from '@/game/main';
import EventBus from './EventBus';
import {
    registerEventHandlers,
    unregisterEventHandlers,
    COMMON_EVENTS,
} from './utils/eventUtils'; // Import event utilities

// Define the PhaserGameRef interface
interface PhaserGameRef {
    game: Phaser.Game | null; // Allow null
}

// Define the PhaserGameProps interface
interface PhaserGameProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    onGameReady?: (game: Phaser.Game) => void;
    onBeforeDestroy?: () => void;
}

// --- Helper Functions ---

// Function to handle scene start event within useLayoutEffect
const handleSceneStart = (
    scene: Phaser.Scene,
    currentSceneRef: React.MutableRefObject<string | null>
) => {
    const sceneName = scene.scene.key;
    if (currentSceneRef.current !== sceneName) {
        currentSceneRef.current = sceneName;
        console.log(`Scene changed to: ${sceneName}`);
        EventBus.emit(COMMON_EVENTS.SCENE_CHANGED, sceneName);
    }
};

// Function to attach the start listener to a single scene
const attachStartListener = (
    scene: Phaser.Scene,
    currentSceneRef: React.MutableRefObject<string | null>
) => {
    // Use an anonymous function to properly scope the scene parameter for handleSceneStart
    scene.events.on('start', () => handleSceneStart(scene, currentSceneRef));
};

// Function to setup scene change monitoring
const setupSceneMonitoring = (
    gameInstance: Phaser.Game,
    currentSceneRef: React.MutableRefObject<string | null>
) => {
    gameInstance.scene.scenes.forEach(scene =>
        attachStartListener(scene, currentSceneRef)
    );
};

// --- Event Handlers for Game Scene (used in useEffect polling) ---
const createScoreHandler = () => (score: number) => {
    EventBus.emit('update-score', score);
};

const createFactHandler = () => (fact: string) => {
    EventBus.emit('game:set-input-active', false);
    EventBus.emit('show-fact', fact);
};

const createTimerHandler = () => (time: number) => {
    EventBus.emit('ui:update-timer', time);
};

// Function to attach Game scene listeners and return a cleanup function
const attachGameSceneListeners = (
    scene: Phaser.Scene,
    scoreHandler: (score: number) => void,
    factHandler: (fact: string) => void,
    timerHandler: (time: number) => void
): (() => void) => {
    if (!scene.events) {
        console.error(
            "[PhaserGame Polling] Game scene active but 'events' missing!"
        );
        return () => {}; // Return no-op cleanup
    }
    scene.events.on('game:update-score', scoreHandler);
    scene.events.on('game:show-fact', factHandler);
    scene.events.on('game:update-timer', timerHandler);

    // Return cleanup function for THESE listeners
    return () => {
        if (scene?.events) {
            try {
                scene.events.off('game:update-score', scoreHandler);
                scene.events.off('game:show-fact', factHandler);
                scene.events.off('game:update-timer', timerHandler);
            } catch (e) {
                console.warn(
                    '[PhaserGame Cleanup Ref] Error removing listeners.',
                    e
                );
            }
        }
    };
};

// --- PhaserGame Component ---

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
    function PhaserGame(
        {
            className,
            style,
            width = '100%',
            height = '100%',
            onGameReady,
            onBeforeDestroy,
        },
        ref
    ) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listenersAttachedRef = useRef(false);
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);
        const currentSceneRef = useRef<string | null>(null);

        // Initialization Effect
        useLayoutEffect(() => {
            if (gameRef.current || !containerRef.current) {
                return;
            }
            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            const handleModalClosed = () => {
                if (gameRef.current) {
                    EventBus.emit('game:set-input-active', true);
                }
            };

            // Register event handlers using utility
            const eventHandlers = [
                {
                    event: COMMON_EVENTS.UI_MODAL_CLOSED,
                    handler: handleModalClosed,
                },
            ];
            registerEventHandlers(eventHandlers);

            // Define the ready callback using the extracted function
            const onGameReadyCallback = () =>
                setupSceneMonitoring(game, currentSceneRef);

            // Setup monitoring once game is ready
            if (game.isBooted) {
                onGameReadyCallback();
            } else {
                game.events.once('ready', onGameReadyCallback);
            }

            if (typeof ref === 'function') {
                ref({ game: game });
            } else if (ref) {
                ref.current = { game: game };
            }

            onGameReady?.(game);

            // Cleanup function for this effect
            return () => {
                onBeforeDestroy?.();
                unregisterEventHandlers(eventHandlers);
                // Remove the 'ready' listener if the game didn't boot before cleanup
                game.events.off('ready', onGameReadyCallback);
                // Note: Listeners attached by attachStartListener are managed by Phaser scene lifecycle
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                gameRef.current?.destroy(true);
                gameRef.current = null;
                listenersAttachedRef.current = false;
                currentSceneRef.current = null;
            };
        }, [ref, onGameReady, onBeforeDestroy]); // Keep dependencies

        // Polling Effect for Game Scene Listeners
        useEffect(() => {
            // Create handlers once per component mount
            const scoreHandler = createScoreHandler();
            const factHandler = createFactHandler();
            const timerHandler = createTimerHandler();

            const intervalId = setInterval(() => {
                const game = gameRef.current;
                if (!game?.scene?.getScene) {
                    return;
                }

                const gameSceneInstance = game.scene.getScene('Game');
                const isGameSceneActive =
                    gameSceneInstance?.scene.isActive('Game');

                // Emit UI signal for scene active state
                EventBus.emit(
                    COMMON_EVENTS.UI_GAME_ACTIVE,
                    Boolean(isGameSceneActive)
                );

                // Attach listeners when Game scene becomes active
                if (isGameSceneActive && !listenersAttachedRef.current) {
                    if (gameSceneInstance) {
                        // Ensure instance exists
                        sceneListenerCleanupRef.current =
                            attachGameSceneListeners(
                                gameSceneInstance,
                                scoreHandler,
                                factHandler,
                                timerHandler
                            );
                        listenersAttachedRef.current = true;
                    }
                }
                // Cleanup listeners when Game scene becomes inactive
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    sceneListenerCleanupRef.current?.();
                    sceneListenerCleanupRef.current = null;
                    listenersAttachedRef.current = false;
                    // Reset UI state when leaving Game scene
                    EventBus.emit(COMMON_EVENTS.UI_HIDE_MODAL);
                    EventBus.emit(COMMON_EVENTS.UPDATE_SCORE, 0);
                    EventBus.emit(COMMON_EVENTS.UI_UPDATE_TIMER, 60);
                }
            }, 250); // Polling interval

            // Cleanup function for the polling effect
            return () => {
                clearInterval(intervalId);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false;
                // Ensure input enabled and UI reset on unmount/cleanup
                EventBus.emit(COMMON_EVENTS.GAME_SET_INPUT_ACTIVE, true);
                EventBus.emit(COMMON_EVENTS.UPDATE_SCORE, 0);
                EventBus.emit(COMMON_EVENTS.UI_UPDATE_TIMER, 60);
            };
        }, []); // Empty dependency array: runs once on mount

        // Render Container Div
        return (
            <div
                id="game-container"
                ref={containerRef}
                className={className}
                style={{ width, height, ...style }}
            />
        );
    }
);

PhaserGame.displayName = 'PhaserGame';
export type { PhaserGameRef, PhaserGameProps };
export default PhaserGame;
