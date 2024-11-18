import { CanvasHelper, GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { gravityForceAll } from "./game"
import { createBarnesHutTree, simplifyBodiesForTarget } from "./barnes-hun"

const canvas = document.querySelector<HTMLCanvasElement>("#main-frame")
if(!canvas) throw new Error('No canvas!')

const canvasHelper = new CanvasHelper(canvas)

canvas.width = innerWidth
canvas.height = innerHeight

const particles: Particle[] = [],
      camera = new Camera({particles, canvasHelper})

camera.scale = +sessionStorage['camera_scale'] || 1
camera.pos = JSON.parse(sessionStorage['camera_pos'] || '{"x": 0, "y": 0}')

for(let i = 0; i < 700; i++) particles.push(new Particle({
  pos: {x: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU), y: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU)},
  velocity: {x: randomBetween(-1e3, 1e3), y: randomBetween(-1e3, 1e3)},
  radius: 1e3,
  mass: 1e12
}))

camera.render({debug: true})

// let start = +new Date()
const loop = setInterval(() => {
  canvasHelper.ctx?.clearRect(0, 0, canvas.width, canvas.height)

  const BHRoot = createBarnesHutTree(particles)

  for(const particle of particles) {
    const gravityPoints = simplifyBodiesForTarget(particle, BHRoot, 1e3).map(item => item.sectors ? item.data : item)
    gravityForceAll(particle, gravityPoints)
  }

  // for(const particle of particles) gravityForceAll(particle, particles)
  for(const particle of particles) particle.move()

  camera.render({debug: true})
  camera.canvasHelper.drawCursor()

  // console.log(+new Date() - start, 'ms')
  // start = +new Date()

}, 1000 / GAME_PARAMS.tick_speed)