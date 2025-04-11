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
    function PhaserGame({ onGameReady, onBeforeDestroy, ...props }, ref) { // Pass props through
        const gameRef = useRef<Phaser.Game | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const listenersAttachedRef = useRef(false);
        const sceneListenerCleanupRef = useRef<(() => void) | null>(null);

        // Initialization Effect
        useLayoutEffect(() => {
            console.log("PhaserGame: useLayoutEffect for initialization running.");
            if (gameRef.current || !containerRef.current) { return; }

            console.log("PhaserGame: Starting Phaser game instance...");
            const game = StartGame(containerRef.current.id);
            gameRef.current = game;

            const handleModalClosed = () => {
                console.log("PhaserGame: Received 'ui:modal-closed'. Emitting 'game:set-input-active' (true)."); // <<< LOG RECEIPT
                if (gameRef.current) { // Safety check
                    EventBus.emit("game:set-input-active", true);
                }
            };
            console.log("PhaserGame: Attaching 'ui:modal-closed' listener.");
            EventBus.on("ui:modal-closed", handleModalClosed);

            if (typeof ref === "function") { ref({ game: game }); }
            else if (ref) { ref.current = { game: game }; }
            onGameReady?.(game);
            console.log("PhaserGame: Initialization effect finished.");

            return () => {
                console.log("PhaserGame: Cleanup running (unmount/ref change).");
                onBeforeDestroy?.();
                console.log("PhaserGame: Removing 'ui:modal-closed' listener.");
                EventBus.off("ui:modal-closed", handleModalClosed);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                console.log("PhaserGame: Destroying Phaser game instance.");
                gameRef.current?.destroy(true);
                gameRef.current = null;
                listenersAttachedRef.current = false;
            };
        }, [ref, onGameReady, onBeforeDestroy]); // Include callbacks in dependencies

        // Polling Effect
        useEffect(() => {
            console.log("PhaserGame: Polling effect starting.");
            const intervalId = setInterval(() => {
                const game = gameRef.current;
                if (!game || !game.scene) return;

                const gameSceneInstance = game.scene.getScene("Game");
                const isGameSceneActive = gameSceneInstance?.scene.isActive("Game");

                // Attach listeners
                if (isGameSceneActive && !listenersAttachedRef.current) {
                     console.log("PhaserGame Polling: Game scene is active and listeners NOT attached. Attaching...");
                    const scoreHandler = (score: number) => { EventBus.emit("update-score", score); };
                    const factHandler = (fact: string) => {
                        console.log(`PhaserGame: factHandler triggered for fact: "${fact}"`); // <<< LOG HANDLER ENTRY
                        console.log("PhaserGame: Emitting 'game:set-input-active' (false)."); // <<< LOG INPUT DISABLE
                        EventBus.emit("game:set-input-active", false);
                        console.log(`PhaserGame: Emitting 'show-fact': "${fact}"`); // <<< LOG SHOW FACT EMIT
                        EventBus.emit("show-fact", fact);
                    };

                    if (gameSceneInstance.events) {
                        gameSceneInstance.events.on("game:update-score", scoreHandler);
                        gameSceneInstance.events.on("game:show-fact", factHandler);
                        listenersAttachedRef.current = true;
                         console.log("PhaserGame Polling: Listeners attached to Game scene.");
                        sceneListenerCleanupRef.current = () => { /* Cleanup logic */ };
                    } else {
                         console.error("PhaserGame Polling: Game scene active but 'events' missing!");
                    }
                }
                // Cleanup listeners
                else if (!isGameSceneActive && listenersAttachedRef.current) {
                    console.log("PhaserGame Polling: Game scene is NOT active and listeners ARE attached. Cleaning up...");
                    sceneListenerCleanupRef.current?.();
                    sceneListenerCleanupRef.current = null;
                    console.log("PhaserGame Polling: Emitting 'ui:hide-modal'."); // <<< LOG HIDE MODAL EMIT
                    EventBus.emit("ui:hide-modal");
                    // EventBus.emit("update-score", 0); // Removed optional score reset
                }
            }, 250);

            return () => { // Cleanup for polling effect
                console.log("PhaserGame: Polling effect cleanup. Clearing interval.");
                clearInterval(intervalId);
                sceneListenerCleanupRef.current?.();
                sceneListenerCleanupRef.current = null;
                listenersAttachedRef.current = false;
                console.log("PhaserGame Polling Cleanup: Emitting 'game:set-input-active' (true)."); // <<< LOG INPUT ENABLE ON UNMOUNT
                EventBus.emit("game:set-input-active", true);
            };
        }, []); // End of Polling useEffect

        console.log("PhaserGame: Rendering component.");
        // Pass props down to the div
        return (
            <div id="game-container" ref={containerRef} {...props} />
        );
    }
);
PhaserGame.displayName = "PhaserGame";
// Export types separately if needed elsewhere, default export is the component
export type { PhaserGameRef, PhaserGameProps };
export default PhaserGame;