// src/game/scenes/Game.ts
import * as Phaser from "phaser";
import EventBus from "../EventBus"; // Import EventBus for DPad and input control
import gsap from "gsap"; // Import GSAP for animations
import POLLINATION_FACTS from "../data/pollinationFacts"; // Import the facts array
import flowerCollectionService from "@/services/FlowerCollectionService"; // Import flower collection service

// Define an interface for Flower data
interface FlowerData {
    type: "red" | "blue";
    hasPollen: boolean;
    isPollinated: boolean;
    flowerId?: string; // Added flowerId to track specific flower type
}

// Define ArcadePhysicsCallback type alias
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Phaser.Scene {
    private bee!: Phaser.Physics.Arcade.Sprite;
    private flowers!: Phaser.Physics.Arcade.StaticGroup;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    // Facts array is now imported
    private carryingPollen: { type: "red" | "blue" | null } = { type: null };
    private pollenIndicator!: Phaser.GameObjects.Sprite | null;
    private pollenIndicatorTween: Phaser.Tweens.Tween | null = null;
    private wingFlapTween: gsap.core.Tween | null = null;
    private dpadState = { up: false, down: false, left: false, right: false };
    private isMoving: boolean = false;
    private inputEnabled: boolean = true; // Flag controls body enable/disable in update
    private completedFlowers: number = 0; // Track completed flowers

    // --- Timer Properties ---
    private gameDuration: number = 60; // Seconds (1 minute)
    private timerValue: number = 0;
    private gameTimerEvent!: Phaser.Time.TimerEvent;
    // --------------------------

    constructor() {
        super("Game");
    }

    create() {
        this.add.image(400, 300, "background_generated");

        // --- Bee Setup ---
        this.bee = this.physics.add.sprite(
            100,
            this.cameras.main.height / 2,
            "bee_generated"
        );
        this.bee.setCollideWorldBounds(true).setBounce(0.1).setDepth(10);
        this.bee
            .setBodySize(this.bee.width * 0.8, this.bee.height * 0.8)
            .setOrigin(0.5, 0.5);
        this.bee.setScale(0).setAlpha(0);
        this.tweens.add({
            // Entrance tween
            targets: this.bee,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            delay: 200,
            onComplete: () => {
                if (this.bee?.active) {
                    this.startWingFlapAnimation();
                }
            },
        });

        // --- Flower Setup ---
        this.flowers = this.physics.add.staticGroup();
        this.spawnFlowers(6, "red");
        this.spawnFlowers(6, "blue");
        this.assignInitialPollen();

        // --- Physics Overlap Setup ---
        this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback,
            undefined, // No processCallback, rely on body enable/disable in update
            this
        );

        // --- Input Setup ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            console.error("Keyboard input plugin not found.");
        }
        EventBus.on("dpad", this.handleDpadInput, this);
        EventBus.on("game:set-input-active", this.setInputActive, this);

        // --- State Reset ---
        this.score = 0;
        this.carryingPollen.type = null;
        this.pollenIndicator = null;
        this.pollenIndicatorTween = null;
        this.wingFlapTween = null;
        this.isMoving = false;
        this.inputEnabled = true; // Start enabled
        this.completedFlowers = 0; // Reset completed flowers

        // --- Initialize Timer ---
        this.timerValue = this.gameDuration;
        this.gameTimerEvent = this.time.addEvent({
            delay: 1000, // 1 second in ms
            callback: this.decrementTimer,
            callbackScope: this,
            loop: true,
        });
        // -----------------------

        // Emit Initial UI Events (Score and Timer)
        this.events.emit("game:update-score", this.score);
        this.events.emit("game:update-timer", this.timerValue); // Emit initial timer value
        // Do NOT emit initial fact here to avoid immediate modal

        // Scene Cleanup Logic
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off("dpad", this.handleDpadInput, this);
            EventBus.off("game:set-input-active", this.setInputActive, this);
            this.gameTimerEvent?.destroy(); // Clean up timer event
            this.wingFlapTween?.kill();
            this.wingFlapTween = null;
            gsap.killTweensOf(this.bee);
            this.pollenIndicatorTween?.stop();
            this.pollenIndicatorTween = null;
        });
    }

    // Method to enable/disable input AND pause/resume timer
    private setInputActive(isActive: boolean) {
        if (this.inputEnabled === isActive) return; // No change needed

        this.inputEnabled = isActive;
        const beeBody = this.bee?.body as
            | Phaser.Physics.Arcade.Body
            | undefined;

        if (!isActive) {
            // --- Disable ---
            // Note: Body disable/enable happens in update loop now
            // Pause Timer
            if (this.gameTimerEvent) this.gameTimerEvent.paused = true;
            // Reset DPad state
            this.dpadState = {
                up: false,
                down: false,
                left: false,
                right: false,
            };
            // Stop wing animation visually
            if (this.isMoving && this.wingFlapTween) {
                this.wingFlapTween.pause();
                gsap.to(this.bee, { scaleY: 1, duration: 0.1 });
                this.isMoving = false;
            }
        } else {
            // --- Enable ---
            // Note: Body enable/disable happens in update loop now
            // Resume Timer
            if (this.gameTimerEvent) this.gameTimerEvent.paused = false;
            // Reset keyboard keys state
            this.input.keyboard?.resetKeys();
            this.dpadState = {
                up: false,
                down: false,
                left: false,
                right: false,
            }; // Also reset DPad on enable
            this.isMoving = false; // Reset visual state
            this.wingFlapTween?.pause();
            gsap.to(this.bee, { scaleY: 1, duration: 0.05 });
        }
    }

    // --- Timer Decrement Function ---
    private decrementTimer() {
        // Check Phaser's internal paused state for the event first
        if (this.gameTimerEvent.paused) {
            return;
        }

        this.timerValue--; // Decrement the tracked time

        // Emit the update event for the UI
        this.events.emit("game:update-timer", this.timerValue);

        // Check if time has run out
        if (this.timerValue <= 0) {
            this.inputEnabled = false; // Prevent further actions by setting flag
            // Let the update loop handle disabling the body and stopping velocity
            this.gameTimerEvent.paused = true; // Stop timer callbacks for good

            // Emit Time's Up message for the modal
            this.events.emit("game:show-fact", "Time's Up!");

            // Transition to GameOver after a short delay to show the message
            this.time.delayedCall(1500, () => {
                if (this.scene.isActive()) {
                    // Pass completed flowers and full time to GameOver
                    this.scene.start("GameOver", {
                        score: this.score,
                        completedFlowers: this.completedFlowers,
                        totalTime: this.gameDuration,
                    });
                }
            });
        }
    }
    // ----------------------------------

    // Handles DPad input events
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }) {
        if (this.inputEnabled && data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // Sets up the GSAP wing flap animation
    private startWingFlapAnimation() {
        if (this.wingFlapTween || !this.bee?.active) return;
        const targetScaleY = 0.8;
        const flapDuration = 0.1;
        this.bee.setScale(this.bee.scaleX, 1);
        this.wingFlapTween = gsap.to(this.bee, {
            scaleY: targetScaleY,
            duration: flapDuration,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            paused: true,
            overwrite: true,
        });
    }

    // --- Main game loop update method - Controls body enable/disable ---
    update(time: number, delta: number) {
        const beeBody = this.bee?.body as
            | Phaser.Physics.Arcade.Body
            | undefined;
        if (!beeBody) return; // Exit if no body

        if (!this.inputEnabled) {
            // --- Input is Disabled ---
            // 1. Ensure body is disabled
            if (beeBody.enable) {
                beeBody.enable = false;
                // 2. Force velocity to zero *after* disabling body
                this.bee.setVelocity(0);
            } else {
                // Body already disabled, ensure velocity stays zero
                if (beeBody.velocity.x !== 0 || beeBody.velocity.y !== 0) {
                    this.bee.setVelocity(0);
                }
            }
            // 3. Ensure wing animation reflects stopped state
            if (this.isMoving) {
                this.wingFlapTween?.pause();
                if (this.bee.scaleY !== 1) {
                    gsap.to(this.bee, { scaleY: 1, duration: 0.1 });
                }
                this.isMoving = false;
            }
        } else {
            // --- Input is Enabled ---
            // 1. Ensure body is enabled
            if (!beeBody.enable) {
                beeBody.enable = true;
            }
            // 2. Process movement only if body IS enabled
            if (beeBody.enable) {
                this.handlePlayerMovement(delta);
            } else {
                // This case indicates a potential problem if it occurs
                console.warn(
                    "GAME Update: inputEnabled=TRUE but body is still disabled?"
                );
            }
        }
        this.updatePollenIndicatorPosition(); // Always update indicator
    }

    // Assigns initial pollen
    assignInitialPollen() {
        const flowerChildren =
            this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[];
        Phaser.Utils.Array.Shuffle(flowerChildren);
        let pollenCount = 0;
        const maxPollen = Math.ceil(flowerChildren.length / 2);
        for (const flower of flowerChildren) {
            if (pollenCount >= maxPollen) break;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            if (data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00);
                pollenCount++;
            }
        }
    }

    // Spawns flowers with specific flower types from our database
    spawnFlowers(count: number, type: "red" | "blue") {
        const texture = `flower_${type}_generated`;
        const margin = 60,
            spacing = 80,
            maxAttempts = 20;

        // Get available flower types for this color category from our database
        const availableFlowerIds: string[] = [];
        if (type === "red") {
            availableFlowerIds.push(
                "red_poppy",
                "red_rose",
                "red_tulip",
                "red_dahlia"
            );
        } else if (type === "blue") {
            availableFlowerIds.push(
                "blue_cornflower",
                "blue_bluebell",
                "blue_delphinium",
                "blue_forget_me_not"
            );
        }

        for (let i = 0; i < count; i++) {
            let x: number,
                y: number,
                validPosition: boolean,
                attempts: number = 0;
            do {
                // Position finding logic
                validPosition = true;
                x = Phaser.Math.Between(
                    margin,
                    this.cameras.main.width - margin
                );
                y = Phaser.Math.Between(
                    margin + 60,
                    this.cameras.main.height - margin
                );
                this.flowers.children.iterate((existingFlower) => {
                    if (!existingFlower) return true;
                    const sprite =
                        existingFlower as Phaser.Physics.Arcade.Sprite;
                    if (
                        Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y) <
                        spacing
                    ) {
                        validPosition = false;
                        return false;
                    }
                    return true;
                });
                attempts++;
                if (attempts > maxAttempts) {
                    console.warn(
                        `Could not find valid pos for ${type} flower ${i + 1}`
                    );
                    break;
                }
            } while (!validPosition);
            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    // Randomly select a specific flower type from available types
                    const flowerId = Phaser.Math.RND.pick(availableFlowerIds);

                    // Set data, physics, tween
                    flower.setData("flowerData", {
                        type: type,
                        hasPollen: false,
                        isPollinated: false,
                        flowerId: flowerId,
                    } as FlowerData);
                    const bodyRadius = flower.width * 0.35;
                    flower
                        .setCircle(bodyRadius)
                        .setOffset(
                            flower.width / 2 - bodyRadius,
                            flower.height / 2 - bodyRadius
                        )
                        .refreshBody();
                    flower.setScale(0).setAlpha(0);
                    this.tweens.add({
                        targets: flower,
                        scale: 1,
                        alpha: 1,
                        duration: 300,
                        ease: "Back.easeOut",
                        delay: i * 50 + 300,
                    });
                }
            }
        }
    }

    // Handles player movement calculation and velocity
    handlePlayerMovement(delta: number) {
        // Assumes inputEnabled=true and body.enable=true because called from update
        if (!this.bee?.body?.enable) return; // Safety check

        this.bee.setVelocity(0); // Reset velocity at start
        const speed = 250;
        let moveX = 0;
        let moveY = 0;
        const leftPressed = this.cursors?.left.isDown || this.dpadState.left;
        const rightPressed = this.cursors?.right.isDown || this.dpadState.right;
        const upPressed = this.cursors?.up.isDown || this.dpadState.up;
        const downPressed = this.cursors?.down.isDown || this.dpadState.down;
        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;
        const moveVector = new Phaser.Math.Vector2(moveX, moveY);
        const isTryingToMove = moveVector.length() > 0;
        if (isTryingToMove) {
            // Apply velocity if moving
            moveVector.normalize();
            this.bee.setVelocity(moveVector.x * speed, moveVector.y * speed);
        }
        // Flip sprite
        if (moveX < 0) this.bee.setFlipX(true);
        else if (moveX > 0) this.bee.setFlipX(false);
        // Control Wing Flap Animation
        if (this.wingFlapTween) {
            if (isTryingToMove && !this.isMoving) {
                gsap.killTweensOf(this.bee, "scaleY");
                if (this.wingFlapTween.paused()) this.wingFlapTween.play();
            } else if (!isTryingToMove && this.isMoving) {
                if (this.wingFlapTween.isActive()) {
                    this.wingFlapTween.pause();
                    gsap.to(this.bee, {
                        scaleY: 1,
                        duration: 0.1,
                        ease: "power1.out",
                        overwrite: true,
                    });
                }
            }
        }
        this.isMoving = isTryingToMove;
    }

    // Handles collision between bee and flowers
    handleBeeFlowerCollision(
        beeGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
        flowerGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile
    ) {
        // No input/body check needed here, physics system shouldn't call this if body is disabled
        if (
            !(beeGO instanceof Phaser.Physics.Arcade.Sprite) ||
            !(flowerGO instanceof Phaser.Physics.Arcade.Sprite) ||
            beeGO !== this.bee
        )
            return;

        const flower = flowerGO;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return;

        // --- Pollen Collection Logic ---
        if (!this.carryingPollen.type && data.hasPollen && !data.isPollinated) {
            this.carryingPollen.type = data.type;
            data.hasPollen = false;
            flower.clearTint();
            this.pollenIndicatorTween?.stop();
            this.pollenIndicator?.destroy();
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated"
                )
                .setDepth(11)
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff)
                .setScale(0)
                .setAlpha(0);
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xffff00,
                15
            );
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);
            if (this.pollenIndicator) {
                // Animate indicator
                this.tweens.add({
                    targets: this.pollenIndicator,
                    scale: 2.5,
                    alpha: 1,
                    duration: 200,
                    ease: "Power1",
                });
                this.pollenIndicatorTween = this.tweens.add({
                    targets: this.pollenIndicator,
                    scale: 2.8,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                    delay: 200,
                });
            }
            // NO fact emission for collection modal
        }
        // --- Pollen Delivery Logic ---
        else if (
            this.carryingPollen.type &&
            data.type === this.carryingPollen.type &&
            !data.isPollinated &&
            !data.hasPollen
        ) {
            data.isPollinated = true;
            flower.setTint(0x90ee90);
            this.score += 10;
            this.completedFlowers += 1; // Increment completed flowers counter
            this.events.emit("game:update-score", this.score); // Update score

            // Track the specific flower type discovery
            if (data.flowerId) {
                // Save to IndexedDB and check if it's a new discovery
                const flowerId = data.flowerId as string; // Use type assertion to tell TypeScript this is definitely a string
                Promise.resolve(
                    flowerCollectionService.discoverFlower(flowerId)
                )
                    .then((isNewDiscovery) => {
                        if (isNewDiscovery) {
                            // Display special message for newly discovered flowers
                            this.events.emit(
                                "game:show-fact",
                                `New flower type discovered: ${data.flowerId}!`
                            );
                            return;
                        }

                        // Only show random fact if no discovery announcement
                        const randomFact =
                            Phaser.Math.RND.pick(POLLINATION_FACTS);
                        if (this.pollenIndicator) {
                            // Animate indicator out
                            this.pollenIndicatorTween?.stop();
                            this.tweens.add({
                                targets: this.pollenIndicator,
                                alpha: 0,
                                scale: 0,
                                duration: 200,
                                ease: "Power1",
                                onComplete: () =>
                                    this.pollenIndicator?.destroy(),
                            });
                            this.pollenIndicator = null;
                            this.pollenIndicatorTween = null;
                        }
                        this.carryingPollen.type = null;
                        this.createParticles(
                            flower.x,
                            flower.y,
                            "pollen_particle_generated",
                            0x90ee90,
                            25
                        );
                        this.addInteractionPulse(flower);
                        this.addInteractionPulse(this.bee, 1.05);

                        let emittedFact = false;
                        let factToEmit = "";

                        if (this.checkAllPollinated()) {
                            // Emit final fact for modal
                            factToEmit = `All flowers pollinated! Great job!`;
                            emittedFact = true;
                            this.time.delayedCall(500, () => {
                                // Delay scene change slightly
                                if (this.scene.isActive()) {
                                    // Pass completed flowers and time remaining to GameOver
                                    this.scene.start("GameOver", {
                                        score: this.score,
                                        completedFlowers: this.completedFlowers,
                                        totalTime:
                                            this.gameDuration - this.timerValue, // Calculate time spent
                                    });
                                }
                            });
                        } else {
                            // Assign more pollen if needed, but don't emit fact from there
                            this.assignMorePollenIfNeeded();
                        }

                        // Emit random pollination fact if no other modal fact was generated
                        if (!emittedFact) {
                            factToEmit = `Pollinated! ${randomFact}`;
                        }
                        // Emit the chosen fact for the modal
                        if (factToEmit) {
                            this.events.emit("game:show-fact", factToEmit);
                        }
                    })
                    .catch((error) => {
                        console.error("Error saving flower discovery:", error);
                        // Fall back to regular behavior
                        const randomFact =
                            Phaser.Math.RND.pick(POLLINATION_FACTS);
                        this.events.emit(
                            "game:show-fact",
                            `Pollinated! ${randomFact}`
                        );
                    });
            } else {
                // Regular behavior if no flowerId is available
                const randomFact = Phaser.Math.RND.pick(POLLINATION_FACTS);
                this.events.emit("game:show-fact", `Pollinated! ${randomFact}`);
            }

            // Reset pollen indicator and complete the interaction
            if (this.pollenIndicator) {
                // Animate indicator out
                this.pollenIndicatorTween?.stop();
                this.tweens.add({
                    targets: this.pollenIndicator,
                    alpha: 0,
                    scale: 0,
                    duration: 200,
                    ease: "Power1",
                    onComplete: () => this.pollenIndicator?.destroy(),
                });
                this.pollenIndicator = null;
                this.pollenIndicatorTween = null;
            }
            this.carryingPollen.type = null;
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x90ee90,
                25
            );
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);
        }
    }

    // Creates a brief scale pulse animation
    addInteractionPulse(
        target: Phaser.GameObjects.Sprite,
        scaleAmount: number = 1.15
    ) {
        if (!target?.active) return;
        const startScaleX = target.scaleX;
        const startScaleY = target.scaleY;
        this.tweens.killTweensOf(target);
        this.tweens.add({
            targets: target,
            scaleX: startScaleX * scaleAmount,
            scaleY: startScaleY * scaleAmount,
            duration: 120,
            yoyo: true,
            ease: "Sine.easeInOut",
        });
    }

    // Adds pollen if none is available (DOES NOT EMIT FACT)
    assignMorePollenIfNeeded(): boolean {
        // Return indicates if pollen was added
        let pollenAvailable = false;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false;
            }
            return true;
        });

        if (!pollenAvailable) {
            const unpollinatedFlowers = (
                this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[]
            ).filter((f) => {
                const data = f?.getData("flowerData") as FlowerData | undefined;
                return data && !data.isPollinated && !data.hasPollen;
            });
            if (unpollinatedFlowers.length > 0) {
                const flowerToAddPollen =
                    Phaser.Math.RND.pick(unpollinatedFlowers);
                const data = flowerToAddPollen?.getData("flowerData") as
                    | FlowerData
                    | undefined;
                if (data && flowerToAddPollen) {
                    data.hasPollen = true;
                    flowerToAddPollen.setTint(0xffff00);
                    this.createParticles(
                        flowerToAddPollen.x,
                        flowerToAddPollen.y,
                        "pollen_particle_generated",
                        0xffff00,
                        10
                    );
                    // NO FACT EMITTED HERE
                    this.addInteractionPulse(flowerToAddPollen);
                    return true; // Indicate pollen was added
                } else {
                    console.warn(
                        "GAME: Failed to get data for flower selected to add pollen."
                    );
                }
            }
        }
        return false; // Indicate no pollen was added
    }

    // Updates pollen indicator position
    updatePollenIndicatorPosition() {
        if (this.pollenIndicator && this.bee?.body) {
            this.pollenIndicator.setPosition(this.bee.x, this.bee.y - 25);
        }
    }

    // Creates particle effects
    createParticles(
        x: number,
        y: number,
        texture: string,
        tint: number,
        count: number = 10
    ) {
        if (!this.textures.exists(texture)) return;
        const particles = this.add.particles(x, y, texture, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: { min: 300, max: 600 },
            gravityY: 80,
            blendMode: "ADD",
            tint: tint,
            emitting: false,
        });
        if (particles) {
            particles.explode(count);
            this.time.delayedCall(1500, () => {
                particles?.destroy();
            });
        }
    }

    // Checks if all flowers are pollinated
    checkAllPollinated(): boolean {
        let allDone = true;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (!data || !data.isPollinated) {
                allDone = false;
                return false;
            }
            return true;
        });
        return allDone;
    }
}
