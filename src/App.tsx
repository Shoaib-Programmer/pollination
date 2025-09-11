// src/App.tsx
import React, { useRef, useState, useEffect } from "react"; // Added useEffect
import PhaserGame, { PhaserGameRef } from "@/game/PhaserGame";
import EventBus from "@/game/EventBus";
import { GameUI } from "@/components/GameUI";
import { MobileControls } from "@/components/MobileControls"; // Import MobileControls
import {
    registerEventHandlers,
    unregisterEventHandlers,
    COMMON_EVENTS,
} from "@/game/utils/eventUtils"; // Import event utilities

function App() {
    const phaserGameRef = useRef<PhaserGameRef>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [, setCurrentScene] = useState<string>("MainMenu");
    const [isGameInputActive, setIsGameInputActive] = useState<boolean>(true);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);

    // Check for touch device on component mount (client-side only)
    useEffect(() => {
        const checkForTouch = () =>
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(checkForTouch());

        // Track current Phaser scene and whether input is active
        const handleSceneChanged = (...args: unknown[]) => {
            const sceneName = args[0] as string;
            setCurrentScene(sceneName);
        };
        const handleInputActive = (...args: unknown[]) => {
            const isActive = args[0] as boolean;
            setIsGameInputActive(isActive);
        };
        const handleGameActive = (...args: unknown[]) => {
            const isActive = args[0] as boolean;
            setIsGameActive(isActive);
        };

        // Register event handlers using utility
        const eventHandlers = [
            { event: COMMON_EVENTS.SCENE_CHANGED, handler: handleSceneChanged },
            {
                event: COMMON_EVENTS.GAME_SET_INPUT_ACTIVE,
                handler: handleInputActive,
            },
            { event: COMMON_EVENTS.UI_GAME_ACTIVE, handler: handleGameActive },
        ];
        registerEventHandlers(eventHandlers);

        // Clean up event listener
        return () => {
            unregisterEventHandlers(eventHandlers);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        // Main container styling ensures proper sizing and context
        <div className="relative w-[800px] h-[600px] max-w-[100vw] max-h-[100vh] m-auto overflow-hidden bg-black/95 border border-white/10 rounded-xl shadow-soft backdrop-blur-sm">
            {/* Phaser Game Component */}
            <PhaserGame ref={phaserGameRef} />

            {/* React UI Overlay Component */}
            <GameUI listenTo={EventBus} />

            {/* Conditionally render Mobile Controls */}
            {isTouchDevice && isGameActive && isGameInputActive && (
                <MobileControls />
            )}
        </div>
    );
}

export default App;
