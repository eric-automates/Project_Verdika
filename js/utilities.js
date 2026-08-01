/**
 * =============================================================================
 * File: utilities.js
 * Project: Project_Verdika
 * Description: Mandatory Utilities Layer containing the Help guide, About 
 *              dropdown, Settings Modals, real-time Health Gauges, and the Parking Lot backlog.
 * Architecture Rules:
 *   - Zero-Dependency: Pure Vanilla JavaScript, no external libraries.
 *   - OpSec/Privacy: Uses strictly LocalStorage for saving Parking Lot notes.
 *   - DOM Interaction: Hooks into the semantic HTML5 foundation without inline 
 *     styles to separate content from presentation[span_5](start_span)[span_5](end_span).
 * Mandatory Update Points:
 *   - To add new gauges, append calculation methods to the HealthMonitor class.
 *   - Any DOM queries must align with the semantic tags in index.html.
 * =============================================================================
 */

const VerdikaUtilities = (function() {

    const elements = {
        btnHelp: document.getElementById('btn-help'),
        btnPause: document.getElementById('btn-pause'),
        btnSettingsMain: document.getElementById('btn-settings-main'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        btnResumeGame: document.getElementById('btn-resume-game'),
        btnQuitGame: document.getElementById('btn-quit-game'),
        btnConfirmQuit: document.getElementById('btn-confirm-quit'),
        btnCancelQuit: document.getElementById('btn-cancel-quit'),
        
        aboutDropdown: document.getElementById('dropdown-about'),
        parkingLot: document.getElementById('parking-lot'),
        modalSettings: document.getElementById('modal-settings'),
        modalQuitConfirm: document.getElementById('modal-quit-confirm'),
        healthGaugesTarget: document.getElementById('health-gauges')
    };

    /**
     * Initializes the Help Button overlay.
     */
    function initHelp() {
        elements.btnHelp.addEventListener('click', () => {
            const isHidden = elements.aboutDropdown.style.display === 'none';
            elements.aboutDropdown.style.display = isHidden ? 'block' : 'none';
        });
    }

    /**
     * Initializes all UI button hooks for the Settings menus and Quit confirmations.
     * Uses HTML5 <dialog> methods natively[span_6](start_span)[span_6](end_span).
     */
    function initModals() {
        // Open Settings from Main Menu
        elements.btnSettingsMain.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'none'; // Hide resume button if on main menu
            elements.btnQuitGame.style.display = 'none';   // Hide quit button if on main menu
            elements.btnCloseSettings.style.display = 'inline-block';
            elements.modalSettings.showModal();
        });

        // Open Settings/Pause from In-Game
        elements.btnPause.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'inline-block'; 
            elements.btnQuitGame.style.display = 'inline-block';   
            elements.btnCloseSettings.style.display = 'none';
            
            // Dispatch a custom event that game.js can listen for to pause the loop
            window.dispatchEvent(new Event('verdikaPauseGame'));
            elements.modalSettings.showModal();
        });

        // Close Settings Modal
        elements.btnCloseSettings.addEventListener('click', () => {
            elements.modalSettings.close();
        });

        // Resume Game from Pause
        elements.btnResumeGame.addEventListener('click', () => {
            elements.modalSettings.close();
            // Dispatch custom event to unpause the loop
            window.dispatchEvent(new Event('verdikaResumeGame'));
        });

        // Initiate Quit Sequence
        elements.btnQuitGame.addEventListener('click', () => {
            elements.modalSettings.close();
            elements.modalQuitConfirm.showModal();
        });

        // Cancel Quit
        elements.btnCancelQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close();
            elements.modalSettings.showModal(); // Go back to settings menu
        });

        // Confirm Quit
        elements.btnConfirmQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close();
            // Dispatch custom event to tear down the game and return to main menu
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
                    <p>Version: 1.0.0 | Offline-first survival roguelite.</p>
                    <h4>Diagnostic Gauges</h4>
                    <p>FPS Engine: ${fps}%</p>
                    <p>DOM Bloat: ${dom}%</p>
                    <p>Memory Footprint: ${mem}%</p>
                `;
            }
        }
    }

    function initParkingLot() {
        const savedNotes = localStorage.getItem('verdika_parking_lot') || '[]';
        const notes = JSON.parse(savedNotes);

        elements.parkingLot.innerHTML = '<h3>Parking Lot Backlog</h3>';
        notes.forEach(note => {
            const p = document.createElement('p');
            p.textContent = note;
            elements.parkingLot.appendChild(p);
        });
    }

    return {
        init: function() {
            initHelp();
            initModals();
            initParkingLot();
            new HealthMonitor(); 
        }
    };

})();

document.addEventListener('DOMContentLoaded', () => {
    VerdikaUtilities.init();
});
