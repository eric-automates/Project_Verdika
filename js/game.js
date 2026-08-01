/**
 * =============================================================================
 * File: game.js
 * Project: Project_Verdika
 * Description: Core logic loop, object rendering, and combat resolution.
 * Architecture Rules:
 *   - Zero-Dependency: Uses requestAnimationFrame for native 60FPS looping[span_5](start_span)[span_5](end_span).
 *   - OpSec/Privacy: Resilient against strict-browser storage blocking. No external 
 *     calls made; 100% offline capable[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span).
 *   - Modularity: Wraps all logic in an IIFE to prevent global namespace pollution[span_8](start_span)[span_8](end_span).
 * Mandatory Update Points:
 *   - Any new enemy archetypes MUST be added to the ENEMY_DICTIONARY.
 *   - Any new visual effects must be managed through the Particle class to ensure 
 *     proper memory garbage collection.
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

    // Tracks all active memory objects for the frame loop
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
        canvas.addEventListener('touchstart', handlePointerDown);
        canvas.addEventListener('touchmove', handlePointerMove);
        canvas.addEventListener('touchend', handlePointerUp);
        canvas.addEventListener('touchcancel', handlePointerUp);
        
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

    /**
     * Visual effect class for transient events (e.g., spawning, dying).
     * Managed by an opacity decay to ensure smooth fading and automatic memory garbage collection.
     */
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 8 + 6; 
            this.life = 1.0; 
            this.decay = Math.random() * 0.02 + 0.015; // Controls how fast the cloud dissipates
            this.color = `rgba(169, 169, 169, `; // Base gray color; alpha appended in render
        }

        update() {
            this.life -= this.decay;
            this.radius += 0.3; // Creates an expanding smoke effect
        }

        render() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color + `${this.life})`;
            ctx.fill();
            ctx.closePath();
        }
    }

    class Projectile {
        constructor(x, y, targetX, targetY, speed, damage) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.damage = damage;
            this.radius = 3;
            this.color = '#ffd700'; 
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
            this.maxSpeed = stats.speed; 
            
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.radius = 15; 
            this.color = '#c0c0c0'; 

            this.lastShotTime = 0;
            this.fireRate = 500; 
        }

        update() {
            if (inputState.isDragging && Date.now() - inputState.lastInteractionTime > 500) {
                 inputState.isDragging = false;
            }

            if (inputState.isDragging) {
                const dx = inputState.currentX - inputState.dragStartX;
                const dy = inputState.currentY - inputState.dragStartY;
                const distance = Math.hypot(dx, dy);

                if (distance > 5) { 
                    const speedMultiplier = Math.min(distance / 100, 1);
                    const currentSpeed = this.maxSpeed * speedMultiplier;

                    this.x += (dx / distance) * currentSpeed;
                    this.y += (dy / distance) * currentSpeed;
                }
            }
            
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

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

            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 15, this.y - 25, 30, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.hp / this.maxHp), 5);
        }
    }

    class Enemy {
        constructor(typeKey, startX, startY, currentWave) {
            const stats = ENEMY_DICTIONARY[typeKey] || ENEMY_DICTIONARY['acolyte'];
            this.type = typeKey;
            
            const healthScale = Math.pow(1.1, currentWave - 1);
            this.hp = Math.floor(stats.hp * healthScale);
            this.maxHp = this.hp;
            
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
            
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 10, this.y - 20, 20, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 10, this.y - 20, 20 * (this.hp / this.maxHp), 3);
        }
    }

    /**
     * Forces enemies to strictly spawn along the absolute 0 or max parameters of the canvas.
     * Accompanied by Particle clouds to signal entry.
     */
    function spawnWave(waveNumber) {
        const enemyCount = waveNumber * 5;
        const enemyTypes = Object.keys(ENEMY_DICTIONARY).filter(type => type !== 'mudhorn');

        for (let i = 0; i < enemyCount; i++) {
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            
            let spawnX, spawnY;
            
            // Randomly select one of the 4 screen edges (0: Top, 1: Right, 2: Bottom, 3: Left)
            const edge = Math.floor(Math.random() * 4);
            
            if (edge === 0) {
                spawnX = Math.random() * canvas.width;
                spawnY = 0;
            } else if (edge === 1) {
                spawnX = canvas.width;
                spawnY = Math.random() * canvas.height;
            } else if (edge === 2) {
                spawnX = Math.random() * canvas.width;
                spawnY = canvas.height;
            } else {
                spawnX = 0;
                spawnY = Math.random() * canvas.height;
            }

            ACTIVE_ENTITIES.enemies.push(new Enemy(randomType, spawnX, spawnY, waveNumber));

            // Generate spawn smoke cloud (Particles)
            for (let p = 0; p < 6; p++) {
                // Apply slight random offset so the cloud looks organic around the spawn point
                ACTIVE_ENTITIES.particles.push(new Particle(
                    spawnX + (Math.random() * 10 - 5), 
                    spawnY + (Math.random() * 10 - 5)
                ));
            }
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
                    e.hp -= p.damage;
                    p.active = false;
                    
                    if (e.hp <= 0) {
                        e.active = false;
                        gameState.beskarScrap += 10; 
                    }
                    break; 
                }
            }
        }

        // Enemy vs Enemy (Solid Objects)
        // Uses a spatial separation vector to push overlapping enemies apart.
        for (let i = 0; i < ACTIVE_ENTITIES.enemies.length; i++) {
            for (let j = i + 1; j < ACTIVE_ENTITIES.enemies.length; j++) {
                const e1 = ACTIVE_ENTITIES.enemies[i];
                const e2 = ACTIVE_ENTITIES.enemies[j];
                
                const dx = e2.x - e1.x;
                const dy = e2.y - e1.y;
                const distance = Math.hypot(dx, dy);
                const minDistance = e1.radius + e2.radius;

                if (distance < minDistance && distance > 0) {
                    const overlap = minDistance - distance;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    
                    // Displace each enemy by half the overlap distance to prevent sticking
                    e1.x -= nx * (overlap / 2);
                    e1.y -= ny * (overlap / 2);
                    e2.x += nx * (overlap / 2);
                    e2.y += ny * (overlap / 2);
                }
            }
        }

        // Clean up inactive entities
        ACTIVE_ENTITIES.projectiles = ACTIVE_ENTITIES.projectiles.filter(p => p.active);
        ACTIVE_ENTITIES.enemies = ACTIVE_ENTITIES.enemies.filter(e => e.active);

        // Enemies vs Player (Hit and Run / Bounce)
        if (ACTIVE_ENTITIES.player) {
            const p = ACTIVE_ENTITIES.player;
            ACTIVE_ENTITIES.enemies.forEach(e => {
                const dx = p.x - e.x;
                const dy = p.y - e.y;
                const distance = Math.hypot(dx, dy);
                const minDistance = p.radius + e.radius;

                if (distance < minDistance) {
                    p.hp -= e.damage * 0.05; 

                    // Bounce Logic: Pushes the enemy backward so they do not rest inside the player coordinate space.
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const pushBackStr = e.speed * 8; // Force of the bounce

                    e.x -= nx * pushBackStr;
                    e.y -= ny * pushBackStr;

                    if (p.hp <= 0) {
                        handleGameOver();
                    }
                }
            });
        }
    }

    function handleGameOver() {
        gameState.isRunning = false;
        document.getElementById('btn-pause').style.display = 'none'; 
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('game-over-stats').innerText = `You reached Wave ${gameState.wave} and collected ${gameState.beskarScrap} Beskar Scrap.`;
        saveProgress();
    }

    function resetGame() {
        ACTIVE_ENTITIES.player = null;
        ACTIVE_ENTITIES.enemies = [];
        ACTIVE_ENTITIES.projectiles = [];
        ACTIVE_ENTITIES.particles = [];
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
        
        // Update particles and clear out dead ones
        ACTIVE_ENTITIES.particles.forEach(p => p.update());
        ACTIVE_ENTITIES.particles = ACTIVE_ENTITIES.particles.filter(p => p.life > 0);

        checkCollisions();

        if (ACTIVE_ENTITIES.enemies.length === 0 && ACTIVE_ENTITIES.player && gameState.isRunning) {
            gameState.wave++;
            saveProgress(); 
            spawnWave(gameState.wave);
        }
    }

    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Wave: ${gameState.wave}`, 10, 60);
        ctx.fillText(`Scrap: ${gameState.beskarScrap}`, 10, 80);

        if (ACTIVE_ENTITIES.player) {
            ACTIVE_ENTITIES.player.render();
        }

        ACTIVE_ENTITIES.enemies.forEach(enemy => {
            enemy.render();
        });

        ACTIVE_ENTITIES.projectiles.forEach(p => p.render());
        
        // Render ephemeral elements last so they draw over entities cleanly
        ACTIVE_ENTITIES.particles.forEach(p => p.render());
    }

    function saveProgress() {
        try {
            localStorage.setItem('verdika_save_state', JSON.stringify(gameState));
        } catch (e) {
            console.warn('OpSec: LocalStorage blocked by browser privacy settings. Progress not saved this session.');
        }
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
                document.getElementById('btn-pause').style.display = 'inline-block'; 
                
                const selectedArchetype = document.getElementById('archetype-picker').value;
                ACTIVE_ENTITIES.player = new Player(selectedArchetype);

                spawnWave(gameState.wave);

                gameState.isRunning = true;
                requestAnimationFrame(gameLoop);
            });

            document.getElementById('btn-restart').addEventListener('click', () => {
                document.getElementById('game-over').style.display = 'none';
                document.getElementById('main-menu').style.display = 'flex';
                document.getElementById('btn-pause').style.display = 'none'; 
                resetGame();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            window.addEventListener('verdikaPauseGame', () => {
                gameState.isRunning = false; 
            });

            window.addEventListener('verdikaResumeGame', () => {
                if (!gameState.isRunning) {
                    gameState.isRunning = true;
                    inputState.lastInteractionTime = Date.now(); 
                    requestAnimationFrame(gameLoop);
                }
            });

            window.addEventListener('verdikaQuitToMenu', () => {
                gameState.isRunning = false;
                
                saveProgress(); 
                
                document.getElementById('main-menu').style.display = 'flex';
                document.getElementById('game-over').style.display = 'none';
                document.getElementById('btn-pause').style.display = 'none'; 
                
                resetGame();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    VerdikaGame.init();
});
