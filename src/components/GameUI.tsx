// src/components/GameUI.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/GameUI.module.css'; // Import CSS module

interface GameUIProps {
    initialScore?: number;
    initialFact?: string;
    listenTo: Phaser.Events.EventEmitter | null; // Pass EventBus here
}

export const GameUI: React.FC<GameUIProps> = ({
                                                  initialScore = 0,
                                                  initialFact = '',
                                                  listenTo, // Receive the EventBus instance
                                              }) => {
    const [score, setScore] = useState<number>(initialScore);
    const [currentFact, setCurrentFact] = useState<string>(initialFact);
    const [isFactVisible, setIsFactVisible] = useState<boolean>(false);
    const factTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for timeout ID

    useEffect(() => {
        if (!listenTo) return; // Don't attach listeners if EventBus isn't ready

        // Handler for score updates
        const handleScoreUpdate = (newScore: number) => {
            // console.log('GameUI received score update:', newScore);
            setScore(newScore);
        };

        // Handler for fact updates
        const handleShowFact = (fact: string) => {
            // console.log('GameUI received fact:', fact);
            setCurrentFact(fact);
            setIsFactVisible(true);

            // Clear previous timeout if any
            if (factTimeoutRef.current) {
                clearTimeout(factTimeoutRef.current);
            }

            // Set timeout to hide the fact
            factTimeoutRef.current = setTimeout(() => {
                setIsFactVisible(false);
                // Optional: Clear fact text after fade out?
                // setTimeout(() => setCurrentFact(''), 500); // Match CSS transition duration
            }, 6000); // Show fact for 6 seconds before starting fade
        };

        // Attach listeners
        listenTo.on('update-score', handleScoreUpdate);
        listenTo.on('show-fact', handleShowFact);

        // Cleanup function: Remove listeners when component unmounts or EventBus changes
        return () => {
            // console.log('GameUI cleaning up listeners');
            listenTo.off('update-score', handleScoreUpdate);
            listenTo.off('show-fact', handleShowFact);
            // Clear timeout on cleanup
            if (factTimeoutRef.current) {
                clearTimeout(factTimeoutRef.current);
            }
        };
    }, [listenTo]); // Re-run effect if listenTo changes

    return (
        <div className={styles.uiOverlay}>
            {/* Score Box */}
            <div className={styles.scoreBox}>
                Score: {score}
            </div>

            {/* Fact Box - Use conditional class for visibility */}
            <div className={`${styles.factBox} ${isFactVisible ? styles.factBoxVisible : ''}`}>
                {currentFact}
            </div>
        </div>
    );
};