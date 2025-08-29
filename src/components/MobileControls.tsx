// src/components/MobileControls.tsx
import React, { useState, PointerEvent } from "react";
import styles from "@/styles/MobileControls.module.css"; // Transitioning away gradually
import EventBus from "@/game/EventBus"; // Use the global EventBus

type DPadDirection = "up" | "down" | "left" | "right";

export const MobileControls: React.FC = () => {
    // State to track which button is actively pressed for styling
    const [pressedButton, setPressedButton] = useState<DPadDirection | null>(
        null,
    );

    const handlePointerDown = (
        e: PointerEvent<HTMLButtonElement>,
        direction: DPadDirection,
    ) => {
        // Prevent default actions like text selection or drag
        e.preventDefault();
        // Capture the pointer to ensure pointerup is received even if cursor moves off
        (e.target as HTMLButtonElement).setPointerCapture(e.pointerId);
        setPressedButton(direction);
        EventBus.emit("dpad", { direction, active: true });
    };

    const handlePointerUp = (
        e: PointerEvent<HTMLButtonElement>,
        direction: DPadDirection,
    ) => {
        e.preventDefault();
        // Release pointer capture
        (e.target as HTMLButtonElement).releasePointerCapture(e.pointerId);
        // Only deactivate if this is the currently pressed button
        if (pressedButton === direction) {
            setPressedButton(null);
            EventBus.emit("dpad", { direction, active: false });
        }
    };

    // Handle pointer leaving the button area *while pressed*
    const handlePointerLeave = (
        e: PointerEvent<HTMLButtonElement>,
        direction: DPadDirection,
    ) => {
        if (pressedButton === direction) {
            // Optional: Decide if leaving should cancel the press.
            // For continuous movement, it's often better *not* to cancel here,
            // rely on pointerup/pointercancel instead.
            // setPressedButton(null);
            // EventBus.emit('dpad', { direction, active: false });
        }
    };

    // Handle unexpected pointer cancellation (e.g., browser interruption)
    const handlePointerCancel = (
        e: PointerEvent<HTMLButtonElement>,
        direction: DPadDirection,
    ) => {
        if (pressedButton === direction) {
            setPressedButton(null);
            EventBus.emit("dpad", { direction, active: false });
        }
    };

    // Helper to generate button props
    const getButtonProps = (direction: DPadDirection) => ({
        className: `${styles.dpadButton} ${styles[direction]} ${
            pressedButton === direction ? styles.dpadButtonPressed : ""
        }`,
        onPointerDown: (e: PointerEvent<HTMLButtonElement>) =>
            handlePointerDown(e, direction),
        onPointerUp: (e: PointerEvent<HTMLButtonElement>) =>
            handlePointerUp(e, direction),
        onPointerLeave: (e: PointerEvent<HTMLButtonElement>) =>
            handlePointerLeave(e, direction),
        onPointerCancel: (e: PointerEvent<HTMLButtonElement>) =>
            handlePointerCancel(e, direction),
        // Prevent context menu on long press
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    });

    return (
        <div className="pointer-events-none select-none absolute bottom-6 left-6 w-40 h-40 grid grid-cols-3 grid-rows-3 gap-1.5 opacity-80 hover:opacity-95 transition-opacity z-20 safe-left safe-bottom">
            <button
                {...getButtonProps("up")}
                className="pointer-events-auto flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-sm border border-white/15 text-3xl text-neutral-200 shadow-soft active:scale-95 transition transform focus-ring col-start-2 row-start-1"
                aria-label="Move Up"
            />
            <button
                {...getButtonProps("left")}
                className="pointer-events-auto flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-sm border border-white/15 text-3xl text-neutral-200 shadow-soft active:scale-95 transition transform focus-ring col-start-1 row-start-2"
                aria-label="Move Left"
            />
            <button
                {...getButtonProps("right")}
                className="pointer-events-auto flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-sm border border-white/15 text-3xl text-neutral-200 shadow-soft active:scale-95 transition transform focus-ring col-start-3 row-start-2"
                aria-label="Move Right"
            />
            <button
                {...getButtonProps("down")}
                className="pointer-events-auto flex items-center justify-center rounded-xl bg-surface/80 backdrop-blur-sm border border-white/15 text-3xl text-neutral-200 shadow-soft active:scale-95 transition transform focus-ring col-start-2 row-start-3"
                aria-label="Move Down"
            />
        </div>
    );
};
