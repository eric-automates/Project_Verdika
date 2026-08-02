/**
 * =============================================================================
 * File: utilities.js
 * Project: Project_Verdika
 * Description: Mandatory Utilities Layer containing DOM interactions and the
 *              Galactic Market event dispatchers.
 * Architecture Rules:
 *   - Zero-Dependency: Pure Vanilla JavaScript, no external libraries.
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
        
        elements.aboutDropdown = document.getElementById('dropdown-about');
        elements.modalSettings = document.getElementById('modal-settings');
        elements.modalQuitConfirm = document.getElementById('modal-quit-confirm');
        
        elements.btnGoFoundry = document.getElementById('btn-go-foundry');

        // Shop Elements
        elements.modalShop = document.getElementById('modal-shop');
        elements.btnCloseShop = document.getElementById('btn-close-shop');
        elements.btnSellShop = document.getElementById('btn-sell-shop');
        elements.shopBeskarVal = document.getElementById('shop-beskar-val');
        elements.shopBtns = document.querySelectorAll('.shop-btn');

        // Market Elements
        elements.marketPanel = document.getElementById('galactic-market');
        elements.marketItemsContainer = document.getElementById('market-items-container');
        elements.btnSkipMarket = document.getElementById('btn-skip-market');
        elements.marketBeskarVal = document.getElementById('market-beskar-val');
    }

    function initHelp() {
        elements.btnHelp.addEventListener('click', () => {
            const isHidden = elements.aboutDropdown.style.display === 'none';
            elements.aboutDropdown.style.display = isHidden ? 'block' : 'none';
            elements.btnHelp.textContent = isHidden ? 'Return' : 'Help';

            if (isHidden) window.dispatchEvent(new Event('verdikaHelpOpened'));
            else window.dispatchEvent(new Event('verdikaHelpClosed'));
        });
    }

    function initShopAndMarket() {
        // Trigger Foundry manually post-wave
        window.addEventListener('verdikaWaveCleared', () => {
            elements.btnGoFoundry.style.display = 'block';
        });

        elements.btnGoFoundry.addEventListener('click', () => {
            elements.btnGoFoundry.style.display = 'none';
            window.dispatchEvent(new Event('verdikaEnterFoundry'));
        });

        // Standard Shop Purchases
        elements.shopBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const cost = parseInt(e.target.getAttribute('data-cost'), 10);
                window.dispatchEvent(new CustomEvent('verdikaBuyUpgrade', { detail: { type, cost } }));
            });
        });

        // Skip standard shop, move to next wave
        elements.btnCloseShop.addEventListener('click', () => {
            elements.modalShop.close();
            window.dispatchEvent(new Event('verdikaCloseShop'));
        });

        // Sell items -> Grants beskar & opens Galactic Market
        elements.btnSellShop.addEventListener('click', () => {
            elements.modalShop.close();
            window.dispatchEvent(new Event('verdikaSellShop'));
        });

        // UI refresh listener
        window.addEventListener('verdikaUpdateShopUI', (e) => {
            if (e.detail && e.detail.beskar !== undefined) {
                elements.shopBeskarVal.innerText = e.detail.beskar;
                elements.marketBeskarVal.innerText = e.detail.beskar;
            }
        });

        window.addEventListener('verdikaOpenShop', () => { elements.modalShop.showModal(); });

        // Market Generation - Now generating full list to allow duplicate buying
        window.addEventListener('verdikaOpenMarket', (e) => {
            elements.marketPanel.style.display = 'flex';
            elements.marketItemsContainer.innerHTML = '';

            const availableItems = e.detail.items;
            
            availableItems.forEach(item => {
                const card = document.createElement('div');
                card.className = 'market-card';
                card.innerHTML = `
                    <div>
                        <h4>${item.name} <span class="badge">[${item.type.toUpperCase()}]</span></h4>
                        <p>> ${item.desc}</p>
                    </div>
                    <button class="market-btn market-btn-buy" data-id="${item.id}" data-cost="${item.cost}">
                        Buy - ${item.cost} Beskar
                    </button>
                `;
                elements.marketItemsContainer.appendChild(card);
            });

            const marketBuyBtns = elements.marketItemsContainer.querySelectorAll('.market-btn-buy');
            marketBuyBtns.forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    const id = ev.target.getAttribute('data-id');
                    const cost = parseInt(ev.target.getAttribute('data-cost'), 10);
                    // Fires event but does NOT close the market (allows duplicate buying)
                    window.dispatchEvent(new CustomEvent('verdikaBuyMarketItem', { detail: { id, cost } }));
                });
            });
        });

        // Market exit trigger
        elements.btnSkipMarket.addEventListener('click', () => {
            elements.marketPanel.style.display = 'none';
            window.dispatchEvent(new Event('verdikaCloseMarket'));
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

        elements.btnCloseSettings.addEventListener('click', () => elements.modalSettings.close() );
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

    return {
        init: function() {
            hydrateElements(); 
            initHelp();
            initShopAndMarket();
            initModals();
        }
    };

})();

document.addEventListener('DOMContentLoaded', () => { VerdikaUtilities.init(); });
