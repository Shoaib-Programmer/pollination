// src/App.tsx
import React, { useRef, useState, useEffect } from "react"; // Added useEffect
import PhaserGame, { PhaserGameRef } from "@/game/PhaserGame";
import EventBus from "@/game/EventBus";
import { GameUI } from "@/components/GameUI";
import { MobileControls } from "@/components/MobileControls"; // Import MobileControls
import Quiz from "@/components/Quiz"; // Import Quiz component

function App() {
    const phaserGameRef = useRef<PhaserGameRef>(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isQuizCompulsory, setIsQuizCompulsory] = useState(false);

    // Check for touch device on component mount (client-side only)
    useEffect(() => {
        const checkForTouch = () =>
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(checkForTouch());

        // Listen for quiz events
        const onQuizRequested = (compulsory: boolean) => {
            setIsQuizCompulsory(compulsory);
            setShowQuiz(true);
        };

        EventBus.on("quiz-requested", onQuizRequested);

        // Clean up event listener
        return () => {
            EventBus.off("quiz-requested", onQuizRequested);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handle quiz completion
    const handleQuizComplete = () => {
        setShowQuiz(false);
        // If it was a compulsory quiz, allow the game to continue
        if (isQuizCompulsory) {
            EventBus.emit("quiz-completed");
        }
    };

    // Handle quiz skip
    const handleQuizSkip = () => {
        setShowQuiz(false);
    };

    // Trigger quiz from button
    const handleQuizButtonClick = () => {
        setIsQuizCompulsory(false);
        setShowQuiz(true);
    };

    return (
        // Main container styling ensures proper sizing and context
        <div className="relative w-[800px] h-[600px] max-w-[100vw] max-h-[100vh] m-auto overflow-hidden bg-black/95 border border-white/10 rounded-xl shadow-soft backdrop-blur-sm">
            {/* Phaser Game Component */}
            {!showQuiz && <PhaserGame ref={phaserGameRef} />}

            {/* Quiz Component - shown when active */}
            {showQuiz && (
                <Quiz
                    isCompulsory={isQuizCompulsory}
                    onComplete={handleQuizComplete}
                    onSkip={handleQuizSkip}
                />
            )}

            {/* React UI Overlay Component - only when quiz not showing */}
            {!showQuiz && (
                <>
                    <GameUI listenTo={EventBus} />
                    {/* Quiz button */}
                    <button
                        onClick={handleQuizButtonClick}
                        className="btn-primary absolute bottom-5 right-5 z-10"
                    >
                        Take Quiz
                    </button>
                </>
            )}

            {/* Conditionally render Mobile Controls */}
            {isTouchDevice && !showQuiz && <MobileControls />}
        </div>
    );
}

export default App;
