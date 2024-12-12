import { GAME_PARAMS } from "./helpers"
import { Vec } from "./types"

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
    this.pos.x += this.velocity.x * _game_params.simulationSpeed
    this.pos.y += this.velocity.y * _game_params.simulationSpeed
  }

  impulse = (vec: Vec) => {
    this.velocity.x += vec.x
    this.velocity.y += vec.y
  }
}