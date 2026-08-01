/**
 * =============================================================================
 * File: utilities.js
 * Project: Project_Verdika
 * Description: Mandatory Utilities Layer containing the Help guide, About 
 *              dropdown, Settings Modals, real-time Health Gauges, and the Parking Lot backlog.
 * Architecture Rules:
 *   - Zero-Dependency: Pure Vanilla JavaScript, no external libraries.
 *   - OpSec/Privacy: Gracefully handles LocalStorage security blocks common in privacy browsers.
 *   - DOM Interaction: Hooks into the semantic HTML5 foundation without inline 
 *     styles to separate content from presentation.
 * Mandatory Update Points:
 *   - To add new gauges, append calculation methods to the HealthMonitor class.
 *   - Any DOM queries must align with the semantic tags in index.html.
 * =============================================================================
 */

const VerdikaUtilities = (function() {

    // Delay hydration so script execution in the <head> doesn't return null references
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
        elements.aboutDropdown = document.getElementById('dropdown-about');
        elements.parkingLot = document.getElementById('parking-lot');
        elements.modalSettings = document.getElementById('modal-settings');
        elements.modalQuitConfirm = document.getElementById('modal-quit-confirm');
        elements.healthGaugesTarget = document.getElementById('health-gauges');
    }

    /**
     * Initializes the Help Button overlay.
     * Toggles text contextually to improve user navigation.
     */
    function initHelp() {
        elements.btnHelp.addEventListener('click', () => {
            const isHidden = elements.aboutDropdown.style.display === 'none';
            elements.aboutDropdown.style.display = isHidden ? 'block' : 'none';
            // Contextual text update based on user feedback
            elements.btnHelp.textContent = isHidden ? 'Return' : 'Help';
        });
    }

    /**
     * Initializes all UI button hooks for the Settings menus and Quit confirmations.
     * Uses HTML5 <dialog> methods natively.
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
                    <p>Version: 1.0.2 | Offline-first survival roguelite.</p>
                    <h4>Diagnostic Gauges</h4>
                    <p>FPS Engine: ${fps}%</p>
                    <p>DOM Bloat: ${dom}%</p>
                    <p>Memory Footprint: ${mem}%</p>
                `;
            }
        }
    }

    function initParkingLot() {
        // Pre-populating with brainstormed tasks
        let notes = [
            'Implement Between-Wave Shop for Scrap Spending',
            'Determine Auto-pickup vs Looting Mini-game',
            'Design AI Allies/Squad Companions'
        ];

        // OpSec/Privacy: Wrapped in try-catch because privacy browsers (DuckDuckGo) block localStorage
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
            hydrateElements(); // Safe to run now that DOMContentLoaded fired
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
