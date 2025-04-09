// src/App.tsx
import React, { useRef, useState, useEffect } from "react"; // Added useEffect
import PhaserGame, { PhaserGameRef } from "@/game/PhaserGame";
import EventBus from "@/game/EventBus";
import { GameUI } from "@/components/GameUI";
import { MobileControls } from "@/components/MobileControls"; // Import Mobile Controls

function App() {
    const phaserGameRef = useRef<PhaserGameRef>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Check for touch support on component mount (client-side only)
    useEffect(() => {
        // Basic check for touch event support
        const touchSupport =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(touchSupport);
        console.log("Is Touch Device:", touchSupport);
    }, []);

    return (
        // Container needs defined dimensions and relative positioning
        <div
            style={{
                position: "relative",
                width: "800px", // Or use responsive width like '100vw' or '90%'
                maxWidth: "800px", // Ensure it doesn't get too wide
                height: "600px", // Or use responsive height like '100vh' or aspect ratio padding
                maxHeight: "600px",
                margin: "auto",
                border: "1px solid #ccc" /* Optional border */,
                overflow: "hidden", // Prevent controls spilling out if container is smaller
            }}
        >
            {/* Phaser Game Component */}
            <PhaserGame ref={phaserGameRef} />

            {/* React UI Overlay Component - Pass the imported EventBus */}
            <GameUI listenTo={EventBus} />

            {/* Conditionally Render Mobile Controls */}
            {isTouchDevice && <MobileControls />}
        </div>
    );
}

export default App;
