/**
 * =============================================================================
 * File: game.js
 * Project: Project_Verdika
 * Description: Core logic loop, object rendering, and combat resolution.
 * Architecture Rules:
 *   - Zero-Dependency: Uses requestAnimationFrame for native 60FPS looping.
 *   - OpSec/Privacy: Saves player stats directly to LocalStorage at wave ends.
 *   - Modularity: Wraps all logic in an IIFE to prevent global namespace pollution.
 * Mandatory Update Points:
 *   - Any new enemy archetypes or boss signets MUST be added to the ENEMY_DICTIONARY.
 *   - Balance adjustments or new classes must be appended to ARCHETYPES.
 * =============================================================================
 */

const VerdikaGame = (function() {
    // Canvas context handles all visual rendering.
    let canvas, ctx;
    
    // Core game state holding scrap, wave count, and current signet.
    let gameState = {
        isRunning: false,
        wave: 1,
        beskarScrap: 0,
        activeSignet: null 
    };

    /**
     * --- ENTITY DICTIONARY ---
     * Acts as the single source of truth for all game objects.
     */
    const ENEMY_DICTIONARY = {
        'acolyte': { hp: 20, speed: 1.5, color: '#4682b4', type: 'horde', radius: 12 },
        'krayt': { hp: 10, speed: 2.5, color: '#228b22', type: 'swarm', radius: 8 },
        'mercenary': { hp: 50, speed: 0.8, color: '#696969', type: 'heavy', radius: 18 },
        'mudhorn': { hp: 500, speed: 3.5, color: '#8b5a2b', type: 'boss', radius: 40, signetDrop: 'mudhorn_horn' }
    };

    const ACTIVE_ENTITIES = {
        player: null,
        enemies: [],
        projectiles: [],
        particles: []
    };

    /**
     * --- PLAYER ARCHETYPES ---
     * Base stats mapped to the Mando'a classes. 
     */
    const ARCHETYPES = {
        'foundry_master': { baseHp: 100, baseArmor: 5, speed: 4, scrapCostMod: 0.8 },
        'heavy_commando': { baseHp: 130, baseArmor: 20, speed: 3.2, scrapCostMod: 1.0 },
        'death_watch': { baseHp: 90, baseArmor: -5, speed: 5.5, critChance: 0.25, scrapCostMod: 1.0 },
        'beskar_smith': { baseHp: 100, baseArmor: 0, speed: 4, scrapCostMod: 1.0 }
    };

    /**
     * --- INPUT HANDLER ---
     * Captures cross-platform interactions. Event listeners are decoupled from the 
     * game loop to prevent blocking the main thread.
     */
    const inputState = { up: false, down: false, left: false, right: false };

    function initInput() {
        window.addEventListener('keydown', (e) => handleKey(e.code, true));
        window.addEventListener('keyup', (e) => handleKey(e.code, false));
        // Touch controls for mobile/Pixel to be appended here in the future.
    }

    function handleKey(code, isPressed) {
        if (code === 'ArrowUp' || code === 'KeyW') inputState.up = isPressed;
        if (code === 'ArrowDown' || code === 'KeyS') inputState.down = isPressed;
        if (code === 'ArrowLeft' || code === 'KeyA') inputState.left = isPressed;
        if (code === 'ArrowRight' || code === 'KeyD') inputState.right = isPressed;
    }

    /**
     * --- PLAYER ENTITY CLASS ---
     * Manages position, health, and rendering of the player.
     */
    class Player {
        constructor(archetypeKey) {
            const stats = ARCHETYPES[archetypeKey] || ARCHETYPES['foundry_master'];
            this.hp = stats.baseHp;
            this.maxHp = stats.baseHp;
            this.armor = stats.baseArmor;
            this.speed = stats.speed;
            
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.radius = 15; 
            this.color = '#c0c0c0'; // Beskar Silver
        }

        update() {
            if (inputState.up) this.y -= this.speed;
            if (inputState.down) this.y += this.speed;
            if (inputState.left) this.x -= this.speed;
            if (inputState.right) this.x += this.speed;
            
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }

        render() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    /**
     * --- ENEMY ENTITY CLASS ---
     * Inherits stats from the ENEMY_DICTIONARY. Includes logic to track and pursue the player.
     */
    class Enemy {
        constructor(typeKey, startX, startY) {
            const stats = ENEMY_DICTIONARY[typeKey] || ENEMY_DICTIONARY['acolyte'];
            this.type = typeKey;
            this.hp = stats.hp;
            this.speed = stats.speed;
            this.radius = stats.radius;
            this.color = stats.color;
            this.x = startX;
            this.y = startY;
        }

        update(player) {
            if (!player) return;

            // Calculate vector toward the player to facilitate tracking
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.hypot(dx, dy);

            // Normalize vector and apply speed to move enemy
            if (distance > 0) {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }

        render() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    /**
     * --- SPAWN MANAGER ---
     * Handles wave generation and entity instantiation slightly off-screen.
     */
    function spawnWave(waveNumber) {
        // Base enemy count scales with the wave number
        const enemyCount = waveNumber * 5;
        const enemyTypes = Object.keys(ENEMY_DICTIONARY).filter(type => type !== 'mudhorn');

        for (let i = 0; i < enemyCount; i++) {
            // Pick a random horde/swarm enemy
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            // Spawn randomly along the edges of the canvas
            let spawnX, spawnY;
            if (Math.random() < 0.5) {
                spawnX = Math.random() < 0.5 ? -30 : canvas.width + 30;
                spawnY = Math.random() * canvas.height;
            } else {
                spawnX = Math.random() * canvas.width;
                spawnY = Math.random() < 0.5 ? -30 : canvas.height + 30;
            }

            ACTIVE_ENTITIES.enemies.push(new Enemy(randomType, spawnX, spawnY));
        }
    }

    /**
     * --- COLLISION HANDLER ---
     * Checks for intersections between bounding boxes.
     */
    function checkCollisions() {
        // 1. Projectiles vs. Enemies
        // 2. Enemies vs. Player
        // 3. Player vs. Pickups (Beskar Scrap)
    }

    /**
     * Main rendering and logic loop. 
     */
    function gameLoop(timestamp) {
        if (!gameState.isRunning) return;
        
        updateLogic();
        renderCanvas();
        
        requestAnimationFrame(gameLoop);
    }

    /**
     * Calculates entity movement, hitboxes, and damage resolution.
     */
    function updateLogic() {
        if (ACTIVE_ENTITIES.player) {
            ACTIVE_ENTITIES.player.update();
        }

        ACTIVE_ENTITIES.enemies.forEach(enemy => {
            enemy.update(ACTIVE_ENTITIES.player);
        });

        checkCollisions();
    }

    /**
     * Clears the previous frame and redraws all active sprites.
     */
    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (ACTIVE_ENTITIES.player) {
            ACTIVE_ENTITIES.player.render();
        }

        ACTIVE_ENTITIES.enemies.forEach(enemy => {
            enemy.render();
        });
    }

    /**
     * Writes the current progress to LocalStorage immediately after purchasing 
     * armor at the Covert Forge.
     */
    function saveProgress() {
        localStorage.setItem('verdika_save_state', JSON.stringify(gameState));
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    return {
        init: function() {
            canvas = document.getElementById('game-canvas');
            ctx = canvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            initInput();

            document.getElementById('btn-start').addEventListener('click', () => {
                document.getElementById('main-menu').style.display = 'none';
                
                const selectedArchetype = document.getElementById('archetype-picker').value;
                ACTIVE_ENTITIES.player = new Player(selectedArchetype);

                // Spawn the first wave immediately upon start
                spawnWave(gameState.wave);

                gameState.isRunning = true;
                requestAnimationFrame(gameLoop);
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    VerdikaGame.init();
});
