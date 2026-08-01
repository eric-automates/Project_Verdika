/**
 * =============================================================================
 * File: utilities.js
 * Project: Project_Verdika
 * Description: Mandatory Utilities Layer containing the Help guide, About 
 *              dropdown, Settings Modals, Health Gauges, and Threat Log renderer.
 * Architecture Rules:
 *   - Zero-Dependency: Pure Vanilla JavaScript, no external libraries.
 *   - OpSec/Privacy: Gracefully handles LocalStorage security blocks.
 *   - DOM Interaction: Hooks into the semantic HTML5 foundation.
 * =============================================================================
 */

const VerdikaUtilities = (function() {

    const elements = {};

    function hydrateElements() {
        elements.btnHelp = document.getElementById('btn-help');
        elements.btnPause = document.getElementById('btn-pause');
        elements.btnSettingsMain = document.getElementById('btn-settings-main');
        elements.btnCloseSettings = document.getElementById('btn-close-settings');
        elements.btnResumeGame = document.getElementById('btn-resume-game');
        elements.btnQuitGame = document.getElementById('btn-quit-game');
        elements.btnConfirmQuit = document.getElementById('btn-confirm-quit');
        elements.btnCancelQuit = document.getElementById('btn-cancel-quit');
        elements.btnThreatLog = document.getElementById('btn-threat-log');
        elements.btnCloseThreatLog = document.getElementById('btn-close-threat-log');
        
        elements.aboutDropdown = document.getElementById('dropdown-about');
        elements.parkingLot = document.getElementById('parking-lot');
        elements.modalSettings = document.getElementById('modal-settings');
        elements.modalQuitConfirm = document.getElementById('modal-quit-confirm');
        elements.modalThreatLog = document.getElementById('modal-threat-log');
        elements.threatList = document.getElementById('threat-list');
        elements.healthGaugesTarget = document.getElementById('health-gauges');
    }

    function initHelp() {
        elements.btnHelp.addEventListener('click', () => {
            const isHidden = elements.aboutDropdown.style.display === 'none';
            elements.aboutDropdown.style.display = isHidden ? 'block' : 'none';
            elements.btnHelp.textContent = isHidden ? 'Return' : 'Help';

            if (isHidden) {
                window.dispatchEvent(new Event('verdikaHelpOpened'));
            } else {
                window.dispatchEvent(new Event('verdikaHelpClosed'));
            }
        });
    }

    /**
     * Populates the Threat Assessment Log.
     * Generates an exact SVG replica of the in-game canvas entity (Circle + Facing Visor Wedge + Healthbar).
     */
    function initThreatLog() {
        elements.btnThreatLog.addEventListener('click', () => {
            elements.modalThreatLog.showModal();
            elements.threatList.innerHTML = ''; 

            const enemies = window.VerdikaGame ? window.VerdikaGame.getEnemyDictionary() : {};

            for (const [key, data] of Object.entries(enemies)) {
                const card = document.createElement('div');
                card.className = 'threat-card';
                
                // SVG representation matching canvas render (Circle, 90deg visor wedge facing right, healthbar above)
                const svgVisual = `
                <div class="threat-card__visual">
                    <svg width="65" height="65" viewBox="0 0 65 65">
                        <!-- Overhead Health Bar -->
                        <rect x="12.5" y="6" width="40" height="4" fill="red" rx="1"/>
                        <rect x="12.5" y="6" width="40" height="4" fill="green" rx="1"/>
                        <!-- Facing Visor Wedge (Semi-circle shadow highlight) -->
                        <path d="M 32.5 35 L 50.5 22.5 A 18 18 0 0 1 50.5 47.5 Z" fill="rgba(255, 255, 255, 0.45)"/>
                        <!-- Core Body -->
                        <circle cx="32.5" cy="35" r="${Math.min(data.radius * 1.1, 16)}" fill="${data.color}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                    </svg>
                </div>`;

                card.innerHTML = `
                    ${svgVisual}
                    <div class="threat-card__info">
                        <h4>${key} <span class="badge" style="background-color: ${data.color};">${data.type.toUpperCase()}</span></h4>
                        <p><strong>Base HP:</strong> ${data.hp} | <strong>Speed:</strong> ${data.speed} | <strong>Damage:</strong> ${data.damage}</p>
                        <p><strong>Behavior:</strong> ${data.behavior}</p>
                        <p><strong>Pros:</strong> ${data.pros}</p>
                        <p><strong>Cons:</strong> ${data.cons}</p>
                    </div>
                `;
                elements.threatList.appendChild(card);
            }
        });

        elements.btnCloseThreatLog.addEventListener('click', () => {
            elements.modalThreatLog.close();
        });
    }

    function initModals() {
        elements.btnSettingsMain.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'none'; 
            elements.btnQuitGame.style.display = 'none';   
            elements.btnCloseSettings.style.display = 'inline-block';
            elements.modalSettings.showModal();
        });

        elements.btnPause.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'inline-block'; 
            elements.btnQuitGame.style.display = 'inline-block';   
            elements.btnCloseSettings.style.display = 'none';
            
            window.dispatchEvent(new Event('verdikaPauseGame'));
            elements.modalSettings.showModal();
        });

        elements.btnCloseSettings.addEventListener('click', () => {
            elements.modalSettings.close();
        });

        elements.btnResumeGame.addEventListener('click', () => {
            elements.modalSettings.close();
            window.dispatchEvent(new Event('verdikaResumeGame'));
        });

        elements.btnQuitGame.addEventListener('click', () => {
            elements.modalSettings.close();
            elements.modalQuitConfirm.showModal();
        });

        elements.btnCancelQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close();
            elements.modalSettings.showModal(); 
        });

        elements.btnConfirmQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close();
            window.dispatchEvent(new Event('verdikaQuitToMenu'));
        });
    }

    class HealthMonitor {
        constructor() {
            this.frameCount = 0;
            this.lastTime = performance.now();
            this.measureFPS = this.measureFPS.bind(this);
            requestAnimationFrame(this.measureFPS);
        }

        measureFPS(currentTime) {
            const delta = currentTime - this.lastTime;
            this.frameCount++;
            
            if (delta >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / delta);
                const fpsGauge = Math.min(100, Math.round((fps / 60) * 100));
                this.updateGauges(fpsGauge, this.measureDOM(), this.measureMemory());
                this.frameCount = 0;
                this.lastTime = currentTime;
            }
            requestAnimationFrame(this.measureFPS);
        }

        measureDOM() {
            const elementsCount = document.getElementsByTagName('*').length;
            return Math.min(100, Math.round((elementsCount / 1500) * 100));
        }

        measureMemory() {
            if (performance && performance.memory) {
                const memoryUsed = performance.memory.usedJSHeapSize;
                const memoryLimit = performance.memory.jsHeapSizeLimit;
                return Math.min(100, Math.round((memoryUsed / memoryLimit) * 100));
            }
            return 0; 
        }

        updateGauges(fps, dom, mem) {
            if (elements.healthGaugesTarget) {
                elements.healthGaugesTarget.innerHTML = `
                    <p>Version: 1.0.5 | Offline-first survival roguelite.</p>
                    <h4>Diagnostic Gauges</h4>
                    <p>FPS Engine: ${fps}%</p>
                    <p>DOM Bloat: ${dom}%</p>
                    <p>Memory Footprint: ${mem}%</p>
                `;
            }
        }
    }

    function initParkingLot() {
        let notes = [
            'Implement Between-Wave Shop for Scrap Spending',
            'Determine Auto-pickup vs Looting Mini-game',
            'Design Holographic Comm-Puck Projection UI for Threat Log'
        ];

        try {
            const savedNotes = localStorage.getItem('verdika_parking_lot');
            if (savedNotes) {
                notes = JSON.parse(savedNotes);
            }
        } catch (e) {
            console.warn('OpSec: LocalStorage access blocked. Proceeding with default Parking Lot.');
        }

        elements.parkingLot.innerHTML = '<h3>Parking Lot Backlog</h3>';
        notes.forEach(note => {
            const p = document.createElement('p');
            p.textContent = '- ' + note;
            elements.parkingLot.appendChild(p);
        });
    }

    return {
        init: function() {
            hydrateElements(); 
            initHelp();
            initThreatLog();
            initModals();
            initParkingLot();
            new HealthMonitor(); 
        }
    };

})();

document.addEventListener('DOMContentLoaded', () => {
    VerdikaUtilities.init();
});
