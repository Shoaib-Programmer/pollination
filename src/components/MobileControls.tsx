// src/components/MobileControls.tsx
import React, { useState, useCallback } from "react";
import styles from "@/styles/MobileControls.module.css";
import EventBus from "@/game/EventBus"; // Import the central EventBus

type Direction = "up" | "down" | "left" | "right";

export const MobileControls: React.FC = () => {
    // State to track which button is visually pressed
    const [pressed, setPressed] = useState<Partial<Record<Direction, boolean>>>(
        {},
    );

    const handlePress = useCallback(
        (direction: Direction, e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault(); // Prevent default actions like scrolling or double-tap zoom
            setPressed((prev) => ({ ...prev, [direction]: true }));
            EventBus.emit("dpad", { direction, active: true });
            // console.log(`DPad Press: ${direction}`);
        },
        [],
    );

    const handleRelease = useCallback(
        (direction: Direction, e?: React.MouseEvent | React.TouchEvent) => {
            e?.preventDefault();
            setPressed((prev) => ({ ...prev, [direction]: false }));
            EventBus.emit("dpad", { direction, active: false });
            // console.log(`DPad Release: ${direction}`);
        },
        [],
    );

    // Handle cases where touch/mouse leaves the button area while still pressed down
    const handleReleaseAll = useCallback(
        (e?: React.MouseEvent | React.TouchEvent) => {
            e?.preventDefault();
            // Release any direction that might still be considered pressed
            (Object.keys(pressed) as Direction[]).forEach((dir) => {
                if (pressed[dir]) {
                    handleRelease(dir);
                }
            });
            // console.log(`DPad Release All`);
        },
        [pressed, handleRelease],
    );

    return (
        <div className={styles.dpadContainer}>
            {/* Up Button */}
            <div
                className={`${styles.dpadButton} ${styles.up} ${pressed.up ? styles.dpadButtonPressed : ""}`}
                onTouchStart={(e) => handlePress("up", e)}
                onTouchEnd={(e) => handleRelease("up", e)}
                onTouchCancel={handleReleaseAll} // Handle interruption
                onMouseDown={(e) => handlePress("up", e)}
                onMouseUp={(e) => handleRelease("up", e)}
                onMouseLeave={(e) => pressed.up && handleRelease("up", e)} // Release if mouse leaves while pressed
            />
            {/* Down Button */}
            <div
                className={`${styles.dpadButton} ${styles.down} ${pressed.down ? styles.dpadButtonPressed : ""}`}
                onTouchStart={(e) => handlePress("down", e)}
                onTouchEnd={(e) => handleRelease("down", e)}
                onTouchCancel={handleReleaseAll}
                onMouseDown={(e) => handlePress("down", e)}
                onMouseUp={(e) => handleRelease("down", e)}
                onMouseLeave={(e) => pressed.down && handleRelease("down", e)}
            />
            {/* Left Button */}
            <div
                className={`${styles.dpadButton} ${styles.left} ${pressed.left ? styles.dpadButtonPressed : ""}`}
                onTouchStart={(e) => handlePress("left", e)}
                onTouchEnd={(e) => handleRelease("left", e)}
                onTouchCancel={handleReleaseAll}
                onMouseDown={(e) => handlePress("left", e)}
                onMouseUp={(e) => handleRelease("left", e)}
                onMouseLeave={(e) => pressed.left && handleRelease("left", e)}
            />
            {/* Right Button */}
            <div
                className={`${styles.dpadButton} ${styles.right} ${pressed.right ? styles.dpadButtonPressed : ""}`}
                onTouchStart={(e) => handlePress("right", e)}
                onTouchEnd={(e) => handleRelease("right", e)}
                onTouchCancel={handleReleaseAll}
                onMouseDown={(e) => handlePress("right", e)}
                onMouseUp={(e) => handleRelease("right", e)}
                onMouseLeave={(e) => pressed.right && handleRelease("right", e)}
            />
        </div>
    );
};
