const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  tick_speed: 120
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

for(let i = 0; i < 500; i++) particles.push(new Particle({
  
}))

const loop = setInterval(() => {

  for(const particle of particles)

}, 1000 / GAME_PARAMS.tick_speed)