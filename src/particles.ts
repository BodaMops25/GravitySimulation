import { GAME_PARAMS, Vec } from "./helpers"

export class Particle {

  pos: Vec
  mass: number
  velocity: Vec
  radius: number
  color: string
  label?: string

  constructor({pos = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff', label}: {
      pos?: {
          x: number;
          y: number;
      };
      mass?: number;
      velocity?: {
          x: number;
          y: number;
      };
      radius?: number;
      color?: string;
      label?: string;
  } = {}) {
    this.pos = pos
    this.mass = mass
    this.velocity = velocity
    this.radius = radius
    this.color = color
    this.label = label
  }

  move = () => {
    this.pos.x += this.velocity.x * GAME_PARAMS.simulationSpeed
    this.pos.y += this.velocity.y * GAME_PARAMS.simulationSpeed
  }

  impulse = (vec: Vec) => {
    this.velocity.x += vec.x
    this.velocity.y += vec.y
  }
}