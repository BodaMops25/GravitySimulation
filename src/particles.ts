import { GAME_PARAMS, Vec } from "./helpers"

export class Particle {

  pos: Vec
  mass: number
  velocity: Vec
  radius: number
  color: string

  constructor({pos = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff'} = {}) {
    this.pos = pos
    this.mass = mass
    this.velocity = velocity
    this.radius = radius
    this.color = color
  }

  move = () => {
    this.pos.x += this.velocity.x * GAME_PARAMS.simulation_speed
    this.pos.y += this.velocity.y * GAME_PARAMS.simulation_speed
  }

  impulse = (vec: Vec) => {
    this.velocity.x += vec.x
    this.velocity.y += vec.y
  }
}