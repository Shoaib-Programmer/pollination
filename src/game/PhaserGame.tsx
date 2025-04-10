// src/game/PhaserGame.tsx
import Phaser from "phaser";
import React, {
    forwardRef,
    useEffect,
    useLayoutEffect,
    useRef,
    // useState can be removed if not used elsewhere
} from "react";
import StartGame from "@/game/main";
import EventBus from "./EventBus";

export interface PhaserGameProps {}

export interface PhaserGameRef {
    game: Phaser.Game | null;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
    function PhaserGame({}, ref) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listenersAttachedRef = useRef(false);
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);

        // --- Initialization Effect ---
        useLayoutEffect(() => {
            if (gameRef.current || !containerRef.current) {
                return; // Skip if already initialized or container missing
            }

            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            // Assign ref if provided
            if (typeof ref === "function") {
                ref({ game: game });
            } else if (ref) {
                ref.current = { game: game };
            }

            // --- Cleanup Function for Initialization ---
            return () => {
                // Execute scene listener cleanup if it exists
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;

                // Destroy Phaser game
                gameRef.current?.destroy(true);
                gameRef.current = null;
                listenersAttachedRef.current = false; // Reset flag
            };
        }, [ref]); // End of Initialization useLayoutEffect

        // --- Polling Effect for Scene Listener Management ---
        useEffect(() => {
            const intervalId = setInterval(() => {
                const game = gameRef.current;
                // Ensure game and scene manager are available
                if (!game || !game.scene) return;

                // Try to get the 'Game' scene and check if it's active
                const gameSceneInstance = game.scene.getScene("Game");
                const isGameSceneActive =
                    gameSceneInstance?.scene.isActive("Game");

                // Scenario 1: Game scene active, listeners need attaching
                if (isGameSceneActive && !listenersAttachedRef.current) {
                    const scoreHandler = (score: number) => {
                        EventBus.emit("update-score", score);
                    };
                    const factHandler = (fact: string) => {
                        EventBus.emit("show-fact", fact);
                    };

                    // Attach listeners to the specific Game scene's event emitter
                    if (gameSceneInstance.events) {
                        gameSceneInstance.events.on(
                            "game:update-score",
                            scoreHandler,
                        );
                        gameSceneInstance.events.on(
                            "game:show-fact",
                            factHandler,
                        );
                        listenersAttachedRef.current = true; // Mark listeners as attached

                        // Store cleanup function for these specific listeners
                        sceneListenerCleanupRef.current = () => {
                            if (gameSceneInstance?.events) {
                                // Check existence before cleanup
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
                                    /* Handle potential errors silently or log warnings */
                                }
                            }
                            listenersAttachedRef.current = false; // Mark as cleaned up
                        };
                    }
                }
                // Scenario 2: Game scene inactive, listeners need cleanup
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    sceneListenerCleanupRef.current?.(); // Execute cleanup
                    sceneListenerCleanupRef.current = null; // Clear cleanup ref
                    // Reset UI state when leaving the game scene
                    EventBus.emit("update-score", 0);
                    EventBus.emit("show-fact", "");
                }
            }, 250); // Polling interval

            // --- Cleanup for the Polling Effect ---
            return () => {
                clearInterval(intervalId); // Stop polling
                // Clean up scene listeners if the effect stops while they are active
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false;
            };
        }, []); // Empty dependency array: Run only once on mount

        // --- Render Container Div ---
        return (
            <div
                id="game-container"
                ref={containerRef}
                style={{ width: "100%", height: "100%" }}
            />
        );
    },
);

PhaserGame.displayName = "PhaserGame";
export default PhaserGame;
