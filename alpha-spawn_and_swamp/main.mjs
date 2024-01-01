import { getObjectsByPrototype, findClosestByPath } from 'game/utils';
import { Source, StructureContainer, StructureSpawn, Creep} from 'game/prototypes';
import { WORK, TOUGH, CARRY, MOVE, ATTACK, RESOURCE_ENERGY, ERR_NOT_IN_RANGE} from 'game/constants';
import { } from 'arena';

function getHarvesters() {
  return getObjectsByPrototype(Creep).filter(creep => creep.my && creep.body.some(part => part.type === CARRY));
}

function getAttackers() {
  return getObjectsByPrototype(Creep).filter(creep => creep.my && creep.body.some(part => part.type === ATTACK));
}

function getEnemies() {
  return getObjectsByPrototype(Creep).filter(creep => !creep.my && creep.body.some(part => part.type === ATTACK));
}

function getMySpawn() {
    return getObjectsByPrototype(StructureSpawn).find(spawn => spawn.my);
}

function getEnemySpawn() {
    return getObjectsByPrototype(StructureSpawn).find(spawn => !spawn.my);
}

function spawnHarvesters() {
  if (getHarvesters().length < 3) {
    let spawn = getMySpawn();
    spawn.spawnCreep([CARRY, MOVE]);
  }
}

function chargeSpawn() {
  let spawn = getMySpawn();
  getHarvesters().forEach(creep => {
    if (spawn.store[RESOURCE_ENERGY] < spawn.store.getCapacity(RESOURCE_ENERGY)) {
      console.log(`charging spawn ${spawn.id}`);
      if (creep.store[RESOURCE_ENERGY] > 0 && creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(spawn);
      } else {
        let containers = getObjectsByPrototype(StructureContainer).filter(container => container.store[RESOURCE_ENERGY] > 0);
        let container = creep.findClosestByPath(containers);
        console.log(`withdraw container ${container.id} to charge`);
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(container);
        }
      }
    }
  });
}

function spawnAttackers() {
  let spawn = getMySpawn();
  if (!hasEnoughAttackers() && spawn.store[RESOURCE_ENERGY] > 500) {
    console.log('spawning attacker');
    let spawn = getMySpawn();
    let attaker = spawn.spawnCreep([TOUGH, TOUGH, MOVE, ATTACK, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK]).object;
    if (attaker) {
      console.log(`attacker ${attaker.id} spawned`);
      let movingResult = attaker.moveTo({x: spawn.x, y: spawn.y - 5});
      console.log("attacker movingResult: ", movingResult);
    }
  }
}

function hasEnoughAttackers() {
  return getAttackers().length >= 9;
}

function attack() {
  if (!hasEnoughAttackers()) {
    return;
  }

  if (!getEnemies().length) {
    console.log("no enemies");
    let enemySpawn = getEnemySpawn();
    getAttackers().forEach(creep => {
      if (creep.attack(enemySpawn) === ERR_NOT_IN_RANGE) {
        creep.moveTo(getEnemySpawn());
      }
    });
  } else {
    getAttackers().forEach(creep => {
      if (creep.attack(creep.findClosestByPath(getEnemies())) === ERR_NOT_IN_RANGE) {
        console.log(`attacker ${creep.id} is moving`);
        creep.moveTo(creep.findClosestByPath(getEnemies()));
      }
    });
  }
}

export function loop() {
  chargeSpawn();
  spawnHarvesters()
  spawnAttackers()
  attack();
}
