import { _game_params, CanvasHelper, GAME_PARAMS, getIntervalChangableDelay, metricalIMS, number2MS, randomBetween, Vec } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { gravityForceAll } from "./game"
import { createBarnesHutTree, getAreaCorners, simplifyBodiesForTarget } from "./barnes-hun"
import {Pane} from 'tweakpane'
import * as TweakpaneEssentials from '@tweakpane/plugin-essentials'
import { KeyboardListener, keys } from "./hotkeys"
import particlesMap from "./particles-map"

// ---- SETTINGS ----

const paneContainer = document.querySelector<HTMLElement>('#pane-settings-container'),
      pane = new Pane({title: 'Settings', container: paneContainer === null ? undefined : paneContainer}) as {[key: string]: any},
      simulationSettingsFolder = pane.addFolder({title: 'Simulation'}),
      cameraSettingsFolder = pane.addFolder({title: 'Camera'})

pane.registerPlugin(TweakpaneEssentials)

pane.on('change', (event: unknown) => {  
  sessionStorage['gameSettings'] = JSON.stringify(pane.exportState())
})

// ---- CANVAS ----

const canvas = document.querySelector<HTMLCanvasElement>("#main-frame")
if(!canvas) throw new Error('No canvas!')

canvas.width = innerWidth
canvas.height = innerHeight

// ---- SETTINGS ----

const particles: Particle[] = [],
      canvasHelper = new CanvasHelper(canvas),
      camera = new Camera({particles, canvasHelper, tweakpane: pane}),
      keyboardHandler = new KeyboardListener({keymap: keys, tweakpane: pane})

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

cameraSettingsFolder.addBinding(_game_params.camera, 'pos', {
  label: 'pos',
  x: {step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  y: {step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  picker: 'inline'
}).on('change', ({last, value: pos}: {last: boolean, value: Vec}) => {
  if(last) camera.setPos(pos, 'relative')
})
cameraSettingsFolder.addBinding(_game_params.camera, 'scale', {format: (value: number) => value.toExponential()})
  .on('change', ({last, value}: {last: boolean, value: number}) => {
    if(last) camera.scale = value
  })

camera.bodyVelocityPanes = {
  number: cameraSettingsFolder.addBinding(_game_params.camera, 'focusBodyVelocity', {
    label: 'bodyVelocity',
    format: (value: number) => number2MS(value, metricalIMS, 'm/s', 3),
    readonly: true,
  }),
  graph: cameraSettingsFolder.addBinding(_game_params.camera, 'focusBodyVelocity', {
    label: 'bodyVelocity',
    view: 'graph',
    min: 0,
    max: 1e5,
    readonly: true,
  })
}

if(sessionStorage['gameSettings'] !== undefined) pane.importState(JSON.parse(sessionStorage['gameSettings']))

particlesMap.forEach(particle => particles.push(particle))
if(sessionStorage['focus-body']) {
  const body = particles.find(particle => particle.label === sessionStorage['focus-body'])
  if(body) camera.focusBody(body)
}

loopInterval(1000 / GAME_PARAMS.tps)
renderInterval(1000 / GAME_PARAMS.fps)

// ---- OTHER ----

window.pane = pane
window.particles = particles
window.canvasHelper = canvasHelper
window.camera = camera
window.keyboardHandler = keyboardHandler

/* cameraSettingsFolder.addBlade({
  order: -1,
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
      bodyVelocityViews.number.hidden = true
      bodyVelocityViews.graph.hidden = true
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

  if(body !== 'none') {
    bodyVelocityViews.number.hidden = false
    bodyVelocityViews.graph.hidden = false
  }
}) */