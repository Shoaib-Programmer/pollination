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
    // State for the target score received from the game
    const [targetScore, setTargetScore] = useState<number>(0);
    // State for the currently displayed score on the screen
    const [displayScore, setDisplayScore] = useState<number>(0);

    // State for the fact text and visibility
    const [currentFact, setCurrentFact] = useState<string>("");
    const [isFactVisible, setIsFactVisible] = useState<boolean>(false);

    // Refs for DOM elements and GSAP proxy
    const containerRef = useRef<HTMLDivElement>(null);
    const scoreBoxRef = useRef<HTMLDivElement>(null);
    const factBoxRef = useRef<HTMLDivElement>(null);
    const scoreTweenProxy = useRef({ value: 0 }); // Proxy for smooth score ticking

    // GSAP Animation for the Fact Box
    useGSAP(
        () => {
            const target = factBoxRef.current;
            if (!target) return;

            gsap.set(target, { opacity: 0, y: 20, visibility: "hidden" });

            let animation: gsap.core.Tween;
            if (isFactVisible) {
                // Animate IN
                animation = gsap.to(target, {
                    opacity: 1,
                    y: 0,
                    visibility: "visible",
                    duration: 0.4,
                    ease: "power2.out",
                });
            } else {
                // Animate OUT
                animation = gsap.to(target, {
                    opacity: 0,
                    y: 20,
                    duration: 0.4,
                    ease: "power2.in",
                    onComplete: () => {
                        // Set visibility hidden AFTER animation
                        if (!isFactVisible && target) {
                            gsap.set(target, { visibility: "hidden" });
                        }
                    },
                });
            }

            // Cleanup
            return () => {
                animation?.kill();
            };
        },
        { dependencies: [isFactVisible], scope: containerRef },
    );

    // GSAP Animation for Score Ticker and Pop Effect
    useGSAP(
        () => {
            const scoreBoxTarget = scoreBoxRef.current;
            const scoreIncreased = targetScore > scoreTweenProxy.current.value;

            gsap.killTweensOf(scoreTweenProxy.current);

            // Animate the proxy value for smooth ticking
            const scoreTween = gsap.to(scoreTweenProxy.current, {
                value: targetScore,
                duration: 0.6,
                ease: "power1.out",
                onUpdate: () => {
                    setDisplayScore(Math.round(scoreTweenProxy.current.value));
                },
            });

            // Pop animation on score increase
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

            // Cleanup
            return () => {
                scoreTween.kill();
                if (scoreBoxTarget) {
                    gsap.killTweensOf(scoreBoxTarget, "scale");
                }
            };
        },
        { dependencies: [targetScore], scope: containerRef },
    );

    // Event Listeners Setup
    useLayoutEffect(() => {
        if (!listenTo) return; // Guard clause

        let factTimeoutId: NodeJS.Timeout | null = null;

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore);
        };

        const handleShowFact = (fact: string) => {
            setCurrentFact(fact);
            setIsFactVisible(true);
            if (factTimeoutId) clearTimeout(factTimeoutId); // Reset timer
            factTimeoutId = setTimeout(() => {
                setIsFactVisible(false);
            }, 6000); // Hide after 6 seconds
        };

        // Initial State Setup
        setTargetScore(0);
        setDisplayScore(0);
        scoreTweenProxy.current.value = 0;
        setCurrentFact("");
        setIsFactVisible(false);

        // Attach Listeners
        listenTo.on("update-score", handleScoreUpdate);
        listenTo.on("show-fact", handleShowFact);

        // Cleanup Function
        return () => {
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFact);
            if (factTimeoutId) {
                clearTimeout(factTimeoutId);
            }
            // GSAP cleanup is handled by useGSAP hooks
        };
    }, [listenTo]);

    // Component Rendering
    return (
        <div ref={containerRef} className={styles.uiOverlay}>
            <div ref={scoreBoxRef} className={styles.scoreBox}>
                Score: {displayScore}
            </div>
            <div ref={factBoxRef} className={styles.factBox}>
                {currentFact}
            </div>
        </div>
    );
};
