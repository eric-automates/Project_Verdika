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
    let canvas, ctx;
    
    let gameState = {
        isRunning: false,
        wave: 1,
        beskarScrap: 0,
        activeSignet: null 
    };

    const ENEMY_DICTIONARY = {
        'acolyte': { hp: 20, speed: 1.5, color: '#4682b4', type: 'horde', radius: 12, damage: 5 },
        'krayt': { hp: 10, speed: 2.5, color: '#228b22', type: 'swarm', radius: 8, damage: 2 },
        'mercenary': { hp: 50, speed: 0.8, color: '#696969', type: 'heavy', radius: 18, damage: 10 },
        'mudhorn': { hp: 500, speed: 3.5, color: '#8b5a2b', type: 'boss', radius: 40, damage: 25, signetDrop: 'mudhorn_horn' }
    };

    const ACTIVE_ENTITIES = {
        player: null,
        enemies: [],
        projectiles: [],
        particles: []
    };

    const ARCHETYPES = {
        'foundry_master': { baseHp: 100, baseArmor: 5, speed: 4, scrapCostMod: 0.8 },
        'heavy_commando': { baseHp: 130, baseArmor: 20, speed: 3.2, scrapCostMod: 1.0 },
        'death_watch': { baseHp: 90, baseArmor: -5, speed: 5.5, critChance: 0.25, scrapCostMod: 1.0 },
        'beskar_smith': { baseHp: 100, baseArmor: 0, speed: 4, scrapCostMod: 1.0 }
    };

    /**
     * --- INPUT HANDLER (TOUCH / DRAG) ---
     * Captures drag gestures to move the player. Speed scales with drag distance.
     */
    const inputState = { 
        isDragging: false, 
        dragStartX: 0, 
        dragStartY: 0,
        currentX: 0,
        currentY: 0,
        lastInteractionTime: 0
    };

    function initInput() {
        // Touch events
        canvas.addEventListener('touchstart', handlePointerDown);
        canvas.addEventListener('touchmove', handlePointerMove);
        canvas.addEventListener('touchend', handlePointerUp);
        canvas.addEventListener('touchcancel', handlePointerUp);
        
        // Mouse events (for desktop testing)
        canvas.addEventListener('mousedown', handlePointerDown);
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('mouseup', handlePointerUp);
        canvas.addEventListener('mouseleave', handlePointerUp);
    }

    function handlePointerDown(e) {
        if (!gameState.isRunning) return;
        e.preventDefault(); 
        inputState.isDragging = true;
        const pos = getPointerPos(e);
        inputState.dragStartX = pos.x;
        inputState.dragStartY = pos.y;
        inputState.currentX = pos.x;
        inputState.currentY = pos.y;
        inputState.lastInteractionTime = Date.now();
    }

    function handlePointerMove(e) {
        if (!inputState.isDragging || !gameState.isRunning) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        inputState.currentX = pos.x;
        inputState.currentY = pos.y;
        inputState.lastInteractionTime = Date.now();
    }

    function handlePointerUp(e) {
        if (!gameState.isRunning) return;
        e.preventDefault();
        inputState.isDragging = false;
    }

    function getPointerPos(e) {
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    class Projectile {
        constructor(x, y, targetX, targetY, speed, damage) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.damage = damage;
            this.radius = 3;
            this.color = '#ffd700'; // Gold
            this.active = true;

            const dx = targetX - x;
            const dy = targetY - y;
            const distance = Math.hypot(dx, dy);
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Deactivate if off-screen
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.active = false;
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

    class Player {
        constructor(archetypeKey) {
            const stats = ARCHETYPES[archetypeKey] || ARCHETYPES['foundry_master'];
            this.hp = stats.baseHp;
            this.maxHp = stats.baseHp;
            this.armor = stats.baseArmor;
            this.maxSpeed = stats.speed; // Maximum allowed speed
            
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.radius = 15; 
            this.color = '#c0c0c0'; // Beskar Silver

            this.lastShotTime = 0;
            this.fireRate = 500; // milliseconds between shots
        }

        update() {
            // Idle timeout check (stop moving if no interaction for 500ms)
            if (inputState.isDragging && Date.now() - inputState.lastInteractionTime > 500) {
                 inputState.isDragging = false;
            }

            if (inputState.isDragging) {
                const dx = inputState.currentX - inputState.dragStartX;
                const dy = inputState.currentY - inputState.dragStartY;
                const distance = Math.hypot(dx, dy);

                if (distance > 5) { // Deadzone to prevent jitter
                    // Scale speed based on drag distance, capped at maxSpeed
                    // A drag distance of 100 pixels represents max speed.
                    const speedMultiplier = Math.min(distance / 100, 1);
                    const currentSpeed = this.maxSpeed * speedMultiplier;

                    this.x += (dx / distance) * currentSpeed;
                    this.y += (dy / distance) * currentSpeed;
                }
            }
            
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

            // Auto-fire at nearest enemy
            if (Date.now() - this.lastShotTime > this.fireRate && ACTIVE_ENTITIES.enemies.length > 0) {
                this.shootNearest();
            }
        }

        shootNearest() {
            let nearestEnemy = null;
            let minDistance = Infinity;

            ACTIVE_ENTITIES.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestEnemy = enemy;
                }
            });

            if (nearestEnemy) {
                // Shoot projectile
                ACTIVE_ENTITIES.projectiles.push(new Projectile(this.x, this.y, nearestEnemy.x, nearestEnemy.y, 8, 10));
                this.lastShotTime = Date.now();
            }
        }

        render() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();

            // Health bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 15, this.y - 25, 30, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.hp / this.maxHp), 5);
        }
    }

    class Enemy {
        constructor(typeKey, startX, startY) {
            const stats = ENEMY_DICTIONARY[typeKey] || ENEMY_DICTIONARY['acolyte'];
            this.type = typeKey;
            this.hp = stats.hp;
            this.maxHp = stats.hp;
            this.speed = stats.speed;
            this.radius = stats.radius;
            this.damage = stats.damage;
            this.color = stats.color;
            this.x = startX;
            this.y = startY;
            this.active = true;
        }

        update(player) {
            if (!player) return;

            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.hypot(dx, dy);

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
            
            // Enemy health bar
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 10, this.y - 20, 20, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 10, this.y - 20, 20 * (this.hp / this.maxHp), 3);
        }
    }

    function spawnWave(waveNumber) {
        const enemyCount = waveNumber * 5;
        const enemyTypes = Object.keys(ENEMY_DICTIONARY).filter(type => type !== 'mudhorn');

        for (let i = 0; i < enemyCount; i++) {
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
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

    function checkCollisions() {
        // Projectiles vs Enemies
        for (let i = ACTIVE_ENTITIES.projectiles.length - 1; i >= 0; i--) {
            const p = ACTIVE_ENTITIES.projectiles[i];
            for (let j = ACTIVE_ENTITIES.enemies.length - 1; j >= 0; j--) {
                const e = ACTIVE_ENTITIES.enemies[j];
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                
                if (dist < p.radius + e.radius) {
                    // Hit!
                    e.hp -= p.damage;
                    p.active = false;
                    
                    if (e.hp <= 0) {
                        e.active = false;
                        gameState.beskarScrap += 10; // Reward
                    }
                    break; // Projectile destroyed, stop checking other enemies
                }
            }
        }

        // Clean up inactive entities
        ACTIVE_ENTITIES.projectiles = ACTIVE_ENTITIES.projectiles.filter(p => p.active);
        ACTIVE_ENTITIES.enemies = ACTIVE_ENTITIES.enemies.filter(e => e.active);

        // Enemies vs Player
        if (ACTIVE_ENTITIES.player) {
            const p = ACTIVE_ENTITIES.player;
            ACTIVE_ENTITIES.enemies.forEach(e => {
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                if (dist < p.radius + e.radius) {
                    // Simple collision damage logic (needs cooldown/i-frames for real game)
                    p.hp -= e.damage * 0.05; // Arbitrary tick damage

                    if (p.hp <= 0) {
                        handleGameOver();
                    }
                }
            });
        }
    }

    function handleGameOver() {
        gameState.isRunning = false;
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('game-over-stats').innerText = `You reached Wave ${gameState.wave} and collected ${gameState.beskarScrap} Beskar Scrap.`;
        saveProgress();
    }

    function resetGame() {
        ACTIVE_ENTITIES.player = null;
        ACTIVE_ENTITIES.enemies = [];
        ACTIVE_ENTITIES.projectiles = [];
        gameState.wave = 1;
        gameState.beskarScrap = 0;
        inputState.isDragging = false;
    }

    function gameLoop(timestamp) {
        if (!gameState.isRunning) return;
        
        updateLogic();
        renderCanvas();
        
        requestAnimationFrame(gameLoop);
    }

    function updateLogic() {
        if (ACTIVE_ENTITIES.player) {
            ACTIVE_ENTITIES.player.update();
        }

        ACTIVE_ENTITIES.enemies.forEach(enemy => {
            enemy.update(ACTIVE_ENTITIES.player);
        });

        ACTIVE_ENTITIES.projectiles.forEach(p => p.update());

        checkCollisions();
    }

    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (ACTIVE_ENTITIES.player) {
            ACTIVE_ENTITIES.player.render();
        }

        ACTIVE_ENTITIES.enemies.forEach(enemy => {
            enemy.render();
        });

        ACTIVE_ENTITIES.projectiles.forEach(p => p.render());

        // Simple HUD
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Wave: ${gameState.wave}`, 10, 20);
        ctx.fillText(`Scrap: ${gameState.beskarScrap}`, 10, 40);
    }

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

                spawnWave(gameState.wave);

                gameState.isRunning = true;
                requestAnimationFrame(gameLoop);
            });

            document.getElementById('btn-restart').addEventListener('click', () => {
                document.getElementById('game-over').style.display = 'none';
                document.getElementById('main-menu').style.display = 'flex';
                resetGame();
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    VerdikaGame.init();
});
