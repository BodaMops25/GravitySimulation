const cnvs = document.querySelector("#main-frame"),
      ctx = cnvs.getContext("2d")

cnvs.width = innerWidth
cnvs.height = innerHeight

// ---- MATH ----

function Vec(x = 0, y = 0) {
  this.x = x
  this.y = y

  this.copy = () => new Vec(this.x, this.y)
  this.set = (x, y) => {

    if(typeof x === "function") {
      this.x = x(this.x, 'x')
      this.y = x(this.y, 'y')
      return this
    }

    this.x = x
    this.y = y
    return this
  }

  this.add = value => {
    if(isNaN(+value) === false) return new Vec(this.x + value, this.y + value)
    return new Vec(this.x + value.x, this.y + value.y)
  }

  this.subtract = value => {
    if(isNaN(+value) === false) return new Vec(this.x - value, this.y - value)
    return new Vec(this.x - value.x, this.y - value.y)
  }

  this.multiply = value => {
    if(isNaN(+value) === false) return new Vec(this.x * value, this.y * value)
    return new Vec(this.x * value.x, this.y * value.y)
  }

  this.divide = value => {
    if(isNaN(+value) === false) return new Vec(this.x / value, this.y / value)
    return new Vec(this.x / value.x, this.y / value.y)
  }

  this.pow = value => {
    if(isNaN(+value) === false) return new Vec(this.x ** value, this.y ** value)
    return new Vec(this.x ** value.x, this.y ** value.y)
  }

  this.angle = () => Math.atan2(this.x, this.y)
  this.module = () => (this.x**2 + this.y**2)**.5
}

function degToRad(deg) {return deg/180 * Math.PI}
function radToDeg(rad) {return rad/Math.PI * 180}

function vecsModule(vec2, vec1) {
  return ((vec2.x - vec1.x)**2 + (vec2.y - vec1.y)**2)**.5
}

// ---- CANVAS ----

