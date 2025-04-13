// src/components/GameUI.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styles from "@/styles/GameUI.module.css";
import EventBus from "@/game/EventBus";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GameUIProps {
    listenTo: Phaser.Events.EventEmitter | null;
}

// Helper function to format seconds into MM:SS
const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedSeconds = seconds.toString().padStart(2, "0");
    return `${minutes}:${paddedSeconds}`;
};

export const GameUI: React.FC<GameUIProps> = ({ listenTo }) => {
    // Score state
    const [targetScore, setTargetScore] = useState<number>(0);
    const [displayScore, setDisplayScore] = useState<number>(0);
    // Modal state
    const [modalFact, setModalFact] = useState<string>("");
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    // Timer state
    const [remainingTime, setRemainingTime] = useState<number>(60); // Default to 60 seconds
    // Game scene state - NEW
    const [isGameSceneActive, setIsGameSceneActive] = useState<boolean>(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const scoreBoxRef = useRef<HTMLDivElement>(null);
    const modalOverlayRef = useRef<HTMLDivElement>(null);
    const timerBarRef = useRef<HTMLDivElement>(null); // Ref for the modal's timer bar
    const timerDisplayRef = useRef<HTMLDivElement>(null); // Ref for the game timer display
    const scoreTweenProxy = useRef({ value: 0 });
    const modalTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    // Ref to track visibility state accurately for cleanup, avoiding stale closures
    const isModalVisibleOnCleanup = useRef(isModalVisible);

    // Update ref whenever isModalVisible changes
    useEffect(() => {
        isModalVisibleOnCleanup.current = isModalVisible;
    }, [isModalVisible]);

    // GSAP Animation for the Modal Overlay Fade
    useGSAP(
        () => {
            const target = modalOverlayRef.current;
            if (!target) return;
            gsap.set(target, { opacity: 0, visibility: "hidden" }); // Ensure hidden initially
            let animation: gsap.core.Tween;
            if (isModalVisible) {
                // Animate IN
                animation = gsap.to(target, {
                    opacity: 1,
                    visibility: "visible",
                    duration: 0.5,
                    ease: "power2.out",
                });
            } else {
                // Animate OUT
                animation = gsap.to(target, {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        // Ensure visibility is hidden only if state still matches (using ref)
                        if (!isModalVisibleOnCleanup.current && target) {
                            gsap.set(target, { visibility: "hidden" });
                        }
                    },
                });
            }
            return () => {
                animation?.kill();
            }; // Cleanup tween
        },
        { dependencies: [isModalVisible], scope: containerRef }
    );

    // GSAP Animation for the Modal's Timer Bar Shrink
    useGSAP(
        () => {
            const bar = timerBarRef.current;
            if (!bar) return;

            gsap.killTweensOf(bar); // Kill previous bar animations

            if (isModalVisible) {
                // Reset bar to full width and invisible, then animate
                gsap.set(bar, {
                    width: "100%",
                    opacity: 0,
                    visibility: "hidden",
                });
                gsap.to(bar, {
                    delay: 0.3, // Start slightly after modal fade-in
                    opacity: 1,
                    visibility: "visible",
                    width: "0%", // Animate to 0 width
                    duration: 10, // Exactly 10 seconds
                    ease: "none", // Linear depletion
                });
            } else {
                // Immediately hide and reset bar when modal is not visible
                gsap.set(bar, {
                    width: "100%",
                    opacity: 0,
                    visibility: "hidden",
                });
            }
        },
        { dependencies: [isModalVisible], scope: containerRef }
    );

    // GSAP Animation for Score Ticker/Pop
    useGSAP(
        () => {
            const scoreBoxTarget = scoreBoxRef.current;
            const scoreIncreased = targetScore > scoreTweenProxy.current.value;
            gsap.killTweensOf(scoreTweenProxy.current);
            const scoreTween = gsap.to(scoreTweenProxy.current, {
                value: targetScore,
                duration: 0.6,
                ease: "power1.out",
                onUpdate: () => {
                    setDisplayScore(Math.round(scoreTweenProxy.current.value));
                },
            });
            if (scoreIncreased && scoreBoxTarget) {
                gsap.fromTo(
                    scoreBoxTarget,
                    { scale: 1 },
                    {
                        scale: 1.15,
                        duration: 0.15,
                        yoyo: true,
                        repeat: 1,
                        ease: "power1.inOut",
                        overwrite: true,
                    }
                );
            }
            return () => {
                // Cleanup
                scoreTween.kill();
                if (scoreBoxTarget) gsap.killTweensOf(scoreBoxTarget, "scale");
            };
        },
        { dependencies: [targetScore], scope: containerRef }
    );

    // Event Listeners Setup
    useLayoutEffect(() => {
        if (!listenTo) {
            console.warn("GameUI: EventBus (listenTo prop) is null.");
            return;
        }

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore);
            // When we get a score update, it indicates game scene is active
            setIsGameSceneActive(true);
        };

        const handleShowFactModal = (fact: string) => {
            setModalFact(fact);
            setIsModalVisible(true); // Show modal & trigger animations
            if (modalTimeoutIdRef.current)
                clearTimeout(modalTimeoutIdRef.current); // Clear previous timer
            modalTimeoutIdRef.current = setTimeout(() => {
                // Set new timer
                setIsModalVisible(false); // Hide modal & trigger animations after timeout
                // setModalFact(""); // Clear fact after animation out if needed
                EventBus.emit("ui:modal-closed"); // Notify game
                modalTimeoutIdRef.current = null;
            }, 10000); // 10 seconds
        };

        // Handler to force hide the modal if the scene changes etc.
        const forceHideModal = () => {
            if (modalTimeoutIdRef.current) {
                // If timer was running
                clearTimeout(modalTimeoutIdRef.current);
                modalTimeoutIdRef.current = null;
                // Use the REF to check if modal was visible when force hide was called
                if (isModalVisibleOnCleanup.current) {
                    EventBus.emit("ui:modal-closed"); // Notify game immediately
                }
            }
            setIsModalVisible(false); // Trigger animation out
            // setModalFact("");
        };

        // Handler for game timer updates
        const handleTimerUpdate = (time: number) => {
            setRemainingTime(Math.max(0, time)); // Update state, ensuring non-negative
            // When we get a timer update, it indicates game scene is active
            setIsGameSceneActive(true);
        };

        // Handler for scene changes - NEW
        const handleSceneActivation = (scene: string) => {
            // Only show UI elements during Game scene
            setIsGameSceneActive(scene === "Game");
        };

        // Initial State Setup on mount or when listenTo changes
        setTargetScore(0);
        setDisplayScore(0);
        scoreTweenProxy.current.value = 0;
        setModalFact("");
        setIsModalVisible(false);
        setRemainingTime(60); // Reset timer display
        setIsGameSceneActive(false); // Reset game scene state

        // Attach Listeners
        listenTo.on("update-score", handleScoreUpdate);
        listenTo.on("show-fact", handleShowFactModal);
        listenTo.on("ui:hide-modal", forceHideModal);
        listenTo.on("ui:update-timer", handleTimerUpdate); // Attach timer listener
        EventBus.on("scene:changed", handleSceneActivation); // NEW: Listen for scene changes

        // Cleanup Function
        return () => {
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFactModal);
            listenTo.off("ui:hide-modal", forceHideModal);
            listenTo.off("ui:update-timer", handleTimerUpdate); // Detach timer listener
            EventBus.off("scene:changed", handleSceneActivation); // NEW: Clean up scene change listener

            // Clear timeout on unmount or dependency change
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                // Use the REF value captured by THIS cleanup closure
                // to correctly determine if the modal WAS visible when cleanup runs.
                if (isModalVisibleOnCleanup.current) {
                    EventBus.emit("ui:modal-closed"); // Ensure game input is re-enabled
                }
            }
        };
    }, [listenTo]); // Only dependency needed is listenTo (EventBus instance)

    // Component Rendering
    return (
        <div ref={containerRef} className={styles.uiOverlay}>
            {/* Top Bar for Score and Timer - Only show during gameplay */}
            {isGameSceneActive && (
                <div className={styles.topBar}>
                    <div ref={scoreBoxRef} className={styles.scoreBox}>
                        Score: {displayScore}
                    </div>
                    <div ref={timerDisplayRef} className={styles.timerBox}>
                        Time: {formatTime(remainingTime)}
                    </div>
                </div>
            )}

            {/* Full Screen Modal for Facts */}
            <div
                ref={modalOverlayRef}
                className={styles.modalOverlay}
                style={{ visibility: "hidden" }} // Initial visibility set by GSAP
            >
                <div className={styles.modalContent}> {modalFact} </div>
                {/* Timer Bar inside the modal */}
                <div ref={timerBarRef} className={styles.timerBar}></div>
            </div>
        </div>
    );
};
