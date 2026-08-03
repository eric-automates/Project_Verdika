Verd'ika: Resol'nare - Game Design & Architecture

Game Concept: Verd'ika: Resol'nare (Warrior: The Six Actions)
Instead of playing as a round potato with googly eyes, you play as a Mandalorian Initiate (Verd'ika) dropped into hostile arena maps during the ancient Crusade eras. The game is built around Bounty Raids, where your primary goal is surviving massive waves of beasts, rival warriors, and ancient enemies while gathering scrap to craft your armor and claim grand trophies.

🛡️ Core Visual Mechanics: Beskar Crafting & Beast Signets
1. Armor Progression (Visually Changes Your Avatar)

Instead of picking up generic +Max HP items, you spend your salvaged metals between waves at the Covert Forge.

• Stage 1 (Durasteel Scavenger): You start in mismatched, rusted plating with exposed, cloth flight suits.

• Stage 2 (Forged Beskar): Buying defensive upgrades swaps out your plates one by one (Chest, Gauntlets, Vambraces, Helmet).

• Stage 3 (Master Alloy & Paint Schemes): Buying Tier 4 / Rare items unlocks custom paint coats. You can set your armor scheme based on your stats:

  • High Health/Armor -> Dark Red & Gold (Honor & Remembrance)

  • High Speed/Dodge -> Blue & Silver (Reliability)

  • High Explosive/Ranged Damage -> Orange & Black (Lust for Battle)

2. Signet Trophy System (Boss Marks on Armor)

When you kill a Boss at Wave 10 or Wave 20, they don't just vanish—you perform a Signet Harvest.

• Defeating a massive boss places their Signet Emblem directly onto your left shoulder armor plate for the rest of the run.

• Example: Defeating the Mythosaur Beast engraves the iconic skull on your shoulder, permanently granting +20% Knockback and +5 Armor for the rest of your run.

🌌 The "Magic Wielders": How Mandalorians View Jedi
Mandalorians don't use mystical force terms—they view Force-users through a pragmatic, warrior lens. In Mando'a lore:

• The "Jedi" Class: Called Jetii (Sorcerers) or Jetii'kad (Blade-Wielding Sorcerers). Mandalorians view their abilities not as a spiritual Force, but as mind-sorcery and invisible telekinetic trickery.

• The Dark Force-Users: Called Dar'jetii (False Sorcerers / Fallen Sorcerers).

Playable Class: The Jetii Hunter (The Mage Equivalent)

• Mechanic: A Mandalorian who specifically crafts countermeasures against sorcerers.

• Passive: Starts with Cortosis-Lined Vambraces. Taking elemental or energy damage charges an invisible kinetic shield.

• Special Trait: Cannot equip Melee swords, but gadgets (like Repulsors and Flame Projectors) gain +100% Range and knock back sorcerer projectiles.

🪖 Playable Archetypes (Verd'ike / Initiates)
1. The Foundry Master (Nau'ur / Engineer)

• Passive: Cannot fire weapons directly as fast. Spawns autonomous Turret Drones and Automated Sentry Skiffs that follow you around the arena.

• Special Trait: Armor upgrades cost 20% less scrap at the Forge.

2. The Heavy Commando (Kandosii / Heavy)

• Passive: Starts with +15 Armor and +30 Max HP, but -20% Movement Speed.

• Special Trait: Guns deal extra damage based on your total Armor rating. The bulkier your Beskar suit becomes, the harder your blaster bolts hit.

3. The Death Watch Zealot (Kyr'tsad / Shadow)

• Passive: High mobility, +25% Crit Chance, but -10 Armor.

• Special Trait: Duel-wields light blasters or wrist-blades. Every critical hit ignites surrounding enemies with a flame pulse.

4. The Beskar Smith (Goran / Smith)

• Passive: Starts with 0% Damage, but gains +1% Damage for every 15 unspent Beskar Scraps sitting in your pouch.

• Special Trait: Converts unspent scrap directly into raw stats at the end of every wave.

⚔️ The Weapon Arsenal
Ranged Weapons

• Dual Westar Pistols: High attack speed, moderate damage. Perfect for crit-based builds.

• Heavy Repeating Blaster: Fires a stream of suppressive bolts; slows down your movement speed while firing, but melts elite hordes.

• Wrist Flame-Projector: Short-range AoE weapon that inflicts "Burn" across entire groups of beasts.

• Whistling Bird Vambrace: Fires tiny guided rockets that automatically seek out the 6 closest enemies on screen.

Melee & Gadget Weapons

• Beskar Spear: Long-reach melee weapon that pierces through lines of enemies. Deals extra damage to Sorcerer/Boss units.

• Vibro-Arblade: High-frequency blade that shreds through heavy armor stats on enemy units.

• Repulsor Blast Vambrace: Deals zero direct lethal damage, but creates a massive forcewave that slams enemies into walls, dealing massive collision damage.

👾 Enemies & Bosses (The Trophies)
Standard Horde Enemies

• Shrine Acolytes: Minor sorcerer trainees that throw slow-moving energy balls.

• Krayt Hatchlings: Fast-moving swarming beasts that attempt to surround and pin you down.

• Crusade Mercenaries: Heavy armored infantry carrying riot shields that block forward damage.

Bosses (Signet Drops)

1. The Mudhorn Beast (Wave 10 Boss)

• Behavior: Charges linearly across the screen at hyper-speed, destroying terrain.

• Signet Trophy: Mudhorn Horn Emblem (+15% Charge Impact Damage, +100 Max HP).

2. The Jetii Master (Wave 20 Boss)

• Behavior: Uses telekinetic waves to pull you toward him while deflecting your blaster bolts back at you unless hit from behind or with flame attacks.

• Signet Trophy: Torn Sorcerer Cloak / Symbol (Reflects 15% of incoming damage back at attackers).

⚙️ Example Run Loop
1. Wave 1: You drop in wearing rusted scavenged gear firing a single Westar Pistol.

2. Wave 5: You collect 200 Beskar Scrap, visit the Forge, and craft Beskar Vambraces (your arms now shine with silver metal).

3. Wave 10: You kill the Mudhorn Boss. Your chest armor instantly updates to full Beskar, and a Mudhorn Signet is stamped onto your shoulder.

4. Wave 15: You buy high-rarity items, triggering a color scheme prompt—your armor paints itself in Dark Crimson & Gold.

5. Wave 20: You stand in the center of the arena completely covered in shining, customized Mandalorian plate, wielding dual Wrist Flamers and Whistling Birds, taking virtually 0 damage as waves break against your armor.

🎨 Visuals & Assets
Note: To be refined before app is created. All game designs and visuals will be stored on a single unified sprite sheet (texture atlas). The game engine will reference specific pixel grid coordinates on this single image to rapidly load and apply sprites, minimizing HTTP requests and maximizing rendering efficiency.

🏗️ Basic App Architecture (The Portable Standard)
Scope: A portable, zero-dependency browser-based survival roguelite. Built to run beautifully on any screen, specifically optimized for the Pixel 10 Pro XL's on-device processing capabilities.

Core Architecture

• Zero-Dependency Ecosystem: Code will be generated in pure HTML5 Canvas, CSS, and Vanilla JavaScript. No CDNs or external libraries will be used.

• Self-Documenting Code: Every file will feature a unified header block explaining the code's structure, mandatory update hooks for new waves/weapons, and future expansion rules.

• Thematic Consistency: A unified CSS variable system mapping Mandalorian color themes (e.g., `--color-honor-red`, `--color-beskar-silver`) ensuring global consistency across the UI, menus, and game canvas.

• Privacy & OpSec: Entirely reliant on LocalStorage or IndexedDB for save states and run histories. If a cloud-save feature or leaderboard is later desired, it will be strictly cordoned into a standalone, opt-in module.

Mandatory App Components (The Utilities Layer)

• Help Button: An on-screen overlay holding the survival 'How-To' guide and update Revision History.

• About Dropdown: Contains the game version, backstory, and real-time health-check gauges.

• Health Gauges: Dynamic readouts displaying the app's DOM bloat, rendering frame rate (FPS), and memory footprint.

• Parking Lot: An active view inside the utility layer to catalog future feature requests (e.g., new bosses, multiplayer modules) out of the main logic stream.

File Structure

• Project Number and Title (`Project_Verdika`)

  • `WIP` (Work in progress for iterative code and design tests)

  • `Shared` (Verified design data shared across the app, such as the master sprite sheet)

  • `Publish` (Final playable executable files)

    • `index.html` - The application skeleton and canvas container.

    • `styles.css` - Global thematic variables and layout rules.

    • `utilities.js` - Contains the Help, About, Health Gauges, and Parking lot.

    • `game.js` - The core logic loop, enemy spawning, and collision detection.
1. Minimize Complexity & Reusability (Modular Architecture)

A modern approach requires us to build the app using Modular Architecture. This structure groups application features into self-contained, decoupled, and interchangeable modules that only communicate via well-defined interfaces. It directly minimizes interdependencies, leading to faster testing, bug isolation, and code reuse across different parts of the platform or other projects. [cite: 5]

• Instead of a monolithic app where a single bug can crash everything, modular fault isolation ensures that if one module fails (e.g., the shopping cart), the rest of the application (like product search) remains fully functional. [cite: 5]

• Scale parts of the system based on resource demands instead of scaling the whole application, enabling much more efficient use of hardware. [cite: 5]

2. Separation of Interface from Functionality (HTML/CSS Best Practices)

Code will follow strict guidelines for front-end architecture to ensure visual assets remain independent of the backend logic.

• Decoupling Content and Presentation: We will never use deprecated HTML elements (like `<font>` or `<center>`) or table-based layouts. CSS is the only permitted method for visual layout, ensuring a strict separation between content structure and presentation rules. [cite: 10]

• Modular CSS & Avoidance of `!important`: Do not use the `!important` flag as a quick fix, as it disrupts the CSS cascading order and becomes a nightmare to maintain. Instead, control overrides by accurately adjusting CSS specificity. [cite: 9] We will use the BEM (Block, Element, Modifier) naming convention for clear, independent UI component styling. [cite: 9]

• Semantics & Native Features: We will rely on native HTML5 features and tags (like ``, `<header>`, and specific input types like `email` or `url`) over custom JavaScript implementations whenever possible. This improves accessibility, SEO, and minimizes bloat. [cite: 10]

3. Offline-First Capability (Resilient Data Storage)

The app must remain robust under intermittent network connections, specifically matching the goal of a portable, zero-dependency environment.

• We will adopt an Offline-First Architecture, meaning the app is designed to function reliably without an active internet connection by caching and storing data locally on the end-user’s device. [cite: 7]

• Data read/write operations will be executed against a local data source first (such as a local SQLite database or MMKV key-value store), allowing the user to continue interacting with the app seamlessly. [cite: 7]

• When a network connection is detected, the app will execute background synchronization (e.g., using Delta/Incremental sync to only push changes) to reconcile the local data source with the remote server. [cite: 7]
---

📋 PROJECT WORK INSTRUCTION & OUTLINE
Objective: Build Verd'ika: Resol'nare as a zero-dependency, modular, and portable browser-based application, prioritizing local storage and on-device efficiency for the Pixel 10 Pro XL.

Execution Steps:

1. Define Scope & Framework: Lock in all game mechanics, visuals, and archetypes. Establish the offline-first, zero-dependency HTML5/CSS/JS foundation.

2. Generate Modular File Structure: Create the `Project_Verdika` directory system (`WIP`, `Shared`, `Publish`), adopting strict naming and filing conventions inspired by the PWA BUILDINGS CAD STANDARDS MANUAL Ver. 4.0.pdf [cite: 1].

3. Implement Mandatory Utilities Layer:

  • Help Button (How-To guide & Revision History).

  • About Dropdown (Version, backstory, and 0-100% Health Gauges for DOM bloat, FPS, and memory).

  • Parking Lot (Backlog for future modules).

4. Establish Thematic Consistency (CSS): Define all Mandalorian design systems (colors, spacing) as top-level unified CSS variables.

5. Develop Core Game Logic (JS): Build out the isolated modules using chunk-based commentary explaining the why, not the what.

6. Apply Self-Documenting Headers: Ensure every code file begins with a standardized header block detailing its structure, update points, and feature-addition rules.
---

Code Commenting & Multi-File Standards

• Layman's Terms: Comments must be short, concise, and written in plain language explaining the why, not the what.

• Cross-Referencing: If a block of code references another file, explicitly state "This references [Filename]" in the comment.

• Multi-File Approach: We are adopting a multi-file structure (HTML, CSS, JS) to keep things organized for GitHub. The application will remain highly portable.

[IN PROGRESS] Step 1.1: HTML5 Foundation (`index.html`)

Creating the `index.html` structure based on strict compliance and offline-first standards.
---

📋 PROJECT WORK INSTRUCTION & CHECKLIST
High-level roadmap to ensure all components integrate perfectly before coding begins. We will update statuses as we move through the project.

• Phase 1: Project Scope & Architecture Rules (Modular, Offline-First, Zero-Dependency)

• Phase 2: Code Commenting & Multi-File Standards (Layman's terms, why over what, cross-referencing files)

• [IN PROGRESS] Phase 3: HTML5 Foundation (`index.html`) (Strict W3C compliance, offline-first setup, IBM HTML best practices including `<!DOCTYPE html5>`)

• Phase 4: Thematic CSS Variables & Styling (`styles.css`) (BEM convention, CSS Resets, no `!important` flags)

• Phase 5: Mandatory Utilities Layer (`utilities.js`) (Help, About, Health Gauges, Parking Lot)

• Phase 6: Core Game Logic & Systems (`game.js`) (Enemy spawning, Beskar crafting, Boss Signets)

• Phase 7: Testing & W3C Validation (Ensure cross-browser compatibility and zero-dependency performance)

---

🗂️ ASCII FILE STRUCTURE
Based on PWA CAD Standards for collaborative working and shared data.

```

Project_Verdika/

├── Archive/                  # Historical records and superseded data

├── Received/                 # Third-party assets or references

├── Shared/                   # Verified shared design data (Master sprite sheet, global assets)

├── WIP/                      # Iterative testing and work-in-progress code

└── Publish/                  # Final playable executable files (Zero-dependency)

    ├── index.html            # HTML5 foundation and canvas container

    ├── css/

    │   └── styles.css        # Global thematic variables and BEM-structured styles

    └── js/

        ├── utilities.js      # Utilities layer: Help, Health Gauges, Parking Lot

        └── game.js           # Core game loop, objects, and collision logic

```

---

🔄 ASCII GAME FLOWCHART
General programming flow from start to finish.

```

[LAUNCH APP: index.html]

       |

       v

[INIT: utilities.js] ---> (Load Health Gauges, About, Help, Parking Lot)

       |

       v

[INIT: game.js] ---> (Load Canvas, Initialize CSS Variables)

       |

       v

{ MAIN MENU } <--------------------------------+

       |                                       |

       |-- (Select Archetype / Load Save)      |

       v                                       |

{ GAME START }                                 |

       |                                       |

       v                                       |

+--> [ WAVE GENERATION ]                       |

|      |                                       |

|      v                                       |

|    [ SPAWN ENEMIES ]                         |

|      |                                       |

|      v                                       |

|    ( Player Input / Combat Logic )           |

|    ( Collision Detection )                   |

|    ( Health / Scrap Calculations )           |

|      |                                       |

|      v                                       |

|    [ WAVE COMPLETE ]                         |

|      |                                       |

|      v                                       |

|    { COVERT FORGE } ---> (Spend Scrap, Buy Armor/Signets, Auto-Save LocalStorage)

|      |                                       |

|      v                                       |

+------+ (Next Wave)                           |

       |                                       |

       v                                       |

[ PLAYER DEATH OR VICTORY ]                    |

       |                                       |

       v                                       |

{ GAME OVER SCREEN } ---> (Calculate final stats, save history to LocalStorage)

       |                                       |

       +---------------------------------------+

```
---

[UPDATE] Progress Status

• Phase 3 & Phase 4: [DONE] HTML5 Foundation & Thematic CSS established.

• Phase 5: [IN PROGRESS] Mandatory Utilities Layer (`utilities.js`).
---

[IN PROGRESS] Phase 6: Core Game Logic & Systems (`game.js`)

Outlining the base Javascript architecture with BEM conventions, strict module separation, and health gauge integration.

Log Update: 
- Implemented mobile-responsive drag-to-move input logic in `game.js`.
- Refactored player movement to use dragging gestures scaled to max speed, avoiding virtual buttons.
- Added a fully functional "Raid Failed" (Game Over) screen to `index.html` with dynamic stat calculation and restart functionality, maintaining IBM HTML5 standards.
- 


Old Log Updates (check all app files to to make sure you know the current state of docs): 
- Implemented the Enemy class and wave spawning logic in `game.js`.
- Enemies now actively track and move toward the player's coordinates during the `updateLogic()` loop.
- Provided full, updated `index.html` and `game.js` files conforming to the Portable Standard and IBM HTML5 Best Practices (no `type` attributes, semantic tags).
- Reviewed index.html, utilities.js, and styles.css. They successfully meet the Portable Standard (zero-dependency, utilities layer integrated, thematic CSS).
- Generated game.js scope and foundational structure, including game loop, state management, and main menu event hooks.
- Reviewed index.html, utilities.js, and styles.css. Files are fully compliant with the Portable Standard and HTML/CSS best practices. Proceeding to define scope and implement game.js.
- Added Player entity class, Input Handling, and Archetype definitions to the `game.js` scope.\n- Updated `index.html` to include the Archetype Selection UI before Raid start, keeping strict compliance with IBM HTML5 best practices.
- Implemented the Enemy class and wave spawning logic in `game.js`.\n- Enemies now actively track and move toward the player's coordinates during the `updateLogic()` loop.\n- Provided full, updated `index.html` and `game.js` files conforming to the Portable Standard and IBM HTML5 Best Practices (no `type` attributes, semantic tags).
- Implemented `checkCollisions()` logic and the `Projectile` class.\n- Player can now shoot back at enemies, and enemies can damage the player.\n- Addressed issue: Player health drops to 0, but no game over screen.