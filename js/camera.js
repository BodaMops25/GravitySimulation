import { GAME_PARAMS } from "./helpers.js"

export function Camera({particles, pos = {x: 0, y: 0}, scale = 1, focusedBody, canvasHelper}) {
  this.pos = pos
  this.scale = scale
  this.particles = particles
  this.canvasHelper = canvasHelper
  this.focusedBody = focusedBody

  this.mousemove = false
  this.mouseDelta = {x: 0, y: 0}
  this.anchored = {x: 0, y: 0}

  this.map2CameraPos = pos => {
    return {
      x: (pos.x - this.pos.x) * this.scale + this.canvasHelper.canvas.width / 2,
      y: (pos.y - this.pos.y) * this.scale + this.canvasHelper.canvas.height / 2
    }
  }

  this.focus = pos => {
    this.pos.x = pos.x
    this.pos.y = pos.y
  }

  this.focusBody = particle => {
    this.focusedBody = particle
    this.pos = particle.pos
  }
  this.removeFocusBody = () => {
    this.focus(this.focusedBody.pos)
    this.focusedBody = undefined
  }


  this.render = ({debug} = {}) => {

    for(const particle of particles) {

      const pos = this.map2CameraPos(particle.pos),
            velocity = this.map2CameraPos({
              x: particle.pos.x + particle.velocity.x * GAME_PARAMS.simulation_speed,
              y: particle.pos.y + particle.velocity.y * GAME_PARAMS.simulation_speed
            }),
            scale = particle.radius * this.scale

      this.canvasHelper.drawBall(pos, scale < 5 ? 5 : scale, particle.color)

      if(debug) this.canvasHelper.drawVector(pos, velocity, 2, '#000')
    }

  }

  document.body.addEventListener("wheel", event => {
    if(event.deltaY > 0) this.scale /= 2
    else if(event.deltaY < 0) this.scale *= 2

    sessionStorage['camera_scale'] = this.scale
  })

  document.body.addEventListener("mousedown", event => {
    if(event.buttons === 1) this.mousemove = true

    this.mouseDelta.x = event.offsetX
    this.mouseDelta.y = event.offsetY

    this.anchored.x = this.pos.x
    this.anchored.y = this.pos.y
  })

  document.body.addEventListener("mouseup", event => {
    if(event.buttons === 0) this.mousemove = false

    sessionStorage['camera_pos'] = JSON.stringify(this.pos)
  })

  document.body.addEventListener("mousemove", event => {
    if(this.mousemove === true) {
      const delta_x = event.offsetX - this.mouseDelta.x,
            delta_y = event.offsetY - this.mouseDelta.y

      this.pos.x = this.anchored.x - delta_x / this.scale
      this.pos.y = this.anchored.y - delta_y / this.scale
    }
  })
}