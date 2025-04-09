// src/App.tsx
import React, { useRef, useState, useEffect } from "react"; // Added useEffect
import PhaserGame, { PhaserGameRef } from "@/game/PhaserGame";
import EventBus from "@/game/EventBus";
import { GameUI } from "@/components/GameUI";
import { MobileControls } from "@/components/MobileControls"; // Import MobileControls

function App() {
    const phaserGameRef = useRef<PhaserGameRef>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Check for touch device on component mount (client-side only)
    useEffect(() => {
        const checkForTouch = () =>
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(checkForTouch());
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        // Main container styling ensures proper sizing and context
        <div
            style={{
                position: "relative",
                width: "800px", // Or use responsive units like '90vw', '800px max-width' etc.
                height: "600px", // Or use responsive units like '90vh', '600px max-height' etc.
                maxWidth: "100vw", // Prevent overflow on small screens
                maxHeight: "100vh",
                margin: "auto",
                border: "1px solid #444", // Optional border for visual structure
                overflow: "hidden", // Clip content
                backgroundColor: "#000", // Fallback background
            }}
        >
            {/* Phaser Game Component */}
            <PhaserGame ref={phaserGameRef} />

            {/* React UI Overlay Component */}
            <GameUI listenTo={EventBus} />

            {/* Conditionally render Mobile Controls */}
            {isTouchDevice && <MobileControls />}
        </div>
    );
}

export default App;
