import { GAME_PARAMS } from "./helpers"


export function Particle({pos = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff', canvasHelper} = {}) {
  this.pos = pos
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.move = () => {
    this.pos.x += this.velocity.x / this.mass * GAME_PARAMS.simulation_speed
    this.pos.y += this.velocity.y / this.mass * GAME_PARAMS.simulation_speed
  }

  this.impulse = (vec) => {
    this.velocity.x += vec.x
    this.velocity.y += vec.y
  }

  this.draw = (isDebug = false) => {
    canvasHelper.drawBall(this.x, this.y, this.radius, this.color)

    if(isDebug === true) {
      drawVector(this.x, this.y, this.velocity.x, this.velocity.y, 3, undefined, 'relative')
    }
  }
}