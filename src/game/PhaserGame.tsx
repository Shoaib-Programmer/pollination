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
    function PhaserGame(
        {
            className,
            style,
            width = "100%",
            height = "100%",
            onGameReady,
            onBeforeDestroy,
        },
        ref,
    ) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listenersAttachedRef = useRef(false);
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);

        // Initialization Effect (Listen for modal close)
        useLayoutEffect(() => {
            if (gameRef.current || !containerRef.current) {
                return;
            }
            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            // Listen for UI modal closing to re-enable input
            const handleModalClosed = () => {
                // Only re-enable input if the game instance still exists
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

            // Call onGameReady callback if provided
            onGameReady?.(game);

            // Cleanup
            return () => {
                onBeforeDestroy?.();
                EventBus.off("ui:modal-closed", handleModalClosed); // Cleanup listener
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                gameRef.current?.destroy(true);
                gameRef.current = null;
                listenersAttachedRef.current = false;
            };
        }, [ref, onGameReady, onBeforeDestroy]);

        // Polling Effect for attaching/detaching scene listeners
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
                        // Disable input FIRST
                        EventBus.emit("game:set-input-active", false);
                        // Then show fact modal
                        EventBus.emit("show-fact", fact);
                    };

                    if (gameSceneInstance.events) {
                        gameSceneInstance.events.on(
                            "game:update-score",
                            scoreHandler,
                        );
                        gameSceneInstance.events.on(
                            "game:show-fact",
                            factHandler,
                        );
                        listenersAttachedRef.current = true;

                        // Store cleanup
                        sceneListenerCleanupRef.current = () => {
                            if (gameSceneInstance?.events) {
                                try {
                                    gameSceneInstance.events.off(
                                        "game:update-score",
                                        scoreHandler,
                                    );
                                    gameSceneInstance.events.off(
                                        "game:show-fact",
                                        factHandler,
                                    );
                                } catch (e) {
                                    /* Ignore */
                                }
                            }
                            listenersAttachedRef.current = false;
                        };
                    }
                }
                // Cleanup listeners AND explicitly hide UI modal
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    sceneListenerCleanupRef.current?.();
                    sceneListenerCleanupRef.current = null;
                    // --- NEW: Tell UI to hide modal immediately ---
                    EventBus.emit("ui:hide-modal");
                    // ---------------------------------------------
                    // Reset score (optional, could be handled by UI itself)
                    // EventBus.emit("update-score", 0);
                }
            }, 250);

            // Cleanup polling effect
            return () => {
                clearInterval(intervalId);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false;
                // Ensure input is enabled on unmount
                EventBus.emit("game:set-input-active", true);
            };
        }, []);

        // Render Container Div
        return (
            <div
                id="game-container"
                ref={containerRef}
                className={className}
                style={{ width, height, ...style }}
            />
        );
    },
);

export type { PhaserGameRef, PhaserGameProps };

PhaserGame.displayName = "PhaserGame";
export default PhaserGame;
