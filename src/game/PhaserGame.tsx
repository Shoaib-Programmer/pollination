// src/game/PhaserGame.tsx
import Phaser from "phaser";
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "@/game/main";
import EventBus from "./EventBus";

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

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
    function PhaserGame(
        {
            className,
            style,
            width = "100%", // Apply defaults here
            height = "100%",
            onGameReady,
            onBeforeDestroy,
        },
        ref
    ) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        // Ref to track if listeners specific to the Game scene are currently attached
        const listenersAttachedRef = useRef(false);
        // Ref to store the function that cleans up Game scene specific listeners
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);
        // Ref to track the current active scene
        const currentSceneRef = useRef<string | null>(null);

        // Initialization Effect (Sets up game instance and global listener)
        useLayoutEffect(() => {
            // Prevent re-initialization
            if (gameRef.current || !containerRef.current) {
                return;
            }
            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            // Listen for UI modal closing to re-enable input globally
            const handleModalClosed = () => {
                if (gameRef.current) {
                    // Safety check
                    EventBus.emit("game:set-input-active", true);
                }
            };
            EventBus.on("ui:modal-closed", handleModalClosed);

            // Setup scene change monitoring
            const setupSceneMonitoring = () => {
                // Watch for scene changes and emit events
                game.scene.scenes.forEach(scene => {
                    scene.events.on('start', () => {
                        const sceneName = scene.scene.key;
                        if (currentSceneRef.current !== sceneName) {
                            currentSceneRef.current = sceneName;
                            console.log(`Scene changed to: ${sceneName}`);
                            EventBus.emit("scene:changed", sceneName);
                        }
                    });
                });
            };
            
            // Setup monitoring once game is ready
            if (game.isBooted) {
                setupSceneMonitoring();
            } else {
                game.events.once('ready', setupSceneMonitoring);
            }

            // Assign ref if provided
            if (typeof ref === "function") {
                ref({ game: game });
            } else if (ref) {
                ref.current = { game: game };
            }

            onGameReady?.(game); // Call callback

            // Cleanup function for this effect
            return () => {
                onBeforeDestroy?.(); // Call provided callback
                EventBus.off("ui:modal-closed", handleModalClosed); // Cleanup listener
                sceneListenerCleanupRef.current?.(); // Cleanup scene listeners if polling effect didn't
                sceneListenerCleanupRef.current = null;
                gameRef.current?.destroy(true); // Destroy Phaser game
                gameRef.current = null;
                listenersAttachedRef.current = false;
                currentSceneRef.current = null;
            };
        }, [ref, onGameReady, onBeforeDestroy]); // Dependencies

        // Polling Effect (Manages listeners attached to the actual Game scene)
        useEffect(() => {
            const intervalId = setInterval(() => {
                const game = gameRef.current;
                // Early exit if game isn't ready or scene manager unavailable
                if (!game || !game.scene || !game.scene.getScene) {
                    return;
                }

                const gameSceneInstance = game.scene.getScene("Game");
                // Check if scene exists AND is active
                const isGameSceneActive =
                    gameSceneInstance?.scene.isActive("Game");

                // --- Attach listeners when Game scene becomes active ---
                if (isGameSceneActive && !listenersAttachedRef.current) {
                    // Define Handlers
                    const scoreHandler = (score: number) => {
                        EventBus.emit("update-score", score);
                    };
                    const factHandler = (fact: string) => {
                        EventBus.emit("game:set-input-active", false); // Disable game input
                        EventBus.emit("show-fact", fact); // Tell UI to show modal
                    };
                    const timerHandler = (time: number) => {
                        EventBus.emit("ui:update-timer", time); // Relay to UI
                    };

                    // Attach listeners to the scene's event emitter
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
                        );
                        listenersAttachedRef.current = true; // Mark as attached

                        // --- Store cleanup function for THESE listeners ---
                        sceneListenerCleanupRef.current = () => {
                            if (gameSceneInstance?.events) {
                                // Check again inside closure
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
                                    );
                                } catch (e) {
                                    console.warn(
                                        "[PhaserGame Cleanup Ref] Error removing listeners.",
                                        e
                                    );
                                }
                            }
                            listenersAttachedRef.current = false; // Reset flag AFTER cleanup attempt
                        };
                    } else {
                        console.error(
                            "[PhaserGame Polling] Game scene active but 'events' missing!"
                        );
                    }
                }
                // --- Cleanup listeners when Game scene becomes inactive ---
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    if (sceneListenerCleanupRef.current) {
                        sceneListenerCleanupRef.current(); // Execute cleanup function
                        sceneListenerCleanupRef.current = null; // Clear the ref
                    } else {
                        // Should not happen often, but reset flag just in case
                        listenersAttachedRef.current = false;
                    }
                    // Reset UI state when leaving Game scene
                    EventBus.emit("ui:hide-modal"); // Ensure modal is hidden
                    EventBus.emit("update-score", 0); // Reset UI score
                    EventBus.emit("ui:update-timer", 60); // Reset UI timer
                }
            }, 250); // Polling interval

            // Cleanup function for the polling effect itself
            return () => {
                clearInterval(intervalId); // Stop the interval timer
                sceneListenerCleanupRef.current?.(); // Execute scene listener cleanup if still attached
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false; // Ensure flag is false on unmount
                // Ensure input enabled and UI reset on unmount/cleanup
                EventBus.emit("game:set-input-active", true);
                EventBus.emit("update-score", 0);
                EventBus.emit("ui:update-timer", 60);
            };
        }, []); // Empty dependency array means this effect runs once on mount

        // --- Render Container Div ---
        // Use destructured props here
        return (
            <div
                id="game-container"
                ref={containerRef}
                className={className} // Pass className from props
                style={{ width, height, ...style }} // Combine default/prop width/height with other styles
            />
        );
    }
);

PhaserGame.displayName = "PhaserGame";
export type { PhaserGameRef, PhaserGameProps }; // Export types if needed externally
export default PhaserGame;
