import { _game_params, CanvasHelper, distanceBetweenVec, formatTimeInSec, GAME_PARAMS, getIntervalChangableDelay, metricalIMS, number2MS, vecMagnitude } from "./helpers"
import { Particle } from "./particles"
import { Camera } from "./camera"
import { getAllGravityForces, getGravityBodies2body, gravityForce2body } from "./game"
import { BarnesHutRootType, createBarnesHutTree, getAreaCorners, simplifyBodiesForTarget } from "./barnes-hun"
import { Pane } from 'tweakpane'
import * as TweakpaneEssentials from '@tweakpane/plugin-essentials'
import { KeyboardListener } from "./hotkeys"
import { Vec } from "./types"
import { KeplerOrbit } from "./kepler-orbit"

// ---- SETTINGS ----

const paneContainer = document.querySelector<HTMLElement>('#pane-settings-container'),
  pane = new Pane({ title: 'Settings', container: paneContainer === null ? undefined : paneContainer }) as { [key: string]: any },
  simulationSettingsFolder = pane.addFolder({ title: 'Simulation' }),
  orbitSettingsFolder = pane.addFolder({ title: 'Two-body orbit' }),
  cameraSettingsFolder = pane.addFolder({ title: 'Camera' })

pane.registerPlugin(TweakpaneEssentials)

pane.on('change', (event: unknown) => {
  sessionStorage['gameSettings'] = JSON.stringify(pane.exportState())
})

// ---- CANVAS ----

const canvas = document.querySelector<HTMLCanvasElement>("#main-frame")
if (!canvas) throw new Error('No canvas!')

canvas.width = innerWidth
canvas.height = innerHeight

// ---- SETTINGS ----

const particles: Particle[] = [],
  canvasHelper = new CanvasHelper(canvas),
  keyboardHandler = new KeyboardListener({ tweakpane: pane }),
  camera = new Camera({ particles, canvasHelper, tweakpane: pane, keyboardHandler })

keyboardHandler.camera = camera

const frameRate = {
  tpsgraph: simulationSettingsFolder.addBlade({ view: 'fpsgraph', label: 'TPS' }),
  fpsgraph: simulationSettingsFolder.addBlade({ view: 'fpsgraph', label: 'FPS' })
}

let keplerOrbit: KeplerOrbit | undefined
let orbitFocusedBody: Particle | undefined
let selectedOrbitPartner: Particle | undefined
let orbitPartnerBinding: any
const orbitInfo = {
  focusedBody: 'none', partnerBody: 'none',
  periapsis: 1, apoapsis: 1,
  orientation: 0, phase: 0,
  clockwise: false, period: 0
}
let orbitSettingsReady = false

const setupOrbitSettings = () => {
  if (orbitSettingsReady) return
  orbitSettingsReady = true

  const resetOrbit = () => {
    if (!keplerOrbit) return
    Object.assign(keplerOrbit.params, {
      periapsis: orbitInfo.periapsis,
      apoapsis: orbitInfo.apoapsis,
      orientation: orbitInfo.orientation,
      phase: orbitInfo.phase,
      clockwise: orbitInfo.clockwise
    })
    keplerOrbit.resetEpoch(_game_params.simulationAge)
    keplerOrbit.update(_game_params.simulationAge)
    orbitInfo.period = keplerOrbit.period
  }

  orbitSettingsFolder.addBinding(orbitInfo, 'focusedBody', { label: 'focused', readonly: true })
  orbitSettingsFolder.addBinding(orbitInfo, 'periapsis', {
    label: 'lowest distance', min: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 3)
  }).on('change', resetOrbit)
  orbitSettingsFolder.addBinding(orbitInfo, 'apoapsis', {
    label: 'highest distance', min: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 3)
  }).on('change', resetOrbit)
  orbitSettingsFolder.addBinding(orbitInfo, 'orientation', {
    min: -180, max: 180, step: 1, format: (value: number) => value.toFixed(0) + '°'
  }).on('change', resetOrbit)
  orbitSettingsFolder.addBinding(orbitInfo, 'phase', {
    min: 0, max: 360, step: 1, format: (value: number) => value.toFixed(0) + '°'
  }).on('change', resetOrbit)
  orbitSettingsFolder.addBinding(orbitInfo, 'clockwise').on('change', resetOrbit)
  orbitSettingsFolder.addBinding(orbitInfo, 'period', {
    readonly: true,
    format: (value: number) => {
      const time = formatTimeInSec(value)
      return `${time.years}y ${time.days}d ${time.hours}h`
    }
  })
}

const getKeplerPartners = (focusedBody: Particle) => {
  return particles.filter(body => {
    if (body === focusedBody) return false
    const distance = distanceBetweenVec(focusedBody.pos, body.pos)
    const relativeVelocity = {
      x: focusedBody.velocity.x - body.velocity.x,
      y: focusedBody.velocity.y - body.velocity.y
    }
    const mu = GAME_PARAMS.gravity * (focusedBody.mass + body.mass)
    return vecMagnitude(relativeVelocity) ** 2 / 2 - mu / distance < 0
  })
}

