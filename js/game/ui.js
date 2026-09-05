/**
 * DEAD O'CLOCK: Retro 90s Canvas-Based HUD & Face Expressions
 */

import { CONFIG, STRINGS } from "../config.js";

export class UIManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  drawHUD(state) {
    const w = CONFIG.INTERNAL_WIDTH;
    const h = CONFIG.INTERNAL_HEIGHT;
    const hudH = 34;
    const hudY = h - hudH;

    // Draw HUD background panel (Beveled dark steel/gothic border)
    this.ctx.fillStyle = "#161320";
    this.ctx.fillRect(0, hudY, w, hudH);

    // Bevel highlights & shadow
    this.ctx.fillStyle = "#3e1e68";
    this.ctx.fillRect(0, hudY, w, 2);
    this.ctx.fillStyle = "#0c0814";
    this.ctx.fillRect(0, hudY + hudH - 2, w, 2);

    // Health Box
    this._drawStatBox(8, hudY + 4, 52, 26, "VITA", `${state.health}%`, state.health < 25 ? "#ff2a2a" : "#39ff14");

    // Armor Box
    this._drawStatBox(64, hudY + 4, 52, 26, "CORAZZA", `${state.armor}%`, "#48cae4");

    // Hero Face Box (Center)
    this._drawHeroFace(126, hudY + 3, 28, 28, state);

    // Ammo Box
    const wp = state.weapons.getCurrentWeapon(state.currentWeaponIndex);
    const ammoCount = wp.ammoType ? state.ammo[wp.ammoType] : "∞";
    this._drawStatBox(164, hudY + 4, 52, 26, "COLPI", `${ammoCount}`, "#ffa200");

    // Weapon Name & Keys
    this._drawStatBox(220, hudY + 4, 92, 26, wp.name.toUpperCase().substring(0, 11), this._getKeysString(state.inventory), "#e0dacf");

    // Boss Bar if Boss is nearby and alive
    this._drawBossBar(state);

    // On-screen notifications / messages
    if (state.messageTimer > 0) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(20, 20, w - 40, 20);
      this.ctx.strokeStyle = "#8b3fe8";
      this.ctx.strokeRect(20, 20, w - 40, 20);

