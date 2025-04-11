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
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false); // State drives visibility

    const containerRef = useRef<HTMLDivElement>(null);
    const scoreBoxRef = useRef<HTMLDivElement>(null);
    const modalOverlayRef = useRef<HTMLDivElement>(null);
    const scoreTweenProxy = useRef({ value: 0 });
    const modalTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const isModalVisibleOnCleanup = useRef(isModalVisible); // Ref to track visibility state for cleanup

    // Update ref whenever isModalVisible changes
    useEffect(() => {
        isModalVisibleOnCleanup.current = isModalVisible;
    }, [isModalVisible]);

    // GSAP Animation for the Modal Overlay
    useGSAP(
        () => {
            const target = modalOverlayRef.current;
            if (!target) return;
            gsap.set(target, { opacity: 0, visibility: "hidden" });
            let animation: gsap.core.Tween;
            if (isModalVisible) {
                console.log("GameUI: Animating modal IN"); // <<< LOG MODAL ANIMATION
                animation = gsap.to(target, {
                    opacity: 1,
                    visibility: "visible",
                    duration: 0.5,
                    ease: "power2.out",
                });
            } else {
                console.log("GameUI: Animating modal OUT"); // <<< LOG MODAL ANIMATION
                animation = gsap.to(target, {
                    opacity: 0,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        if (!isModalVisibleOnCleanup.current && target) {
                            gsap.set(target, { visibility: "hidden" });
                        }
                    }, // Use ref here
                });
            }
            return () => {
                animation?.kill();
            };
        },
        { dependencies: [isModalVisible], scope: containerRef }
    );

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
        console.log(
            "GameUI: Attaching EventBus listeners (update-score, show-fact, ui:hide-modal)."
        );

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore);
        };

        const handleShowFactModal = (fact: string) => {
            console.log(
                `GameUI: Received 'show-fact': "${fact}". Showing modal and starting timer.`
            ); // <<< LOG SHOW FACT
            setModalFact(fact);
            setIsModalVisible(true); // Show modal triggers animation
            if (modalTimeoutIdRef.current)
                clearTimeout(modalTimeoutIdRef.current);
            modalTimeoutIdRef.current = setTimeout(() => {
                console.log(
                    "GameUI: Modal timeout finished. Hiding modal and emitting 'ui:modal-closed'."
                ); // <<< LOG TIMEOUT
                setIsModalVisible(false); // Hide modal triggers animation
                // Don't clear fact immediately, let animation finish hiding it
                // setModalFact("");
                EventBus.emit("ui:modal-closed");
                modalTimeoutIdRef.current = null;
            }, 10000); // 10 seconds
        };

        const forceHideModal = () => {
            console.log(
                "GameUI: Received 'ui:hide-modal'. Forcing modal hide."
            ); // <<< LOG FORCE HIDE
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                modalTimeoutIdRef.current = null;
                // Use the REF to check if modal was visible when force hide was called
                if (isModalVisibleOnCleanup.current) {
                    console.log(
                        "GameUI: Force hide - Emitting 'ui:modal-closed' because modal was visible."
                    );
                    EventBus.emit("ui:modal-closed");
                }
            }
            setIsModalVisible(false); // Trigger animation out
            // setModalFact("");
        };

        // Initial State (on mount or listenTo change)
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
            console.log(
                "GameUI: Cleaning up listeners (update-score, show-fact, ui:hide-modal)."
            );
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFactModal);
            listenTo.off("ui:hide-modal", forceHideModal);
            if (modalTimeoutIdRef.current) {
                clearTimeout(modalTimeoutIdRef.current);
                // Use the REF value captured by THIS cleanup closure
                if (isModalVisibleOnCleanup.current) {
                    console.log(
                        "GameUI: Cleanup - Emitting 'ui:modal-closed' because modal was visible during unmount/dependency change."
                    );
                    EventBus.emit("ui:modal-closed");
                }
            }
        };
        // --- CORRECTED DEPENDENCY ARRAY: Removed isModalVisible ---
    }, [listenTo]);
    // -----------------------------------------------------------

    // Component Rendering
    console.log(
        `GameUI: Rendering. isModalVisible: ${isModalVisible}, modalFact: "${modalFact}"`
    ); // <<< LOG RENDER STATE
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
