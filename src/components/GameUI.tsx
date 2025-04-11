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
    const scoreTweenProxy = useRef({ value: 0 });
    const modalTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    // GSAP Animation for the Modal Overlay
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
                        // Ensure visibility is hidden only if state still matches
                        if (!isModalVisible && target) {
                            gsap.set(target, { visibility: "hidden" });
                        }
                    },
                });
            }
            return () => {
                animation?.kill();
            };
        },
        { dependencies: [isModalVisible], scope: containerRef },
    );

    // GSAP Animation for Score
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
                    },
                );
            }
            return () => {
                scoreTween.kill();
                if (scoreBoxTarget) gsap.killTweensOf(scoreBoxTarget, "scale");
            };
        },
        { dependencies: [targetScore], scope: containerRef },
    );

    // Event Listeners Setup
    useLayoutEffect(() => {
        if (!listenTo) return;

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore);
        };

        const handleShowFactModal = (fact: string) => {
            setModalFact(fact);
            setIsModalVisible(true); // Show modal
            if (modalTimeoutIdRef.current)
                clearTimeout(modalTimeoutIdRef.current); // Clear previous timer
            modalTimeoutIdRef.current = setTimeout(() => {
                // Set new timer
                setIsModalVisible(false); // Hide modal after timeout
                setModalFact("");
                EventBus.emit("ui:modal-closed"); // Notify game
                modalTimeoutIdRef.current = null;
            }, 10000); // 10 seconds
        };

        const forceHideModal = () => {
            if (modalTimeoutIdRef.current) {
                // Clear timer
                clearTimeout(modalTimeoutIdRef.current);
                modalTimeoutIdRef.current = null;
                // Emit closed only if it was actually visible when forced hide
                // The isModalVisible check needs the current value, hence the dependency change
                if (isModalVisible) {
                    // Check current state here
                    EventBus.emit("ui:modal-closed");
                }
            }
            setIsModalVisible(false); // Force hide
            setModalFact("");
        };

        // Initial State Setup on mount or when listenTo changes
        // (This part doesn't strictly need isModalVisible as a dependency,
        // but the cleanup function does, so the effect needs to re-run)
        setTargetScore(0);
        setDisplayScore(0);
        scoreTweenProxy.current.value = 0;
        setModalFact("");
        setIsModalVisible(false); // Ensure modal starts hidden

        // Attach Listeners
        listenTo.on("update-score", handleScoreUpdate);
        listenTo.on("show-fact", handleShowFactModal);
        listenTo.on("ui:hide-modal", forceHideModal);

        // Cleanup Function
        return () => {
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFactModal);
            listenTo.off("ui:hide-modal", forceHideModal);

            // Clear timeout on unmount or dependency change
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                // Use the 'isModalVisible' value captured by THIS cleanup closure
                // to correctly determine if the modal WAS visible when cleanup runs.
                if (isModalVisible) {
                    EventBus.emit("ui:modal-closed");
                }
            }
        };
        // --- CORRECTED DEPENDENCY ARRAY ---
    }, [listenTo, isModalVisible]);
    // ---------------------------------

    // Component Rendering
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
            </div>
        </div>
    );
};
