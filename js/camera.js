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


  this.render = () => {

    for(const particle of particles) {

      const {x, y} = this.map2CameraPos(particle.pos),
            {force_x, force_y} = this.map2CameraPos({
              x: particle.pos.x + particle.velocity.x / particle.mass,
              y: particle.pos.y + particle.velocity.y / particle.mass
            }),
            scale = particle.radius * this.scale

      this.canvasHelper.drawBall(x, y, scale < 5 ? 5 : scale, particle.color)
      this.canvasHelper.drawVector(x, y, force_x, force_y, 2, '#fff', 0)
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

    this.anchored.x = this.x
    this.anchored.y = this.y
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