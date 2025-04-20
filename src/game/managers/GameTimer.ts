// src/game/managers/GameTimer.ts
import * as Phaser from "phaser";

export class GameTimer {
    private readonly scene: Phaser.Scene;
    private readonly timerEvent: Phaser.Time.TimerEvent;
    private readonly duration: number; // Total time in seconds
    private remainingTime: number; // Current time left in seconds
    private readonly onUpdate: (time: number) => void; // Callback when time changes
    private readonly onComplete: () => void; // Callback when timer finishes
    private isPaused: boolean = false;

    constructor(
        scene: Phaser.Scene,
        duration: number,
        onUpdate: (time: number) => void,
        onComplete: () => void,
    ) {
        this.scene = scene;
        this.duration = duration;
        this.remainingTime = duration;
        this.onUpdate = onUpdate;
        this.onComplete = onComplete;

        // Create the timer event, but don't start it yet
        this.timerEvent = this.scene.time.addEvent({
            delay: 1000, // 1 second in ms
            callback: this.tick,
            callbackScope: this,
            loop: true,
            paused: true, // Start paused until explicitly started
        });
    }

    // Start the timer
    public start(): void {
        this.remainingTime = this.duration; // Reset time
        this.isPaused = false;
        this.timerEvent.paused = false;
        this.onUpdate(this.remainingTime); // Emit initial time value
    }

    // Pause the timer
    public pause(): void {
        if (!this.isPaused) {
            this.isPaused = true;
            this.timerEvent.paused = true;
        }
    }

    // Resume the timer if paused
    public resume(): void {
        if (this.isPaused) {
            this.isPaused = false;
            this.timerEvent.paused = false;
        }
    }

    // Tick function called every second
    private tick(): void {
        // Check if timer is paused or already at 0
        if (this.isPaused || this.remainingTime <= 0) {
            return;
        }

        this.remainingTime--; // Decrement time
        this.onUpdate(this.remainingTime); // Notify listener

        // Check if time has run out
        if (this.remainingTime <= 0) {
            this.pause(); // Stop timer
            this.onComplete(); // Call completion handler
        }
    }

    // Get remaining time
    public getRemainingTime(): number {
        return this.remainingTime;
    }

    // Get whether timer is currently paused
    public getIsPaused(): boolean {
        return this.isPaused;
    }

    // Clean up the timer when no longer needed
    public destroy(): void {
        if (this.timerEvent) {
            this.timerEvent.destroy();
        }
    }
}