function DrawEngine(context2D) {
  this.ctx = context2D

  this.clear = () => this.ctx.clearRect(0, 0, cnvs.width, cnvs.height)

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
    const hh = cnvs.width / 2,
          vh = cnvs.height / 2,
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

function Particle({coords = new Vec(), mass = 1, velocity = new Vec(), radius = 10, color = '#fff'} = {}) {
  this.coords = coords
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.orbitLine = []

  this.move = () => {
    this.coords.set((coord, dim) => coord + this.velocity[dim] * SIMULATION_SPEED)

    // if(this.orbitLine.length < 1000) this.orbitLine.push(this.coords.copy())
  }

  this.impulse = vec => this.velocity = this.velocity.add(vec)
}

// ---- CAMERA ----

function Camera({coords = new Vec(), scale = 1, particles, drawEngine} = {}) {
  this.coords = coords
  this.scale = scale
  this.particles = particles
  this.drawEngine = drawEngine

  this.mousemove = false
  this.mouseDelta = new Vec()
  this.anchoredCoords = new Vec()

  this.mapToCameraCoords = vec => {
    return vec.copy().set((value, dim) => (value - this.coords[dim]) * this.scale + {x: cnvs.width, y: cnvs.height}[dim] / 2)
  }

  this.focus = vec => this.coords = vec.copy()

  this.render = () => {

    for(const particle of particles) {

      const coords = this.mapToCameraCoords(particle.coords),
            velocityCoords = this.mapToCameraCoords(new Vec().set((value, dim) => particle.coords[dim] + particle.velocity[dim] * SIMULATION_SPEED)),
            scale = particle.radius * this.scale

      if(scale < 5) {
        this.drawEngine.drawBall(coords, 5, particle.color)
        this.drawEngine.drawCircle(coords, 7, 1, 'white')
      }
      else {
        this.drawEngine.drawBall(coords, scale, particle.color)
      }

      this.drawEngine.drawVector(coords, velocityCoords, 2, '#fff', 0)

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

    sessionStorage['camera_scale'] = this.scale
  })

  document.body.addEventListener("mousedown", event => {
    if(event.buttons === 1 && event.shiftKey) this.mousemove = true

    this.mouseDelta.set(event.offsetX, event.offsetY)
    this.anchoredCoords = this.coords.copy()
  })

  document.body.addEventListener("mouseup", event => {
    if(event.buttons === 0 && event.shiftKey) this.mousemove = false

    sessionStorage['camera_x'] = this.coords.x
    sessionStorage['camera_y'] = this.coords.y
  })

  document.body.addEventListener("mousemove", event => {
    if(this.mousemove === true && event.shiftKey) {

      const delta = new Vec(event.offsetX, event.offsetY).subtract(this.mouseDelta)
      this.coords = this.anchoredCoords.subtract(delta.divide(this.scale))
    }
  })
}

//  ---- PROGRAM ----

const G = 6.7e-11,
      AU = 150e9, 
      particles = [],
      camera = new Camera({
        coords: new Vec(+sessionStorage['camera_x'] || 0, +sessionStorage['camera_y'] || 0),
        scale: +sessionStorage['camera_scale'] || 1,
        particles,
        drawEngine: new DrawEngine(ctx)
      })

const tick_speed = 120, // count per second
    fps = 60

let SIMULATION_SPEED = 3600 * 24

const sun = new Particle({
              mass: 2e30,
              color: 'yellow',
              radius: 7e8
            }),

      earth = new Particle({
              coords: new Vec(AU, 0),
              mass: 6e24,
              velocity: new Vec(0, 30e3),
              color: 'aqua',
              radius: 6.4e6
            }),

      mars = new Particle({
              coords: new Vec(1.5 * AU, 0),
              mass: 6e23,
              velocity: new Vec(0, 24e3),
              color: 'darkred',
              radius: 3.3e6
            }),

      mercury = new Particle({
              coords: new Vec(.4 * AU, 0),
              mass: 3e23,
              velocity: new Vec(0, 47e3),
              color: 'darkgray',
              radius: 2.4e6
            }),

      venus = new Particle({
              coords: new Vec(.7 * AU, 0),
              mass: 5e24,
              velocity: new Vec(0, 35e3),
              color: 'white',
              radius: 6e6
            }),

      moon = new Particle({
              coords: new Vec(AU + 380e6, 0),
              mass: 7e22,
              velocity: new Vec(0, 30e3 + 1000),
              color: 'gray',
              radius: 1.7e6
            })

particles.push(sun, earth, moon, mars, mercury, venus)

// earth.impulse(new Vec(20e3, -5.233e3))
venus.impulse(new Vec(-40e3, -25e3))
camera.coords = earth.coords

// LOOP

const loop = setInterval(() => {

  for(const particle of particles) {
    for(const particle2 of particles) {
      if(particle === particle2) continue

      const vec = particle2.coords.subtract(particle.coords),
            gravityForce = G * particle.mass * particle2.mass / vec.module()**2,
            velocity = new Vec().set((value, dim) => ({x: Math.sin, y: Math.cos})[dim](vec.angle()) * gravityForce / particle.mass * SIMULATION_SPEED)

      particle.impulse(velocity)
    }
  }

  for(const particle of particles) particle.move(particles)

}, 1000 / tick_speed)

const render_loop = setInterval(() => {
  window.requestAnimationFrame(() => {
    camera.drawEngine.clear()
    camera.render()
    camera.drawEngine.drawCursor()
  })
}, 1000 / fps)

// ---- SETTINGS ----

const settings = QuickSettings.create()

settings.addText('Simulation Speed')
settings.addText('Focus body')
settings.addHTML('HTML', '<s>html</s>')

document.querySelector('#null.qs_main').addEventListener('focusout', ({target}) => {
  switch (target.id) {
    case 'Simulation Speed':
      
      const value = eval(target.value)
      if(isNaN(+value) === false) SIMULATION_SPEED = value
      break;

    case 'Focus body':
      const coords = eval(target.value)
      camera.coords = coords
      break;
  }
})

settings.saveInLocalStorage('game_settings')