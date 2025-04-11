// src/game/PhaserGame.tsx
import Phaser from "phaser";
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "@/game/main";
import EventBus from "./EventBus";

// Define the PhaserGameRef interface
interface PhaserGameRef {
    game: Phaser.Game;
}

// Define the PhaserGameRef interface
interface PhaserGameRef {
    game: Phaser.Game;
}

// Define the PhaserGameProps interface with useful properties
interface PhaserGameProps {
    /** Custom class name for the game container */
    className?: string;

    /** Custom styles for the game container */
    style?: React.CSSProperties;

    /** Width of the game canvas (default: 100%) */
    width?: number | string;

    /** Height of the game canvas (default: 100%) */
    height?: number | string;

    /** Callback when the game instance is ready */
    onGameReady?: (game: Phaser.Game) => void;

    /** Callback when the game is about to be destroyed */
    onBeforeDestroy?: () => void;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
    function PhaserGame({ onGameReady, onBeforeDestroy, ...props }, ref) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listenersAttachedRef = useRef(false);
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);

        // Initialization Effect
        useLayoutEffect(() => {
            if (gameRef.current || !containerRef.current) return;
            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            const handleModalClosed = () => {
                if (gameRef.current) {
                    EventBus.emit("game:set-input-active", true);
                }
            };
            EventBus.on("ui:modal-closed", handleModalClosed);

            if (typeof ref === "function") {
                ref({ game: game });
            } else if (ref) {
                ref.current = { game: game };
            }
            onGameReady?.(game);

            return () => {
                // Cleanup
                onBeforeDestroy?.();
                EventBus.off("ui:modal-closed", handleModalClosed);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                gameRef.current?.destroy(true);
                gameRef.current = null;
                listenersAttachedRef.current = false;
            };
        }, [ref, onGameReady, onBeforeDestroy]);

        // Polling Effect
        useEffect(() => {
            const intervalId = setInterval(() => {
                const game = gameRef.current;
                if (!game || !game.scene) return;
                const gameSceneInstance = game.scene.getScene("Game");
                const isGameSceneActive =
                    gameSceneInstance?.scene.isActive("Game");

                // Attach listeners
                if (isGameSceneActive && !listenersAttachedRef.current) {
                    const scoreHandler = (score: number) => {
                        EventBus.emit("update-score", score);
                    };
                    const factHandler = (fact: string) => {
                        EventBus.emit("game:set-input-active", false); // Disable input
                        EventBus.emit("show-fact", fact); // Show fact modal
                    };
                    // --- NEW: Timer Handler ---
                    const timerHandler = (time: number) => {
                        EventBus.emit("ui:update-timer", time); // Relay timer update
                    };
                    // ------------------------

                    if (gameSceneInstance.events) {
                        gameSceneInstance.events.on(
                            "game:update-score",
                            scoreHandler
                        );
                        gameSceneInstance.events.on(
                            "game:show-fact",
                            factHandler
                        );
                        gameSceneInstance.events.on(
                            "game:update-timer",
                            timerHandler
                        ); // <<< Attach timer listener
                        listenersAttachedRef.current = true;

                        // Store cleanup
                        sceneListenerCleanupRef.current = () => {
                            if (gameSceneInstance?.events) {
                                try {
                                    gameSceneInstance.events.off(
                                        "game:update-score",
                                        scoreHandler
                                    );
                                    gameSceneInstance.events.off(
                                        "game:show-fact",
                                        factHandler
                                    );
                                    gameSceneInstance.events.off(
                                        "game:update-timer",
                                        timerHandler
                                    ); // <<< Detach timer listener
                                } catch (e) {
                                    /* Ignore */
                                }
                            }
                            listenersAttachedRef.current = false;
                        };
                    }
                }
                // Cleanup listeners AND explicitly hide UI modal/reset timer display
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    sceneListenerCleanupRef.current?.();
                    sceneListenerCleanupRef.current = null;
                    EventBus.emit("ui:hide-modal"); // Hide modal if scene changes
                    EventBus.emit("ui:update-timer", 60); // <<< Reset UI timer display
                }
            }, 250);

            // Cleanup polling effect
            return () => {
                clearInterval(intervalId);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false;
                EventBus.emit("game:set-input-active", true); // Ensure input enabled on unmount
            };
        }, []);

        // Render Container Div
        return <div id="game-container" ref={containerRef} {...props} />;
    }
);

PhaserGame.displayName = "PhaserGame";
// Export types separately if needed elsewhere, default export is the component
export type { PhaserGameRef, PhaserGameProps };
export default PhaserGame;
