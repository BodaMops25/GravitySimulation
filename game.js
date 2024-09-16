import {Vec} from './helpers.js'

// ---- CANVAS ----

export function DrawEngine(canvas) {
  this.cnvs = canvas
  this.ctx = canvas.getContext('2d')

  this.clear = () => this.ctx.clearRect(0, 0, this.cnvs.width, this.cnvs.height)

  this.drawBall = (vec = new Vec(10, 10), scale = 10, color = '#fff') => {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.arc(vec.x, vec.y, scale, 0, Math.PI*2)
    this.ctx.fill()
  }

  this.drawCircle = (vec = new Vec(10, 10), scale = 10, thickness = 2, color = '#fff') => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = thickness
    this.ctx.arc(vec.x, vec.y, scale, 0, Math.PI*2)
    this.ctx.stroke()
  }
  
  this.drawVector = (vec1 = new Vec(), vec2 = new Vec(50, 50), scale = 10, color = '#fff', mode = 0) => {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = scale
    this.ctx.moveTo(vec1.x, vec1.y)
  
    let vec_end = vec2
  
    if(mode === 1) vec_end = vec1.add(vec2)
  
    this.ctx.lineTo(vec_end.x, vec_end.y)
    this.ctx.stroke()
    this.ctx.beginPath()
    this.drawBall(vec_end, scale * 1.2, color)
  }
  
  this.drawCursor = () => {
    const hh = this.cnvs.width / 2,
          vh = this.cnvs.height / 2,
          radius = 5
  
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 1
  
    this.ctx.beginPath()
    this.ctx.moveTo(hh - radius, vh)
    this.ctx.lineTo(hh + radius, vh)
    this.ctx.stroke()
  
    this.ctx.beginPath()
    this.ctx.moveTo(hh, vh - radius)
    this.ctx.lineTo(hh, vh + radius)
    this.ctx.stroke()
  }
}

// ---- PARTICLES ----

export function Particle({coords = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff', options} = {}) {
  this.coords = coords
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.options = options

  this.orbitLine = []

  this.move = () => {
    this.coords.x += this.velocity.x * this.options.simulationSpeed
    this.coords.y += this.velocity.y * this.options.simulationSpeed
  }

  this.impulse = (x, y) => {
    if(x) this.velocity.x += x
    if(y) this.velocity.y += y
  }
}

// ---- CAMERA ----

export function Camera({coords = {x: 0, y: 0}, scale = 1, particles, drawEngine, pane, options} = {}) {
  this.coords = coords
  this.scale = scale
  this.particles = particles
  this.drawEngine = drawEngine

  this.mousemove = false
  this.mouseDelta = {x: 0, y: 0}
  this.anchoredCoords = {x: 0, y: 0}

  this.pane = pane
  this.options = options

  this.mapToCameraCoords = (x, y) => {
    // return vec.copy().set((value, dim) => (value - this.coords[dim]) * this.scale + {x: this.drawEngine.cnvs.width, y: this.drawEngine.cnvs.height}[dim] / 2)
    return {
      x: (x - this.coords.x) * this.scale + this.drawEngine.cnvs.width / 2,
      y: (y - this.coords.y) * this.scale + this.drawEngine.cnvs.height / 2
    }
  }

  this.focus = vec => this.coords = vec.copy()

  this.render = () => {

    for(const particle of particles) {

      const coords = this.mapToCameraCoords(particle.coords.x, particle.coords.y),
            velocityCoords = {
              x: particle.coords.x + particle.velocity.x * this.options.simulationSpeed,
              y: particle.coords.y + particle.velocity.y * this.options.simulationSpeed
            },
            scale = particle.radius * this.scale

      if(scale < 5) {
        this.drawEngine.drawBall(coords, 5, particle.color)
        this.drawEngine.drawCircle(coords, 7, 1, 'white')
      }
      else {
        this.drawEngine.drawBall(coords, scale, particle.color)
      }

      this.drawEngine.drawVector(coords, velocityCoords, 2, '#fff', 0)

      if(this.pane) {
        this.options.cameraCoords.x = this.coords.x
        this.options.cameraCoords.y = this.coords.y
      }

      /* this.drawEngine.ctx.beginPath()
      particle.orbitLine.forEach((coords, index) => {
        const {x, y} = this.mapToCameraCoords(coords)

        if(index === 1) {
          this.drawEngine.ctx.lineTo(x, y)
          return
        }

        this.drawEngine.ctx.lineTo(x, y)
      })

      this.drawEngine.ctx.strokeStyle = particle.color
      this.drawEngine.ctx.lineWidth = 1
      this.drawEngine.ctx.stroke() */
    }

  }

  document.body.addEventListener("wheel", event => {
    if(event.deltaY > 0) this.scale /= 2
    else if(event.deltaY < 0) this.scale *= 2

    if(this.pane) this.pane.refresh()
  })

  document.body.addEventListener("mousedown", event => {
    if(event.buttons === 1 && event.shiftKey) this.mousemove = true

    this.mouseDelta.set(event.offsetX, event.offsetY)
    this.anchoredCoords = this.coords.copy()
  })

  document.body.addEventListener("mouseup", event => {
    if(event.buttons === 0 && event.shiftKey) this.mousemove = false

  })

  document.body.addEventListener("mousemove", event => {
    if(this.mousemove === true && event.shiftKey) {

      const delta = new Vec(event.offsetX, event.offsetY).subtract(this.mouseDelta)
      this.coords = this.anchoredCoords.subtract(delta.divide(this.scale))
    }
  })
}