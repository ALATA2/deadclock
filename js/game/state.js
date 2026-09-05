/**
 * DEAD O'CLOCK: Global Game State Manager
 * Oversees levels, player progression, secrets, switches, and inventory
 */

import { CONFIG, STRINGS } from "../config.js";
import { MAPS } from "./maps.js";
import { EntityManager } from "./entities.js";
import { CombatSystem } from "./combat.js";
import { WeaponSystem } from "./weapons.js";
import { SaveManager } from "./save.js";
import { sound } from "../engine/audio.js";

export class GameState {
  constructor() {
    this.currentLevelIndex = 0;
    this.levelKeys = ["L01_FOREST", "L02_CEMETERY", "L03_CRYPT", "L04_CATACOMBS"];
    this.currentMapData = null;

    // Player stats
    this.health = 100;
    this.armor = 0;
    this.ammo = {
      bullets: 40,
      shells: 10,
      occult: 0
    };
    this.inventory = {
      hasKeyBlue: false,
      hasKeyOrange: false,
      hasKeyRed: false,
      hasKeyPurple: false
    };

    this.currentWeaponIndex = 1; // Start with Pistol (index 1)
    this.weapons = new WeaponSystem();
    this.entities = new EntityManager();
    this.combat = new CombatSystem();

    // Progression / Stats
    this.score = 0;
    this.killsTotal = 0;
    this.levelKills = 0;
    this.secretsFoundTotal = 0;
    this.levelSecretsFound = 0;
    this.levelStartTime = performance.now();

    // Visual timers
    this.damageFlashTimer = 0;
    this.messageTimer = 0;
    this.currentMessage = "";
    this.promptKey = null;
    this.promptTimer = 0;
    this.hudFaceMood = "idle";
    this.bobPhase = 0;

    // Game modes: title, intro, playing, paused, level_cleared, game_over, victory
    this.mode = "title";
  }

  startNewGame() {
    this.currentLevelIndex = 0;
    this.health = 100;
    this.armor = 0;
    this.ammo = { bullets: 40, shells: 10, occult: 0 };
    this.inventory = { hasKeyBlue: false, hasKeyOrange: false, hasKeyRed: false, hasKeyPurple: false };
    this.currentWeaponIndex = 1;
    this.score = 0;
    this.killsTotal = 0;
    this.secretsFoundTotal = 0;
    this.loadLevel(this.currentLevelIndex);
    this.mode = "intro";
  }

  loadLevel(index) {
    this.currentLevelIndex = index;
    const mapKey = this.levelKeys[index] || this.levelKeys[0];
    this.currentMapData = JSON.parse(JSON.stringify(MAPS[mapKey]));

    this.levelKills = 0;
    this.levelSecretsFound = 0;
    this.levelStartTime = performance.now();
    this.entities.loadLevel(this.currentMapData);

    // Play clock chime at level start
    sound.playClockChime();

    // Auto save on entering level
    SaveManager.saveGame(this);
  }

  nextLevel() {
    if (this.currentLevelIndex < this.levelKeys.length - 1) {
      this.loadLevel(this.currentLevelIndex + 1);
      this.mode = "intro";
    } else {
      this.triggerVictory();
    }
  }

  triggerVictory() {
    this.mode = "victory";
    sound.playClockChime();
  }

