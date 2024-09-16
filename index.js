import {Vec, GAME_PARAMS, number2MS, metricalIMS, randomBetween} from './helpers.js'
import {DrawEngine, Particle, Camera} from './game.js'
import {Pane} from './tweakpane-4.0.4.js'
import * as TweakpaneEssentials from './tweakpane-plugin-essentials-0.2.1.js'

GAME_PARAMS.focusBodyVelocity = 0
GAME_PARAMS.focusBodyObj = null

const cnvs = document.querySelector("#main-frame")
let loop, renderLoop;

cnvs.width = innerWidth
cnvs.height = innerHeight

// ---- SETTINGS ----

const pane = new Pane({title: 'Settings', container: document.querySelector('#pane-settings-container')}),
      simulationSettingsFolder = pane.addFolder({title: 'Simulation'}),
      cameraSettingsFolder = pane.addFolder({title: 'Camera'})

pane.registerPlugin(TweakpaneEssentials)

pane.on('change', event => {  
  sessionStorage['gameSettings'] = JSON.stringify(pane.exportState())
})

//  ---- PROGRAM ----

const particles = [],
      camera = new Camera({
        coords: new Vec(GAME_PARAMS.cameraCoords.x, GAME_PARAMS.cameraCoords.y),
        scale: GAME_PARAMS.cameraScale,
        particles,
        drawEngine: new DrawEngine(cnvs),
        pane: pane,
        options: GAME_PARAMS
      })
const sun = new Particle({
              mass: 2e30,
              color: 'yellow',
              radius: 7e8,
              options: GAME_PARAMS
            }),
      earth = new Particle({
              coords: new Vec(GAME_PARAMS.AU, 0),
              mass: 6e24,
              velocity: new Vec(0, 30e3),
              color: 'aqua',
              radius: 6.4e6,
              options: GAME_PARAMS
            }),
      mars = new Particle({
              coords: new Vec(1.5 * GAME_PARAMS.AU, 0),
              mass: 6e23,
              velocity: new Vec(0, 24e3),
              color: 'darkred',
              radius: 3.3e6,
              options: GAME_PARAMS
            }),
      mercury = new Particle({
              coords: new Vec(.4 * GAME_PARAMS.AU, 0),
              mass: 3e23,
              velocity: new Vec(0, 47e3),
              color: 'darkgray',
              radius: 2.4e6,
              options: GAME_PARAMS
            }),
      venus = new Particle({
              coords: new Vec(.7 * GAME_PARAMS.AU, 0),
              mass: 5e24,
              velocity: new Vec(0, 35e3),
              color: 'white',
              radius: 6e6,
              options: GAME_PARAMS
            }),
      moon = new Particle({
              coords: new Vec(GAME_PARAMS.AU + 380e6, 0),
              mass: 7e22,
              velocity: new Vec(0, 30e3 + 1000),
              color: 'gray',
              radius: 1.7e6,
              options: GAME_PARAMS
            })

particles.push(sun, earth, moon, mars, mercury, venus)

for(let i = 0; i < 200; i++) particles.push(new Particle({
  coords: new Vec(GAME_PARAMS.AU / 10 + randomBetween(-4e9, 4e9), randomBetween(-4e9, 4e9)),
  color: 'purple',
  radius: 1e3,
  velocity: new Vec(0, 1e5),
  options: GAME_PARAMS
}))

// earth.impulse(new Vec(20e3, -5.233e3))
venus.impulse(new Vec(-40e3, -25e3))

const fpsgraph = simulationSettingsFolder.addBlade({view: 'fpsgraph', label: 'FPS'})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'tps', {min: 0, max: 1000, step: 1}).on('change', ({last, value}) => last ? (value === 0 ? clearInterval(loop) : setLoop(1000 / value)) : {})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'fps', {min: 0, max: 1000, step: 1}).on('change', ({last, value}) => last ? (value === 0 ? clearInterval(renderLoop) : setRenderLoop(1000 / value)) : {})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'simulationSpeed', {step: 1})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'GRAVITY_CONST', {format: value => value.toExponential()})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'AU', {format: value => value.toExponential()})
cameraSettingsFolder.addBinding(GAME_PARAMS, 'focusBody', {options: {none: null, Sun: 'sun', Earth: 'earth', Mars: 'mars', Mercury: 'mercury', Venus: 'venus', Moon: 'moon'}}).on('change', ({last, value}) => {
  if(last) {
    switch (value) {
      case 'none':
        camera.coords = new Vec()
        GAME_PARAMS.focusBodyObj = null
        break;
      case 'sun':
        camera.coords = sun.coords
        GAME_PARAMS.focusBodyObj = sun
        break;
      case 'earth':
        camera.coords = earth.coords
        GAME_PARAMS.focusBodyObj = earth
        break;
      case 'mars':
        camera.coords = mars.coords
        GAME_PARAMS.focusBodyObj = mars
        break;
      case 'mercury':
        camera.coords = mercury.coords
        GAME_PARAMS.focusBodyObj = mercury
        break;
      case 'venus':
        camera.coords = venus.coords
        GAME_PARAMS.focusBodyObj = venus
        break;
      case 'moon':
        camera.coords = moon.coords
        GAME_PARAMS.focusBodyObj = moon
        break;
    }
  }
})

cameraSettingsFolder.addBinding(GAME_PARAMS, 'focusBodyVelocity', {view: 'graph', readonly: true, min: 0, max: 1e5})
cameraSettingsFolder.addBinding(GAME_PARAMS, 'focusBodyVelocity', {readonly: true, format: value => number2MS(value, metricalIMS, 'm/s', 3)})
cameraSettingsFolder.addBinding(GAME_PARAMS.cameraCoords, 'x', {format: value => number2MS(value, metricalIMS, 'm', 3), readonly: true})
cameraSettingsFolder.addBinding(GAME_PARAMS.cameraCoords, 'y', {format: value => number2MS(value, metricalIMS, 'm', 3), readonly: true})
cameraSettingsFolder.addBinding(camera, 'scale', {format: value => value.toExponential()})

if(sessionStorage['gameSettings'] !== undefined) pane.importState(JSON.parse(sessionStorage['gameSettings']))

// LOOP

let start = +new Date

function setLoop(ms) {
  if(loop !== undefined) clearInterval(loop)
  if(ms === Infinity) return

  loop = setInterval(() => {

    for(const particle of particles) {
      for(const particle2 of particles) {
        if(particle === particle2) continue
  
        const vec = particle2.coords.subtract(particle.coords),
              gravityForce = GAME_PARAMS.GRAVITY_CONST * particle.mass * particle2.mass / vec.module()**2,
              velocity = new Vec().set((value, dim) => ({x: Math.sin, y: Math.cos})[dim](vec.angle()) * gravityForce / particle.mass * GAME_PARAMS.simulationSpeed)
  
        particle.impulse(velocity)
      }
    }
  
    for(const particle of particles) particle.move(particles)
  }, ms)
}

function setRenderLoop(ms) {
  if(renderLoop !== undefined) clearInterval(renderLoop)
  if(ms === Infinity) return

  renderLoop = setInterval(() => {
    window.requestAnimationFrame(() => {
      fpsgraph.begin()

      camera.drawEngine.clear()
      camera.render()
      camera.drawEngine.drawCursor()

      if(GAME_PARAMS.focusBodyObj !== null) GAME_PARAMS.focusBodyVelocity = GAME_PARAMS.focusBodyObj.velocity.module()

      fpsgraph.end()
    })
  }, ms)
}


setLoop(1000 / GAME_PARAMS.tps)
setRenderLoop(1000 / GAME_PARAMS.fps)