// src/game/scenes/Game.ts
import Phaser, { Scene } from "phaser";
import EventBus from "../EventBus"; // Import EventBus for DPad
import gsap from "gsap"; // Import GSAP for animations

// Define an interface for Flower data
interface FlowerData {
    type: "red" | "blue";
    hasPollen: boolean;
    isPollinated: boolean;
}

// Define ArcadePhysicsCallback type alias
type ArcadePhysicsCallback = Phaser.Types.Physics.Arcade.ArcadePhysicsCallback;

export class Game extends Scene {
    private bee!: Phaser.Physics.Arcade.Sprite;
    private flowers!: Phaser.Physics.Arcade.StaticGroup;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private facts: string[] = [
        "Bees are responsible for pollinating about 1/3 of the food we eat!",
        "Some flowers only open at night for nocturnal pollinators like moths and bats.",
        "Honeybees communicate flower locations using a 'waggle dance'.",
        "Not all bees make honey! Many bee species are solitary.",
        "Pollinators include bees, butterflies, moths, beetles, flies, birds, and bats.",
        "Without pollination, many plants cannot produce fruits or seeds.",
        "Some plants trick insects into pollinating them without offering nectar.",
        "Wind and water can also be pollinators for certain plants like grasses and oaks.",
        "Climate change can disrupt the timing between flower blooming and pollinator activity.",
        "Planting native flowers helps support local pollinator populations.",
        "A single bee colony can pollinate 300 million flowers each day.",
        "Flowers have specific colors and scents to attract their preferred pollinators.",
    ];
    private carryingPollen: { type: "red" | "blue" | null } = { type: null };
    private pollenIndicator!: Phaser.GameObjects.Sprite | null;
    private pollenIndicatorTween: Phaser.Tweens.Tween | null = null;
    private wingFlapTween: gsap.core.Tween | null = null; // GSAP tween for wings

    // DPad state for mobile controls
    private dpadState = { up: false, down: false, left: false, right: false };
    private isMoving: boolean = false; // Track movement state for wing animation

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
            .setOrigin(0.5, 0.5); // Center origin for scaleY animation
        this.bee.setScale(0).setAlpha(0); // Start invisible/small for entrance

        // Bee Entrance Animation (Phaser Tween)
        this.tweens.add({
            targets: this.bee,
            scale: 1,
            alpha: 1,
            duration: 500,
            ease: "Power2",
            delay: 200,
            onComplete: () => {
                // Start wing animation only if bee is still active after tween
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

        // --- Input Setup ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        } else {
            // Keep error log for missing keyboard plugin
            console.error("Keyboard input plugin not found.");
        }
        // Listen for DPad events from the UI
        EventBus.on("dpad", this.handleDpadInput, this);

        // --- Physics Setup ---
        this.physics.add.overlap(
            this.bee,
            this.flowers,
            this.handleBeeFlowerCollision as ArcadePhysicsCallback,
            undefined,
            this
        );

        // --- State Reset ---
        this.score = 0;
        this.carryingPollen.type = null;
        this.pollenIndicator = null;
        this.pollenIndicatorTween = null;
        this.wingFlapTween = null;
        this.isMoving = false;

        // --- Emit Initial UI Events ---
        this.events.emit("game:update-score", this.score);
        this.events.emit(
            "game:show-fact",
            "Fly to a glowing flower (yellow tint) to collect pollen!"
        );

        // --- Scene Cleanup Logic ---
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            // Log cleanup for debugging purposes if needed later
            // console.log("Game scene shutdown: Cleaning up listeners and tweens.");
            EventBus.off("dpad", this.handleDpadInput, this); // Remove DPad listener

            // Clean up GSAP tweens
            this.wingFlapTween?.kill();
            this.wingFlapTween = null;
            gsap.killTweensOf(this.bee); // Kill any other potential tweens on the bee

            // Clean up Phaser tweens
            this.pollenIndicatorTween?.stop();
            this.pollenIndicatorTween = null;

            // Optionally destroy game objects explicitly if needed, though scene shutdown often handles it
            // this.pollenIndicator?.destroy();
        });