  damagePlayer(amount, dir = "front") {
    if (this.health <= 0) return;

    // Armor absorbs 60% of damage
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, Math.floor(amount * 0.6));
      this.armor -= absorbed;
      amount -= absorbed;
    }

    this.health = Math.max(0, this.health - amount);
    this.damageFlashTimer = 0.3;
    sound.playPlayerPain();

    if (this.health <= 0) {
      this.mode = "game_over";
      this.hudFaceMood = "dead";
      sound.playMonsterRoar(0.5);
    }
  }

  handlePickup(pickup) {
    const pConf = CONFIG.PICKUPS[pickup.type];
    if (!pConf) return false;

    if (pConf.type === "health") {
      if (this.health >= 100) return false;
      this.health = Math.min(100, this.health + pConf.amount);
      this.showMessage(pConf.label, 2.0);
      return true;
    }

    if (pConf.type === "health_full") {
      if (this.health >= 100) return false;
      this.health = 100;
      this.showMessage(pConf.label, 2.5);
      return true;
    }

    if (pConf.type === "armor") {
      if (this.armor >= 100) return false;
      this.armor = Math.min(100, this.armor + pConf.amount);
      this.showMessage(pConf.label, 2.0);
      return true;
    }

    if (pConf.type === "armor_full") {
      if (this.armor >= 100) return false;
      this.armor = 100;
      this.showMessage(pConf.label, 2.5);
      return true;
    }

    if (["bullets", "shells", "occult"].includes(pConf.type)) {
      const current = this.ammo[pConf.type];
      if (current >= pConf.max) return false;
      this.ammo[pConf.type] = Math.min(pConf.max, current + pConf.amount);
      this.showMessage(pConf.label, 2.0);
      return true;
    }

    if (pConf.type === "key") {
      if (pConf.keyId === "blue") this.inventory.hasKeyBlue = true;
      if (pConf.keyId === "orange") this.inventory.hasKeyOrange = true;
      if (pConf.keyId === "red") this.inventory.hasKeyRed = true;
      if (pConf.keyId === "purple") this.inventory.hasKeyPurple = true;
      this.showMessage(pConf.label, 3.0);
      sound.playSecret();
      return true;
    }

    return false;
  }

  showMessage(msg, duration = 2.0) {
    this.currentMessage = msg;
    this.messageTimer = duration;
  }

  interact(player) {
    const map = this.currentMapData;
    // Raycast a short distance in front to find doors or switches
    const reach = 1.2;
    const targetX = Math.floor(player.x + Math.cos(player.angle) * reach);
    const targetY = Math.floor(player.y + Math.sin(player.angle) * reach);

    // Check switches
    const sw = map.switches?.find((s) => s.x === targetX && s.y === targetY);
    if (sw && !sw.active) {
      sw.active = true;
      sound.playDoor();
      this.showMessage(STRINGS.it.SWITCH_ACTIVATED, 2.5);
      if (sw.targetDoor) {
        const d = map.doors?.find((dr) => dr.x === sw.targetDoor.x && dr.y === sw.targetDoor.y);
        if (d) d.opening = true;
      }
      if (sw.targetSecret) {
        map.grid[sw.targetSecret.y][sw.targetSecret.x] = 0; // open secret wall
        this.levelSecretsFound++;
        this.secretsFoundTotal++;
        sound.playSecret();
        this.showMessage(STRINGS.it.SECRET_FOUND, 2.5);
      }
      return;
    }

    // Check secret walls directly interactable
    if (map.grid[targetY] && map.grid[targetY][targetX] === 3) {
      map.grid[targetY][targetX] = 0;
      this.levelSecretsFound++;
      this.secretsFoundTotal++;
      sound.playSecret();
      this.showMessage(STRINGS.it.SECRET_FOUND, 2.5);
      return;
    }

    // Check doors
    const door = map.doors?.find((d) => d.x === targetX && d.y === targetY);
    if (door && !door.open && !door.opening) {
      if (!door.key) {
        door.opening = true;
        sound.playDoor();
        return;
      }

      // Keyed door
      let hasKey = false;
      if (door.key === "blue" && this.inventory.hasKeyBlue) hasKey = true;
      if (door.key === "orange" && this.inventory.hasKeyOrange) hasKey = true;
      if (door.key === "red" && this.inventory.hasKeyRed) hasKey = true;
      if (door.key === "purple" && this.inventory.hasKeyPurple) hasKey = true;

      if (hasKey) {
        door.opening = true;
        sound.playDoor();
        this.showMessage("PORTA SBLOCCATA!", 2.0);
      } else {
        const reqStr = STRINGS.it[`KEY_REQUIRED_${door.key.toUpperCase()}`] || STRINGS.it.DOOR_LOCKED;
        this.promptKey = reqStr;
        this.promptTimer = 2.0;
        sound.playMonsterRoar(1.8);
      }
      return;
    }

    // Check level exit
    if (map.exit) {
      const distExit = Math.hypot(player.x - map.exit.x, player.y - map.exit.y);
      if (distExit < 1.2) {
        this.mode = "level_cleared";
        sound.playSecret();
      }
    }
  }

  update(dt, player) {
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;
    if (this.promptTimer > 0) {
      this.promptTimer -= dt;
      if (this.promptTimer <= 0) this.promptKey = null;
    }
    if (this.weapons.flashTimer > 0) this.weapons.flashTimer -= dt;

    // Check level exit trigger by proximity
    if (this.currentMapData && this.currentMapData.exit) {
      const distExit = Math.hypot(player.x - this.currentMapData.exit.x, player.y - this.currentMapData.exit.y);
      if (distExit < 0.9) {
        this.mode = "level_cleared";
        sound.playSecret();
      }
    }

    // Update animated doors (smooth vertical slide open)
    if (this.currentMapData && this.currentMapData.doors) {
      for (const d of this.currentMapData.doors) {
        if (d.opening && d.progress < 1.0) {
          d.progress = Math.min(1.0, d.progress + dt * 1.5);
          if (d.progress >= 1.0) {
            d.open = true;
            d.opening = false;
          }
        }
      }
    }

    // Update entities
    this.entities.update(dt, player, this.currentMapData, this);
  }
}
