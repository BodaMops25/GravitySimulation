// ---- CANVAS ----

export function DrawEngine(canvas) {
  this.cnvs = canvas
  this.ctx = canvas.getContext('2d')

  this.clear = () => this.ctx.clearRect(0, 0, this.cnvs.width, this.cnvs.height)

  this.drawBall = (x = 10, y = 10, scale = 10, color = '#fff') => {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.arc(x, y, scale, 0, Math.PI*2)
    this.ctx.fill()
  }

  this.drawCircle = (x = 10, y = 10, scale = 10, thickness = 2, color = '#fff') => {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = thickness
    this.ctx.arc(x, y, scale, 0, Math.PI*2)
    this.ctx.stroke()
  }
  
  this.drawVector = (x = 0, y = 0, x2 = 50, y2 = 50, scale = 10, color = '#fff', mode = 0) => {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = scale
    this.ctx.moveTo(x, y)
  
    let end_x = x2,
        end_y = y2
  
    if(mode === 1) {
      end_x = x + x2
      end_y = y + y2
    }
  
    this.ctx.lineTo(end_x, end_y)
    this.ctx.stroke()
    this.ctx.beginPath()
    this.drawBall(end_x, end_y, scale * 1.2, color)
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

  this.focusBody = null

  this.pane = pane
  this.options = options

  this.mapToCameraCoords = (x, y) => {
    return {
      x: (x - this.coords.x) * this.scale + this.drawEngine.cnvs.width / 2,
      y: (y - this.coords.y) * this.scale + this.drawEngine.cnvs.height / 2
    }
  }

  this.focus = (x, y) => {
    if(x === null) this.focusBody = null
    else if(x.constructor === Particle) this.focusBody = x
    else {
      if(x) this.coords.x = x
      if(y) this.coords.y = y
    }
  }

  this.render = () => {

    if(this.focusBody) {
      this.coords.x = this.focusBody.coords.x
      this.coords.y = this.focusBody.coords.y
    }

    for(const particle of particles) {

      const coords = this.mapToCameraCoords(particle.coords.x, particle.coords.y),
            velocityCoords = this.mapToCameraCoords(particle.coords.x + particle.velocity.x * this.options.simulationSpeed, particle.coords.y + particle.velocity.y * this.options.simulationSpeed),
            scale = particle.radius * this.scale

      if(scale < 5) {
        this.drawEngine.drawBall(coords.x, coords.y, 5, particle.color)
        this.drawEngine.drawCircle(coords.x, coords.y, 7, 1, 'white')
      }
      else {
        this.drawEngine.drawBall(coords.x, coords.y, scale, particle.color)
      }

      this.drawEngine.drawVector(coords.x, coords.y, velocityCoords.x, velocityCoords.y, 2, '#fff', 0)

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

    this.mouseDelta.x = event.offsetX
    this.mouseDelta.y = event.offsetY

    this.anchoredCoords.x = this.coords.x
    this.anchoredCoords.y = this.coords.y
  })

  document.body.addEventListener("mouseup", event => {
    if(event.buttons === 0 && event.shiftKey) this.mousemove = false

  })

  document.body.addEventListener("mousemove", event => {
    if(this.mousemove === true && event.shiftKey) {

      const delta_x = event.offsetX - this.mouseDelta.x,
            delta_y = event.offsetY - this.mouseDelta.y

      this.coords.x = this.anchoredCoords.x - delta_x / this.scale
      this.coords.y = this.anchoredCoords.y - delta_y / this.scale
    }
  })
}