/**
 * DEAD O'CLOCK: Procedural Amiga 1200 AGA Style Asset & Texture Generator
 * Generates 128x128 textures and sprites as Canvas fallback or primary high-speed assets.
 * Respects external manifest/assets if present.
 */

import { CONFIG } from "../config.js";

export class AssetRegistry {
  constructor() {
    this.textures = {};
    this.sprites = {};
    this.ready = false;
  }

  async init() {
    console.log("[DEAD O'CLOCK] Initializing Asset Registry (Amiga AGA Palette)...");
    this._generateProceduralTextures();
    this._generateProceduralSprites();
    this.ready = true;
    return true;
  }

  getTexture(id) {
    return this.textures[id] || this.textures["stone_wall"] || null;
  }

  getSprite(id) {
    return this.sprites[id] || this.sprites["zombie"] || null;
  }

  _generateProceduralTextures() {
    // 128x128 Stone Wall
    this.textures["stone_wall"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#2b2d42";
      ctx.fillRect(0, 0, 128, 128);
      // Bricks
      ctx.fillStyle = "#4a4e69";
      for (let y = 0; y < 128; y += 16) {
        const offset = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = -16; x < 128; x += 32) {
          ctx.fillStyle = ((x + y) % 3 === 0) ? "#3d405b" : "#4a4e69";
          ctx.fillRect(x + offset + 1, y + 1, 30, 14);
          // Dark mortar border
          ctx.fillStyle = "#121420";
          ctx.fillRect(x + offset, y + 15, 32, 1);
          ctx.fillRect(x + offset + 31, y, 1, 16);
          // Highlights
          ctx.fillStyle = "#6c757d";
          ctx.fillRect(x + offset + 1, y + 1, 29, 1);
          ctx.fillRect(x + offset + 1, y + 1, 1, 13);
        }
      }
    });

    // Mossy / Forest Wall (Level 1)
    this.textures["forest_tree_wall"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#1b140e";
      ctx.fillRect(0, 0, 128, 128);
      // Gnarled dark wood / roots
      ctx.fillStyle = "#2d1e12";
      for (let x = 0; x < 128; x += 8) {
        ctx.fillRect(x + (Math.sin(x) * 4), 0, 5, 128);
      }
      // Green moss & poisonous thorns
      ctx.fillStyle = "#107e3e";
      for (let i = 0; i < 60; i++) {
        const rx = (i * 27) % 120;
        const ry = (i * 43) % 120;
        ctx.fillRect(rx, ry, 6, 8);
        ctx.fillStyle = "#39ff14";
        ctx.fillRect(rx + 2, ry + 2, 2, 2);
        ctx.fillStyle = "#107e3e";
      }
    });

    // Cemetery Crypt Wall (Level 2)
    this.textures["crypt_wall"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#1a1824";
      ctx.fillRect(0, 0, 128, 128);
      // Engraved gothic crosses and skulls
      ctx.fillStyle = "#3e1e68";
      ctx.fillRect(20, 20, 88, 88);
      ctx.fillStyle = "#24103f";
      ctx.fillRect(24, 24, 80, 80);
      // Skull relief
      ctx.fillStyle = "#e0dacf";
      ctx.fillRect(56, 44, 16, 14);
      ctx.fillRect(58, 58, 12, 6);
      ctx.fillStyle = "#000000";
      ctx.fillRect(58, 48, 4, 4); // eye
      ctx.fillRect(66, 48, 4, 4); // eye
      // Purple runes
      ctx.fillStyle = "#8b3fe8";
      ctx.fillRect(32, 32, 6, 64);
      ctx.fillRect(90, 32, 6, 64);
    });

    // Catacombs Blood / Bone Wall (Level 3 & 4)
    this.textures["catacomb_wall"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#12080a";
      ctx.fillRect(0, 0, 128, 128);
      // Skulls piled up
      ctx.fillStyle = "#b0a898";
      for (let y = 8; y < 120; y += 24) {
        for (let x = 8; x < 120; x += 24) {
          ctx.fillRect(x, y, 16, 12);
          ctx.fillRect(x + 3, y + 12, 10, 5);
          ctx.fillStyle = "#2b0a0d";
          ctx.fillRect(x + 2, y + 3, 3, 3);
          ctx.fillRect(x + 9, y + 3, 3, 3);
          ctx.fillStyle = "#b0a898";
        }
      }
      // Dripping blood
      ctx.fillStyle = "#c1121f";
      for (let x = 12; x < 128; x += 32) {
        ctx.fillRect(x, 0, 4, 45 + (x % 20));
      }
    });

    // Secret Door (slightly off-colored wall)
    this.textures["secret_wall"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["stone_wall"], 0, 0);
      // Faint crack / candle mark
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(62, 50, 4, 18);
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(63, 46, 2, 4);
    });

    // Wooden Door / Gates
    this.textures["door_wood"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#3a1e0b";
      ctx.fillRect(0, 0, 128, 128);
      // Planks
      ctx.fillStyle = "#1d0e04";
      ctx.fillRect(31, 0, 2, 128);
      ctx.fillRect(63, 0, 2, 128);
      ctx.fillRect(95, 0, 2, 128);
      // Iron bands
      ctx.fillStyle = "#495057";
      ctx.fillRect(0, 20, 128, 14);
      ctx.fillRect(0, 94, 128, 14);
      // Rivets
      ctx.fillStyle = "#e0dacf";
      ctx.fillRect(10, 24, 6, 6);
      ctx.fillRect(50, 24, 6, 6);
      ctx.fillRect(80, 24, 6, 6);
      ctx.fillRect(115, 24, 6, 6);
      // Keyhole / Ring
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(60, 60, 8, 12);
    });

    // Blue Locked Door
    this.textures["door_blue"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["door_wood"], 0, 0);
      ctx.fillStyle = "#0077b6";
      ctx.fillRect(48, 48, 32, 32);
      ctx.fillStyle = "#48cae4";
      ctx.fillRect(54, 54, 20, 20);
    });

    // Orange Locked Door
    this.textures["door_orange"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["door_wood"], 0, 0);
      ctx.fillStyle = "#d05b0c";
      ctx.fillRect(48, 48, 32, 32);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(54, 54, 20, 20);
    });

    // Red Locked Door
    this.textures["door_red"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["door_wood"], 0, 0);
      ctx.fillStyle = "#9d0208";
      ctx.fillRect(48, 48, 32, 32);
      ctx.fillStyle = "#ff2a2a";
      ctx.fillRect(54, 54, 20, 20);
    });

    // Purple Locked Door
    this.textures["door_purple"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["door_wood"], 0, 0);
      ctx.fillStyle = "#3e1e68";
      ctx.fillRect(48, 48, 32, 32);
      ctx.fillStyle = "#8b3fe8";
      ctx.fillRect(54, 54, 20, 20);
    });

    // Switch Off / On
    this.textures["switch_off"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["stone_wall"], 0, 0);
      ctx.fillStyle = "#222";
      ctx.fillRect(44, 40, 40, 48);
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(54, 60, 20, 20);
    });

    this.textures["switch_on"] = this._createCanvas(128, 128, (ctx) => {
      ctx.drawImage(this.textures["stone_wall"], 0, 0);
      ctx.fillStyle = "#222";
      ctx.fillRect(44, 40, 40, 48);
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(54, 48, 20, 20);
    });

    // Floors & Ceilings
    this.textures["floor_stone"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#2b2c34";
      ctx.fillRect(2, 2, 60, 60);
      ctx.fillStyle = "#18181c";
      ctx.fillRect(0, 62, 64, 2);
      ctx.fillRect(62, 0, 2, 64);
    });

    this.textures["floor_mud"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "#18100a";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#24180e";
      for (let i = 0; i < 15; i++) {
        ctx.fillRect((i * 19) % 56, (i * 29) % 56, 8, 6);
      }
    });

    this.textures["ceiling_dark"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "#0c0814";
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#140e20";
      ctx.fillRect(8, 8, 48, 48);
    });

    // Night Sky Panorama (360 degrees horizontal loop)
    this.textures["sky_night"] = this._createCanvas(640, 180, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 180);
      grad.addColorStop(0, "#080314");
      grad.addColorStop(0.6, "#1a0f35");
      grad.addColorStop(1, "#361845");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 180);

      // Huge Bloody Halloween Moon
      ctx.fillStyle = "#ff7b00";
      ctx.beginPath();
      ctx.arc(200, 70, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffa200";
      ctx.beginPath();
      ctx.arc(195, 65, 36, 0, Math.PI * 2);
      ctx.fill();

      // Dead tree silhouettes and bats
      ctx.fillStyle = "#0a0312";
      for (let x = 0; x < 640; x += 50) {
        ctx.fillRect(x + 10, 130 + Math.sin(x) * 10, 8, 50);
        ctx.fillRect(x + 5, 140, 18, 5);
      }

      // Distant stars
      ctx.fillStyle = "#e0dacf";
      for (let i = 0; i < 70; i++) {
        ctx.fillRect((i * 97) % 640, (i * 37) % 110, 2, 2);
      }
    });
  }

  _generateProceduralSprites() {
    // Weapons HUD Sprites
    this.sprites["weapon_axe"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(56, 30, 16, 98);
      ctx.fillStyle = "#8a9a86";
      ctx.beginPath();
      ctx.arc(64, 40, 36, 0, Math.PI * 0.8, false);
      ctx.fill();
      ctx.fillStyle = "#c1121f"; // blood stained blade
      ctx.fillRect(68, 20, 8, 20);
    });

    this.sprites["weapon_pistol"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#adb5bd";
      ctx.fillRect(48, 50, 32, 60);
      ctx.fillStyle = "#495057";
      ctx.fillRect(52, 20, 24, 45);
      ctx.fillStyle = "#212529";
      ctx.fillRect(56, 10, 16, 20);
    });

    this.sprites["weapon_shotgun"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#2b2d42";
      ctx.fillRect(52, 10, 24, 90);
      ctx.fillStyle = "#6f4e37";
      ctx.fillRect(48, 80, 32, 45);
      ctx.fillStyle = "#111";
      ctx.fillRect(58, 0, 12, 12);
    });

    this.sprites["weapon_double_shotgun"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#222";
      ctx.fillRect(42, 10, 20, 90);
      ctx.fillRect(66, 10, 20, 90);
      ctx.fillStyle = "#5c3d2e";
      ctx.fillRect(40, 80, 48, 48);
    });

    this.sprites["weapon_crossbow"] = this._createCanvas(128, 128, (ctx) => {
      ctx.fillStyle = "#3e1e68";
      ctx.fillRect(58, 20, 12, 90);
      ctx.fillStyle = "#8b3fe8";
      ctx.fillRect(10, 40, 108, 10);
      ctx.fillStyle = "#39ff14"; // occult glowing bolt
      ctx.fillRect(60, 10, 8, 40);
    });

    // Monsters (Standard billboard sprites)
    this.sprites["zombie"] = this._createCanvas(64, 64, (ctx) => {
      // Body
      ctx.fillStyle = "#355070";
      ctx.fillRect(20, 24, 24, 28);
      // Ripped clothes & arms
      ctx.fillStyle = "#2dc653"; // green zombie skin
      ctx.fillRect(12, 26, 8, 20);
      ctx.fillRect(44, 26, 8, 20);
      // Head
      ctx.fillRect(22, 6, 20, 18);
      // Yellow eyes
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(26, 10, 4, 4);
      ctx.fillRect(34, 10, 4, 4);
      // Blood mouth
      ctx.fillStyle = "#780000";
      ctx.fillRect(28, 18, 8, 4);
      // Legs
      ctx.fillStyle = "#1a1824";
      ctx.fillRect(22, 52, 8, 12);
      ctx.fillRect(34, 52, 8, 12);
    });

    this.sprites["wolf"] = this._createCanvas(64, 64, (ctx) => {
      // Werewolf
      ctx.fillStyle = "#2b1e1a";
      ctx.fillRect(18, 20, 28, 30);
      ctx.fillStyle = "#1b120f";
      ctx.fillRect(14, 24, 8, 26);
      ctx.fillRect(42, 24, 8, 26);
      // Wolf Head & Fangs
      ctx.fillStyle = "#3b2b25";
      ctx.fillRect(20, 4, 24, 18);
      ctx.fillStyle = "#e0dacf";
      ctx.fillRect(24, 16, 4, 6);
      ctx.fillRect(36, 16, 4, 6);
      // Glowing Red Eyes
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(24, 10, 4, 3);
      ctx.fillRect(36, 10, 4, 3);
      // Legs
      ctx.fillStyle = "#1b120f";
      ctx.fillRect(20, 50, 10, 14);
      ctx.fillRect(34, 50, 10, 14);
    });

    this.sprites["skeleton"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "#e0dacf";
      // Ribs & spine
      ctx.fillRect(28, 22, 8, 24);
      ctx.fillRect(20, 26, 24, 4);
      ctx.fillRect(22, 34, 20, 4);
      // Skull
      ctx.fillRect(24, 6, 16, 14);
      ctx.fillStyle = "#000";
      ctx.fillRect(26, 10, 4, 4);
      ctx.fillRect(34, 10, 4, 4);
      ctx.fillRect(28, 16, 8, 3);
      // Rusty sword
      ctx.fillStyle = "#adb5bd";
      ctx.fillRect(48, 12, 6, 40);
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(49, 14, 4, 10);
      // Bone legs
      ctx.fillStyle = "#e0dacf";
      ctx.fillRect(24, 46, 4, 18);
      ctx.fillRect(36, 46, 4, 18);
    });

    this.sprites["ghost"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "rgba(139, 63, 232, 0.75)";
      ctx.beginPath();
      ctx.arc(32, 24, 20, Math.PI, 0, false);
      ctx.lineTo(52, 54);
      ctx.lineTo(44, 46);
      ctx.lineTo(36, 56);
      ctx.lineTo(28, 46);
      ctx.lineTo(20, 56);
      ctx.lineTo(12, 54);
      ctx.closePath();
      ctx.fill();
      // Glowing eerie eyes
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(24, 20, 5, 6);
      ctx.fillRect(35, 20, 5, 6);
    });

    this.sprites["pumpkin_mage"] = this._createCanvas(64, 64, (ctx) => {
      // Robe
      ctx.fillStyle = "#3e1e68";
      ctx.fillRect(18, 26, 28, 36);
      // Pumpkin Head
      ctx.fillStyle = "#d05b0c";
      ctx.beginPath();
      ctx.arc(32, 18, 14, 0, Math.PI * 2);
      ctx.fill();
      // Evil carved face
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(26, 14, 4, 4);
      ctx.fillRect(34, 14, 4, 4);
      ctx.fillRect(28, 22, 8, 4);
      // Wand
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(48, 14, 4, 30);
    });

    // Boss 1: Alpha Werewolf
    this.sprites["boss_wolf"] = this._createCanvas(96, 96, (ctx) => {
      ctx.drawImage(this.sprites["wolf"], 0, 0, 64, 64, 0, 0, 96, 96);
      // Add glowing red aura & horns/spikes
      ctx.fillStyle = "#ff2a2a";
      ctx.fillRect(20, 10, 6, 12);
      ctx.fillRect(70, 10, 6, 12);
      ctx.fillStyle = "#ffff00";
      ctx.fillRect(34, 16, 7, 7);
      ctx.fillRect(55, 16, 7, 7);
    });

    // Boss 2: Pumpkin King
    this.sprites["boss_pumpkin"] = this._createCanvas(96, 96, (ctx) => {
      // Massive Royal Robe
      ctx.fillStyle = "#240046";
      ctx.fillRect(24, 36, 48, 56);
      // Crown
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(32, 4, 32, 10);
      // Giant Flaming Pumpkin
      ctx.fillStyle = "#ff7b00";
      ctx.beginPath();
      ctx.arc(48, 28, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#107e3e";
      ctx.fillRect(42, 22, 6, 6);
      ctx.fillRect(50, 22, 6, 6);
      ctx.fillRect(40, 34, 16, 6);
    });

    // Boss 3: Headless Knight
    this.sprites["boss_knight"] = this._createCanvas(96, 96, (ctx) => {
      // Heavy Black Armor
      ctx.fillStyle = "#212529";
      ctx.fillRect(26, 24, 44, 48);
      ctx.fillStyle = "#495057";
      ctx.fillRect(32, 28, 32, 38);
      // Bloody neck stump
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(42, 18, 12, 8);
      // Massive Scythe
      ctx.fillStyle = "#adb5bd";
      ctx.beginPath();
      ctx.arc(76, 20, 26, 0, Math.PI * 0.7, false);
      ctx.fill();
      ctx.fillStyle = "#5c3d2e";
      ctx.fillRect(70, 10, 6, 80);
      // Legs
      ctx.fillStyle = "#212529";
      ctx.fillRect(30, 72, 14, 24);
      ctx.fillRect(52, 72, 14, 24);
    });

    // Boss 4: Clock Reaper
    this.sprites["boss_reaper"] = this._createCanvas(96, 96, (ctx) => {
      // Cloak of shadows
      ctx.fillStyle = "#0c0814";
      ctx.beginPath();
      ctx.arc(48, 30, 24, Math.PI, 0, false);
      ctx.lineTo(80, 88);
      ctx.lineTo(16, 88);
      ctx.closePath();
      ctx.fill();
      // Clock Face Embedded in Chest
      ctx.fillStyle = "#e0dacf";
      ctx.beginPath();
      ctx.arc(48, 48, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#780000";
      ctx.fillRect(47, 38, 2, 10);
      ctx.fillRect(47, 47, 8, 2);
      // Glowing purple eyes inside hood
      ctx.fillStyle = "#8b3fe8";
      ctx.fillRect(40, 24, 5, 5);
      ctx.fillRect(51, 24, 5, 5);
    });

    // Dead / Corpse Sprite (shared)
    this.sprites["corpse"] = this._createCanvas(64, 64, (ctx) => {
      ctx.fillStyle = "#780000";
      ctx.fillRect(10, 44, 44, 12);
      ctx.fillStyle = "#355070";
      ctx.fillRect(16, 40, 32, 10);
      ctx.fillStyle = "#e0dacf";
      ctx.fillRect(42, 38, 12, 10);
    });

    // Pickups
    this.sprites["pickup_health_vial"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(10, 10, 12, 18);
      ctx.fillStyle = "#fff";
      ctx.fillRect(12, 6, 8, 4);
    });

    this.sprites["pickup_medkit"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(4, 6, 24, 20);
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(13, 10, 6, 12);
      ctx.fillRect(10, 13, 12, 6);
    });

    this.sprites["pickup_heart_crystal"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#ff2a2a";
      ctx.beginPath();
      ctx.moveTo(16, 6);
      ctx.lineTo(26, 16);
      ctx.lineTo(16, 28);
      ctx.lineTo(6, 16);
      ctx.closePath();
      ctx.fill();
    });

    this.sprites["pickup_armor_shard"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#0077b6";
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = "#48cae4";
      ctx.fillRect(12, 12, 8, 8);
    });

    this.sprites["pickup_armor_full"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#03045e";
      ctx.fillRect(6, 4, 20, 24);
      ctx.fillStyle = "#00b4d8";
      ctx.fillRect(10, 8, 12, 16);
    });

    this.sprites["pickup_bullets"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#adb5bd";
      ctx.fillRect(8, 8, 16, 18);
      ctx.fillStyle = "#e0a96d";
      ctx.fillRect(11, 4, 10, 4);
    });

    this.sprites["pickup_shells"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#c1121f";
      ctx.fillRect(6, 8, 8, 18);
      ctx.fillRect(18, 8, 8, 18);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(6, 6, 8, 3);
      ctx.fillRect(18, 6, 8, 3);
    });

    this.sprites["pickup_occult"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#3e1e68";
      ctx.fillRect(8, 6, 16, 20);
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(12, 10, 8, 12);
    });

    this.sprites["pickup_key_blue"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#00b4d8";
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(14, 10, 12, 4);
      ctx.fillRect(22, 14, 4, 6);
    });

    this.sprites["pickup_key_orange"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#ff7b00";
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(14, 10, 12, 4);
      ctx.fillRect(22, 14, 4, 6);
    });

    this.sprites["pickup_key_red"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#ff2a2a";
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(14, 10, 12, 4);
      ctx.fillRect(22, 14, 4, 6);
    });

    this.sprites["pickup_key_purple"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#8b3fe8";
      ctx.beginPath();
      ctx.arc(12, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(14, 10, 12, 4);
      ctx.fillRect(22, 14, 4, 6);
    });

    // Projectiles
    this.sprites["proj_pumpkin"] = this._createCanvas(24, 24, (ctx) => {
      ctx.fillStyle = "#ff7b00";
      ctx.beginPath();
      ctx.arc(12, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(10, 10, 4, 4);
    });

    this.sprites["proj_bolt"] = this._createCanvas(24, 24, (ctx) => {
      ctx.fillStyle = "#39ff14";
      ctx.fillRect(4, 10, 16, 4);
    });

    this.sprites["proj_scythe"] = this._createCanvas(24, 24, (ctx) => {
      ctx.fillStyle = "#adb5bd";
      ctx.fillRect(6, 6, 12, 12);
      ctx.fillStyle = "#ff2a2a";
      ctx.fillRect(10, 10, 4, 4);
    });

    // Props
    this.sprites["prop_torch"] = this._createCanvas(32, 64, (ctx) => {
      ctx.fillStyle = "#4a2810";
      ctx.fillRect(14, 24, 4, 36);
      ctx.fillStyle = "#ff7b00";
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffea00";
      ctx.beginPath();
      ctx.arc(16, 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.sprites["prop_green_torch"] = this._createCanvas(32, 64, (ctx) => {
      ctx.fillStyle = "#212529";
      ctx.fillRect(14, 24, 4, 36);
      ctx.fillStyle = "#107e3e";
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#39ff14";
      ctx.beginPath();
      ctx.arc(16, 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.sprites["prop_pillar"] = this._createCanvas(32, 64, (ctx) => {
      ctx.fillStyle = "#343a40";
      ctx.fillRect(8, 0, 16, 64);
      ctx.fillStyle = "#495057";
      ctx.fillRect(6, 0, 20, 8);
      ctx.fillRect(6, 56, 20, 8);
    });

    this.sprites["prop_tombstone"] = this._createCanvas(32, 32, (ctx) => {
      ctx.fillStyle = "#495057";
      ctx.beginPath();
      ctx.arc(16, 12, 10, Math.PI, 0, false);
      ctx.lineTo(26, 32);
      ctx.lineTo(6, 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#212529";
      ctx.fillRect(14, 10, 4, 12);
      ctx.fillRect(10, 14, 12, 4);
    });
  }

  _createCanvas(width, height, drawFn) {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d");
    drawFn(ctx);
    return c;
  }
}

export const assets = new AssetRegistry();
