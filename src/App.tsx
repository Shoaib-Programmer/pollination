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
    const [currentScene, setCurrentScene] = useState<string>("MainMenu");
    const [isGameInputActive, setIsGameInputActive] = useState<boolean>(true);
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [showQuiz, setShowQuiz] = useState(false);
    const [isQuizCompulsory, setIsQuizCompulsory] = useState(false);

    // Check for touch device on component mount (client-side only)
    useEffect(() => {
        const checkForTouch = () =>
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(checkForTouch());

        // Track current Phaser scene and whether input is active
        const handleSceneChanged = (sceneName: string) => {
            setCurrentScene(sceneName);
        };
        const handleInputActive = (isActive: boolean) => {
            setIsGameInputActive(isActive);
        };
        EventBus.on("scene:changed", handleSceneChanged);
        EventBus.on("game:set-input-active", handleInputActive);
        EventBus.on("ui:game-active", setIsGameActive);

        // Listen for quiz events
        const onQuizRequested = (compulsory: boolean) => {
            setIsQuizCompulsory(compulsory);
            setShowQuiz(true);
        };

        EventBus.on("quiz-requested", onQuizRequested);

        // Clean up event listener
        return () => {
            EventBus.off("quiz-requested", onQuizRequested);
            EventBus.off("scene:changed", handleSceneChanged);
            EventBus.off("game:set-input-active", handleInputActive);
            EventBus.off("ui:game-active", setIsGameActive);
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
                        className="absolute bottom-5 right-5 z-10 pointer-events-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ease-out bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-emerald-950 shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/40 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-black/20"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Take Quiz
                    </button>
                </>
            )}

            {/* Conditionally render Mobile Controls */}
            {isTouchDevice && !showQuiz && isGameActive && isGameInputActive && (
                <MobileControls />
            )}
        </div>
    );
}

export default App;