        // Note: The 'scene-ready' event emit is no longer needed by PhaserGame.tsx
        // this.events.emit("scene-ready", this);
    }

    // Handles DPad input events from the EventBus
    private handleDpadInput(data: {
        direction: "up" | "down" | "left" | "right";
        active: boolean;
    }) {
        if (data.direction in this.dpadState) {
            this.dpadState[data.direction] = data.active;
        }
    }

    // Sets up the GSAP wing flap animation
    private startWingFlapAnimation() {
        if (this.wingFlapTween || !this.bee?.active) return; // Prevent multiple tweens

        const targetScaleY = 0.8;
        const flapDuration = 0.1;

        this.bee.setScale(this.bee.scaleX, 1); // Ensure starting scaleY is 1

        this.wingFlapTween = gsap.to(this.bee, {
            scaleY: targetScaleY,
            duration: flapDuration,
            repeat: -1, // Loop infinitely
            yoyo: true, // Animate back and forth
            ease: "sine.inOut",
            paused: true, // Start paused, activate on movement
            overwrite: true, // Prevent conflicts
        });
    }

    // Main game loop update method
    update(time: number, delta: number) {
        this.handlePlayerMovement(delta);
        this.updatePollenIndicatorPosition();
    }

    // Assigns pollen to a random subset of flowers initially
    assignInitialPollen() {
        const flowerChildren =
            this.flowers.getChildren() as Phaser.Physics.Arcade.Sprite[];
        Phaser.Utils.Array.Shuffle(flowerChildren); // Randomize order
        let pollenCount = 0;
        const maxPollen = Math.ceil(flowerChildren.length / 2); // Pollen on about half the flowers

        for (const flower of flowerChildren) {
            if (pollenCount >= maxPollen) break;
            const data = flower?.getData("flowerData") as
                | FlowerData
                | undefined;
            // Assign pollen only if flower exists, has data, isn't pollinated, and doesn't already have pollen
            if (data && !data.isPollinated && !data.hasPollen) {
                data.hasPollen = true;
                flower.setTint(0xffff00); // Yellow tint indicates pollen
                pollenCount++;
            }
        }
    }

    // Creates multiple flowers of a specific type
    spawnFlowers(count: number, type: "red" | "blue") {
        const texture = `flower_${type}_generated`;
        const margin = 60; // Distance from world edges
        const spacing = 80; // Minimum distance between flowers
        const maxAttempts = 20; // Prevent infinite loop if space is too tight

        for (let i = 0; i < count; i++) {
            let x: number,
                y: number,
                validPosition: boolean,
                attempts: number = 0;

            // Find a valid position not too close to other flowers
            do {
                validPosition = true;
                x = Phaser.Math.Between(
                    margin,
                    this.cameras.main.width - margin
                );
                y = Phaser.Math.Between(
                    margin + 60,
                    this.cameras.main.height - margin
                ); // Avoid top UI area

                // Check distance against existing flowers
                this.flowers.children.iterate((existingFlower) => {
                    if (!existingFlower) return true; // Should not happen in static group
                    const sprite =
                        existingFlower as Phaser.Physics.Arcade.Sprite;
                    if (
                        Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y) <
                        spacing
                    ) {
                        validPosition = false;
                        return false; // Stop iteration early
                    }
                    return true;
                });
                attempts++;
                if (attempts > maxAttempts) {
                    // Could not find a valid position after many tries
                    console.warn(
                        `Could not find valid position for flower ${
                            i + 1
                        } of type ${type}`
                    );
                    break;
                }
            } while (!validPosition);

            // Create the flower if a valid position was found
            if (validPosition) {
                const flower = this.flowers.create(x, y, texture);
                if (flower) {
                    // Set custom data
                    flower.setData("flowerData", {
                        type: type,
                        hasPollen: false,
                        isPollinated: false,
                    } as FlowerData);

                    // Adjust physics body (circular)
                    const bodyRadius = flower.width * 0.35;
                    flower
                        .setCircle(bodyRadius)
                        .setOffset(
                            flower.width / 2 - bodyRadius,
                            flower.height / 2 - bodyRadius
                        )
                        .refreshBody(); // Apply physics changes

                    // Flower Entrance Animation
                    flower.setScale(0).setAlpha(0);
                    this.tweens.add({
                        targets: flower,
                        scale: 1,
                        alpha: 1,
                        duration: 300,
                        ease: "Back.easeOut",
                        delay: i * 50 + 300, // Staggered entrance
                    });
                }
            }
        }
    }

    // Handles player movement based on keyboard and DPad input
    handlePlayerMovement(delta: number) {
        if (!this.bee?.body) return; // Guard clause

        const speed = 250;
        let moveX = 0;
        let moveY = 0;

        // Combine inputs
        const leftPressed = this.cursors?.left.isDown || this.dpadState.left;
        const rightPressed = this.cursors?.right.isDown || this.dpadState.right;
        const upPressed = this.cursors?.up.isDown || this.dpadState.up;
        const downPressed = this.cursors?.down.isDown || this.dpadState.down;

        if (leftPressed) moveX = -1;
        else if (rightPressed) moveX = 1;
        if (upPressed) moveY = -1;
        else if (downPressed) moveY = 1;

        // Apply velocity using normalized vector for consistent diagonal speed
        const moveVector = new Phaser.Math.Vector2(moveX, moveY).normalize();
        this.bee.setVelocity(moveVector.x * speed, moveVector.y * speed);

        // Flip sprite based on horizontal direction
        if (moveX < 0) this.bee.setFlipX(true);
        else if (moveX > 0) this.bee.setFlipX(false);

        // Control wing flap animation based on movement state change
        const isCurrentlyMoving = moveVector.length() > 0;
        if (this.wingFlapTween) {
            if (isCurrentlyMoving && !this.isMoving) {
                // Started moving
                gsap.killTweensOf(this.bee, "scaleY"); // Ensure scaleY isn't being tweened back to 1
                if (this.wingFlapTween.paused()) this.wingFlapTween.play();
            } else if (!isCurrentlyMoving && this.isMoving) {
                // Stopped moving
                this.wingFlapTween.pause();
                gsap.to(this.bee, {
                    // Smoothly return wings to normal scaleY
                    scaleY: 1,
                    duration: 0.1,
                    ease: "power1.out",
                    overwrite: true,
                });
            }
        }
        this.isMoving = isCurrentlyMoving; // Update state for next frame
    }

    // Handles collision between the bee and flowers
    handleBeeFlowerCollision(
        beeGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile,
        flowerGO:
            | Phaser.Types.Physics.Arcade.GameObjectWithBody
            | Phaser.Tilemaps.Tile
    ) {
        // Type check GameObjects
        if (
            !(beeGO instanceof Phaser.Physics.Arcade.Sprite) ||
            !(flowerGO instanceof Phaser.Physics.Arcade.Sprite)
        )
            return;
        const flower = flowerGO;
        const data = flower.getData("flowerData") as FlowerData | undefined;
        if (!data) return; // Exit if flower has no data

        // --- Pollen Collection Logic ---
        if (!this.carryingPollen.type && data.hasPollen && !data.isPollinated) {
            this.carryingPollen.type = data.type;
            data.hasPollen = false;
            flower.clearTint(); // Remove yellow tint

            // Stop previous indicator animation and destroy old indicator
            this.pollenIndicatorTween?.stop();
            this.pollenIndicator?.destroy();

            // Create new pollen indicator above bee
            this.pollenIndicator = this.add
                .sprite(
                    this.bee.x,
                    this.bee.y - 25,
                    "pollen_particle_generated"
                )
                .setDepth(11) // Ensure it's above bee
                .setTint(data.type === "red" ? 0xffaaaa : 0xaaaaff) // Match pollen type color
                .setScale(0)
                .setAlpha(0); // Start hidden for animation

            // Particle effect at the flower
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0xffff00,
                15
            );

            // Emit fact to UI
            this.events.emit(
                "game:show-fact",
                `Collected ${data.type} pollen! Find another ${data.type} flower.`
            );

            // Visual feedback pulses
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);

            // Animate pollen indicator appearing and pulsing
            if (this.pollenIndicator) {
                this.tweens.add({
                    // Pop-in animation
                    targets: this.pollenIndicator,
                    scale: 2.5,
                    alpha: 1,
                    duration: 200,
                    ease: "Power1",
                });
                this.pollenIndicatorTween = this.tweens.add({
                    // Pulse animation
                    targets: this.pollenIndicator,
                    scale: 2.8,
                    duration: 400,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                    delay: 200,
                });
            }
        }
        // --- Pollen Delivery Logic ---
        else if (
            this.carryingPollen.type && // Bee must be carrying pollen
            data.type === this.carryingPollen.type && // Flower type must match carried pollen
            !data.isPollinated && // Flower must not be already pollinated
            !data.hasPollen // Flower should not have pollen (prevents delivering to source type)
        ) {
            data.isPollinated = true;
            flower.setTint(0x90ee90); // Green tint indicates pollinated
            this.score += 10;
            this.events.emit("game:update-score", this.score); // Update score UI

            // Emit random fact to UI
            const randomFact = Phaser.Math.RND.pick(this.facts);
            this.events.emit("game:show-fact", `Pollinated! ${randomFact}`);

            // Animate pollen indicator disappearing
            if (this.pollenIndicator) {
                this.pollenIndicatorTween?.stop(); // Stop pulse
                this.tweens.add({
                    // Fade out animation
                    targets: this.pollenIndicator,
                    alpha: 0,
                    scale: 0,
                    duration: 200,
                    ease: "Power1",
                    onComplete: () => this.pollenIndicator?.destroy(), // Destroy after fade
                });
                this.pollenIndicator = null;
                this.pollenIndicatorTween = null;
            }
            this.carryingPollen.type = null; // Bee is no longer carrying pollen

            // Particle effect at the flower
            this.createParticles(
                flower.x,
                flower.y,
                "pollen_particle_generated",
                0x90ee90,
                25
            );

            // Visual feedback pulses
            this.addInteractionPulse(flower);
            this.addInteractionPulse(this.bee, 1.05);

            // Check if game is over or more pollen needs to spawn
            if (this.checkAllPollinated()) {
                // All flowers done, transition to GameOver
                this.events.emit(
                    "game:show-fact",
                    `All flowers pollinated! Great job!`
                );
                this.time.delayedCall(1500, () => {
                    this.scene.start("GameOver", { score: this.score });
                });
            } else {
                // Assign more pollen if needed
                this.assignMorePollenIfNeeded();
            }
        }
    }

    // Creates a brief scale pulse animation on a target sprite
    addInteractionPulse(
        target: Phaser.GameObjects.Sprite,
        scaleAmount: number = 1.15
    ) {
        if (!target?.active) return; // Safety check
        const startScaleX = target.scaleX; // Store original scales
        const startScaleY = target.scaleY;
        this.tweens.killTweensOf(target); // Prevent conflicting scale tweens
        this.tweens.add({
            targets: target,
            scaleX: startScaleX * scaleAmount,
            scaleY: startScaleY * scaleAmount,
            duration: 120,
            yoyo: true, // Automatically returns to start scale
            ease: "Sine.easeInOut",
            // No onComplete needed to reset scale due to yoyo:true
        });
    }

    // Checks if more pollen needs to be added to the field
    assignMorePollenIfNeeded() {
        let pollenAvailable = false;
        // Check if any flower currently has pollen
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            if (data?.hasPollen && !data.isPollinated) {
                pollenAvailable = true;
                return false; // Stop iteration early
            }
            return true;
        });

        // If no pollen is available, add pollen to one random unpollinated flower
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
                    flowerToAddPollen.setTint(0xffff00); // Add yellow tint
                    this.createParticles(
                        flowerToAddPollen.x,
                        flowerToAddPollen.y,
                        "pollen_particle_generated",
                        0xffff00,
                        10
                    );
                    this.events.emit(
                        "game:show-fact",
                        "More pollen has appeared!"
                    );
                    this.addInteractionPulse(flowerToAddPollen); // Pulse feedback
                }
            }
            // If unpollinatedFlowers is empty, the game should end soon via checkAllPollinated
        }
    }

    // Keeps the pollen indicator positioned above the bee
    updatePollenIndicatorPosition() {
        if (this.pollenIndicator && this.bee?.body) {
            this.pollenIndicator.setPosition(this.bee.x, this.bee.y - 25);
        }
    }

    // Utility function to create particle explosions
    createParticles(
        x: number,
        y: number,
        texture: string,
        tint: number,
        count: number = 10
    ) {
        // Ensure texture exists before creating particles
        if (!this.textures.exists(texture)) return;

        const particles = this.add.particles(x, y, texture, {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 }, // Spread in all directions
            scale: { start: 1.5, end: 0 }, // Shrink to nothing
            lifespan: { min: 300, max: 600 }, // How long particles live
            gravityY: 80, // Slight downward drift
            blendMode: "ADD", // Bright additive blending
            tint: tint,
            emitting: false, // Don't emit continuously
        });

        if (particles) {
            particles.explode(count); // Emit particles once
            // Destroy the particle emitter after a delay to prevent memory leaks
            this.time.delayedCall(1500, () => {
                particles?.destroy();
            });
        }
    }

    // Checks if all flowers in the scene have been pollinated
    checkAllPollinated(): boolean {
        let allDone = true;
        this.flowers.children.iterate((child) => {
            if (!child) return true;
            const flower = child as Phaser.Physics.Arcade.Sprite;
            const data = flower.getData("flowerData") as FlowerData | undefined;
            // If any flower lacks data or isn't pollinated, not all are done
            if (!data || !data.isPollinated) {
                allDone = false;
                return false; // Stop iteration early
            }
            return true;
        });
        return allDone;
    }
}