const findOrbitPartner = (focusedBody: Particle) => {
  return getKeplerPartners(focusedBody).reduce<Particle | undefined>((best, body) => {
    if (!best) return body
    const score = (candidate: Particle) => {
      const distance = distanceBetweenVec(focusedBody.pos, candidate.pos)
      return GAME_PARAMS.gravity * (focusedBody.mass + candidate.mass) / distance ** 3
    }
    return score(body) > score(best) ? body : best
  }, undefined)
}

const setupOrbitPartnerDropdown = (focusedBody: Particle) => {
  orbitPartnerBinding?.dispose()

  const candidates = getKeplerPartners(focusedBody)
  const options = candidates.reduce<Record<string, string>>((result, body) => {
    const index = particles.indexOf(body)
    const name = body.label ?? `body ${index + 1}`
    result[`${name} [${index}]`] = index.toString()
    return result
  }, {})

  selectedOrbitPartner = findOrbitPartner(focusedBody)
  orbitInfo.partnerBody = selectedOrbitPartner
    ? particles.indexOf(selectedOrbitPartner).toString()
    : 'none'

  orbitPartnerBinding = orbitSettingsFolder.addBinding(orbitInfo, 'partnerBody', {
    label: 'orbit partner',
    options
  }).on('change', ({value}: {value: string}) => {
    selectedOrbitPartner = particles[Number(value)]
    keplerOrbit = undefined
  })
}

const syncKeplerOrbitForFocus = () => {
  const focusedBody = camera.focusedBody ?? (particles.length === 2 ? particles[1] : undefined)

  if (!focusedBody) {
    orbitInfo.focusedBody = 'none'
    orbitInfo.partnerBody = 'none'
    keplerOrbit = undefined
    orbitFocusedBody = undefined
    selectedOrbitPartner = undefined
    orbitPartnerBinding?.dispose()
    orbitPartnerBinding = undefined
    return
  }

  if (focusedBody && orbitFocusedBody !== focusedBody) {
    setupOrbitPartnerDropdown(focusedBody)
  }

  const partnerBody = focusedBody && selectedOrbitPartner !== focusedBody
    ? selectedOrbitPartner
    : undefined

  if (!partnerBody || GAME_PARAMS.simulationMode === 'numerical') {
    orbitInfo.focusedBody = focusedBody.label ?? 'unnamed'
    keplerOrbit = undefined
    orbitFocusedBody = focusedBody
    return
  }

  const pairChanged = !keplerOrbit || orbitFocusedBody !== focusedBody ||
    ![keplerOrbit.primary, keplerOrbit.secondary].includes(focusedBody) ||
    ![keplerOrbit.primary, keplerOrbit.secondary].includes(partnerBody)
  if (!pairChanged) return

  const primary = focusedBody.mass >= partnerBody.mass ? focusedBody : partnerBody
  const secondary = primary === focusedBody ? partnerBody : focusedBody
  keplerOrbit = new KeplerOrbit(primary, secondary, _game_params.simulationAge)
  orbitFocusedBody = focusedBody
  orbitInfo.focusedBody = focusedBody.label ?? 'unnamed'
  Object.assign(orbitInfo, keplerOrbit.params)
  orbitInfo.period = keplerOrbit.period
}

setupOrbitSettings()

