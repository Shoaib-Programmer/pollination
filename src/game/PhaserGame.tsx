// src/game/PhaserGame.tsx
import Phaser from "phaser";
import React, {
    forwardRef,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react"; // Added useState
import StartGame from "@/game/main";
import EventBus from "./EventBus"; // <-- IMPORT global EventBus

export interface PhaserGameProps {}

export interface PhaserGameRef {
    game: Phaser.Game | null;
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
    function PhaserGame({}, ref) {
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        // State to hold the active Game scene instance
        const [gameScene, setGameScene] = useState<Phaser.Scene | null>(null);

        // Effect to setup and tear down the game instance
        useLayoutEffect(() => {
            if (gameRef.current === null && containerRef.current) {
                console.log("PhaserGame: Starting game instance...");
                gameRef.current = StartGame(containerRef.current.id);

                // --- Add listener for the main Game scene becoming ready ---
                // This assumes the Game scene emits 'scene-ready' in its create method
                gameRef.current.events.on(
                    "scene-ready",
                    (sceneInstance: Phaser.Scene) => {
                        if (sceneInstance.scene.key === "Game") {
                            console.log(
                                "PhaserGame: Game scene is ready, setting up bridge listeners.",
                            );
                            setGameScene(sceneInstance); // Store the scene instance
                        }
                    },
                );
                // Also listen for other scenes if needed, e.g., MainMenu readiness
                gameRef.current.events.on(
                    "scene-ready",
                    (sceneInstance: Phaser.Scene) => {
                        if (
                            sceneInstance.scene.key === "MainMenu" ||
                            sceneInstance.scene.key === "GameOver"
                        ) {
                            // Optional: Clear score/facts when returning to menu/game over
                            EventBus.emit("update-score", 0); // Reset score display
                            EventBus.emit("show-fact", ""); // Clear fact display
                        }
                    },
                );
                // ----------------------------------------------------------

                if (typeof ref === "function") {
                    ref({ game: gameRef.current });
                } else if (ref) {
                    ref.current = { game: gameRef.current };
                }
            }

            return () => {
                // Cleanup on component unmount
                if (gameRef.current) {
                    console.log("PhaserGame: Destroying game instance.");
                    gameRef.current.events.off("scene-ready"); // Clean up game-level listener
                    gameRef.current.destroy(true);
                    if (gameRef.current !== null) gameRef.current = null;
                }
                setGameScene(null); // Clear scene reference
            };
        }, [ref]);

        // --- Effect to bridge events from Game scene to global EventBus ---
        useEffect(() => {
            if (gameScene) {
                console.log(
                    "PhaserGame: Attaching listeners to Game scene's internal events.",
                );

                const scoreHandler = (score: number) => {
                    EventBus.emit("update-score", score); // Re-emit on global bus
                };
                const factHandler = (fact: string) => {
                    EventBus.emit("show-fact", fact); // Re-emit on global bus
                };

                // Listen to internal events from the specific Game scene instance
                gameScene.events.on("game:update-score", scoreHandler);
                gameScene.events.on("game:show-fact", factHandler);

                // Cleanup listeners when the scene reference changes or component unmounts
                return () => {
                    console.log(
                        "PhaserGame: Removing listeners from Game scene's internal events.",
                    );
                    gameScene.events.off("game:update-score", scoreHandler);
                    gameScene.events.off("game:show-fact", factHandler);
                };
            }
        }, [gameScene]); // Re-run this effect when the gameScene state changes
        // ------------------------------------------------------------------

        // Ensure the div has the ID expected by StartGame and takes up space
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
