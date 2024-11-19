import { CanvasHelper, GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { gravityForceAll } from "./game"
import { createBarnesHutTree, getAreaCorners, simplifyBodiesForTarget } from "./barnes-hun"

const canvas = document.querySelector<HTMLCanvasElement>("#main-frame")
if(!canvas) throw new Error('No canvas!')

const canvasHelper = new CanvasHelper(canvas)

canvas.width = innerWidth
canvas.height = innerHeight

const particles: Particle[] = [],
      camera = new Camera({particles, canvasHelper})

camera.scale = +sessionStorage['camera_scale'] || 1
camera.pos = JSON.parse(sessionStorage['camera_pos'] || '{"x": 0, "y": 0}')

const sun = new Particle({
    mass: 2e30,
    color: 'yellow',
    radius: 7e8
  }),
earth = new Particle({
    pos: {x: GAME_PARAMS.AU, y: 0},
    mass: 6e24,
    velocity: {x: 0, y: 30e3},
    color: 'aqua',
    radius: 6.4e6
  }),
mars = new Particle({
    pos: {x: 1.5 * GAME_PARAMS.AU, y: 0},
    mass: 6e23,
    velocity: {x: 0, y: 24e3},
    color: 'darkred',
    radius: 3.3e6
  }),
mercury = new Particle({
    pos: {x: .4 * GAME_PARAMS.AU, y: 0},
    mass: 3e23,
    velocity: {x: 0, y: 47e3},
    color: 'darkgray',
    radius: 2.4e6
  }),
venus = new Particle({
    pos: {x: .7 * GAME_PARAMS.AU, y: 0},
    mass: 5e24,
    velocity: {x: 0, y: 35e3},
    color: 'white',
    radius: 6e6
  }),
moon = new Particle({
    pos: {x: GAME_PARAMS.AU + 380e6, y: 0},
    mass: 7e22,
    velocity: {x: 0, y: 30e3 + 1000},
    color: 'gray',
    radius: 1.7e6
  })

particles.push(sun, earth, moon, mars, mercury, venus)

for(let i = 0; i < 300; i++) particles.push(new Particle({
  pos: {x: .4 * GAME_PARAMS.AU + randomBetween(-1e10, 1e10), y: randomBetween(-1e10, 1e10)},
  mass: 1e20,
  velocity: {x: randomBetween(-2e3, 2e3), y: 47e3 + randomBetween(-2e3, 2e3)},
  color: 'purple',
  radius: 1e3
}))

/* for(let i = 0; i < 1000; i++) particles.push(new Particle({
  pos: {x: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU), y: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU)},
  velocity: {x: randomBetween(-1e3, 1e3), y: randomBetween(-1e3, 1e3)},
  radius: 1e3,
  mass: 1e12
})) */

camera.render({debug: true})
// camera.focusBody(earth)

// let start = +new Date()
const loop = setInterval(() => {
  canvasHelper.ctx?.clearRect(0, 0, canvas.width, canvas.height)

  const pointsCorners = getAreaCorners(particles),
        BHRoot = createBarnesHutTree(particles, pointsCorners)

  for(const particle of particles) {
    const gravityPoints = simplifyBodiesForTarget(particle, BHRoot, 2).map(item => item.sectors ? item.data : item)
    gravityForceAll(particle, gravityPoints)
    // gravityForceAll(particle, particles)
  }
  for(const particle of particles) particle.move()

  camera.render({debug: true})
  camera.canvasHelper.drawCursor()

  // console.log(+new Date() - start, 'ms')
  // start = +new Date()

}, 1000 / GAME_PARAMS.tick_speed)