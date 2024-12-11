import { _game_params, CanvasHelper, formatTimeInSec, GAME_PARAMS, getIntervalChangableDelay, metricalIMS, number2MS, vecMagnitude } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { getAllGravityForces, getGravityBodies2body } from "./game"
import { BarnesHutRootType, createBarnesHutTree, getAreaCorners, simplifyBodiesForTarget } from "./barnes-hun"
import {Pane} from 'tweakpane'
import * as TweakpaneEssentials from '@tweakpane/plugin-essentials'
import { KeyboardListener } from "./hotkeys"
import { Vec } from "./types"

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
      keyboardHandler = new KeyboardListener({tweakpane: pane}),
      camera = new Camera({particles, canvasHelper, tweakpane: pane, keyboardHandler})

keyboardHandler.camera = camera

const frameRate = {
  tpsgraph: simulationSettingsFolder.addBlade({view: 'fpsgraph', label: 'TPS'}),
  fpsgraph: simulationSettingsFolder.addBlade({view: 'fpsgraph', label: 'FPS'})
}

const loopInterval = getIntervalChangableDelay(() => {
  frameRate.tpsgraph.begin()

  for(const particle of particles) particle.move()

  let BHRoot: BarnesHutRootType

  if( GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') {
    BHRoot = createBarnesHutTree(particles, getAreaCorners(particles))
  }

  for(const particle of particles) {

    let bodies = particles
    if(GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') bodies = simplifyBodiesForTarget(particle, BHRoot, GAME_PARAMS.barnesHutThreshold) as any

    const gravityForces = getAllGravityForces(particle, bodies)

    if(particle === camera.focusedBody) {
      _game_params.camera.focusBodyGravityPoints = getGravityBodies2body(gravityForces, GAME_PARAMS.minCountedGravityVeclocity)
    }

    gravityForces.forEach(force => particle.impulse(force.velocity))
  }

  _game_params.gameAge += GAME_PARAMS.simulationSpeed

  frameRate.tpsgraph.end()
})

const renderInterval = getIntervalChangableDelay(() => {
  frameRate.fpsgraph.begin()
  canvasHelper.ctx?.clearRect(0, 0, canvas.width, canvas.height)
  camera.render({debug: false})
  camera.canvasHelper.drawCursor()
  frameRate.fpsgraph.end()
})

simulationSettingsFolder.addBinding(GAME_PARAMS, 'tps', {min: 0, max: 1000, step: 1, format: (v: number) => v + ' t/s'}).on('change', ({last, value}: {last: boolean, value: number}) => last && loopInterval(1000 / value))
simulationSettingsFolder.addBinding(GAME_PARAMS, 'fps', {min: 0, max: 1000, step: 1, format: (v: number) => v + ' t/s'}).on('change', ({last, value}: {last: boolean, value: number}) => last && renderInterval(1000 / value))

simulationSettingsFolder.addBinding(GAME_PARAMS, 'simulationSpeed', {format: (v: number) => v + ' sec/t'})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'gravity', {format: (value: number) => value.toExponential()})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'AU', {format: (value: number) => value.toExponential()})
simulationSettingsFolder.addBinding(GAME_PARAMS, 'minCountedGravityVeclocity', {format: (value: number) => value.toExponential(), label: 'minGravity'})
simulationSettingsFolder.addBinding(_game_params, 'gameAge', {format: (value: number) => {
  const timeObj = formatTimeInSec(value);
  return [
    [timeObj.years, 'y'],
    [timeObj.days, 'd'],
    [timeObj.hours, 'h'],
    [timeObj.minutes, 'm'],
    [timeObj.seconds, 's']
  ].reduce((str, [value, timeKey]) => str + value.toString().padStart(2, '0') + ' ' + timeKey + ' ', '')
}, readonly: true})

cameraSettingsFolder.addBinding(_game_params.camera, 'pos', {
  label: 'pos',
  x: {step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  y: {step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1)},
  picker: 'inline'
}).on('change', ({last, value: pos}: {last: boolean, value: Vec}) => {
  if(last) camera.setPos(pos, 'relative')
})
cameraSettingsFolder.addBinding(_game_params.camera, 'scale', {format: (value: number) => number2MS(1 / value * camera.canvasHelper.canvas.width, metricalIMS, 'm', 3)})
  .on('change', ({last, value}: {last: boolean, value: number}) => {
    if(last) camera.scale = value
  })

camera.bodyVelocityPanes = {
  number: cameraSettingsFolder.addBinding(_game_params.camera, 'focusBodyVelocity', {
    label: 'bodyVelocity',
    format: (value: number) => number2MS(value, metricalIMS, 'm/sec', 3),
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

import("./particles-map")
  .then((module) => {
    module.default.forEach(particle => particles.push(particle))
    if(sessionStorage['focus-body']) {
      const body = particles.find(particle => particle.label === sessionStorage['focus-body'])
      if(body) camera.focusBody(body)
    }
  })

loopInterval(1000 / GAME_PARAMS.tps)
renderInterval(1000 / GAME_PARAMS.fps)

// ---- OTHER ----

window.pane = pane
window.particles = particles
window.canvasHelper = canvasHelper
window.camera = camera
window.keyboardHandler = keyboardHandler