const loopInterval = getIntervalChangableDelay(() => {
  frameRate.tpsgraph.begin()

  for (let i = 0; i < 1; i++) {
    syncKeplerOrbitForFocus()
    const keplerBodies = keplerOrbit ? [keplerOrbit.primary, keplerOrbit.secondary] : []

    let BHRoot: BarnesHutRootType

    if (GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') {
      BHRoot = createBarnesHutTree(particles, getAreaCorners(particles))
    }

    const minSimSpeed: number[] = []

    for (const particle of particles) {
      if (keplerBodies.includes(particle)) continue

      let bodies = particles
      if (GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') bodies = simplifyBodiesForTarget(particle, BHRoot, GAME_PARAMS.barnesHutThreshold) as any

      const simSpeed = bodies.reduce<number[]>((arr, body) => {
        if (particle === body) return arr

        const relativeVelocity = {
          x: particle.velocity.x - body.velocity.x,
          y: particle.velocity.y - body.velocity.y
        }

        const particleRealSpeed = vecMagnitude(relativeVelocity),
          distance = distanceBetweenVec(body.pos, particle.pos)

        const particleSpeed = vecMagnitude({
          x: relativeVelocity.x * _game_params.simulationSpeed,
          y: relativeVelocity.y * _game_params.simulationSpeed
        })

        const gravityRealSpeed2body = vecMagnitude(
          gravityForce2body(particle, body).velocity
        )

        const newParticleSpeed = distance * GAME_PARAMS.minSpeedPerDistanceCoefficient,
          newSimSpeed = Math.floor(newParticleSpeed / particleRealSpeed)

        arr.push(newSimSpeed)
        return arr
      }, [])

      minSimSpeed.push(Math.min(...simSpeed))
    }

    const min = Math.min(...minSimSpeed, GAME_PARAMS.simulationSpeed) || 1

    _game_params.simulationSpeed = min
    keplerOrbit?.update(_game_params.simulationAge + _game_params.simulationSpeed)

    for (const particle of particles) {

      if (keplerBodies.includes(particle)) {
        if (particle === camera.focusedBody) {
          const gravityForces = getAllGravityForces(particle, particles)
          _game_params.camera.focusBodyGravityPoints = getGravityBodies2body(gravityForces, GAME_PARAMS.minCountedGravityVeclocity)
        }
        continue
      }

      let bodies = particles
      if (GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') bodies = simplifyBodiesForTarget(particle, BHRoot, GAME_PARAMS.barnesHutThreshold) as any

      particle.move()

      const gravityForces = getAllGravityForces(particle, bodies)

      if (particle === camera.focusedBody) {
        _game_params.camera.focusBodyGravityPoints = getGravityBodies2body(gravityForces, GAME_PARAMS.minCountedGravityVeclocity)
      }

      gravityForces.forEach(force => {
        if (vecMagnitude(force.velocity) >= GAME_PARAMS.minCountedGravityVeclocity) {
          particle.impulse(force.velocity)
        }
      })
    }

    _game_params.simulationAge += _game_params.simulationSpeed
  }

  frameRate.tpsgraph.end()
})

const renderInterval = getIntervalChangableDelay(() => {
  frameRate.fpsgraph.begin()
  canvasHelper.ctx?.clearRect(0, 0, canvas.width, canvas.height)
  keplerOrbit?.getTrajectories(_game_params.simulationAge).forEach(trajectory => {
    camera.drawTrajectoryEllipse({
      ...trajectory,
      color: trajectory.body === camera.focusedBody ? '#ffffff' : '#888888'
    })
  })
  camera.render({ debug: true })
  camera.canvasHelper.drawCursor()
  frameRate.fpsgraph.end()
})

simulationSettingsFolder.addBinding(GAME_PARAMS, 'tps', { min: 0, max: 1000, step: 1, format: (v: number) => v + ' t/s' }).on('change', ({ last, value }: { last: boolean, value: number }) => last && loopInterval(1000 / value))
simulationSettingsFolder.addBinding(GAME_PARAMS, 'fps', { min: 0, max: 1000, step: 1, format: (v: number) => v + ' t/s' }).on('change', ({ last, value }: { last: boolean, value: number }) => last && renderInterval(1000 / value))

simulationSettingsFolder.addBinding(GAME_PARAMS, 'simulationSpeed', { format: (v: number) => v + ' sec/t' })
simulationSettingsFolder.addBinding(GAME_PARAMS, 'simulationMode', {
  label: 'mode',
  options: {
    Auto: 'auto',
    Numerical: 'numerical',
    Kepler: 'kepler'
  }
}).on('change', () => {
  if (keplerOrbit) {
    keplerOrbit.syncFromState(_game_params.simulationAge)
    orbitInfo.period = keplerOrbit.period
  }
})
simulationSettingsFolder.addBinding(_game_params, 'simulationSpeed', { format: (v: number) => v + ' sec/t', readonly: true, label: '_simulationSpeed' })
simulationSettingsFolder.addBinding(GAME_PARAMS, 'gravity', { format: (value: number) => value.toExponential() })
simulationSettingsFolder.addBinding(GAME_PARAMS, 'AU', { format: (value: number) => value.toExponential() })
simulationSettingsFolder.addBinding(GAME_PARAMS, 'minCountedGravityVeclocity', { format: (value: number) => value.toExponential(), label: 'minGravity' })
simulationSettingsFolder.addBinding(_game_params, 'simulationAge', {
  format: (value: number) => {
    const timeObj = formatTimeInSec(value);
    return [
      [timeObj.years, 'y'],
      [timeObj.days, 'd'],
      [timeObj.hours, 'h'],
      [timeObj.minutes, 'm'],
      [timeObj.seconds, 's']
    ].reduce((str, [value, timeKey]) => str + value.toString().padStart(2, '0') + ' ' + timeKey + ' ', '')
  }, readonly: true
})

cameraSettingsFolder.addBinding(_game_params.camera, 'pos', {
  label: 'pos',
  x: { step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1) },
  y: { step: 1, format: (value: number) => number2MS(value, metricalIMS, 'm', 1) },
  picker: 'inline'
}).on('change', ({ last, value: pos }: { last: boolean, value: Vec }) => {
  if (last) camera.setPos(pos, 'relative')
})
cameraSettingsFolder.addBinding(_game_params.camera, 'scale', { format: (value: number) => number2MS(1 / value * camera.canvasHelper.canvas.width, metricalIMS, 'm', 3) })
  .on('change', ({ last, value }: { last: boolean, value: number }) => {
    if (last) camera.scale = value
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

if (sessionStorage['gameSettings'] !== undefined) pane.importState(JSON.parse(sessionStorage['gameSettings']))

import("./particles-map-solar-system")
  .then((module) => {
    module.default.forEach(particle => particles.push(particle))
    if (sessionStorage['focus-body']) {
      const body = particles.find(particle => particle.label === sessionStorage['focus-body'])
      if (body) camera.focusBody(body)
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
