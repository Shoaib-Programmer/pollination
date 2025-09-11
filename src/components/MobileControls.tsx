// src/components/MobileControls.tsx
import React, { useState, PointerEvent } from "react";
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

    // Handlers for DPad buttons
    const getButtonHandlers = (direction: DPadDirection) => ({
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

    // Compose className for Tailwind-only DPad buttons
    const getButtonClassName = (direction: DPadDirection) =>
        `pointer-events-auto flex items-center justify-center rounded-xl ` +
        // Base visual style (less transparent, gamified gradient + shadows)
        `bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-sm ` +
        `border border-white/20 text-neutral-100 shadow-lg shadow-black/40 ` +
        // Interactions
        `transition transform duration-150 ease-out ` +
        `hover:brightness-110 hover:shadow-xl hover:shadow-black/50 hover:ring-2 hover:ring-accent/40 ` +
        `focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ` +
        `active:translate-y-px active:shadow-inner active:shadow-black/60 active:brightness-95 ` +
        // Pressed state from game input
        `${pressedButton === direction ? "scale-95 ring-2 ring-accent/60 text-accent" : ""}`;

    const ArrowIcon: React.FC<{ direction: DPadDirection }> = ({
        direction,
    }) => {
        const rotation =
            direction === "up"
                ? 0
                : direction === "right"
                  ? 90
                  : direction === "down"
                    ? 180
                    : 270;
        return (
            <svg
                className="w-8 h-8 md:w-9 md:h-9 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <path d="M12 5c.28 0 .53.11.71.29l6 6a1 1 0 0 1-1.42 1.42L13 8.41V18a1 1 0 1 1-2 0V8.41l-4.29 4.3A1 1 0 0 1 5.3 11.3l6-6A1 1 0 0 1 12 5z" />
            </svg>
        );
    };

    return (
        <div className="pointer-events-none select-none absolute bottom-6 left-6 w-40 h-40 grid grid-cols-3 grid-rows-3 gap-1.5 opacity-95 hover:opacity-100 transition-opacity z-20 safe-left safe-bottom">
            <button
                {...getButtonHandlers("up")}
                className={`${getButtonClassName("up")} col-start-2 row-start-1`}
                aria-label="Move Up"
            >
                <ArrowIcon direction="up" />
            </button>
            <button
                {...getButtonHandlers("left")}
                className={`${getButtonClassName("left")} col-start-1 row-start-2`}
                aria-label="Move Left"
            >
                <ArrowIcon direction="left" />
            </button>
            <button
                {...getButtonHandlers("right")}
                className={`${getButtonClassName("right")} col-start-3 row-start-2`}
                aria-label="Move Right"
            >
                <ArrowIcon direction="right" />
            </button>
            <button
                {...getButtonHandlers("down")}
                className={`${getButtonClassName("down")} col-start-2 row-start-3`}
                aria-label="Move Down"
            >
                <ArrowIcon direction="down" />
            </button>
        </div>
    );
};
