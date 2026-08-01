/**
 * =============================================================================
 * File: utilities.js
 * Project: Project_Verdika
 * Description: Mandatory Utilities Layer containing the Help guide, About 
 *              dropdown, Settings Modals, real-time Health Gauges, and the Parking Lot backlog.
 * Architecture Rules:
 *   - Zero-Dependency: Pure Vanilla JavaScript, no external libraries[span_12](start_span)[span_12](end_span).
 *   - OpSec/Privacy: Gracefully handles LocalStorage security blocks common in privacy browsers[span_13](start_span)[span_13](end_span).
 *   - DOM Interaction: Hooks into the semantic HTML5 foundation without inline styles[span_14](start_span)[span_14](end_span).
 * Mandatory Update Points:
 *   - To add new gauges, append calculation methods to the HealthMonitor class.
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

    /**
     * Initializes the Help Button overlay.
     */
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
     * Populates the Threat Assessment Log utilizing data straight from game.js
     * Fix: Ensure we tap into window.VerdikaGame explicitly.
     */
    function initThreatLog() {
        elements.btnThreatLog.addEventListener('click', () => {
            elements.modalThreatLog.showModal();
            elements.threatList.innerHTML = ''; 

            const enemies = window.VerdikaGame ? window.VerdikaGame.getEnemyDictionary() : {};

            for (const [key, data] of Object.entries(enemies)) {
                const card = document.createElement('div');
                card.className = 'threat-card';
                
                // SVG representation mimicking canvas render logic (circle + visor)
                const svgVisual = `
                <div class="threat-card__visual">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                        <circle cx="30" cy="30" r="${Math.min(data.radius * 1.5, 25)}" fill="${data.color}" />
                        <path d="M 15 25 Q 30 40 45 25" stroke="rgba(255, 255, 255, 0.6)" stroke-width="4" fill="none" stroke-linecap="round"/>
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

        // Use the close button OR clicking outside the modal (handled via standard dialog methods if desired)
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
                    <p>Version: 1.0.4 | Offline-first survival roguelite.</p>
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
            'Design AI Allies/Squad Companions'
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
