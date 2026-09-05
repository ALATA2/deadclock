/**
 * DEAD O'CLOCK: Combat Mechanics & Raycast Hitscan / Projectile Logic
 */

import { sound } from "../engine/audio.js";

export class CombatSystem {
  processAttack(weapon, player, state) {
    const map = state.currentMapData;
    const enemies = state.entities.enemies;

    if (weapon.isProjectile) {
      // Spawn gothic crossbow projectile
      const dirX = Math.cos(player.angle);
      const dirY = Math.sin(player.angle);
      state.entities.spawnProjectile(
        player.x + dirX * 0.4,
        player.y + dirY * 0.4,
        dirX,
        dirY,
        weapon.projectileSpeed,
        weapon.damageMin + Math.random() * (weapon.damageMax - weapon.damageMin),
        true,
        "proj_bolt"
      );
      return;
    }

    if (weapon.isMelee) {
      // Short-range forward strike
      let closestEnemy = null;
      let minDistance = weapon.range;

      for (const e of enemies) {
        if (e.hp <= 0) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= minDistance) {
          // Angle check
          const angleToEnemy = Math.atan2(dy, dx);
          let diffAngle = angleToEnemy - player.angle;
          while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
          while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;

          if (Math.abs(diffAngle) < 0.6) {
            closestEnemy = e;
            minDistance = dist;
          }
        }
      }

      if (closestEnemy) {
        const dmg = Math.floor(weapon.damageMin + Math.random() * (weapon.damageMax - weapon.damageMin));
        closestEnemy.hp -= dmg;
        closestEnemy.painTimer = 0.15;
        sound.playMonsterHit();
        state.hudFaceMood = "attack";
        if (closestEnemy.hp <= 0) {
          state.entities.killEnemy(closestEnemy, state);
        }
      }
      return;
    }

    // Firearms: Shotgun or Pistol (Hitscan with optional pellets)
    const pelletCount = weapon.pellets || 1;
    for (let p = 0; p < pelletCount; p++) {
      const spreadAngle = weapon.spread ? (Math.random() - 0.5) * weapon.spread : 0;
      const rayAngle = player.angle + spreadAngle;
      this.fireHitscan(player, rayAngle, weapon, map, enemies, state);
    }
  }

  fireHitscan(player, rayAngle, weapon, map, enemies, state) {
    const sin = Math.sin(rayAngle);
    const cos = Math.cos(rayAngle);

    let maxDist = weapon.range;
    let hitEnemy = null;
    let closestEnemyDist = maxDist;

    // Check hit against living enemies along ray
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;

      // Project onto ray
      const proj = dx * cos + dy * sin;
      if (proj > 0 && proj < maxDist) {
        const perpDist = Math.abs(dx * sin - dy * cos);
        if (perpDist < e.radius + 0.15) {
          if (proj < closestEnemyDist) {
            // Check if map wall is blocking
            if (!this.isWallBetween(player.x, player.y, e.x, e.y, map)) {
              closestEnemyDist = proj;
              hitEnemy = e;
            }
          }
        }
      }
    }

    if (hitEnemy) {
      const dmg = Math.floor(weapon.damageMin + Math.random() * (weapon.damageMax - weapon.damageMin));
      hitEnemy.hp -= dmg;
      hitEnemy.painTimer = 0.15;
      sound.playMonsterHit();
      state.hudFaceMood = "attack";
      if (hitEnemy.hp <= 0) {
        state.entities.killEnemy(hitEnemy, state);
      }
    }
  }

  isWallBetween(x1, y1, x2, y2, map) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(dist * 5);
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;

    for (let s = 1; s < steps; s++) {
      const cx = Math.floor(x1 + dx * s);
      const cy = Math.floor(y1 + dy * s);
      if (map.grid[cy] && map.grid[cy][cx] > 0) {
        const door = map.doors?.find((d) => d.x === cx && d.y === cy);
        if (door && door.open) continue;
        return true;
      }
    }
    return false;
  }
}
