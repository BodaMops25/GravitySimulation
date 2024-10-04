const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tick_speed: 120
}

function distance(x2, y2, x, y) {
  return ((x2 - x)**2 + (y2 - y)**2)**.5
}


function Particle({pos = {x: 0, y: 0}, mass = 1, velocity = {x: 0, y: 0}, radius = 10, color = '#fff'} = {}) {
  this.pos = pos
  this.mass = mass
  this.velocity = velocity
  this.radius = radius
  this.color = color

  this.move = () => {
    this.pos.x += this.velocity.x / this.mass * GAME_PARAMS.simulation_speed
    this.pos.y += this.velocity.y / this.mass * GAME_PARAMS.simulation_speed
  }

  this.impulse = (pos) => {
    this.velocity.x += pos.x
    this.velocity.y += pos.y
  }
}

const particles = []

for(let i = 0; i < 1600; i++) particles.push(new Particle({
  pos: {
    x: Math.random() * GAME_PARAMS.AU,
    y: Math.random() * GAME_PARAMS.AU
  },
  velocity: {x: 0, y: 1e3}
}))

let start = +new Date()
const loop = setInterval(() => {

  for(const particle of particles) {
    for(const particle2 of particles) {
      if(particle === particle2) continue

      const r = distance(particle2.x, particle2.y, particle.x, particle.y),
          force = particle.mass * particle2.mass / r**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulation_speed,
          angle = Math.atan2(particle2.x - particle.x, particle2.y - particle.y),
          velocity = {
            x: Math.sin(angle) * force,
            y: Math.cos(angle) * force
          }

      particle.impulse(velocity)
    }

    particle.move()
  }

  console.log(new Date() - start, 'ms')
  start = +new Date()

}, 1000 / GAME_PARAMS.tick_speed)