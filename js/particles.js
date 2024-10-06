import { GAME_PARAMS } from "./helpers.js"


export function Particle({pos = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff', canvasHelper} = {}) {
  this.pos = pos
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.move = () => {
    this.pos.x += this.velocity.x * GAME_PARAMS.simulation_speed
    this.pos.y += this.velocity.y * GAME_PARAMS.simulation_speed
  }

  this.impulse = (vec) => {
    this.velocity.x += vec.x
    this.velocity.y += vec.y
  }
}