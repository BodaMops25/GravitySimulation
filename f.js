const GAME_PARAMS = {
  tps: 70,
  fps: 70,
  simulationSpeed: 3600 * 6,
  focusBody: 'none',
  cameraCoords: {x: 0, y: 0},
  cameraScale: 5e-10,

  GRAVITY_CONST: 6.7e-11,
  AU: 150e9
}

function randomBetween(min, max) {
  return min + Math.random()*(max-min)
}

function Particle({coords = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff', options} = {}) {
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

const particles = []

for(let i = 0; i < 700; i++) particles.push(new Particle({
  coords: {x: GAME_PARAMS.AU / 10 + randomBetween(-4e9, 4e9), y: randomBetween(-4e9, 4e9)},
  color: 'purple',
  radius: 1e3,
  velocity: {x: 0, y: 1e5},
  options: GAME_PARAMS
}))

let start = +new Date

setInterval(() => {

  for(const particle of particles) {
    for(const particle2 of particles) {
      if(particle === particle2) continue

      const vec = {
              x: particle2.coords.x - particle.coords.x,
              y: particle2.coords.y - particle.coords.y
            },
            gravityForce = GAME_PARAMS.GRAVITY_CONST * particle.mass * particle2.mass / ((vec.x**2 + vec.y**2)**.5)**2,
            velocity = {
              x: Math.sin(Math.atan2(vec.x, vec.y)) * gravityForce / particle.mass * GAME_PARAMS.simulationSpeed,
              y: Math.cos(Math.atan2(vec.x, vec.y)) * gravityForce / particle.mass * GAME_PARAMS.simulationSpeed
            }

      particle.impulse(velocity.x, velocity.y)
    }
  }

  for(const particle of particles) particle.move(particles)
  
  console.log(Math.round(1000 / (new Date() - start)))
  start = +new Date()
}, 1000 / GAME_PARAMS.tps)