/**
 * =============================================================================
 * File: game.js (Part 1 of 3)
 * Project: Project_Verdika
 * Description: Core logic loop, object rendering, and player/particle models.
 * Architecture Rules:
 *   - Zero-Dependency: Uses requestAnimationFrame for native 60FPS looping.
 *   - OpSec/Privacy: Resilient against strict-browser storage blocking.
 *   - Modularity: Wraps all logic in an IIFE, attached explicitly to window.
 * Mandatory Update Points:
 *   - Any new enemy archetypes MUST be added to the ENEMY_DICTIONARY.
 * =============================================================================
 */

window.VerdikaGame = (function() {
    let canvas, ctx;
    
    // Core game state tracking
    let gameState = {
        isRunning: false,
        isShopping: false,
        wave: 1,
        beskarScrap: 0,
        activeSignet: null 
    };

    // Centralized Data Dictionary: Shared with Utilities (Threat Log)
    const ENEMY_DICTIONARY = {
        'acolyte': { hp: 20, speed: 1.5, color: '#4682b4', type: 'horde', radius: 12, damage: 5, pros: 'Swarm tactics', cons: 'Low individual health', behavior: 'Erratic forward pursuit' },
        'strill': { hp: 30, speed: 2.5, color: '#8b4513', type: 'hound', radius: 10, damage: 8, pros: 'Fast, pack hunter', cons: 'Hesitates at range', behavior: 'Circles the edge, dives when close' },
        'krayt': { hp: 10, speed: 2.8, color: '#228b22', type: 'swarm', radius: 8, damage: 2, pros: 'Extremely fast', cons: 'Fragile', behavior: 'Erratic weaving, hit and run' },
        'clansman': { hp: 80, speed: 1.8, color: '#4b0082', type: 'warrior', radius: 15, damage: 15, pros: 'Tactical pairing', cons: 'Retreats if isolated', behavior: 'Seeks backup, attacks in pairs' },
        'mercenary': { hp: 50, speed: 0.9, color: '#696969', type: 'heavy', radius: 18, damage: 10, pros: 'High armor & damage', cons: 'Slow movement', behavior: 'Roman Phalanx rigid grid formation' },
        'mudhorn': { hp: 500, speed: 1.2, color: '#8b5a2b', type: 'boss', radius: 35, damage: 25, signetDrop: 'mudhorn_horn', pros: 'Devastating charge', cons: 'Large turning radius', behavior: 'Relentless aggression' }
    };

    const ACTIVE_ENTITIES = {
        player: null,
        enemies: [],
        projectiles: [],
        particles: [],
        loot: [] // Holds physical drops
    };

    const ARCHETYPES = {
        'foundry_master': { baseHp: 100, baseArmor: 5, speed: 4, scrapCostMod: 0.8 },
        'heavy_commando': { baseHp: 130, baseArmor: 20, speed: 3.2, scrapCostMod: 1.0 },
        'death_watch': { baseHp: 90, baseArmor: -5, speed: 5.5, critChance: 0.25, scrapCostMod: 1.0 },
        'beskar_smith': { baseHp: 100, baseArmor: 0, speed: 4, scrapCostMod: 1.0 }
    };

    const inputState = { 
        isDragging: false, 
        dragStartX: 0, 
        dragStartY: 0,
        currentX: 0,
        currentY: 0,
        lastInteractionTime: 0
    };

    function initInput() {
        canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
        canvas.addEventListener('touchmove', handlePointerMove, {passive: false});
        canvas.addEventListener('touchend', handlePointerUp, {passive: false});
        canvas.addEventListener('touchcancel', handlePointerUp, {passive: false});
        
        canvas.addEventListener('mousedown', handlePointerDown);
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('mouseup', handlePointerUp);
        canvas.addEventListener('mouseleave', handlePointerUp);

        window.addEventListener('touchmove', (e) => {
            if (gameState.isRunning) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    function handlePointerDown(e) {
        if (!gameState.isRunning || gameState.isShopping) return;
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
        if (!inputState.isDragging || !gameState.isRunning || gameState.isShopping) return;
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

    class Particle {
        constructor(x, y, colorStr = 'rgba(169, 169, 169, ') {
            this.x = x;
            this.y = y;
            this.radius = Math.random() * 6 + 4; 
            this.life = 1.0; 
            this.decay = Math.random() * 0.03 + 0.02; 
            this.color = colorStr; 
        }

        update() {
            this.life -= this.decay;
            this.radius += 0.2; 
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
            this.radius = 3.5;
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
    /**
 * =============================================================================
 * File: game.js (Part 2 of 3)
 * =============================================================================
 */
    class Loot {
        constructor(x, y, amount) {
            this.x = x;
            this.y = y;
            this.amount = amount;
            this.radius = 6;
            this.color = '#ffd700'; 
            this.active = true;
            this.pulse = 0;
        }

        update() {
            this.pulse += 0.1;
            this.radius = 6 + Math.sin(this.pulse) * 1.5;
        }

        render() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0; 
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
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
            this.damageMod = 0; 
            
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
            this.radius = 15; 
            this.color = '#c0c0c0'; 

            this.lastShotTime = 0;
            this.fireRate = 450; 
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
                if (dist < minDistance && enemy.state !== 'spawning') {
                    minDistance = dist;
                    nearestEnemy = enemy;
                }
            });

            if (nearestEnemy) {
                const totalDamage = 10 + this.damageMod;
                ACTIVE_ENTITIES.projectiles.push(new Projectile(this.x, this.y, nearestEnemy.x, nearestEnemy.y, 9, totalDamage));
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
            ctx.fillRect(this.x - 15, this.y - 24, 30, 4);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 15, this.y - 24, 30 * Math.max(0, (this.hp / this.maxHp)), 4);
        }
    }

    class Enemy {
        constructor(typeKey, startX, startY, currentWave, indexId) {
            const stats = ENEMY_DICTIONARY[typeKey] || ENEMY_DICTIONARY['acolyte'];
            this.type = typeKey;
            
            const healthScale = Math.pow(1.10, currentWave - 1);
            this.hp = Math.floor(stats.hp * healthScale);
            this.maxHp = this.hp;
            
            this.baseSpeed = stats.speed; 
            this.speed = stats.speed;
            this.radius = stats.radius;
            this.damage = stats.damage;
            this.color = stats.color;
            this.x = startX;
            this.y = startY;
            this.active = true;

            this.isAware = false;
            this.viewingDistance = this.radius * 10; 
            this.fov = Math.PI / 2; 
            this.patrolTimer = Math.floor(Math.random() * 60);

            this.state = 'observing'; 
            this.stateTimer = Math.floor(Math.random() * 40) + 20;
            this.angle = Math.atan2(canvas.height/2 - startY, canvas.width/2 - startX); 
            
            this.formationOffsetX = (indexId % 4) * 45 - 60;
            this.formationOffsetY = Math.floor(indexId / 4) * 45 - 60;

            this.ticks = Math.floor(Math.random() * 100);
            this.randomSeed = Math.random() * Math.PI * 2; 
        }

        update(player) {
            if (!player) return;

            this.ticks++;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distanceToPlayer = Math.hypot(dx, dy);
            const directAngleToPlayer = Math.atan2(dy, dx);
            const wanderAngle = Math.sin(this.ticks * 0.05 + this.randomSeed) * 0.4;
            let targetAngle = directAngleToPlayer + wanderAngle;

            if (!this.isAware) {
                let angleDiff = Math.abs(directAngleToPlayer - this.angle);
                while (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

                if (distanceToPlayer < this.viewingDistance && angleDiff < this.fov / 2) {
                    this.isAware = true;
                }

                if (!this.isAware) {
                    let friendSpotted = false;
                    let friendTargetAngle = this.angle;

                    for (let i = 0; i < ACTIVE_ENTITIES.enemies.length; i++) {
                        let friend = ACTIVE_ENTITIES.enemies[i];
                        if (friend !== this && friend.isAware) {
                            let fdx = friend.x - this.x;
                            let fdy = friend.y - this.y;
                            let distToFriend = Math.hypot(fdx, fdy);
                            let angleToFriend = Math.atan2(fdy, fdx);

                            let fAngleDiff = Math.abs(angleToFriend - this.angle);
                            while (fAngleDiff > Math.PI) fAngleDiff = Math.PI * 2 - fAngleDiff;

                            if (distToFriend < this.viewingDistance && fAngleDiff < this.fov / 2) {
                                friendSpotted = true;
                                friendTargetAngle = directAngleToPlayer; 
                                break;
                            }
                        }
                    }

                    if (friendSpotted) {
                        let diff = friendTargetAngle - this.angle;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        this.angle += Math.max(-0.015, Math.min(0.015, diff));
                    } else {
                        this.patrolTimer--;
                        if (this.patrolTimer <= 0) {
                            this.angle += Math.PI + (Math.random() * 0.5 - 0.25); 
                            this.patrolTimer = 120 + Math.floor(Math.random() * 60);
                        }
                        this.speed = this.baseSpeed * 0.3; 
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                    }
                }
            }

            if (this.isAware) {
                if (this.type === 'strill') {
                    this.state = 'moving';
                    if (distanceToPlayer > 180) {
                        targetAngle = directAngleToPlayer + (Math.PI / 2) + wanderAngle;
                        this.speed = this.baseSpeed * 1.2;
                    } else {
                        targetAngle = directAngleToPlayer;
                        this.speed = this.baseSpeed * 1.8;
                    }
                    this.angle = targetAngle;
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                }
                else if (this.type === 'clansman') {
                    let hasBackup = ACTIVE_ENTITIES.enemies.some(e => e !== this && e.type === 'clansman' && Math.hypot(e.x - this.x, e.y - this.y) < 250);
                    if (!hasBackup) {
                        this.state = 'fleeing';
                        targetAngle = directAngleToPlayer + Math.PI + wanderAngle;
                        this.speed = this.baseSpeed * 1.5; 
                    } else {
                        this.state = 'moving';
                        this.speed = this.baseSpeed;
                    }
                    this.angle = targetAngle;
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                }
                else if (this.type === 'acolyte') {
                    if (this.state === 'observing') {
                        this.angle = targetAngle;
                        this.stateTimer--;
                        if (this.stateTimer <= 0) {
                            this.state = 'moving';
                            this.stateTimer = 90; 
                        }
                    } else if (this.state === 'moving') {
                        this.angle = targetAngle;
                        this.speed = this.baseSpeed;
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                        this.stateTimer--;
                        if (this.stateTimer <= 0) {
                            this.state = 'observing';
                            this.stateTimer = 25; 
                        }
                    }
                } 
                else if (this.type === 'krayt') {
                    if (this.state === 'fleeing') {
                        this.angle = directAngleToPlayer + Math.PI; 
                        this.x += Math.cos(this.angle) * (this.speed * 1.4);
                        this.y += Math.sin(this.angle) * (this.speed * 1.4);
                        this.stateTimer--;
                        if (this.stateTimer <= 0) {
                            this.state = 'moving';
                        }
                    } else {
                        this.state = 'moving';
                        this.speed = this.baseSpeed;
                        const weaveAngle = directAngleToPlayer + Math.sin(this.ticks * 0.15) * 1.2;
                        this.angle = weaveAngle;
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;
                    }
                } 
                else if (this.type === 'mercenary') {
                    this.state = 'moving';
                    this.speed = this.baseSpeed;
                    const marchTargetX = player.x + this.formationOffsetX;
                    const marchTargetY = player.y + this.formationOffsetY;
                    const angleToFormation = Math.atan2(marchTargetY - this.y, marchTargetX - this.x);
                    
                    this.angle = directAngleToPlayer; 
                    this.x += Math.cos(angleToFormation) * this.speed;
                    this.y += Math.sin(angleToFormation) * this.speed;
                } 
                else if (this.type === 'mudhorn') {
                    if (this.state === 'charging') {
                        this.x += Math.cos(this.angle) * 6.5; 
                        this.y += Math.sin(this.angle) * 6.5;
                        if (this.ticks % 2 === 0) {
                            ACTIVE_ENTITIES.particles.push(new Particle(this.x, this.y, 'rgba(139, 90, 43, '));
                        }
                        this.stateTimer--;
                        if (this.stateTimer <= 0 || this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                            this.state = 'exhausted';
                            this.stateTimer = 50; 
                        }
                    } else if (this.state === 'exhausted') {
                        this.stateTimer--;
                        if (this.stateTimer <= 0) {
                            this.state = 'observing';
                        }
                    } else {
                        this.speed = this.baseSpeed;
                        let diff = directAngleToPlayer - this.angle;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        
                        const maxTurn = 0.035; 
                        this.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
                        this.x += Math.cos(this.angle) * this.speed;
                        this.y += Math.sin(this.angle) * this.speed;

                        if (Math.abs(diff) < 0.2 && distanceToPlayer < 350 && distanceToPlayer > 80) {
                            this.state = 'charging';
                            this.stateTimer = 45; 
                        }
                    }
                }
            }

            if (this.x <= this.radius || this.x >= canvas.width - this.radius ||
                this.y <= this.radius || this.y >= canvas.height - this.radius) {
                this.angle += Math.PI; 
            }
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }

        render() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.arc(this.x, this.y, this.viewingDistance, this.angle - this.fov/2, this.angle + this.fov/2);
            ctx.lineTo(this.x, this.y);
            ctx.fillStyle = this.isAware ? 'rgba(255, 69, 0, 0.2)' : 'rgba(255, 255, 255, 0.15)'; 
            ctx.fill();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
            
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 12, this.y - (this.radius + 8), 24, 3);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - 12, this.y - (this.radius + 8), 24 * Math.max(0, (this.hp / this.maxHp)), 3);
        }
        }
   /**
 * =============================================================================
 * File: game.js (Part 3 of 3)
 * =============================================================================
 */
    function spawnWave(waveNumber) {
        const enemyCount = waveNumber * 4 + 2;
        const enemyTypes = Object.keys(ENEMY_DICTIONARY);

        for (let i = 0; i < enemyCount; i++) {
            let typeKey = enemyTypes[Math.floor(Math.random() * (enemyTypes.length - 1))];
            if (waveNumber % 5 === 0 && i === 0) {
                typeKey = 'mudhorn';
            }
            
            let spawnX, spawnY;
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { spawnX = Math.random() * canvas.width; spawnY = -20; }
            else if (edge === 1) { spawnX = canvas.width + 20; spawnY = Math.random() * canvas.height; }
            else if (edge === 2) { spawnX = Math.random() * canvas.width; spawnY = canvas.height + 20; }
            else { spawnX = -20; spawnY = Math.random() * canvas.height; }

            ACTIVE_ENTITIES.enemies.push(new Enemy(typeKey, spawnX, spawnY, waveNumber, i));
        }
    }

    function checkCollisions() {
        for (let i = ACTIVE_ENTITIES.projectiles.length - 1; i >= 0; i--) {
            const p = ACTIVE_ENTITIES.projectiles[i];
            for (let j = ACTIVE_ENTITIES.enemies.length - 1; j >= 0; j--) {
                const e = ACTIVE_ENTITIES.enemies[j];
                const dist = Math.hypot(p.x - e.x, p.y - e.y);
                
                if (dist < p.radius + e.radius) {
                    e.hp -= p.damage;
                    e.isAware = true; 
                    p.active = false;
                    
                    if (e.hp <= 0) {
                        e.active = false;
                        const dropAmount = (e.type === 'mudhorn') ? 100 : 10;
                        ACTIVE_ENTITIES.loot.push(new Loot(e.x, e.y, dropAmount));
                    }
                    break; 
                }
            }
        }

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
                    
                    e1.x -= nx * (overlap / 2);
                    e1.y -= ny * (overlap / 2);
                    e2.x += nx * (overlap / 2);
                    e2.y += ny * (overlap / 2);
                }
            }
        }

        ACTIVE_ENTITIES.projectiles = ACTIVE_ENTITIES.projectiles.filter(p => p.active);
        ACTIVE_ENTITIES.enemies = ACTIVE_ENTITIES.enemies.filter(e => e.active);

        if (ACTIVE_ENTITIES.player) {
            const p = ACTIVE_ENTITIES.player;
            
            ACTIVE_ENTITIES.enemies.forEach(e => {
                const dx = p.x - e.x;
                const dy = p.y - e.y;
                const distance = Math.hypot(dx, dy);
                const minDistance = p.radius + e.radius;

                if (distance < minDistance) {
                    p.hp -= e.damage * 0.05; 
                    e.isAware = true; 

                    const nx = dx / distance;
                    const ny = dy / distance;
                    e.x -= nx * (e.speed * 6);
                    e.y -= ny * (e.speed * 6);

                    if (e.type === 'krayt') {
                        e.state = 'fleeing';
                        e.stateTimer = 40; 
                    }

                    if (p.hp <= 0) {
                        handleGameOver();
                    }
                }
            });

            // Loot pickup handling
            for (let i = ACTIVE_ENTITIES.loot.length - 1; i >= 0; i--) {
                const l = ACTIVE_ENTITIES.loot[i];
                const dist = Math.hypot(p.x - l.x, p.y - l.y);
                if (dist < p.radius + l.radius) {
                    gameState.beskarScrap += l.amount;
                    l.active = false;
                    window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                }
            }
        }
    }

    function handleGameOver() {
        gameState.isRunning = false;
        document.getElementById('btn-pause').style.display = 'none'; 
        document.getElementById('game-hud').style.display = 'none'; 
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('game-over-stats').innerText = `You reached Wave ${gameState.wave} and collected ${gameState.beskarScrap} Beskar Scrap.`;
        saveProgress();
    }

    function resetGame() {
        ACTIVE_ENTITIES.player = null;
        ACTIVE_ENTITIES.enemies = [];
        ACTIVE_ENTITIES.projectiles = [];
        ACTIVE_ENTITIES.particles = [];
        ACTIVE_ENTITIES.loot = [];
        gameState.wave = 1;
        gameState.beskarScrap = 0;
        inputState.isDragging = false;
    }

    function triggerShopPhase() {
        gameState.isShopping = true;
        inputState.isDragging = false;
        
        window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
        window.dispatchEvent(new Event('verdikaOpenShop'));
    }

    function gameLoop() {
        if (!gameState.isRunning) return;
        
        if (!gameState.isShopping) {
            updateLogic();
        }
        
        renderCanvas();
        updateHUD();
        
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
        
        ACTIVE_ENTITIES.particles.forEach(p => p.update());
        ACTIVE_ENTITIES.particles = ACTIVE_ENTITIES.particles.filter(p => p.life > 0);

        ACTIVE_ENTITIES.loot.forEach(l => l.update());
        ACTIVE_ENTITIES.loot = ACTIVE_ENTITIES.loot.filter(l => l.active);

        checkCollisions();

        if (ACTIVE_ENTITIES.enemies.length === 0 && ACTIVE_ENTITIES.player && gameState.isRunning && !gameState.isShopping) {
            saveProgress(); 
            triggerShopPhase();
        }
    }

    function updateHUD() {
        const waveElem = document.getElementById('hud-wave-val');
        const scrapElem = document.getElementById('hud-scrap-val');
        if (waveElem) waveElem.innerText = gameState.wave;
        if (scrapElem) scrapElem.innerText = gameState.beskarScrap;
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
        
        ACTIVE_ENTITIES.particles.forEach(p => p.render());
        
        ACTIVE_ENTITIES.loot.forEach(l => l.render());
    }

    function saveProgress() {
        try {
            localStorage.setItem('verdika_save_state', JSON.stringify(gameState));
        } catch (e) {
            console.warn('OpSec: LocalStorage blocked by browser privacy settings.');
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    let wasRunningBeforeHelp = false;

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
                document.getElementById('game-hud').style.display = 'flex'; 
                
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
                document.getElementById('game-hud').style.display = 'none'; 
                resetGame();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            window.addEventListener('verdikaBuyUpgrade', (e) => {
                const { type, cost } = e.detail;
                if (gameState.beskarScrap >= cost && ACTIVE_ENTITIES.player) {
                    gameState.beskarScrap -= cost;
                    const p = ACTIVE_ENTITIES.player;
                                        
                    if (type === 'hp') {
                        p.maxHp += 20;
                        p.hp += 20;
                    } else if (type === 'speed') {
                        p.maxSpeed *= 1.10;
                    } else if (type === 'damage') {
                        p.damageMod += 2;
                    }
                    
                    window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                }
            });

            window.addEventListener('verdikaCloseShop', () => {
                gameState.isShopping = false;
                gameState.wave++;
                spawnWave(gameState.wave);
            });

            window.addEventListener('verdikaPauseGame', () => {
                gameState.isRunning = false; 
            });

            window.addEventListener('verdikaResumeGame', () => {
                if (!gameState.isRunning && ACTIVE_ENTITIES.player) {
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
                document.getElementById('game-hud').style.display = 'none'; 
                resetGame();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            window.addEventListener('verdikaHelpOpened', () => {
                if (ACTIVE_ENTITIES.player && gameState.isRunning) {
                    wasRunningBeforeHelp = true;
                    gameState.isRunning = false; 
                }
            });

            window.addEventListener('verdikaHelpClosed', () => {
                if (wasRunningBeforeHelp) {
                    gameState.isRunning = true;
                    wasRunningBeforeHelp = false;
                    inputState.lastInteractionTime = Date.now();
                    requestAnimationFrame(gameLoop);
                }
            });
        },
        
        getEnemyDictionary: function() {
            return ENEMY_DICTIONARY;
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.VerdikaGame.init();
});
                
