/**
 * DEAD O'CLOCK: Main Game Loop & Coordinator
 */

import { CONFIG, STRINGS } from "./config.js";
import { sound } from "./engine/audio.js";
import { InputManager } from "./engine/input.js";
import { RaycasterRenderer } from "./engine/renderer.js";
import { assets } from "./game/assets.js";
import { GameState } from "./game/state.js";
import { UIManager } from "./game/ui.js";
import { SaveManager } from "./game/save.js";

class DeadOClockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.renderer = new RaycasterRenderer(this.canvas);
    this.ui = new UIManager(this.canvas);
    this.input = new InputManager(this.canvas);
    this.state = new GameState();

    // Player position & physics
    this.player = {
      x: 2.5,
      y: 2.5,
      z: 0,
      angle: 0,
      radius: 0.3,
      speed: 3.2
    };

    this.lastTime = performance.now();
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.showDebug = false;
    this.showMinimap = false;

    // DOM UI elements
    this.domScreens = {
      title: document.getElementById("screenTitle"),
      intro: document.getElementById("screenIntro"),
      paused: document.getElementById("screenPaused"),
      levelCleared: document.getElementById("screenLevelCleared"),
      gameOver: document.getElementById("screenGameOver"),
      victory: document.getElementById("screenVictory"),
      settings: document.getElementById("screenSettings"),
      controls: document.getElementById("screenControls")
    };

    this.settings = SaveManager.loadSettings();
  }

  async init() {
    console.log("[DEAD O'CLOCK] Booting game engine...");
    await assets.init();
    this._applySettings();
    this._bindDOMButtons();
    this._setupTouchUI();

    // Check saved game for "Continua" button
    const hasSave = SaveManager.hasSave();
    const btnContinue = document.getElementById("btnContinue");
    if (btnContinue) {
      btnContinue.style.display = hasSave ? "inline-block" : "none";
    }

    // Start requestAnimationFrame loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  _applySettings() {
    sound.setVolume(this.settings.volume);
    this.input.mouseSensitivity = this.settings.mouseSensitivity;
    this.renderer.setQuality(this.settings.quality);
  }

  _bindDOMButtons() {
    // Menu navigation
    document.getElementById("btnNewGame")?.addEventListener("click", () => {
      sound.init();
      this.state.startNewGame();
      this.respawnPlayer();
      this._showDOMScreen(null);
      this._showLevelIntro();
    });

    document.getElementById("btnContinue")?.addEventListener("click", () => {
      sound.init();
      const save = SaveManager.loadGame();
      if (save) {
        this.state.health = save.health;
        this.state.armor = save.armor;
        this.state.ammo = save.ammo;
        this.state.inventory = save.inventory;
        this.state.score = save.score;
        this.state.currentWeaponIndex = save.currentWeaponIndex;
        this.state.loadLevel(save.levelIndex);
        this.respawnPlayer();
        this._showDOMScreen(null);
        this._showLevelIntro();
      }
    });

    document.getElementById("btnControls")?.addEventListener("click", () => {
      this._showDOMScreen("controls");
    });

    document.getElementById("btnCloseControls")?.addEventListener("click", () => {
      this._showDOMScreen("title");
    });

    document.getElementById("btnSettings")?.addEventListener("click", () => {
      this._showDOMScreen("settings");
    });

    document.getElementById("btnCloseSettings")?.addEventListener("click", () => {
      this._showDOMScreen(this.state.mode === "paused" ? "paused" : "title");
    });

    document.getElementById("btnStartLevel")?.addEventListener("click", () => {
      this.state.mode = "playing";
      this._showDOMScreen(null);
      this.canvas.requestPointerLock?.();
    });

    document.getElementById("btnResume")?.addEventListener("click", () => {
      this.state.mode = "playing";
      this._showDOMScreen(null);
      this.canvas.requestPointerLock?.();
    });

    document.getElementById("btnRestartLevel")?.addEventListener("click", () => {
      this.state.loadLevel(this.state.currentLevelIndex);
      this.respawnPlayer();
      this.state.health = 100;
      this.state.mode = "playing";
      this._showDOMScreen(null);
      this.canvas.requestPointerLock?.();
    });

    document.getElementById("btnPauseToMenu")?.addEventListener("click", () => {
      this.state.mode = "title";
      this._showDOMScreen("title");
    });

    document.getElementById("btnNextLevel")?.addEventListener("click", () => {
      this.state.nextLevel();
      this.respawnPlayer();
      this._showLevelIntro();
    });

    document.getElementById("btnRetry")?.addEventListener("click", () => {
      this.state.health = 100;
      this.state.loadLevel(this.state.currentLevelIndex);
      this.respawnPlayer();
      this.state.mode = "playing";
      this._showDOMScreen(null);
    });

    document.getElementById("btnGameOverToMenu")?.addEventListener("click", () => {
      this.state.mode = "title";
      this._showDOMScreen("title");
    });

    document.getElementById("btnVictoryToMenu")?.addEventListener("click", () => {
      SaveManager.clearSave();
      this.state.mode = "title";
      this._showDOMScreen("title");
    });

    // Settings inputs
    const rangeVolume = document.getElementById("settingVolume");
    if (rangeVolume) {
      rangeVolume.value = this.settings.volume * 100;
      rangeVolume.addEventListener("input", (e) => {
        this.settings.volume = e.target.value / 100;
        this._applySettings();
        SaveManager.saveSettings(this.settings);
      });
    }

    const rangeSens = document.getElementById("settingSens");
    if (rangeSens) {
      rangeSens.value = this.settings.mouseSensitivity * 10000;
      rangeSens.addEventListener("input", (e) => {
        this.settings.mouseSensitivity = e.target.value / 10000;
        this._applySettings();
        SaveManager.saveSettings(this.settings);
      });
    }

    const selectQuality = document.getElementById("settingQuality");
    if (selectQuality) {
      selectQuality.value = this.settings.quality;
      selectQuality.addEventListener("change", (e) => {
        this.settings.quality = e.target.value;
        this._applySettings();
        SaveManager.saveSettings(this.settings);
      });
    }
  }

  _setupTouchUI() {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);
    const touchUI = document.getElementById("touchControls");
    if (touchUI && isMobileDevice) {
      touchUI.style.display = "block";
      this.input.touchEnabled = true;

      // Virtual D-pad / Joystick
      const stickZone = document.getElementById("touchJoystickZone");
      const stickNub = document.getElementById("touchJoystickNub");

      stickZone?.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        const rect = stickZone.getBoundingClientRect();
        this.input.touchJoystick.active = true;
        this.input.touchJoystick.startX = rect.left + rect.width / 2;
        this.input.touchJoystick.startY = rect.top + rect.height / 2;
      }, { passive: false });

      stickZone?.addEventListener("touchmove", (e) => {
        if (!this.input.touchJoystick.active) return;
        const touch = e.touches[0];
        const dx = touch.clientX - this.input.touchJoystick.startX;
        const dy = touch.clientY - this.input.touchJoystick.startY;
        const dist = Math.min(40, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const nubX = Math.cos(angle) * dist;
        const nubY = Math.sin(angle) * dist;
        if (stickNub) stickNub.style.transform = `translate(${nubX}px, ${nubY}px)`;
        this.input.touchJoystick.dx = nubX / 40;
        this.input.touchJoystick.dy = nubY / 40;
        e.preventDefault();
      }, { passive: false });

      const resetStick = () => {
        this.input.touchJoystick.active = false;
        this.input.touchJoystick.dx = 0;
        this.input.touchJoystick.dy = 0;
        if (stickNub) stickNub.style.transform = "translate(0px, 0px)";
      };
      stickZone?.addEventListener("touchend", resetStick);
      stickZone?.addEventListener("touchcancel", resetStick);

      // Touch look area (right screen half)
      const lookZone = document.getElementById("touchLookZone");
      let lastTouchX = 0;
      lookZone?.addEventListener("touchstart", (e) => {
        lastTouchX = e.touches[0].clientX;
      }, { passive: true });
      lookZone?.addEventListener("touchmove", (e) => {
        const cx = e.touches[0].clientX;
        this.input.touchLook.dx = cx - lastTouchX;
        lastTouchX = cx;
        e.preventDefault();
      }, { passive: false });
      lookZone?.addEventListener("touchend", () => {
        this.input.touchLook.dx = 0;
      });

      // Touch Action buttons
      document.getElementById("btnTouchFire")?.addEventListener("touchstart", (e) => {
        this.input.actions.attack = true;
        e.preventDefault();
      });
      document.getElementById("btnTouchFire")?.addEventListener("touchend", () => {
        this.input.actions.attack = false;
      });

      document.getElementById("btnTouchUse")?.addEventListener("touchstart", (e) => {
        this.state.interact(this.player);
        e.preventDefault();
      });

      document.getElementById("btnTouchWeapon")?.addEventListener("touchstart", (e) => {
        this.state.currentWeaponIndex = (this.state.currentWeaponIndex + 1) % this.state.weapons.weapons.length;
        e.preventDefault();
      });

      document.getElementById("btnTouchPause")?.addEventListener("touchstart", (e) => {
        this.state.mode = "paused";
        this._showDOMScreen("paused");
        e.preventDefault();
      });
    }
  }

  _showDOMScreen(screenName) {
    Object.keys(this.domScreens).forEach((key) => {
      const el = this.domScreens[key];
      if (el) el.style.display = key === screenName ? "flex" : "none";
    });
  }

  _showLevelIntro() {
    const map = this.state.currentMapData;
    const titleEl = document.getElementById("introLevelTitle");
    const textEl = document.getElementById("introLevelText");
    const numEl = document.getElementById("introLevelNumber");

    if (titleEl) titleEl.innerText = map.name;
    if (numEl) numEl.innerText = `LIVELLO ${this.state.currentLevelIndex + 1} DI 4`;
    const introKey = `L0${this.state.currentLevelIndex + 1}_INTRO`;
    if (textEl) textEl.innerText = STRINGS.it[introKey] || "";

    this._showDOMScreen("intro");
  }

  respawnPlayer() {
    const map = this.state.currentMapData;
    if (!map) return;
    this.player.x = map.playerStart.x;
    this.player.y = map.playerStart.y;
    this.player.angle = map.playerStart.angle;
    this.player.z = 0;
  }

  gameLoop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.input.update();

    // Toggle Debug and Minimap
    if (this.input.consumeAction("toggleDebug")) {
      this.showDebug = !this.showDebug;
    }
    if (this.input.consumeAction("toggleMap")) {
      this.showMinimap = !this.showMinimap;
    }
    if (this.input.consumeAction("pause")) {
      if (this.state.mode === "playing") {
        this.state.mode = "paused";
        document.exitPointerLock?.();
        this._showDOMScreen("paused");
      }
    }

    if (this.state.mode === "playing") {
      this._updateGameplay(dt);
    } else if (this.state.mode === "level_cleared") {
      this._showLevelClearedScreen();
    } else if (this.state.mode === "game_over") {
      document.exitPointerLock?.();
      this._showDOMScreen("gameOver");
    } else if (this.state.mode === "victory") {
      document.exitPointerLock?.();
      this._showDOMScreen("victory");
    }

    // Render frame
    if (this.state.mode === "playing" || this.state.mode === "paused") {
      this.renderer.render(this.state, this.player);
      this.ui.drawHUD(this.state);

      if (this.showMinimap) {
        this.ui.drawMinimap(this.state, this.player);
      }
      if (this.showDebug) {
        this.ui.drawDebug(this.state, this.player, this.fps, this.renderer.renderStats.drawCalls);
      }
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  _updateGameplay(dt) {
    // 1. Rotation
    const turn = this.input.getTurnDelta();
    this.player.angle += turn;

    // 2. Weapon Slot switches
    const slot = this.input.consumeWeaponSlot();
    if (slot !== null && slot < this.state.weapons.weapons.length) {
      this.state.currentWeaponIndex = slot;
    }
    if (this.input.consumeAction("weaponNext")) {
      this.state.currentWeaponIndex = (this.state.currentWeaponIndex + 1) % this.state.weapons.weapons.length;
    }
    if (this.input.consumeAction("weaponPrev")) {
      this.state.currentWeaponIndex = (this.state.currentWeaponIndex - 1 + this.state.weapons.weapons.length) % this.state.weapons.weapons.length;
    }

    // 3. Movement
    let moveX = 0;
    let moveY = 0;
    const speed = this.player.speed * (this.input.actions.run ? 1.5 : 1.0) * dt;

    if (this.input.actions.forward) {
      moveX += Math.cos(this.player.angle) * speed;
      moveY += Math.sin(this.player.angle) * speed;
    }
    if (this.input.actions.backward) {
      moveX -= Math.cos(this.player.angle) * speed;
      moveY -= Math.sin(this.player.angle) * speed;
    }
    if (this.input.actions.strafeLeft) {
      moveX += Math.cos(this.player.angle - Math.PI / 2) * speed;
      moveY += Math.sin(this.player.angle - Math.PI / 2) * speed;
    }
    if (this.input.actions.strafeRight) {
      moveX += Math.cos(this.player.angle + Math.PI / 2) * speed;
      moveY += Math.sin(this.player.angle + Math.PI / 2) * speed;
    }

    // Collision Detection & Smooth sliding along walls
    const map = this.state.currentMapData;
    const r = this.player.radius;

    if (moveX !== 0) {
      const nextX = this.player.x + moveX;
      if (this.canMoveTo(nextX + Math.sign(moveX) * r, this.player.y, map)) {
        this.player.x = nextX;
      }
    }
    if (moveY !== 0) {
      const nextY = this.player.y + moveY;
      if (this.canMoveTo(this.player.x, nextY + Math.sign(moveY) * r, map)) {
        this.player.y = nextY;
      }
    }

    // Head bobbing
    if (moveX !== 0 || moveY !== 0) {
      this.state.bobPhase += dt * 10;
    } else {
      this.state.bobPhase = 0;
    }

    // Sector heights smooth interpolation
    let targetZ = 0;
    if (map.heights) {
      for (const h of map.heights) {
        if (this.player.x >= h.x && this.player.x <= h.x + h.w && this.player.y >= h.y && this.player.y <= h.y + h.h) {
          targetZ = h.floor;
          break;
        }
      }
    }
    this.player.z += (targetZ - this.player.z) * 0.15; // Smooth camera elevation

    // 4. Attack
    if (this.input.actions.attack) {
      this.state.weapons.fire(this.state.currentWeaponIndex, this.state.ammo, this.player, this.state);
    }

    // 5. Use / Interact
    if (this.input.consumeAction("use")) {
      this.state.interact(this.player);
    }

    // 6. Update Entities and State
    this.state.update(dt, this.player);
  }

  canMoveTo(x, y, map) {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cx >= map.width || cy < 0 || cy >= map.height) return false;
    const tile = map.grid[cy][cx];
    if (tile > 0) {
      const door = map.doors?.find((d) => d.x === cx && d.y === cy);
      if (door && door.open) return true;
      return false;
    }
    return true;
  }

  _showLevelClearedScreen() {
    document.exitPointerLock?.();
    const statsKills = document.getElementById("statsKills");
    const statsSecrets = document.getElementById("statsSecrets");
    const statsTime = document.getElementById("statsTime");

    const elapsedSec = Math.floor((performance.now() - this.state.levelStartTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;

    if (statsKills) statsKills.innerText = `${this.state.levelKills} / ${this.state.currentMapData.enemies.length}`;
    if (statsSecrets) statsSecrets.innerText = `${this.state.levelSecretsFound} / ${this.state.currentMapData.secretsTotal}`;
    if (statsTime) statsTime.innerText = timeStr;

    this._showDOMScreen("levelCleared");
  }
}

// Launch on page load
window.addEventListener("DOMContentLoaded", () => {
  const game = new DeadOClockGame();
  game.init();
});
