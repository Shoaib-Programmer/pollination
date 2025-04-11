// src/components/GameUI.tsx
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import styles from "@/styles/GameUI.module.css";
import EventBus from "@/game/EventBus";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface GameUIProps {
    listenTo: Phaser.Events.EventEmitter | null;
}

export const GameUI: React.FC<GameUIProps> = ({ listenTo }) => {
    const [targetScore, setTargetScore] = useState<number>(0);
    const [displayScore, setDisplayScore] = useState<number>(0);
    const [modalFact, setModalFact] = useState<string>("");
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const scoreBoxRef = useRef<HTMLDivElement>(null);
    const modalOverlayRef = useRef<HTMLDivElement>(null);
    const timerBarRef = useRef<HTMLDivElement>(null); // <<< NEW: Ref for the timer bar
    const scoreTweenProxy = useRef({ value: 0 });
    const modalTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
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
            gsap.set(target, { opacity: 0, visibility: "hidden" });
            let animation: gsap.core.Tween;
            if (isModalVisible) {
                animation = gsap.to(target, {
                    opacity: 1,
                    visibility: "visible",
                    duration: 0.5,
                    ease: "power2.out",
                });
            } else {
                animation = gsap.to(target, {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        if (!isModalVisibleOnCleanup.current && target) {
                            gsap.set(target, { visibility: "hidden" });
                        }
                    },
                });
            }
            return () => {
                animation?.kill();
            };
        },
        { dependencies: [isModalVisible], scope: containerRef }
    );

    // --- NEW: GSAP Animation for the Timer Bar ---
    useGSAP(
        () => {
            const bar = timerBarRef.current;
            if (!bar) return;

            // Kill previous timer bar tweens on this element
            gsap.killTweensOf(bar);

            if (isModalVisible) {
                // When modal becomes visible, RESET bar to full width and fade it in slightly delayed
                gsap.set(bar, {
                    width: "100%",
                    opacity: 0,
                    visibility: "hidden",
                }); // Start full width but invisible
                // Start the 10-second shrink animation slightly after modal fades in
                gsap.to(bar, {
                    delay: 0.3, // Start slightly after modal fade-in
                    opacity: 1, // Fade in
                    visibility: "visible",
                    width: "0%", // Animate to 0 width
                    duration: 10, // Exactly 10 seconds
                    ease: "none", // Linear depletion for a timer
                });
            } else {
                // When modal becomes invisible, immediately hide the bar and reset width
                gsap.set(bar, {
                    width: "100%",
                    opacity: 0,
                    visibility: "hidden",
                });
            }
            // Cleanup is handled automatically by useGSAP hook killing tweens on dependency change/unmount
        },
        { dependencies: [isModalVisible], scope: containerRef }
    );
    // -------------------------------------------

    // GSAP Animation for Score
    useGSAP(
        () => {
            /* ... score animation logic ... */
        },
        { dependencies: [targetScore], scope: containerRef }
    );

    // Event Listeners Setup
    useLayoutEffect(() => {
        if (!listenTo) return;
        // console.log("GameUI: Attaching EventBus listeners...");

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore);
        };

        const handleShowFactModal = (fact: string) => {
            // console.log(`GameUI: Received 'show-fact': "${fact}".`);
            setModalFact(fact);
            setIsModalVisible(true); // Show modal & trigger animations
            if (modalTimeoutIdRef.current)
                clearTimeout(modalTimeoutIdRef.current);
            modalTimeoutIdRef.current = setTimeout(() => {
                // console.log("GameUI: Modal timeout finished.");
                setIsModalVisible(false); // Hide modal & trigger animations
                EventBus.emit("ui:modal-closed"); // Notify game
                modalTimeoutIdRef.current = null;
            }, 10000); // 10 seconds
        };

        const forceHideModal = () => {
            // console.log("GameUI: Received 'ui:hide-modal'.");
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                modalTimeoutIdRef.current = null;
                if (isModalVisibleOnCleanup.current) {
                    // Use ref for correct check
                    // console.log("GameUI: Force hide - Emitting 'ui:modal-closed'.");
                    EventBus.emit("ui:modal-closed");
                }
            }
            setIsModalVisible(false); // Trigger animation out
        };

        // Initial State
        setTargetScore(0);
        setDisplayScore(0);
        scoreTweenProxy.current.value = 0;
        setModalFact("");
        setIsModalVisible(false);

        // Attach Listeners
        listenTo.on("update-score", handleScoreUpdate);
        listenTo.on("show-fact", handleShowFactModal);
        listenTo.on("ui:hide-modal", forceHideModal);

        // Cleanup Function
        return () => {
            // console.log("GameUI: Cleaning up listeners.");
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFactModal);
            listenTo.off("ui:hide-modal", forceHideModal);
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                if (isModalVisibleOnCleanup.current) {
                    // Use ref for correct check
                    // console.log("GameUI: Cleanup - Emitting 'ui:modal-closed'.");
                    EventBus.emit("ui:modal-closed");
                }
            }
        };
    }, [listenTo]); // ONLY listenTo is the dependency here

    // Component Rendering
    // console.log(`GameUI: Rendering. isModalVisible: ${isModalVisible}`);
    return (
        <div ref={containerRef} className={styles.uiOverlay}>
            <div ref={scoreBoxRef} className={styles.scoreBox}>
                {" "}
                Score: {displayScore}{" "}
            </div>
            <div
                ref={modalOverlayRef}
                className={styles.modalOverlay}
                style={{ visibility: "hidden" }}
            >
                <div className={styles.modalContent}> {modalFact} </div>
                {/* --- NEW: Timer Bar Element --- */}
                <div ref={timerBarRef} className={styles.timerBar}></div>
                {/* ----------------------------- */}
            </div>
        </div>
    );
};
