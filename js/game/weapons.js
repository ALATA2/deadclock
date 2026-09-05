/**
 * DEAD O'CLOCK: Weapons Arsenal & Firing System
 */

import { CONFIG } from "../config.js";
import { sound } from "../engine/audio.js";

export class WeaponSystem {
  constructor() {
    this.weaponKeys = ["AXE", "PISTOL", "SHOTGUN", "DOUBLE_SHOTGUN", "CROSSBOW"];
    this.weapons = this.weaponKeys.map((key) => ({ ...CONFIG.WEAPONS[key] }));
    this.unlocked = [true, true, true, false, false]; // Axe, Pistol, Shotgun initially unlocked
    this.lastFireTime = 0;
    this.flashTimer = 0;
    this.bobPhase = 0;
  }

  getCurrentWeapon(index) {
    return this.weapons[index] || this.weapons[0];
  }

  canFire(index, ammoState) {
    const now = performance.now();
    const wp = this.getCurrentWeapon(index);
    if (now - this.lastFireTime < wp.cooldown) return false;

    if (wp.ammoType) {
      if (ammoState[wp.ammoType] < wp.ammoPerShot) return false;
    }
    return true;
  }

  fire(index, ammoState, player, state) {
    if (!this.canFire(index, ammoState)) return false;
    this.lastFireTime = performance.now();
    this.flashTimer = 0.12; // 120ms muzzle flash

    const wp = this.getCurrentWeapon(index);

    // Deduct ammo
    if (wp.ammoType) {
      ammoState[wp.ammoType] = Math.max(0, ammoState[wp.ammoType] - wp.ammoPerShot);
    }

    // Play SFX
    if (wp.id === "axe") sound.playMelee();
    else if (wp.id === "pistol") sound.playGunshot();
    else if (wp.id === "shotgun" || wp.id === "double_shotgun") sound.playShotgun();
    else if (wp.id === "crossbow") sound.playCrossbow();

    // Trigger Combat System
    state.combat.processAttack(wp, player, state);
    return true;
  }
}
