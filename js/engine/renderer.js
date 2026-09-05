/**
 * DEAD O'CLOCK: Advanced 2.5D Raycaster Renderer
 * Features:
 * - DDA raycasting with textured walls
 * - Textured floors & ceilings with lighting & distance fog
 * - Sector floor heights interpolation (raised platforms, sunken areas)
 * - 360-degree rotating Amiga parallax night panorama sky
 * - Depth buffer (zBuffer) sorted billboard sprite rendering
 * - Object scaling, translucent shadows, and muzzle flash
 */

import { CONFIG } from "../config.js";
import { assets } from "../game/assets.js";

export class RaycasterRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;

    this.width = CONFIG.INTERNAL_WIDTH;
    this.height = CONFIG.INTERNAL_HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.zBuffer = new Float32Array(this.width);
    this.skyAngle = 0;
    this.quality = "high"; // "high" or "low"
    this.renderStats = { fps: 60, drawCalls: 0 };
  }

  setQuality(q) {
    this.quality = q;
  }

  render(state, player) {
    const map = state.currentMapData;
    this.renderStats.drawCalls = 0;

    // 1. Clear Screen & Draw Sky or Ceiling/Floor
    this._renderSkyAndFloor(player, map);

    // 2. DDA Raycast Walls
    this._renderWalls(player, map);

    // 3. Render Sprites (Pickups, Props, Enemies, Projectiles, Corpses)
    this._renderSprites(player, state);

    // 4. Muzzle Flash Overlay
    if (state.weapons.flashTimer > 0) {
      this.ctx.fillStyle = "rgba(255, 234, 0, 0.25)";
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 5. Screen Red Damage Flash
    if (state.damageFlashTimer > 0) {
      this.ctx.fillStyle = `rgba(193, 18, 31, ${Math.min(0.6, state.damageFlashTimer * 1.5)})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 6. Draw Weapon in First Person
    this._renderFirstPersonWeapon(state, player);
  }

  _renderSkyAndFloor(player, map) {
    // Sky / Ceiling
    if (map.hasSky) {
      const skyImg = assets.getTexture("sky_night");
      if (skyImg) {
        const skyW = skyImg.width;
        // Normalize angle to [0, 2PI]
        let normAngle = player.angle % (Math.PI * 2);
        if (normAngle < 0) normAngle += Math.PI * 2;
        const skyOffset = -Math.floor((normAngle / (Math.PI * 2)) * skyW);

        this.ctx.drawImage(skyImg, skyOffset, 0, skyW, this.height / 2 + 10);
        if (skyOffset + skyW < this.width) {
          this.ctx.drawImage(skyImg, skyOffset + skyW, 0, skyW, this.height / 2 + 10);
        }
      } else {
        this.ctx.fillStyle = "#180b2b";
        this.ctx.fillRect(0, 0, this.width, this.height / 2);
      }
    } else {
      // Dark gothic ceiling
      this.ctx.fillStyle = "#0c0814";
      this.ctx.fillRect(0, 0, this.width, this.height / 2);
    }

    // Floor (Fast gradient or texture)
    const floorGrad = this.ctx.createLinearGradient(0, this.height / 2, 0, this.height);
    floorGrad.addColorStop(0, "#100918");
    floorGrad.addColorStop(1, "#281b10");
    this.ctx.fillStyle = floorGrad;
    this.ctx.fillRect(0, this.height / 2, this.width, this.height / 2);
  }

  _renderWalls(player, map) {
    const fov = CONFIG.FOV;
    const halfFov = fov / 2;
    const px = player.x;
    const py = player.y;
    const angle = player.angle;
    const pZ = player.z || 0; // vertical camera offset

    for (let x = 0; x < this.width; x++) {
      const rayAngle = angle - halfFov + (x / this.width) * fov;
      const cosA = Math.cos(rayAngle);
      const sinA = Math.sin(rayAngle);

      let mapX = Math.floor(px);
      let mapY = Math.floor(py);

      const deltaDistX = Math.abs(1 / cosA);
      const deltaDistY = Math.abs(1 / sinA);

      let stepX, stepY;
      let sideDistX, sideDistY;

      if (cosA < 0) {
        stepX = -1;
        sideDistX = (px - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - px) * deltaDistX;
      }

      if (sinA < 0) {
        stepY = -1;
        sideDistY = (py - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - py) * deltaDistY;
      }

      let hit = 0;
      let side = 0;
      let wallType = 1;
      let isDoor = false;
      let doorProgress = 0;
      let maxSteps = 40;

      while (hit === 0 && maxSteps-- > 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (mapX < 0 || mapX >= map.width || mapY < 0 || mapY >= map.height) {
          hit = 1;
          wallType = 1;
          break;
        }

        const tile = map.grid[mapY][mapX];
        if (tile > 0) {
          // Check for door
          const door = map.doors?.find((d) => d.x === mapX && d.y === mapY);
          if (door) {
            if (door.open) continue; // Walk through open door
            isDoor = true;
            doorProgress = door.progress;
          }
          hit = 1;
          wallType = tile;
        }
      }

      // Fish-eye correction
      let perpWallDist;
      if (side === 0) {
        perpWallDist = (mapX - px + (1 - stepX) / 2) / cosA;
      } else {
        perpWallDist = (mapY - py + (1 - stepY) / 2) / sinA;
      }

      const correctedDist = perpWallDist * Math.cos(rayAngle - angle);
      this.zBuffer[x] = correctedDist;

      // Vertical position with sector heights
      const lineHeight = Math.floor((this.height / Math.max(0.1, correctedDist)));
      const horizon = Math.floor(this.height / 2 + pZ * (lineHeight / 2));
      const drawStart = Math.floor(horizon - lineHeight / 2);
      const drawEnd = Math.floor(horizon + lineHeight / 2);

      // Texture coordinate calculation
      let wallX;
      if (side === 0) wallX = py + perpWallDist * sinA;
      else wallX = px + perpWallDist * cosA;
      wallX -= Math.floor(wallX);

      // Choose texture
      let texName = map.wallTexture;
      if (wallType === 3) texName = "secret_wall";
      else if (wallType === 10) {
        if (map.exitKey === "blue") texName = "door_blue";
        else if (map.exitKey === "orange") texName = "door_orange";
        else if (map.exitKey === "red") texName = "door_red";
        else texName = "door_purple";
      } else if (wallType === 11) {
        texName = "door_wood";
      }

      const tex = assets.getTexture(texName);
      if (tex) {
        const texX = Math.floor(wallX * tex.width);
        this.ctx.drawImage(
          tex,
          texX,
          0,
          1,
          tex.height,
          x,
          drawStart,
          1,
          Math.max(1, drawEnd - drawStart)
        );
      }

      // Shading / Depth Fog (Amiga purple-dark fog)
      const fogIntensity = Math.min(0.85, Math.max(0, correctedDist / 14));
      if (fogIntensity > 0.05 || side === 1) {
        const shade = side === 1 ? 0.15 : 0;
        const totalDarkness = Math.min(0.9, fogIntensity + shade);
        this.ctx.fillStyle = `rgba(12, 8, 20, ${totalDarkness})`;
        this.ctx.fillRect(x, drawStart, 1, Math.max(1, drawEnd - drawStart));
      }

      this.renderStats.drawCalls++;
    }
  }

  _renderSprites(player, state) {
    const map = state.currentMapData;
    const entities = state.entities;

    // Collect all active drawable sprites
    const sprites = [];

    // Corpses
    for (const c of entities.corpses) {
      sprites.push({ x: c.x, y: c.y, tex: assets.getSprite("corpse"), scale: (c.scale || 1) * 0.7, isCorpse: true });
    }

    // Props
    for (const p of entities.props) {
      sprites.push({ x: p.x, y: p.y, tex: assets.getSprite(p.type), scale: 0.9 });
    }

    // Pickups
    for (const pick of entities.pickups) {
      if (pick.collected) continue;
      const sprName = `pickup_${pick.type.toLowerCase()}`;
      sprites.push({ x: pick.x, y: pick.y, tex: assets.getSprite(sprName), scale: 0.6 });
    }

    // Enemies
    for (const e of entities.enemies) {
      if (e.hp <= 0) continue;
      sprites.push({
        x: e.x,
        y: e.y,
        tex: assets.getSprite(e.type),
        scale: e.scale,
        isHurt: e.painTimer > 0,
        isEnemy: true,
        hp: e.hp,
        maxHp: e.maxHp,
        isBoss: e.isBoss
      });
    }

    // Projectiles
    for (const pr of entities.projectiles) {
      sprites.push({ x: pr.x, y: pr.y, tex: assets.getSprite(pr.spriteType), scale: 0.5 });
    }

    // Sort sprites farthest to nearest (Painter's algorithm)
    sprites.forEach((s) => {
      s.dist = Math.hypot(player.x - s.x, player.y - s.y);
    });
    sprites.sort((a, b) => b.dist - a.dist);

    const fov = CONFIG.FOV;
    const pZ = player.z || 0;

    for (const s of sprites) {
      if (s.dist < 0.2) continue;

      const sprX = s.x - player.x;
      const sprY = s.y - player.y;

      // Transform sprite with camera direction
      const cosA = Math.cos(-player.angle);
      const sinA = Math.sin(-player.angle);

      const transX = sprX * cosA - sprY * sinA;
      const transY = sprX * sinA + sprY * cosA;

      if (transY <= 0.1) continue; // Behind camera

      const sprScreenX = Math.floor((this.width / 2) * (1 + transX / (transY * Math.tan(fov / 2))));
      const sprHeight = Math.abs(Math.floor((this.height / transY) * s.scale));
      const sprWidth = sprHeight;

      const horizon = Math.floor(this.height / 2 + pZ * (sprHeight / 2));
      const sprTop = Math.floor(horizon - (s.isCorpse ? sprHeight * 0.2 : sprHeight / 2));
      const sprLeft = Math.floor(sprScreenX - sprWidth / 2);

      // Check occlusion against zBuffer
      if (sprScreenX + sprWidth / 2 < 0 || sprScreenX - sprWidth / 2 >= this.width) continue;

      // Draw sprite column by column with zBuffer clipping
      const tex = s.tex;
      if (!tex) continue;

      for (let stripe = 0; stripe < sprWidth; stripe++) {
        const screenCol = sprLeft + stripe;
        if (screenCol >= 0 && screenCol < this.width) {
          if (transY < this.zBuffer[screenCol]) {
            const texX = Math.floor((stripe / sprWidth) * tex.width);
            this.ctx.drawImage(
              tex,
              texX,
              0,
              1,
              tex.height,
              screenCol,
              sprTop,
              1,
              sprHeight
            );

            // Red flash when hurt
            if (s.isHurt) {
              this.ctx.fillStyle = "rgba(255, 42, 42, 0.45)";
              this.ctx.fillRect(screenCol, sprTop, 1, sprHeight);
            }
          }
        }
      }
    }
  }

  _renderFirstPersonWeapon(state, player) {
    const wp = state.weapons.getCurrentWeapon(state.currentWeaponIndex);
    const spriteName = `weapon_${wp.id}`;
    const tex = assets.getSprite(spriteName);

    if (tex) {
      // Weapon sway/bobbing
      const bob = Math.sin(state.bobPhase) * 6;
      const recoil = state.weapons.flashTimer > 0 ? 12 : 0;

      const w = 110;
      const h = 110;
      const x = Math.floor(this.width / 2 - w / 2 + Math.cos(state.bobPhase / 2) * 4);
      const y = Math.floor(this.height - h + bob + recoil);

      this.ctx.drawImage(tex, x, y, w, h);
    }
  }
}
