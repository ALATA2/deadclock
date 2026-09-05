/**
 * DEAD O'CLOCK: LocalStorage Save & Progress Manager
 */

import { CONFIG } from "../config.js";

export class SaveManager {
  static saveGame(state) {
    try {
      const payload = {
        timestamp: Date.now(),
        levelIndex: state.currentLevelIndex,
        health: state.health,
        armor: state.armor,
        ammo: state.ammo,
        inventory: state.inventory,
        currentWeaponIndex: state.currentWeaponIndex,
        score: state.score,
        secretsFoundTotal: state.secretsFoundTotal,
        killsTotal: state.killsTotal
      };
      localStorage.setItem(CONFIG.STORAGE_KEY_SAVE, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.warn("Failed to save Dead O'Clock progress:", e);
      return false;
    }
  }

  static loadGame() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_SAVE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load Dead O'Clock progress:", e);
      return null;
    }
  }

  static hasSave() {
    return !!localStorage.getItem(CONFIG.STORAGE_KEY_SAVE);
  }

  static clearSave() {
    localStorage.removeItem(CONFIG.STORAGE_KEY_SAVE);
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save settings:", e);
    }
  }

  static loadSettings() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_KEY_SETTINGS);
      if (!raw) {
        return {
          volume: CONFIG.AUDIO_VOLUME_DEFAULT,
          mouseSensitivity: CONFIG.MOUSE_SENSITIVITY_DEFAULT,
          quality: CONFIG.GRAPHICS_QUALITY_DEFAULT,
          touchMode: CONFIG.TOUCH_ENABLED_DEFAULT,
          fullscreen: false
        };
      }
      return JSON.parse(raw);
    } catch (e) {
      return {
        volume: CONFIG.AUDIO_VOLUME_DEFAULT,
        mouseSensitivity: CONFIG.MOUSE_SENSITIVITY_DEFAULT,
        quality: CONFIG.GRAPHICS_QUALITY_DEFAULT,
        touchMode: CONFIG.TOUCH_ENABLED_DEFAULT,
        fullscreen: false
      };
    }
  }
}
