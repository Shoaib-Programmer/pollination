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
    // State for the *target* score received from the game
    const [targetScore, setTargetScore] = useState<number>(0);
    // State for the *currently displayed* score on the screen
    const [displayScore, setDisplayScore] = useState<number>(0);

    const [currentFact, setCurrentFact] = useState<string>("");
    const [isFactVisible, setIsFactVisible] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const scoreBoxRef = useRef<HTMLDivElement>(null);
    const factBoxRef = useRef<HTMLDivElement>(null);
    // Proxy object for GSAP to tween the display score smoothly
    const scoreTweenProxy = useRef({ value: 0 });

    // --- GSAP Animations ---

    useGSAP(
        () => {
            // Fact Box Animation
            const target = factBoxRef.current;
            if (!target) return;
            const animation = isFactVisible
                ? gsap.fromTo(
                      target,
                      { y: 20, opacity: 0, visibility: "visible" },
                      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
                  )
                : gsap.to(target, {
                      y: 20,
                      opacity: 0,
                      duration: 0.4,
                      ease: "power2.in",
                      onComplete: () => {
                          if (target) target.style.visibility = "hidden";
                      },
                  });
            return () => {
                animation.kill();
            }; // Cleanup tween on visibility change/unmount
        },
        { dependencies: [isFactVisible], scope: containerRef }
    );

    useGSAP(
        () => {
            // Score Ticker and Pop Animation
            const scoreBoxTarget = scoreBoxRef.current;
            const scoreChanged = targetScore !== scoreTweenProxy.current.value; // Check if target changed

            // Kill previous tween to avoid conflicts if updates are rapid
            gsap.killTweensOf(scoreTweenProxy.current);

            // Always tween from the *current proxy value* to the *new target score*
            const scoreTween = gsap.to(scoreTweenProxy.current, {
                value: targetScore,
                duration: 0.5, // Adjust duration as needed
                ease: "power1.out",
                onUpdate: () => {
                    // Update the displayed score during the tween
                    setDisplayScore(Math.round(scoreTweenProxy.current.value));
                },
            });

            // Pop animation only if score increased (target is higher than current display)
            if (targetScore > displayScore && scoreBoxTarget) {
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
                    } // Overwrite previous scale tween
                );
            }
            return () => {
                scoreTween.kill();
            }; // Cleanup on targetScore change/unmount
        },
        { dependencies: [targetScore], scope: containerRef }
    );

    // --- Event Listeners Setup ---
    useLayoutEffect(() => {
        if (!listenTo) return;
        let factTimeoutId: NodeJS.Timeout | null = null;

        const handleScoreUpdate = (newScore: number) => {
            setTargetScore(newScore); // Update the target score state -> triggers useGSAP
        };

        const handleShowFact = (fact: string) => {
            setCurrentFact(fact);
            setIsFactVisible(true);
            if (factTimeoutId) clearTimeout(factTimeoutId);
            factTimeoutId = setTimeout(() => setIsFactVisible(false), 6000);
        };

        // Initialize state
        setTargetScore(0);
        setDisplayScore(0);
        scoreTweenProxy.current.value = 0; // Init proxy
        setCurrentFact("");
        setIsFactVisible(false);
        if (factBoxRef.current) factBoxRef.current.style.visibility = "hidden";

        // Attach listeners
        listenTo.on("update-score", handleScoreUpdate);
        listenTo.on("show-fact", handleShowFact);

        return () => {
            // Cleanup listeners
            listenTo.off("update-score", handleScoreUpdate);
            listenTo.off("show-fact", handleShowFact);
            if (factTimeoutId) clearTimeout(factTimeoutId);
            // useGSAP handles tween cleanup
        };
    }, [listenTo]);

    return (
        <div ref={containerRef} className={styles.uiOverlay}>
            <div ref={scoreBoxRef} className={styles.scoreBox}>
                Score: {displayScore} {/* Display the smoothly tweened score */}
            </div>
            <div
                ref={factBoxRef}
                className={styles.factBox}
                style={{ visibility: "hidden", opacity: 0 }}
            >
                {currentFact}
            </div>
        </div>
    );
};
