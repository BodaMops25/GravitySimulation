import { CanvasHelper, GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { gravityForce } from "./game"

const canvas = document.querySelector("#main-frame"),
      canvasHelper = new CanvasHelper(canvas)

canvas.width = innerWidth
canvas.height = innerHeight

const particles = [],
      camera = new Camera({particles, canvasHelper})

camera.scale = +sessionStorage['camera_scale'] || 1
camera.pos = JSON.parse(sessionStorage['camera_pos'] || '{x: 0, y: 0}')


for(let i = 0; i < 500; i++) particles.push(new Particle({
  pos: {x: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU), y: randomBetween(-GAME_PARAMS.AU, GAME_PARAMS.AU)},
  velocity: {x: 0, y: 100}
}))

let start = +new Date()
const loop = setInterval(() => {
  canvasHelper.ctx.clearRect(0, 0, canvas.width, canvas.height)

  for(const particle of particles) gravityForce(particle, particles)
  for(const particle of particles) particle.move()

  camera.render()
  drawCursor()

  console.log(new Date() - start, 'ms')
  start = +new Date()

}, 1000 / GAME_PARAMS.tick_speed)