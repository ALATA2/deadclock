/**
 * DEAD O'CLOCK: Entities (Enemies, Projectiles, Pickups, Props)
 */

import { sound } from "../engine/audio.js";

export class EntityManager {
  constructor() {
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.props = [];
    this.corpses = [];
  }

  loadLevel(mapData) {
    this.enemies = mapData.enemies.map((e, idx) => ({
      id: `enemy_${idx}`,
      x: e.x,
      y: e.y,
      type: e.type,
      hp: e.hp,
      maxHp: e.hp,
      isBoss: !!e.isBoss,
      isFinalBoss: !!e.isFinalBoss,
      dropsKey: e.dropsKey || null,
      speed: e.isBoss ? 1.6 : (e.type === "wolf" ? 2.2 : 1.4),
      damage: e.isBoss ? 25 : 12,
      state: "idle", // idle, chase, attack, hurt, dying, dead
      attackCooldown: 0,
      radius: 0.35,
      scale: e.isBoss ? 1.35 : 1.0,
      painTimer: 0,
      phase: 1
    }));

    this.pickups = mapData.pickups.map((p, idx) => ({
      id: `pickup_${idx}`,
      x: p.x,
      y: p.y,
      type: p.type,
      radius: 0.3,
      collected: false
    }));

    this.props = mapData.props.map((pr, idx) => ({
      id: `prop_${idx}`,
      x: pr.x,
      y: pr.y,
      type: pr.type,
      radius: 0.35
    }));

    this.projectiles = [];
    this.corpses = [];
  }

  spawnProjectile(x, y, dirX, dirY, speed, damage, isPlayer, spriteType) {
    this.projectiles.push({
      x,
      y,
      dirX,
      dirY,
      speed,
      damage,
      isPlayer,
      spriteType,
      life: 4.0 // 4 seconds max
    });
  }

  update(dt, player, map, state) {
    // 1. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.dirX * p.speed * dt;
      p.y += p.dirY * p.speed * dt;
      p.life -= dt;

      // Check map collision
      const cellX = Math.floor(p.x);
      const cellY = Math.floor(p.y);
      if (
        cellX < 0 || cellX >= map.width ||
        cellY < 0 || cellY >= map.height ||
        map.grid[cellY][cellX] > 0
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check player collision (if enemy projectile)
      if (!p.isPlayer) {
        const distP = Math.hypot(p.x - player.x, p.y - player.y);
        if (distP < 0.4) {
          state.damagePlayer(p.damage, "projectile");
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Player projectile hitting enemy
        let hit = false;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const distE = Math.hypot(p.x - e.x, p.y - e.y);
          if (distE < e.radius + 0.2) {
            e.hp -= p.damage;
            e.painTimer = 0.15;
            sound.playMonsterHit();
            hit = true;
            if (e.hp <= 0) this.killEnemy(e, state);
            break;
          }
        }
        if (hit) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // 2. Update Enemies
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;

      if (e.painTimer > 0) {
        e.painTimer -= dt;
      }

      if (e.attackCooldown > 0) {
        e.attackCooldown -= dt;
      }

      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);

      // Vision check / wake up
      if (dist < 12) {
        e.state = "chase";
      }

      if (e.state === "chase" && dist > 0.6) {
        // Simple obstacle navigation
        const nx = e.x + (dx / dist) * e.speed * dt;
        const ny = e.y + (dy / dist) * e.speed * dt;

        if (this.isWalkable(nx, e.y, map)) e.x = nx;
        if (this.isWalkable(e.x, ny, map)) e.y = ny;
      }

      // Attack player
      if (dist <= 1.2 && e.attackCooldown <= 0) {
        e.state = "attack";
        e.attackCooldown = e.isBoss ? 1.0 : 1.2;
        state.damagePlayer(e.damage, dx > 0 ? "left" : "right");
      }

      // Boss projectile attacks
      if (e.isBoss && dist < 10 && dist > 2.0 && e.attackCooldown <= 0) {
        e.attackCooldown = 1.6;
        sound.playMonsterRoar(e.isFinalBoss ? 0.7 : 1.2);
        const projSprite = e.isFinalBoss ? "proj_scythe" : (e.type === "boss_pumpkin" ? "proj_pumpkin" : "proj_bolt");
        this.spawnProjectile(e.x, e.y, dx / dist, dy / dist, 8.0, 20, false, projSprite);
      }
    }

    // 3. Update Pickups
    for (const p of this.pickups) {
      if (p.collected) continue;
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < player.radius + p.radius) {
        if (state.handlePickup(p)) {
          p.collected = true;
          sound.playPickup();
        }
      }
    }
  }

  isWalkable(x, y, map) {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cx >= map.width || cy < 0 || cy >= map.height) return false;
    // Map walls
    const tile = map.grid[cy][cx];
    if (tile > 0) {
      // Check if it's an open door
      const door = map.doors?.find((d) => d.x === cx && d.y === cy);
      if (door && door.open) return true;
      return false;
    }
    return true;
  }

  killEnemy(e, state) {
    e.state = "dead";
    sound.playMonsterRoar(0.6);
    state.killsTotal++;
    state.levelKills++;
    state.score += e.isBoss ? 2000 : 100;

    // Drop boss key or rewards
    if (e.dropsKey) {
      const keyType = `KEY_${e.dropsKey.toUpperCase()}`;
      this.pickups.push({
        id: `dropped_key_${e.dropsKey}`,
        x: e.x,
        y: e.y,
        type: keyType,
        radius: 0.35,
        collected: false
      });
      state.showMessage(`CHIAVE ${e.dropsKey.toUpperCase()} RILASCIATA!`, 3.5);
    }

    // Push corpse
    this.corpses.push({
      x: e.x,
      y: e.y,
      scale: e.scale
    });

    if (e.isFinalBoss) {
      state.triggerVictory();
    }
  }
}
