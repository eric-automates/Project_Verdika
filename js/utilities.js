/**
 * =============================================================================
 * File: utilities.js
 * Project: Verd'ika: Resol'nare
 * Description: DOM interaction, modal control, and health metric calculations.
 * Structure: Pure Vanilla JS module handling event delegation for UI overlays.
 * How to Add Features: Map new UI elements in hydrateElements() and attach listeners in init().
 * Mandatory Update Points: calculateHealthGauges() if new bloat metrics are defined.
 * =============================================================================
 */

const VerdikaUtilities = (function() {
    const elements = {};

    function hydrateElements() {
        // Core Mandatory UI
        elements.btnHelp = document.getElementById('btn-help');
        elements.btnAbout = document.getElementById('btn-about');
        elements.btnParking = document.getElementById('btn-parking');
        elements.btnThreatLog = document.getElementById('btn-threat-log');
        elements.btnPause = document.getElementById('btn-pause');

        elements.modalHelp = document.getElementById('modal-help');
        elements.modalAbout = document.getElementById('modal-about');
        elements.modalParking = document.getElementById('modal-parking');
        elements.modalThreatLog = document.getElementById('modal-threat-log');
        
        elements.btnCloseHelp = document.getElementById('btn-close-help');
        elements.btnCloseAbout = document.getElementById('btn-close-about');
        elements.btnCloseParking = document.getElementById('btn-close-parking');
        elements.btnCloseThreatLog = document.getElementById('btn-close-threat-log');

        elements.healthGauges = document.getElementById('health-gauges');
        elements.threatList = document.getElementById('threat-list');

        // Settings / Quit
        elements.btnSettingsMain = document.getElementById('btn-settings-main');
        elements.btnCloseSettings = document.getElementById('btn-close-settings');
        elements.btnResumeGame = document.getElementById('btn-resume-game');
        elements.btnQuitGame = document.getElementById('btn-quit-game');
        elements.btnConfirmQuit = document.getElementById('btn-confirm-quit');
        elements.btnCancelQuit = document.getElementById('btn-cancel-quit');
        elements.modalSettings = document.getElementById('modal-settings');
        elements.modalQuitConfirm = document.getElementById('modal-quit-confirm');

        // Shop / Market
        elements.btnGoFoundry = document.getElementById('btn-go-foundry');
        elements.modalShop = document.getElementById('modal-shop');
        elements.btnCloseShop = document.getElementById('btn-close-shop');
        elements.btnSellShop = document.getElementById('btn-sell-shop');
        elements.shopBeskarVal = document.getElementById('shop-beskar-val');
        elements.shopBtns = document.querySelectorAll('.shop-btn');

        elements.marketPanel = document.getElementById('galactic-market');
        elements.marketItemsContainer = document.getElementById('market-items-container');
        elements.btnSkipMarket = document.getElementById('btn-skip-market');
        elements.marketBeskarVal = document.getElementById('market-beskar-val');
    }

    // Health Metric isolates application bloat calculations entirely on-device
    function calculateHealthGauges() {
        if (!elements.healthGauges) return;
        const domNodes = document.querySelectorAll('*').length;
        const maxNodes = 1500; // Architecture bloat threshold
        const bloatPct = Math.min(100, Math.round((domNodes / maxNodes) * 100));

        elements.healthGauges.innerHTML = `
            <div class="health-metric">
                <label>DOM Complexity Bloat (${domNodes} / ${maxNodes} Nodes)</label>
                <progress value="${bloatPct}" max="100"></progress>
                <span>${bloatPct}%</span>
            </div>
        `;
    }

    function initNavModals() {
        // Help
        elements.btnHelp.addEventListener('click', () => elements.modalHelp.showModal());
        elements.btnCloseHelp.addEventListener('click', () => elements.modalHelp.close());

        // About & Diagnostics
        elements.btnAbout.addEventListener('click', () => {
            calculateHealthGauges();
            elements.modalAbout.showModal();
        });
        elements.btnCloseAbout.addEventListener('click', () => elements.modalAbout.close());

        // Parking Lot
        elements.btnParking.addEventListener('click', () => elements.modalParking.showModal());
        elements.btnCloseParking.addEventListener('click', () => elements.modalParking.close());

        // Threat Log Data Bridge
        elements.btnThreatLog.addEventListener('click', () => window.dispatchEvent(new CustomEvent('verdikaRequestThreatLog')));
        elements.btnCloseThreatLog.addEventListener('click', () => elements.modalThreatLog.close());

        window.addEventListener('verdikaShowThreatLog', (e) => {
            if (!e.detail || !e.detail.enemies) return;
            elements.threatList.innerHTML = '';
            const enemies = e.detail.enemies;
            for (const [key, data] of Object.entries(enemies)) {
                const threatEntry = document.createElement('div');
                threatEntry.className = 'threat-card';
                threatEntry.innerHTML = `
                    <h4 style="color: ${data.color}; text-transform: capitalize;">${key}</h4>
                    <p><strong>Class:</strong> ${data.type.toUpperCase()}</p>
                    <p><strong>Base HP:</strong> ${data.hp} | <strong>Damage:</strong> ${data.damage} | <strong>Speed:</strong> ${data.speed}</p>
                `;
                elements.threatList.appendChild(threatEntry);
            }
            elements.modalThreatLog.showModal();
        });
    }
    
    function getAsciiArt(type) {
        if (type === 'weapon') return ` ,-._________\n \`====___==__)\n        |/`;
        if (type === 'armor') return `  /===\\\n (| O |)\n  \\===/`;
        if (type === 'item') return `   ___\n  / _ \\\n | (_) |\n  \\___/`;
        return `   [?]   `;
    }

    function initShopAndMarket() {
        window.addEventListener('verdikaWaveCleared', () => elements.btnGoFoundry.style.display = 'block');
        elements.btnGoFoundry.addEventListener('click', () => {
            elements.btnGoFoundry.style.display = 'none';
            window.dispatchEvent(new Event('verdikaEnterFoundry'));
        });

        elements.shopBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.shop-btn');
                const type = targetBtn.getAttribute('data-type');
                const cost = parseInt(targetBtn.getAttribute('data-cost'), 10);
                window.dispatchEvent(new CustomEvent('verdikaBuyUpgrade', { detail: { type, cost } }));
            });
        });

        elements.btnCloseShop.addEventListener('click', () => {
            elements.modalShop.close(); window.dispatchEvent(new Event('verdikaCloseShop'));
        });

        elements.btnSellShop.addEventListener('click', () => {
            elements.modalShop.close(); window.dispatchEvent(new Event('verdikaSellShop'));
        });

        window.addEventListener('verdikaUpdateShopUI', (e) => {
            if (e.detail && e.detail.beskar !== undefined) {
                elements.shopBeskarVal.innerText = e.detail.beskar;
                elements.marketBeskarVal.innerText = e.detail.beskar;
            }
        });

        window.addEventListener('verdikaOpenShop', () => elements.modalShop.showModal());

        window.addEventListener('verdikaOpenMarket', (e) => {
            elements.marketPanel.style.display = 'flex';
            elements.marketItemsContainer.innerHTML = '';
            e.detail.items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'market-card';
                card.innerHTML = `
                    <div class="ascii-art">${getAsciiArt(item.type)}</div>
                    <div>
                        <h4>${item.name} <span class="badge">[${item.type.toUpperCase()}]</span></h4>
                        <p>> ${item.desc}</p>
                    </div>
                    <button class="market-btn market-btn-buy" data-id="${item.id}" data-cost="${item.cost}">Buy - ${item.cost} Beskar</button>
                `;
                elements.marketItemsContainer.appendChild(card);
            });

            elements.marketItemsContainer.querySelectorAll('.market-btn-buy').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    const id = ev.target.getAttribute('data-id');
                    const cost = parseInt(ev.target.getAttribute('data-cost'), 10);
                    window.dispatchEvent(new CustomEvent('verdikaBuyMarketItem', { detail: { id, cost } }));
                });
            });
        });

        elements.btnSkipMarket.addEventListener('click', () => {
            elements.marketPanel.style.display = 'none'; window.dispatchEvent(new Event('verdikaCloseMarket'));
        });
    }

    function initModals() {
        elements.btnSettingsMain.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'none'; elements.btnQuitGame.style.display = 'none';   
            elements.btnCloseSettings.style.display = 'inline-block'; elements.modalSettings.showModal();
        });

        elements.btnPause.addEventListener('click', () => {
            elements.btnResumeGame.style.display = 'inline-block'; elements.btnQuitGame.style.display = 'inline-block';   
            elements.btnCloseSettings.style.display = 'none';
            window.dispatchEvent(new Event('verdikaPauseGame')); elements.modalSettings.showModal();
        });

        elements.btnCloseSettings.addEventListener('click', () => elements.modalSettings.close() );
        elements.btnResumeGame.addEventListener('click', () => {
            elements.modalSettings.close(); window.dispatchEvent(new Event('verdikaResumeGame'));
        });

        elements.btnQuitGame.addEventListener('click', () => {
            elements.modalSettings.close(); elements.modalQuitConfirm.showModal();
        });

        elements.btnCancelQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close(); elements.modalSettings.showModal(); 
        });

        elements.btnConfirmQuit.addEventListener('click', () => {
            elements.modalQuitConfirm.close(); window.dispatchEvent(new Event('verdikaQuitToMenu'));
        });
    }

    return {
        init: function() {
            // FIX: Polling guarantees DOM elements exist prior to hydration.
            const bootstrapUtilities = () => {
                const checkElement = document.getElementById('btn-help');
                if (!checkElement) {
                    setTimeout(bootstrapUtilities, 50);
                    return;
                }
                hydrateElements(); 
                initNavModals();
                initShopAndMarket();
                initModals();
            };
            bootstrapUtilities();
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => { VerdikaUtilities.init(); });
