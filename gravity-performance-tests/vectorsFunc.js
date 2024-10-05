const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tick_speed: 120
}

function distance(x2, y2, x, y) {
  return ((x2 - x)**2 + (y2 - y)**2)**.5
}

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

function Particle({pos = new Vec(), mass = 1, velocity = new Vec(), radius = 10, color = '#fff'} = {}) {
  this.pos = pos
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.move = () => {
    this.pos.set((value, dim) => value + this.velocity[dim] / this.mass * GAME_PARAMS.simulation_speed)
  }

  this.impulse = pos => {
    this.velocity = this.velocity.add(pos)
  }
}

const particles = []

for(let i = 0; i < 1600; i++) particles.push(new Particle({
  pos: new Vec().set(() => Math.random() * GAME_PARAMS.AU),
  velocity: new Vec(0, 1e3)
}))

let start = +new Date()
const loop = setInterval(() => {

  for(const particle of particles) {
    for(const particle2 of particles) {
      if(particle === particle2) continue

      const r = particle2.pos.module - particle.pos.module,
          force = particle.mass * particle2.mass / r**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulation_speed,
          angle = Math.atan2(particle2.pos.x - particle.pos.x, particle.pos.y - particle.pos.y),
          velocity = new Vec().set((value, dim) => ({x: Math.sin, y: Math.cos})[dim](angle) * force)

      particle.impulse(velocity)
    }

    particle.move()
  }

  console.log(new Date() - start, 'ms')
  start = +new Date()

}, 1000 / GAME_PARAMS.tick_speed)