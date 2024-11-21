import { _game_params, CanvasHelper, GAME_PARAMS, getIntervalChangableDelay, metricalIMS, number2MS, randomBetween, Vec } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { gravityForceAll } from "./game"
import { createBarnesHutTree, getAreaCorners, simplifyBodiesForTarget } from "./barnes-hun"
import {Pane} from 'tweakpane'
import * as TweakpaneEssentials from '@tweakpane/plugin-essentials'

// ---- SETTINGS ----

const paneContainer = document.querySelector<HTMLElement>('#pane-settings-container')

const pane = new Pane({title: 'Settings', container: paneContainer === null ? undefined : paneContainer}) as {[key: string]: any},
      simulationSettingsFolder = pane.addFolder({title: 'Simulation'}),
      cameraSettingsFolder = pane.addFolder({title: 'Camera'})

pane.registerPlugin(TweakpaneEssentials)

pane.on('change', (event: unknown) => {  
  sessionStorage['gameSettings'] = JSON.stringify(pane.exportState())
})

// ---- CANVAS ----

const canvas = document.querySelector<HTMLCanvasElement>("#main-frame")
if(!canvas) throw new Error('No canvas!')

const canvasHelper = new CanvasHelper(canvas)

canvas.width = innerWidth
canvas.height = innerHeight

const particles: Particle[] = [],
      camera = new Camera({particles, canvasHelper, tweakpane: pane})

camera.scale = +sessionStorage['camera_scale'] || 1
// camera.pos = JSON.parse(sessionStorage['camera_pos'] || '{"x": 0, "y": 0}')

const frameRate = {
  tpsgraph: simulationSettingsFolder.addBlade({view: 'fpsgraph', label: 'TPS'}),
  fpsgraph: simulationSettingsFolder.addBlade({view: 'fpsgraph', label: 'FPS'})
}

const loopInterval = getIntervalChangableDelay(() => {
  frameRate.tpsgraph.begin()

  if(GAME_PARAMS.gravityAlgorithmType === 'all') {
    for(const particle of particles) gravityForceAll(particle, particles)
  }
  else if( GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') {
    const pointsCorners = getAreaCorners(particles),
        BHRoot = createBarnesHutTree(particles, pointsCorners)

    for(const particle of particles) {
      const gravityPoints = simplifyBodiesForTarget(particle, BHRoot, GAME_PARAMS.barnesHutThreshold).map(item => item.sectors ? item.data : item)
      gravityForceAll(particle, gravityPoints)
    }
  }

  for(const particle of particles) particle.move()

  frameRate.tpsgraph.end()
})

const renderInterval = getIntervalChangableDelay(() => {
  frameRate.fpsgraph.begin()
  canvasHelper.ctx?.clearRect(0, 0, canvas.width, canvas.height)
  camera.render({debug: true})
  camera.canvasHelper.drawCursor()
  frameRate.fpsgraph.end()
})

simulationSettingsFolder.addBinding(GAME_PARAMS, 'tps', {min: 0, max: 1000, step: 1}).on('change', ({last, value}: {last: boolean, value: number}) => last && loopInterval(1000 / value))
simulationSettingsFolder.addBinding(GAME_PARAMS, 'fps', {min: 0, max: 1000, step: 1}).on('change', ({last, value}: {last: boolean, value: number}) => last && renderInterval(1000 / value))

simulationSettingsFolder.addBinding(GAME_PARAMS, 'simulation_speed', {step: 1})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'gravity', {format: (value: number) => value.toExponential()})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'AU', {format: (value: number) => value.toExponential()})

// if(sessionStorage['gameSettings'] !== undefined) pane.importState(JSON.parse(sessionStorage['gameSettings']))

loopInterval(1000 / GAME_PARAMS.tps)
renderInterval(1000 / GAME_PARAMS.fps)

// ---- PARTICLES SPAWN ----

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

for(let i = 0; i < 100; i++) particles.push(new Particle({
pos: {x: .4 * GAME_PARAMS.AU + randomBetween(-1e10, 1e10), y: randomBetween(-1e10, 1e10)},
mass: 1e20,
velocity: {x: randomBetween(-2e3, 2e3), y: 47e3 + randomBetween(-2e3, 2e3)},
color: 'purple',
radius: 1e3
}))

cameraSettingsFolder.addBinding(_game_params.camera, 'pos', {
  label: 'pos',
  x: {step: 1, min: -GAME_PARAMS.AU, max: GAME_PARAMS.AU, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  y: {step: 1, min: -GAME_PARAMS.AU, max: GAME_PARAMS.AU, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  picker: 'inline'
}).on('change', ({last, value: pos}: {last: boolean, value: Vec}) => {
  if(last) camera.setPos(pos, 'relative')
})
cameraSettingsFolder.addBinding(_game_params.camera, 'scale', {format: (value: number) => value.toExponential()})
  .on('change', ({last, value}: {last: boolean, value: number}) => {
    if(last) camera.scale = value
  })

cameraSettingsFolder.addBlade({
  view: 'list',
  label: 'focusBody',
  options: [
    {text: 'none', value: 'none'},
    {text: 'sun', value: 'sun'},
    {text: 'earth', value: 'earth'},
    {text: 'moon', value: 'moon'},
    {text: 'mars', value: 'mars'},
    {text: 'mercury', value: 'mercury'},
    {text: 'venus', value: 'venus'},
  ],
  value: 'none',
}).on('change', ({value: body}: {value: string}) => {
  switch(body) {
    case 'none':
      camera.removeFocusBody()
      break;
    case 'sun':
      camera.focusBody(sun)
      break;
    case 'earth':
      camera.focusBody(earth)
      break;
    case 'moon':
      camera.focusBody(moon)
      break;
    case 'mars':
      camera.focusBody(mars)
      break;
    case 'mercury':
      camera.focusBody(mercury)
      break;
    case 'venus':
      camera.focusBody(venus)
      break;
  }
})
cameraSettingsFolder.addBinding(_game_params.camera, 'focusBodyVelocity', {
  label: 'bodyVelocity',
  format: (value: number) => number2MS(value, metricalIMS, 'm/s', 3),
  readonly: true
})
cameraSettingsFolder.addBinding(_game_params.camera, 'focusBodyVelocity', {
  label: 'bodyVelocity',
  view: 'graph',
  min: 0,
  max: 1e5,
  readonly: true
})

if(sessionStorage['gameSettings'] !== undefined) pane.importState(JSON.parse(sessionStorage['gameSettings']))

window.camera = camera
window.sun = sun
window.earth = earth
window.moon = moon
window.mars = mars
window.mercury = mercury
window.venus = venus
window._game_params = _game_params