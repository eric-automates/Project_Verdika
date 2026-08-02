/**
 * =============================================================================
 * File: game.js (Part 1 of 3)
 * Project: Project_Verdika
 * Description: Core logic loop, object rendering, and market integration.
 * Architecture Rules:
 *   - Zero-Dependency: Native requestAnimationFrame 60FPS loop.
 *   - Modularity: Wraps all logic in an IIFE, attached explicitly to window.
 *   - OpSec/Privacy: Resilient against strict-browser storage blocking. Prioritizes local variables over DOM memory.
 * =============================================================================
 */

window.VerdikaGame = (function() {
    let canvas, ctx;
    
    let gameState = {
        isRunning: false,
        isShopping: false,
        isMarket: false,
        waveCleared: false, // Tracks manual transition state
        wave: 1,
        beskarScrap: 0
    };

    const ENEMY_DICTIONARY = {
        'acolyte': { hp: 20, speed: 1.5, color: '#4682b4', type: 'horde', radius: 12, damage: 5 },
        'strill': { hp: 30, speed: 2.5, color: '#8b4513', type: 'hound', radius: 10, damage: 8 },
        'krayt': { hp: 10, speed: 2.8, color: '#228b22', type: 'swarm', radius: 8, damage: 2 },
        'clansman': { hp: 80, speed: 1.8, color: '#4b0082', type: 'warrior', radius: 15, damage: 15 },
        'mercenary': { hp: 50, speed: 0.9, color: '#696969', type: 'heavy', radius: 18, damage: 10 },
        'mudhorn': { hp: 500, speed: 1.2, color: '#8b5a2b', type: 'boss', radius: 35, damage: 25 }
    };

    const MARKET_DICTIONARY = [
        { id: 'w_heavy', name: 'Heavy Repeater', desc: 'Increases fire rate drastically. Stackable.', cost: 150, type: 'weapon' },
        { id: 'w_scatter', name: 'Scattergun', desc: 'Fires projectiles in a spread. Duplicates add +2 spread.', cost: 200, type: 'weapon' },
        { id: 'w_sniper', name: 'Sniper Rifle', desc: 'Massive damage, fast projectile. Stackable dmg.', cost: 180, type: 'weapon' },
        { id: 'w_carbine', name: 'Blaster Carbine', desc: 'Projectiles travel faster. Stackable speed.', cost: 120, type: 'weapon' },
        { id: 'w_plasma', name: 'Plasma Cannon', desc: 'Base damage +10. Stackable.', cost: 100, type: 'weapon' },
        { id: 'a_pauldrons', name: 'Beskar Pauldrons', desc: '+50 Max HP. Stackable.', cost: 150, type: 'armor' },
        { id: 'a_plating', name: 'Durasteel Plating', desc: 'Damage resistance +2. Stackable.', cost: 120, type: 'armor' },
        { id: 'a_reflec', name: 'Reflec Coating', desc: '+20% Movement Speed. Stackable.', cost: 100, type: 'armor' },
        { id: 'a_shield', name: 'Energy Shield', desc: 'Regenerates 1 HP per second. Stackable.', cost: 250, type: 'armor' },
        { id: 'a_cortosis', name: 'Cortosis Weave', desc: 'Melee attackers take 5 damage.', cost: 180, type: 'armor' },
        { id: 'i_carbonite', name: 'Carbonite Grenade', desc: 'Auto-freezes all enemies every 15s.', cost: 150, type: 'item' },
        { id: 'i_bacta', name: 'Bacta Infusion', desc: 'Instantly heals to 100% HP.', cost: 80, type: 'item' },
        { id: 'i_magnet', name: 'Beskar Magnet', desc: 'Triples loot pickup radius.', cost: 150, type: 'item' },
        { id: 'i_optics', name: 'Targeting Optics', desc: 'Projectiles last twice as long. Stackable.', cost: 100, type: 'item' },
        { id: 'i_stim', name: 'Overdrive Stim', desc: 'Double speed & fire rate for first 10s of wave.', cost: 120, type: 'item' }
    ];

    const ACTIVE_ENTITIES = { player: null, enemies: [], projectiles: [], particles: [], loot: [] };

    const ARCHETYPES = {
        'foundry_master': { baseHp: 100, speed: 4 },
        'heavy_commando': { baseHp: 130, speed: 3.2 },
        'death_watch': { baseHp: 90, speed: 5.5 },
        'beskar_smith': { baseHp: 100, speed: 4 }
    };

    const inputState = { isDragging: false, dragStartX: 0, dragStartY: 0, currentX: 0, currentY: 0, lastTime: 0 };

    function initInput() {
        canvas.addEventListener('touchstart', handlePointerDown, {passive: false});
        canvas.addEventListener('touchmove', handlePointerMove, {passive: false});
        canvas.addEventListener('touchend', handlePointerUp, {passive: false});
        canvas.addEventListener('mousedown', handlePointerDown);
        canvas.addEventListener('mousemove', handlePointerMove);
        canvas.addEventListener('mouseup', handlePointerUp);
        window.addEventListener('touchmove', (e) => { if (gameState.isRunning) e.preventDefault(); }, { passive: false });
    }

    function handlePointerDown(e) {
        if (!gameState.isRunning || gameState.isShopping || gameState.isMarket) return;
        e.preventDefault(); 
        inputState.isDragging = true;
        const pos = getPointerPos(e);
        inputState.dragStartX = inputState.currentX = pos.x;
        inputState.dragStartY = inputState.currentY = pos.y;
        inputState.lastTime = Date.now();
    }

    function handlePointerMove(e) {
        if (!inputState.isDragging || !gameState.isRunning || gameState.isShopping || gameState.isMarket) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        inputState.currentX = pos.x; inputState.currentY = pos.y;
        inputState.lastTime = Date.now();
    }

    function handlePointerUp(e) {
        if (!gameState.isRunning) return;
        e.preventDefault();
        inputState.isDragging = false;
    }

    function getPointerPos(e) {
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = canvas.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    class Projectile {
        constructor(x, y, targetX, targetY, speed, damage, life = 1.0, colorStr = 'rgba(255, 215, 0,') {
            this.x = x; this.y = y; this.speed = speed; this.damage = damage;
            this.radius = 3.5; this.color = colorStr; this.active = true;
            const dist = Math.hypot(targetX - x, targetY - y);
            this.vx = (targetX - x) / dist * this.speed;
            this.vy = (targetY - y) / dist * this.speed;
            this.lifeSpan = 150 * life; // optics item scales this
        }
        update() {
            this.x += this.vx; this.y += this.vy; this.lifeSpan--;
            // Emit weapon-specific particles organically along trajectory
            if (Math.random() > 0.4) {
                ACTIVE_ENTITIES.particles.push(new Particle(this.x, this.y, this.color));
            }
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.lifeSpan <= 0) this.active = false;
        }
        render() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color + ' 1.0)'; ctx.fill(); ctx.closePath();
        }
            }
    /**
 * =============================================================================
 * File: game.js (Part 2 of 3)
 * =============================================================================
 */
    class Particle {
        constructor(x, y, colorStr = 'rgba(169, 169, 169, ') {
            this.x = x; this.y = y;
            this.radius = Math.random() * 4 + 2; 
            this.life = 1.0; 
            this.decay = Math.random() * 0.05 + 0.03; 
            this.color = colorStr; 
        }
        update() { this.life -= this.decay; this.radius += 0.2; }
        render() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color + `${this.life})`; ctx.fill(); ctx.closePath();
        }
    }

    class Loot {
        constructor(x, y, amount) {
            this.x = x; this.y = y; this.amount = amount;
            this.radius = 6; this.color = '#ffd700'; this.active = true; this.pulse = 0;
        }
        update() { this.pulse += 0.1; this.radius = 6 + Math.sin(this.pulse) * 1.5; }
        render() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill(); ctx.closePath();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.closePath();
        }
    }

    class Player {
        constructor(archetypeKey) {
            const stats = ARCHETYPES[archetypeKey] || ARCHETYPES['foundry_master'];
            this.hp = this.maxHp = stats.baseHp;
            this.maxSpeed = this.baseSpeed = stats.speed; 
            this.damageMod = 0; this.fireRate = 450; this.projSpeed = 9;
            this.weaponType = 'blaster'; this.armorMod = 0; this.healthRegen = 0;
            this.scatterCount = 3; // base for scatter weapon
            this.cortosis = false; this.carbonite = false; this.magnet = false;
            this.optics = 1.0; this.stim = false;
            
            this.x = canvas.width / 2; this.y = canvas.height / 2;
            this.radius = 15; this.color = '#c0c0c0'; 
            this.lastShotTime = 0; this.ticks = 0;
        }

        update() {
            this.ticks++;
            if (inputState.isDragging && Date.now() - inputState.lastTime > 500) inputState.isDragging = false;

            let currentSpeed = this.maxSpeed;
            let currentFireRate = this.fireRate;
            if (this.stim && this.ticks < 600) { currentSpeed *= 1.5; currentFireRate *= 0.5; }

            if (inputState.isDragging) {
                const dx = inputState.currentX - inputState.dragStartX;
                const dy = inputState.currentY - inputState.dragStartY;
                const distance = Math.hypot(dx, dy);
                if (distance > 5) { 
                    const mult = Math.min(distance / 100, 1);
                    this.x += (dx / distance) * (currentSpeed * mult);
                    this.y += (dy / distance) * (currentSpeed * mult);
                }
            }
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));

            if (this.healthRegen > 0 && this.ticks % 60 === 0) this.hp = Math.min(this.maxHp, this.hp + this.healthRegen);

            if (this.carbonite && this.ticks % 900 === 0 && ACTIVE_ENTITIES.enemies.length > 0) {
                ACTIVE_ENTITIES.enemies.forEach(e => e.frozenTimer = 180);
            }

            if (Date.now() - this.lastShotTime > currentFireRate && ACTIVE_ENTITIES.enemies.length > 0) this.shootNearest();
        }

        shootNearest() {
            let nearest = null; let minD = Infinity;
            ACTIVE_ENTITIES.enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < minD) { minD = dist; nearest = enemy; }
            });

            if (nearest) {
                const dmg = 10 + this.damageMod;
                // Core RGBA mapping for specific weapon traits
                let pColor = 'rgba(255, 215, 0,'; 
                if (this.weaponType === 'plasma') pColor = 'rgba(0, 255, 255,';
                if (this.weaponType === 'sniper') pColor = 'rgba(255, 255, 255,';
                if (this.weaponType === 'heavy') pColor = 'rgba(255, 0, 0,';
                if (this.weaponType === 'carbine') pColor = 'rgba(0, 255, 0,';
                if (this.weaponType === 'scatter') pColor = 'rgba(255, 140, 0,';

                if (this.weaponType === 'scatter') {
                    // Spread logic dynamically scales based on stack count
                    const offsetStart = Math.floor(this.scatterCount / 2);
                    for(let i = -offsetStart; i <= offsetStart; i++) {
                        const targetX = nearest.x + (i * 35); const targetY = nearest.y + (i * 35);
                        ACTIVE_ENTITIES.projectiles.push(new Projectile(this.x, this.y, targetX, targetY, this.projSpeed, dmg, this.optics, pColor));
                    }
                } else {
                    ACTIVE_ENTITIES.projectiles.push(new Projectile(this.x, this.y, nearest.x, nearest.y, this.projSpeed, dmg, this.optics, pColor));
                }
                this.lastShotTime = Date.now();
            }
        }

        render() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill(); ctx.closePath();
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 15, this.y - 24, 30, 4);
            ctx.fillStyle = 'green'; ctx.fillRect(this.x - 15, this.y - 24, 30 * Math.max(0, (this.hp / this.maxHp)), 4);
        }
    }

    class Enemy {
        constructor(typeKey, startX, startY, currentWave) {
            const stats = ENEMY_DICTIONARY[typeKey] || ENEMY_DICTIONARY['acolyte'];
            this.type = typeKey;
            this.hp = this.maxHp = Math.floor(stats.hp * Math.pow(1.10, currentWave - 1));
            this.speed = stats.speed; this.radius = stats.radius; this.damage = stats.damage;
            this.color = stats.color; this.x = startX; this.y = startY; this.active = true;
            this.frozenTimer = 0; 
        }
        update(player) {
            if (!player) return;
            if (this.frozenTimer > 0) { this.frozenTimer--; return; }
            const dx = player.x - this.x; const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        render() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.frozenTimer > 0 ? '#00ffff' : this.color; 
            ctx.fill(); ctx.closePath();
        }
                                            }
    /**
 * =============================================================================
 * File: game.js (Part 3 of 3)
 * =============================================================================
 */
    function spawnWave(waveNumber) {
        if(ACTIVE_ENTITIES.player) ACTIVE_ENTITIES.player.ticks = 0; 
        gameState.waveCleared = false; // Reset clear state
        const enemyCount = waveNumber * 4 + 2;
        const enemyTypes = Object.keys(ENEMY_DICTIONARY);

        for (let i = 0; i < enemyCount; i++) {
            let typeKey = enemyTypes[Math.floor(Math.random() * (enemyTypes.length - 1))];
            if (waveNumber % 5 === 0 && i === 0) typeKey = 'mudhorn';
            
            let spawnX, spawnY; const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { spawnX = Math.random() * canvas.width; spawnY = -20; }
            else if (edge === 1) { spawnX = canvas.width + 20; spawnY = Math.random() * canvas.height; }
            else if (edge === 2) { spawnX = Math.random() * canvas.width; spawnY = canvas.height + 20; }
            else { spawnX = -20; spawnY = Math.random() * canvas.height; }

            ACTIVE_ENTITIES.enemies.push(new Enemy(typeKey, spawnX, spawnY, waveNumber));
        }
    }

    function checkCollisions() {
        for (let i = ACTIVE_ENTITIES.projectiles.length - 1; i >= 0; i--) {
            const p = ACTIVE_ENTITIES.projectiles[i];
            for (let j = ACTIVE_ENTITIES.enemies.length - 1; j >= 0; j--) {
                const e = ACTIVE_ENTITIES.enemies[j];
                if (Math.hypot(p.x - e.x, p.y - e.y) < p.radius + e.radius) {
                    e.hp -= p.damage; p.active = false;
                    if (e.hp <= 0) {
                        e.active = false;
                        ACTIVE_ENTITIES.loot.push(new Loot(e.x, e.y, (e.type === 'mudhorn') ? 100 : 10));
                    }
                    break; 
                }
            }
        }

        ACTIVE_ENTITIES.projectiles = ACTIVE_ENTITIES.projectiles.filter(p => p.active);
        ACTIVE_ENTITIES.enemies = ACTIVE_ENTITIES.enemies.filter(e => e.active);

        if (ACTIVE_ENTITIES.player) {
            const p = ACTIVE_ENTITIES.player;
            ACTIVE_ENTITIES.enemies.forEach(e => {
                const distance = Math.hypot(p.x - e.x, p.y - e.y);
                if (distance < p.radius + e.radius) {
                    let actualDmg = e.damage * 0.05 - p.armorMod;
                    p.hp -= Math.max(1, actualDmg); 
                    if(p.cortosis) e.hp -= 5;
                    
                    e.x -= (p.x - e.x) / distance * (e.speed * 6);
                    e.y -= (p.y - e.y) / distance * (e.speed * 6);
                    if (p.hp <= 0) handleGameOver();
                }
            });

            ACTIVE_ENTITIES.loot.forEach(l => {
                let pickupRad = p.magnet ? p.radius + l.radius + 60 : p.radius + l.radius;
                if (Math.hypot(p.x - l.x, p.y - l.y) < pickupRad) {
                    gameState.beskarScrap += l.amount; l.active = false;
                    window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                }
            });
            ACTIVE_ENTITIES.loot = ACTIVE_ENTITIES.loot.filter(l => l.active);
        }
    }

    function handleGameOver() {
        gameState.isRunning = false;
        document.getElementById('btn-pause').style.display = 'none'; 
        document.getElementById('game-hud').style.display = 'none'; 
        document.getElementById('btn-go-foundry').style.display = 'none'; 
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('game-over-stats').innerText = `Reached Wave ${gameState.wave}. Gathered ${gameState.beskarScrap} Beskar.`;
    }

    function resetGame() {
        ACTIVE_ENTITIES.player = null; ACTIVE_ENTITIES.enemies = [];
        ACTIVE_ENTITIES.projectiles = []; ACTIVE_ENTITIES.loot = [];
        ACTIVE_ENTITIES.particles = [];
        gameState.wave = 1; gameState.beskarScrap = 0; inputState.isDragging = false;
    }

    function triggerShopPhase() {
        gameState.isShopping = true; inputState.isDragging = false;
        window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
        window.dispatchEvent(new Event('verdikaOpenShop'));
    }

    function triggerMarketPhase() {
        gameState.isMarket = true; inputState.isDragging = false;
        // Full list delivery ensuring repeated duplicate purchases are available to player
        window.dispatchEvent(new CustomEvent('verdikaOpenMarket', { detail: { items: MARKET_DICTIONARY } }));
    }

    function gameLoop() {
        if (!gameState.isRunning) return;
        if (!gameState.isShopping && !gameState.isMarket) {
            if (ACTIVE_ENTITIES.player) ACTIVE_ENTITIES.player.update();
            ACTIVE_ENTITIES.enemies.forEach(e => e.update(ACTIVE_ENTITIES.player));
            ACTIVE_ENTITIES.projectiles.forEach(p => p.update());
            ACTIVE_ENTITIES.particles.forEach(p => p.update());
            ACTIVE_ENTITIES.particles = ACTIVE_ENTITIES.particles.filter(p => p.life > 0);
            ACTIVE_ENTITIES.loot.forEach(l => l.update());
            
            checkCollisions();

            // Pacing Hook: Free-roaming loot mechanic integration
            if (ACTIVE_ENTITIES.enemies.length === 0 && ACTIVE_ENTITIES.player) {
                if(!gameState.waveCleared) {
                    gameState.waveCleared = true;
                    saveProgress();
                    window.dispatchEvent(new Event('verdikaWaveCleared'));
                }
            }
        }
        renderCanvas();
        requestAnimationFrame(gameLoop);
    }

    function renderCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (ACTIVE_ENTITIES.player) ACTIVE_ENTITIES.player.render();
        ACTIVE_ENTITIES.enemies.forEach(e => e.render());
        ACTIVE_ENTITIES.projectiles.forEach(p => p.render());
        ACTIVE_ENTITIES.particles.forEach(p => p.render());
        ACTIVE_ENTITIES.loot.forEach(l => l.render());
        
        document.getElementById('hud-wave-val').innerText = gameState.wave;
        document.getElementById('hud-scrap-val').innerText = gameState.beskarScrap;
    }

    function saveProgress() {
        try { localStorage.setItem('verdika_save_state', JSON.stringify(gameState)); } 
        catch (e) { console.warn('OpSec: LocalStorage blocked by browser privacy settings.'); }
    }

    return {
        init: function() {
            canvas = document.getElementById('game-canvas'); ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth; canvas.height = window.innerHeight;
            window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
            initInput();

            document.getElementById('btn-start').addEventListener('click', () => {
                document.getElementById('main-menu').style.display = 'none';
                document.getElementById('btn-pause').style.display = 'inline-block'; 
                document.getElementById('game-hud').style.display = 'flex'; 
                ACTIVE_ENTITIES.player = new Player(document.getElementById('archetype-picker').value);
                spawnWave(gameState.wave);
                gameState.isRunning = true; requestAnimationFrame(gameLoop);
            });

            document.getElementById('btn-restart').addEventListener('click', () => {
                document.getElementById('game-over').style.display = 'none';
                document.getElementById('main-menu').style.display = 'flex';
                resetGame(); ctx.clearRect(0, 0, canvas.width, canvas.height);
            });

            window.addEventListener('verdikaEnterFoundry', () => triggerShopPhase());

            window.addEventListener('verdikaBuyUpgrade', (e) => {
                const { type, cost } = e.detail;
                if (gameState.beskarScrap >= cost && ACTIVE_ENTITIES.player) {
                    gameState.beskarScrap -= cost; const p = ACTIVE_ENTITIES.player;
                    if (type === 'hp') { p.maxHp += 20; p.hp += 20; }
                    else if (type === 'speed') p.maxSpeed *= 1.10;
                    else if (type === 'damage') p.damageMod += 2;
                    window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                }
            });

            window.addEventListener('verdikaSellShop', () => {
                gameState.beskarScrap += 75; 
                gameState.isShopping = false;
                window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                triggerMarketPhase();
            });

            // Enables endless stacked purchases (no auto-close)
            window.addEventListener('verdikaBuyMarketItem', (e) => {
                const { id, cost } = e.detail;
                if (gameState.beskarScrap >= cost && ACTIVE_ENTITIES.player) {
                    gameState.beskarScrap -= cost; const p = ACTIVE_ENTITIES.player;
                    if(id === 'w_heavy') { p.weaponType = 'heavy'; p.fireRate = Math.max(50, p.fireRate - 100); }
                    if(id === 'w_scatter') { p.weaponType = 'scatter'; p.scatterCount += 2; }
                    if(id === 'w_sniper') { p.weaponType = 'sniper'; p.damageMod += 20; p.fireRate = 900; p.projSpeed += 3; }
                    if(id === 'w_carbine') { p.weaponType = 'carbine'; p.projSpeed += 4; }
                    if(id === 'w_plasma') { p.weaponType = 'plasma'; p.damageMod += 10; }
                    if(id === 'a_pauldrons') { p.maxHp += 50; p.hp += 50; }
                    if(id === 'a_plating') p.armorMod += 2;
                    if(id === 'a_reflec') { p.maxSpeed *= 1.2; p.baseSpeed *= 1.2; }
                    if(id === 'a_shield') p.healthRegen += 1;
                    if(id === 'a_cortosis') p.cortosis = true;
                    if(id === 'i_carbonite') p.carbonite = true;
                    if(id === 'i_bacta') p.hp = p.maxHp;
                    if(id === 'i_magnet') p.magnet = true;
                    if(id === 'i_optics') p.optics += 1.0;
                    if(id === 'i_stim') p.stim = true;
                    
                    window.dispatchEvent(new CustomEvent('verdikaUpdateShopUI', { detail: { beskar: gameState.beskarScrap } }));
                }
            });

            window.addEventListener('verdikaCloseShop', () => {
                gameState.isShopping = false; gameState.wave++; spawnWave(gameState.wave);
            });

            window.addEventListener('verdikaCloseMarket', () => {
                gameState.isMarket = false; gameState.wave++; spawnWave(gameState.wave);
            });
            
            window.addEventListener('verdikaPauseGame', () => gameState.isRunning = false );
            window.addEventListener('verdikaResumeGame', () => {
                if (ACTIVE_ENTITIES.player) { gameState.isRunning = true; inputState.lastTime = Date.now(); requestAnimationFrame(gameLoop); }
            });
            window.addEventListener('verdikaQuitToMenu', () => {
                gameState.isRunning = false; document.getElementById('main-menu').style.display = 'flex';
                document.getElementById('btn-go-foundry').style.display = 'none';
                resetGame(); ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => window.VerdikaGame.init());