      this.ctx.fillStyle = "#ffea00";
      this.ctx.font = "bold 9px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(state.currentMessage, w / 2, 34);
    }

    // Interactive Key / Door prompt
    if (state.promptKey) {
      this.ctx.fillStyle = "rgba(193, 18, 31, 0.85)";
      this.ctx.fillRect(40, 48, w - 80, 16);
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "8px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(state.promptKey, w / 2, 59);
    }
  }

  _drawStatBox(x, y, bw, bh, label, value, valColor) {
    this.ctx.fillStyle = "#0c0814";
    this.ctx.fillRect(x, y, bw, bh);
    this.ctx.strokeStyle = "#2e1a47";
    this.ctx.strokeRect(x, y, bw, bh);

    // Label
    this.ctx.fillStyle = "#8b3fe8";
    this.ctx.font = "6px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(label, x + bw / 2, y + 8);

    // Value
    this.ctx.fillStyle = valColor;
    this.ctx.font = "bold 11px monospace";
    this.ctx.fillText(value, x + bw / 2, y + 22);
  }

  _drawHeroFace(x, y, fw, fh, state) {
    this.ctx.fillStyle = "#0c0814";
    this.ctx.fillRect(x, y, fw, fh);
    this.ctx.strokeStyle = "#8b3fe8";
    this.ctx.strokeRect(x, y, fw, fh);

    // Pixel face rendering based on health & events
    const cx = x + fw / 2;
    const cy = y + fh / 2;

    // Head base
    this.ctx.fillStyle = state.health < 25 ? "#b0a898" : "#f1c27d";
    this.ctx.fillRect(cx - 8, cy - 8, 16, 18);

    // Hair
    this.ctx.fillStyle = "#3e1e68";
    this.ctx.fillRect(cx - 9, cy - 10, 18, 5);

    // Eyes
    let eyeColor = "#111";
    if (state.health <= 0) eyeColor = "#780000"; // Dead
    else if (state.hudFaceMood === "attack") eyeColor = "#ffea00"; // Rage
    this.ctx.fillStyle = eyeColor;

    if (state.health <= 0) {
      // X X dead eyes
      this.ctx.fillRect(cx - 5, cy - 3, 3, 3);
      this.ctx.fillRect(cx + 2, cy - 3, 3, 3);
    } else {
      this.ctx.fillRect(cx - 5, cy - 3, 3, 3);
      this.ctx.fillRect(cx + 2, cy - 3, 3, 3);
    }

    // Mouth
    if (state.health < 30) {
      this.ctx.fillStyle = "#c1121f"; // Bloody grimace
      this.ctx.fillRect(cx - 4, cy + 4, 8, 3);
    } else if (state.hudFaceMood === "attack") {
      this.ctx.fillStyle = "#111"; // Open roar
      this.ctx.fillRect(cx - 3, cy + 3, 6, 4);
    } else {
      this.ctx.fillStyle = "#8a3a2a"; // Neutral/smirk
      this.ctx.fillRect(cx - 3, cy + 4, 6, 2);
    }
  }

  _getKeysString(inventory) {
    let s = "";
    if (inventory.hasKeyBlue) s += "🟦";
    if (inventory.hasKeyOrange) s += "🟧";
    if (inventory.hasKeyRed) s += "🟥";
    if (inventory.hasKeyPurple) s += "🟪";
    return s || "NESSUNA";
  }

  _drawBossBar(state) {
    const boss = state.entities.enemies.find((e) => e.isBoss && e.hp > 0);
    if (!boss) return;

    const w = CONFIG.INTERNAL_WIDTH;
    const barW = 140;
    const barH = 6;
    const barX = (w - barW) / 2;
    const barY = 8;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    this.ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const pct = Math.max(0, boss.hp / boss.maxHp);
    this.ctx.fillStyle = boss.isFinalBoss ? "#8b3fe8" : "#d05b0c";
    this.ctx.fillRect(barX, barY, Math.floor(barW * pct), barH);

    this.ctx.fillStyle = "#ffea00";
    this.ctx.font = "bold 6px monospace";
    this.ctx.textAlign = "center";
    const bossTitle = boss.isFinalBoss ? "CLOCK REAPER" : (boss.type === "boss_wolf" ? "LUPO MANNARO ALFA" : (boss.type === "boss_pumpkin" ? "RE ZUCCA" : "CAVALIERE SENZA TESTA"));
    this.ctx.fillText(bossTitle, w / 2, barY - 4);
  }

  drawMinimap(state, player) {
    const map = state.currentMapData;
    const w = CONFIG.INTERNAL_WIDTH;
    const h = CONFIG.INTERNAL_HEIGHT;

    // Centered tactical automap
    const size = 4;
    const mapW = map.width * size;
    const mapH = map.height * size;
    const startX = Math.floor((w - mapW) / 2);
    const startY = 10;

    // Background container
    this.ctx.fillStyle = "rgba(8, 3, 20, 0.92)";
    this.ctx.fillRect(startX - 8, startY - 8, mapW + 16, mapH + 34);
    this.ctx.strokeStyle = "#8b3fe8";
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(startX - 8, startY - 8, mapW + 16, mapH + 34);

    // Header Title
    this.ctx.fillStyle = "#ffea00";
    this.ctx.font = "bold 7px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(`MAPPA: ${map.name}`, w / 2, startY - 1);

    // Draw grid floors & sector heights
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.grid[y][x];
        const px = startX + x * size;
        const py = startY + y * size;

        if (tile > 0) {
          // Walls
          if (tile === 10) this.ctx.fillStyle = "#ff7b00"; // Keyed Door
          else if (tile === 11) this.ctx.fillStyle = "#8a5020"; // Wooden Door
          else if (tile === 3) this.ctx.fillStyle = "#39ff14"; // Secret Wall
          else this.ctx.fillStyle = "#4a4e69"; // Normal Wall
          this.ctx.fillRect(px, py, size, size);
        } else {
          // Walkable tile (check sector elevation)
          let isElevated = false;
          let isSunken = false;
          if (map.heights) {
            for (const zone of map.heights) {
              if (x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h) {
                if (zone.floor > 0) isElevated = true;
                if (zone.floor < 0) isSunken = true;
                break;
              }
            }
          }
          if (isElevated) this.ctx.fillStyle = "#2a1545"; // Raised plateau
          else if (isSunken) this.ctx.fillStyle = "#0d1b2a"; // Sunken ditch/water
          else this.ctx.fillStyle = "#120f18"; // Normal floor
          this.ctx.fillRect(px, py, size, size);
        }
      }
    }

    // Draw Pickups & Items
    for (const p of state.entities.pickups) {
      if (p.collected) continue;
      this.ctx.fillStyle = p.type.startsWith("KEY") ? "#ffea00" : "#48cae4";
      this.ctx.fillRect(startX + Math.floor(p.x) * size + 1, startY + Math.floor(p.y) * size + 1, size - 2, size - 2);
    }

    // Draw Enemies (Red for normal, Orange-Red pulsing for Boss)
    for (const e of state.entities.enemies) {
      if (e.hp <= 0) continue;
      this.ctx.fillStyle = e.isBoss ? "#ff0000" : "#c1121f";
      this.ctx.fillRect(startX + Math.floor(e.x) * size, startY + Math.floor(e.y) * size, size, size);
    }

    // Draw Player marker & view cone
    const plX = startX + player.x * size;
    const plY = startY + player.y * size;

    this.ctx.fillStyle = "#39ff14";
    this.ctx.beginPath();
    this.ctx.arc(plX, plY, size / 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Direction arrow
    this.ctx.strokeStyle = "#39ff14";
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(plX, plY);
    this.ctx.lineTo(plX + Math.cos(player.angle) * (size * 2), plY + Math.sin(player.angle) * (size * 2));
    this.ctx.stroke();

    // Legend at bottom of automap
    this.ctx.font = "5px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#e0dacf";
    this.ctx.fillText("🟢 Tu  🔴 Nemici  🟦/🟪 Dislivelli  🟧 Porte  ⭐ Oggetti", w / 2, startY + mapH + 12);
    this.ctx.fillText("Premi [M] per chiudere la mappa", w / 2, startY + mapH + 20);
  }

  drawDebug(state, player, fps, drawCalls) {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    this.ctx.fillRect(5, 5, 110, 75);

    this.ctx.fillStyle = "#39ff14";
    this.ctx.font = "6px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`FPS: ${fps}`, 8, 14);
    this.ctx.fillText(`POS: ${player.x.toFixed(2)}, ${player.y.toFixed(2)}`, 8, 24);
    this.ctx.fillText(`ANG: ${(player.angle * (180 / Math.PI)).toFixed(1)}°`, 8, 34);
    this.ctx.fillText(`LVL: ${state.currentLevelIndex + 1}/4 (${state.currentMapData.id})`, 8, 44);
    this.ctx.fillText(`ENEMIES: ${state.entities.enemies.filter(e => e.hp > 0).length}`, 8, 54);
    this.ctx.fillText(`PROJECTILES: ${state.entities.projectiles.length}`, 8, 64);
    this.ctx.fillText(`DRAWS: ${drawCalls}`, 8, 74);
  }
}
