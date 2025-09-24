import { Skill } from '@deities/athena/info/Skill.tsx';
import {
  AcidBomber,
  AIU,
  Alien,
  Battleship,
  BazookaBear,
  Bear,
  Brute,
  Cannon,
  Commander,
  Dinosaur,
  Dragon,
  DroneBomber,
  Frigate,
  HumveeAvenger,
  InfernoJetpack,
  Jeep,
  Medic,
  Octopus,
  Ogre,
  Pioneer,
  Saboteur,
  Scientist,
  Sniper,
  SuperAPU,
  SuperTank,
  UnitInfo,
  XFighter,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';

export default function getSkillBasedPortrait(skill: Skill): UnitInfo | null {
  switch (skill) {
    case Skill.BuyUnitAlien:
      return Alien;
    case Skill.BuyUnitBazookaBear:
      return BazookaBear;
    case Skill.BuyUnitOctopus:
      return Octopus;
    case Skill.BuyUnitAcidBomber:
      return AcidBomber;
    case Skill.BuyUnitDinosaur:
      return Dinosaur;
    case Skill.BuyUnitAIU:
      return AIU;
    case Skill.BuyUnitBrute:
      return Brute;
    case Skill.BuyUnitCannon:
      return Cannon;
    case Skill.BuyUnitCommander:
      return Commander;
    case Skill.BuyUnitSuperTank:
      return SuperTank;
    case Skill.BuyUnitSuperAPU:
      return SuperAPU;
    case Skill.BuyUnitZombieDefenseDecreaseMajor:
      return Zombie;
    case Skill.Sabotage:
      return Saboteur;
    case Skill.SpawnUnitInfernoJetpack:
      return InfernoJetpack;
    case Skill.UnitAbilitySniperImmediateAction:
      return Sniper;
    case Skill.UnitBattleShipMoveAndAct:
      return Battleship;
    case Skill.BuyUnitBear:
      return Bear;
    case Skill.BuyUnitDragon:
    case Skill.DragonSaboteur:
      return Dragon;
    case Skill.BuyUnitOgre:
      return Ogre;
    case Skill.UnlockScientist:
      return Scientist;
    case Skill.UnlockPowerStation:
    case Skill.UnlockZombie:
      return Pioneer;
    case Skill.HealInfantryMedicPower:
    case Skill.VampireHeal:
      return Medic;
    case Skill.Jeep:
      return Jeep;
    case Skill.ShipIncreaseAttackAndRange:
      return Frigate;
    case Skill.XFighterAttackIncrase:
      return XFighter;
    case Skill.BuyUnitHumveeAvenger:
      return HumveeAvenger;
    case Skill.BuyUnitDroneBomber:
      return DroneBomber;
    case Skill.ArtilleryRangeIncrease:
    case Skill.AttackAndDefenseDecreaseEasy:
    case Skill.AttackAndDefenseIncreaseHard:
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
    case Skill.AttackIncreaseMinor:
    case Skill.Charge:
    case Skill.CostRecovery:
    case Skill.CounterAttackPower:
    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
    case Skill.DefenseIncreaseMinor:
    case Skill.HealVehiclesAttackDecrease:
    case Skill.HighTide:
    case Skill.MovementIncreaseGroundUnitDefenseDecrease:
    case Skill.NoUnitRestrictions:
    case Skill.RecoverAirUnits:
    case Skill.Shield:
    case Skill.UnitInfantryForestAttackAndDefenseIncrease:
    case Skill.UnitRailDefenseIncreasePowerAttackIncrease:
      return null;
    default: {
      skill satisfies never;
      throw new UnknownTypeError('shouldConsiderUnitRatio', String(skill));
    }
  }
}
