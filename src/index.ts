import {Pane} from 'tweakpane'
import * as TweakpaneEssentials from '@tweakpane/plugin-essentials'
import {GpuGravity} from './gpu-gravity'
import {createSolarSystemMap} from './solar-system-map'

type Vec = {x: number, y: number}
type Body = {name?: string, mass: number, radius: number, displayRadius?: number, color: string, pos: Vec, velocity: Vec}

const G = 6.67430e-11
const canvas = document.querySelector<HTMLCanvasElement>('#main-frame')
const paneContainer = document.querySelector<HTMLElement>('#pane-settings-container')
if (!canvas) throw new Error('Canvas #main-frame was not found')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D canvas context is unavailable')

const pane = new Pane({title: 'N-body simulation', container: paneContainer ?? undefined})
pane.registerPlugin(TweakpaneEssentials)

const performanceStats = {averagePhysicsMs: 0, gravityBackend: 'checking', gpuBatching: 'off'}
const gpuSettings = {backend: 'auto' as 'auto' | 'cpu' | 'webgpu', minimumBodies: 256, maxBatchSteps: 128}
const performanceFolder = pane.addFolder({title: 'Performance'})
const fpsGraph = performanceFolder.addBlade({view: 'fpsgraph', label: 'FPS'}) as any
performanceFolder.addBinding(performanceStats, 'averagePhysicsMs', {
  label: 'avg physics', view: 'graph', readonly: true, min: 0, max: 100,
  format: (value: number) => `${value.toFixed(4)} ms`
})
performanceFolder.addBinding(gpuSettings, 'backend', {
  label: 'gravity backend',
  options: {Auto: 'auto', CPU: 'cpu', WebGPU: 'webgpu'}
})
performanceFolder.addBinding(gpuSettings, 'minimumBodies', {label: 'GPU threshold', step: 1})
performanceFolder.addBinding(gpuSettings, 'maxBatchSteps', {label: 'max batch steps', step: 1})
performanceFolder.addBinding(performanceStats, 'gravityBackend', {label: 'using', readonly: true})
performanceFolder.addBinding(performanceStats, 'gpuBatching', {label: 'GPU batching', readonly: true})

const timing = {
  realTimeElapsed: 0,
  simulationTimeElapsed: 0,
  physicsDt: 0.05,
  effectivePhysicsDt: 0.05,
  timeSpeed: 1,
  paused: false,
  forcedSmallerDt: false,
  dtLimitReason: 'none'
}
const precisionSettings = {
  adaptiveDt: true,
  minimumDt: 0.0001,
  gravityStepFraction: 0.02,
  maxTravelFraction: 0.05,
  maxAngleDegrees: 2
}
const collisionSettings = {
  enabled: true,
  restitution: 0.9,
  correctionPercent: 0.8
}
const orbitSettings = {
  mapPreset: 'generated' as 'generated' | 'solar-system',
  bodyCount: 2,
  largeMass: 1e14,
  smallMass: 1e11,
  separation: 140,
  pixelsPerMeter: 2,
  tailLength: 800,
  tailSampleInterval: 0.1,
  maxTailedBodies: 20
}
const bodies: Body[] = []
let gpuGravity: GpuGravity | null = null
let cachedAccelerations: Vec[] | null = null
const camera = {pos: {x: 0, y: 0}, focusedBodyIndex: -1}
const cameraInfo = {focused: 'none'}
const mousePosition = {x: innerWidth / 2, y: innerHeight / 2}

let accumulator = 0
let lastTime = performance.now()
let tailSampleAccumulator = 0
const bodyTails: Vec[][] = []

function resetOrbit() {
  camera.focusedBodyIndex = -1
  camera.pos = {x: 0, y: 0}
  cameraInfo.focused = 'none'
  if (orbitSettings.mapPreset === 'solar-system') {
    bodies.splice(0, bodies.length, ...createSolarSystemMap())
    orbitSettings.bodyCount = bodies.length
    timing.simulationTimeElapsed = 0
    accumulator = 0
    tailSampleAccumulator = 0
    cachedAccelerations = null
    bodyTails.length = Math.min(bodies.length, orbitSettings.maxTailedBodies)
    for (let i = 0; i < bodyTails.length; i++) bodyTails[i] = [{...bodies[i].pos}]
    return
  }

  const count = Math.max(2, Math.round(orbitSettings.bodyCount))
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  bodies.length = 0
  bodies.push({name: 'Central body', mass: orbitSettings.largeMass, radius: 18, color: '#f6c85f', pos: {x: 0, y: 0}, velocity: {x: 0, y: 0}})

  for (let i = 1; i < count; i++) {
    const distance = orbitSettings.separation * Math.sqrt(i)
    const angle = i === 1 ? 0 : i * goldenAngle
    const orbitalSpeed = Math.sqrt(G * orbitSettings.largeMass / distance)
    bodies.push({
      name: `Body ${i + 1}`,
      mass: orbitSettings.smallMass,
      radius: count > 100 ? 2 : 6,
      color: `hsl(${(i * 137.5) % 360} 75% 65%)`,
      pos: {x: Math.cos(angle) * distance, y: Math.sin(angle) * distance},
      velocity: {x: -Math.sin(angle) * orbitalSpeed, y: Math.cos(angle) * orbitalSpeed}
    })
  }

  // Remove net momentum and place the total center of mass at the canvas center.
  const totalMass = bodies.reduce((sum, body) => sum + body.mass, 0)
  const centerOfMass = bodies.reduce((sum, body) => ({
    x: sum.x + body.pos.x * body.mass / totalMass,
    y: sum.y + body.pos.y * body.mass / totalMass
  }), {x: 0, y: 0})
  const centerVelocity = bodies.reduce((sum, body) => ({
    x: sum.x + body.velocity.x * body.mass / totalMass,
    y: sum.y + body.velocity.y * body.mass / totalMass
  }), {x: 0, y: 0})
  bodies.forEach(body => {
    body.pos.x -= centerOfMass.x
    body.pos.y -= centerOfMass.y
    body.velocity.x -= centerVelocity.x
    body.velocity.y -= centerVelocity.y
  })

  timing.simulationTimeElapsed = 0
  accumulator = 0
  tailSampleAccumulator = 0
  bodyTails.length = Math.min(bodies.length, orbitSettings.maxTailedBodies)
  for (let i = 0; i < bodyTails.length; i++) bodyTails[i] = [{...bodies[i].pos}]
  cachedAccelerations = null
}

function setBodyCount(count: number) {
  orbitSettings.bodyCount = Math.max(2, Math.round(count))
  resetOrbit()
}

function accelerationsCpu(): Vec[] {
  const result = bodies.map(() => ({x: 0, y: 0}))
  for (let i = 0; i < bodies.length - 1; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].pos.x - bodies[i].pos.x
      const dy = bodies[j].pos.y - bodies[i].pos.y
      const distanceSquared = dx * dx + dy * dy + 1
      const inverseDistanceCubed = 1 / (distanceSquared * Math.sqrt(distanceSquared))
      result[i].x += G * bodies[j].mass * dx * inverseDistanceCubed
      result[i].y += G * bodies[j].mass * dy * inverseDistanceCubed
      result[j].x -= G * bodies[i].mass * dx * inverseDistanceCubed
      result[j].y -= G * bodies[i].mass * dy * inverseDistanceCubed
    }
  }
  return result
}

function shouldUseGpu() {
  return gpuSettings.backend === 'webgpu' ||
    (gpuSettings.backend === 'auto' && bodies.length >= gpuSettings.minimumBodies)
}

async function accelerations(): Promise<Vec[]> {
  const useGpu = shouldUseGpu()
  if (useGpu && gpuGravity) {
    try {
      performanceStats.gravityBackend = 'WebGPU'
      return await gpuGravity.calculate(bodies)
    } catch (error) {
      console.warn('WebGPU gravity failed; switching to CPU.', error)
      gpuGravity = null
    }
  }
  performanceStats.gravityBackend = useGpu && !gpuGravity
    ? 'CPU (WebGPU unavailable)'
    : 'CPU'
  return accelerationsCpu()
}

function resolveCollisions() {
  for (let i = 0; i < bodies.length - 1; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const first = bodies[i]
      const second = bodies[j]
      const dx = second.pos.x - first.pos.x
      const dy = second.pos.y - first.pos.y
      const distance = Math.hypot(dx, dy)
      const collisionDistance = first.radius + second.radius
      if (distance >= collisionDistance) continue

      // Use a deterministic normal if two centers happen to be exactly equal.
      const normalX = distance > 1e-9 ? dx / distance : 1
      const normalY = distance > 1e-9 ? dy / distance : 0
      const inverseMassFirst = 1 / first.mass
      const inverseMassSecond = 1 / second.mass
      const inverseMassSum = inverseMassFirst + inverseMassSecond
      const overlap = collisionDistance - distance
      const correction = overlap * collisionSettings.correctionPercent / inverseMassSum

      first.pos.x -= normalX * correction * inverseMassFirst
      first.pos.y -= normalY * correction * inverseMassFirst
      second.pos.x += normalX * correction * inverseMassSecond
      second.pos.y += normalY * correction * inverseMassSecond

      const relativeVelocityX = second.velocity.x - first.velocity.x
      const relativeVelocityY = second.velocity.y - first.velocity.y
      const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY
      if (velocityAlongNormal >= 0) continue

      const impulseMagnitude = -(1 + collisionSettings.restitution) * velocityAlongNormal / inverseMassSum
      const impulseX = impulseMagnitude * normalX
      const impulseY = impulseMagnitude * normalY
      first.velocity.x -= impulseX * inverseMassFirst
      first.velocity.y -= impulseY * inverseMassFirst
      second.velocity.x += impulseX * inverseMassSecond
      second.velocity.y += impulseY * inverseMassSecond
    }
  }
}

function getEffectivePhysicsDt(requestedDt: number) {
  if (!precisionSettings.adaptiveDt) return {dt: requestedDt, reason: 'none'}

  let result = {dt: requestedDt, reason: 'none'}
  for (let i = 0; i < bodies.length - 1; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const relativePos = {x: bodies[j].pos.x - bodies[i].pos.x, y: bodies[j].pos.y - bodies[i].pos.y}
      const relativeVelocity = {x: bodies[j].velocity.x - bodies[i].velocity.x, y: bodies[j].velocity.y - bodies[i].velocity.y}
      const distance = Math.max(1e-9, Math.hypot(relativePos.x, relativePos.y))
      const relativeSpeed = Math.hypot(relativeVelocity.x, relativeVelocity.y)
      const mu = G * (bodies[i].mass + bodies[j].mass)
      const gravityDt = precisionSettings.gravityStepFraction * Math.sqrt(distance ** 3 / mu)
      const speedDt = relativeSpeed > 0 ? precisionSettings.maxTravelFraction * distance / relativeSpeed : Infinity
      if (gravityDt < result.dt) result = {dt: gravityDt, reason: 'close gravity'}
      if (speedDt < result.dt) result = {dt: speedDt, reason: 'relative speed'}

      const radialAccelerationScale = -mu / distance ** 3
      const predictedPos = {
        x: relativePos.x + relativeVelocity.x * result.dt + relativePos.x * radialAccelerationScale * result.dt ** 2 / 2,
        y: relativePos.y + relativeVelocity.y * result.dt + relativePos.y * radialAccelerationScale * result.dt ** 2 / 2
      }
      const predictedDistance = Math.max(1e-9, Math.hypot(predictedPos.x, predictedPos.y))
      const cosine = Math.max(-1, Math.min(1,
        (relativePos.x * predictedPos.x + relativePos.y * predictedPos.y) / (distance * predictedDistance)
      ))
      const sweptAngle = Math.acos(cosine)
      const maxAngle = precisionSettings.maxAngleDegrees * Math.PI / 180
      if (maxAngle > 0 && sweptAngle > maxAngle) {
        result = {dt: result.dt * maxAngle / sweptAngle, reason: 'orbit angle'}
      }
    }
  }

  result.dt = Math.min(requestedDt, Math.max(precisionSettings.minimumDt, result.dt))
  return result
}

// A fixed-step velocity-Verlet integrator is substantially more stable than Euler for orbits.
async function doPhysics(deltaTime: number) {
  // The acceleration calculated at the end of the previous Verlet step is
  // also the acceleration at the beginning of this one. Reusing it halves
  // GPU submissions and readbacks after the first step.
  const before = cachedAccelerations ?? await accelerations()
  bodies.forEach((body, index) => {
    body.velocity.x += before[index].x * deltaTime / 2
    body.velocity.y += before[index].y * deltaTime / 2
    body.pos.x += body.velocity.x * deltaTime
    body.pos.y += body.velocity.y * deltaTime
  })
  if (collisionSettings.enabled) resolveCollisions()
  const after = await accelerations()
  bodies.forEach((body, index) => {
    body.velocity.x += after[index].x * deltaTime / 2
    body.velocity.y += after[index].y * deltaTime / 2
  })
  cachedAccelerations = after
}

function resizeCanvas() {
  const pixelRatio = devicePixelRatio || 1
  canvas.width = Math.round(innerWidth * pixelRatio)
  canvas.height = Math.round(innerHeight * pixelRatio)
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function mapToCanvas(pos: Vec): Vec {
  const center = getCameraCenter()
  const scale = Math.max(1e-30, Math.abs(orbitSettings.pixelsPerMeter))
  return {x: innerWidth / 2 + (pos.x - center.x) * scale, y: innerHeight / 2 + (pos.y - center.y) * scale}
}

function getCameraCenter(): Vec {
  const focusedBody = bodies[camera.focusedBodyIndex]
  return focusedBody
    ? {x: focusedBody.pos.x + camera.pos.x, y: focusedBody.pos.y + camera.pos.y}
    : {...camera.pos}
}

function setCameraCenter(center: Vec) {
  const focusedBody = bodies[camera.focusedBodyIndex]
  camera.pos = focusedBody
    ? {x: center.x - focusedBody.pos.x, y: center.y - focusedBody.pos.y}
    : {...center}
}

function canvasToMap(pos: Vec): Vec {
  const center = getCameraCenter()
  const scale = Math.max(1e-30, Math.abs(orbitSettings.pixelsPerMeter))
  return {x: center.x + (pos.x - innerWidth / 2) / scale, y: center.y + (pos.y - innerHeight / 2) / scale}
}

function focusNearestBody() {
  let nearestIndex = -1
  let nearestDistance = 10
  bodies.forEach((body, index) => {
    const screenPos = mapToCanvas(body.pos)
    const distance = Math.hypot(screenPos.x - mousePosition.x, screenPos.y - mousePosition.y)
    if (distance <= nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  if (nearestIndex < 0) return
  camera.focusedBodyIndex = nearestIndex
  camera.pos = {x: 0, y: 0}
  cameraInfo.focused = bodies[nearestIndex].name ?? `Body ${nearestIndex + 1}`
}

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight)
  bodyTails.forEach((tail, bodyIndex) => {
    if (tail.length < 2) return
    ctx.save()
    ctx.globalAlpha = 0.65
    ctx.strokeStyle = bodies[bodyIndex].color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    tail.forEach((point, pointIndex) => {
      const canvasPoint = mapToCanvas(point)
      if (pointIndex === 0) ctx.moveTo(canvasPoint.x, canvasPoint.y)
      else ctx.lineTo(canvasPoint.x, canvasPoint.y)
    })
    ctx.stroke()
    ctx.restore()
  })

  bodies.forEach(body => {
    const pos = mapToCanvas(body.pos)
    ctx.fillStyle = body.color
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, body.displayRadius ?? Math.max(3, body.radius * Math.abs(orbitSettings.pixelsPerMeter)), 0, Math.PI * 2)
    ctx.fill()
  })
}

const timeFolder = pane.addFolder({title: 'Time'})
timeFolder.addBinding(timing, 'realTimeElapsed', {label: 'real elapsed', readonly: true, format: (v: number) => `${v.toFixed(2)} s`})
timeFolder.addBinding(timing, 'simulationTimeElapsed', {label: 'simulation elapsed', readonly: true, format: (v: number) => `${v.toFixed(2)} s`})
timeFolder.addBinding(timing, 'physicsDt', {label: 'physics dt', format: (v: number) => `${v.toPrecision(4)} s`})
timeFolder.addBinding(timing, 'effectivePhysicsDt', {label: 'effective dt', readonly: true, format: (v: number) => `${v.toFixed(4)} s`})
timeFolder.addBinding(timing, 'forcedSmallerDt', {label: 'dt forced smaller', readonly: true})
timeFolder.addBinding(timing, 'dtLimitReason', {label: 'dt limit', readonly: true})
timeFolder.addBinding(timing, 'timeSpeed', {label: 'time speed', format: (v: number) => `${v.toPrecision(4)}x`})
timeFolder.addButton({title: 'Pause / resume'}).on('click', () => {
  timing.paused = !timing.paused
  accumulator = 0
})
timeFolder.addBinding(timing, 'paused', {readonly: true})

const precisionFolder = pane.addFolder({title: 'Physics precision'})
precisionFolder.addBinding(precisionSettings, 'adaptiveDt', {label: 'adaptive dt'})
precisionFolder.addBinding(precisionSettings, 'minimumDt', {label: 'minimum dt', step: 0.00001})
precisionFolder.addBinding(precisionSettings, 'gravityStepFraction', {label: 'gravity fraction', step: 0.001})
precisionFolder.addBinding(precisionSettings, 'maxTravelFraction', {label: 'max travel / dist', step: 0.001})
precisionFolder.addBinding(precisionSettings, 'maxAngleDegrees', {label: 'max angle', step: 0.1, format: (v: number) => `${v.toFixed(1)} deg`})

const collisionFolder = pane.addFolder({title: 'Collisions'})
collisionFolder.addBinding(collisionSettings, 'enabled')
collisionFolder.addBinding(collisionSettings, 'restitution', {label: 'bounciness', step: 0.01})
collisionFolder.addBinding(collisionSettings, 'correctionPercent', {label: 'separation correction', step: 0.05})

const orbitFolder = pane.addFolder({title: 'Bodies and orbit'})
orbitFolder.addBinding(orbitSettings, 'mapPreset', {
  label: 'map', options: {Generated: 'generated', 'Solar system': 'solar-system'}
}).on('change', resetOrbit)
orbitFolder.addBinding(orbitSettings, 'bodyCount', {label: 'body count', step: 1})
orbitFolder.addBinding(orbitSettings, 'largeMass', {label: 'large mass', format: (v: number) => v.toExponential(3)})
orbitFolder.addBinding(orbitSettings, 'smallMass', {label: 'small mass', format: (v: number) => v.toExponential(3)})
orbitFolder.addBinding(orbitSettings, 'separation', {step: 1, format: (v: number) => `${v.toFixed(0)} m`})
orbitFolder.addBinding(orbitSettings, 'pixelsPerMeter', {label: 'view scale', format: (v: number) => v.toExponential(2)})
orbitFolder.addBinding(orbitSettings, 'tailLength', {label: 'tail points', step: 10})
orbitFolder.addBinding(orbitSettings, 'tailSampleInterval', {label: 'tail sample', step: 0.01, format: (v: number) => `${v.toFixed(2)} s`})
orbitFolder.addBinding(orbitSettings, 'maxTailedBodies', {label: 'bodies with tails', step: 1})
orbitFolder.addButton({title: 'Generate bodies / reset'}).on('click', () => setBodyCount(orbitSettings.bodyCount))

const cameraFolder = pane.addFolder({title: 'Camera'})
cameraFolder.addBinding(cameraInfo, 'focused', {readonly: true})
cameraFolder.addButton({title: 'Remove focus'}).on('click', () => {
  const center = getCameraCenter()
  camera.focusedBodyIndex = -1
  camera.pos = center
  cameraInfo.focused = 'none'
})

const paneStorageKey = 'gravity-simulation-pane'
const savePaneSettings = () => localStorage.setItem(paneStorageKey, JSON.stringify(pane.exportState()))
const savedPaneSettings = localStorage.getItem(paneStorageKey)
if (savedPaneSettings) {
  try { pane.importState(JSON.parse(savedPaneSettings)) }
  catch { localStorage.removeItem(paneStorageKey) }
}
pane.on('change', savePaneSettings)
addEventListener('pagehide', savePaneSettings)

let isPanning = false
let previousPointer = {x: 0, y: 0}
canvas.addEventListener('pointermove', event => {
  mousePosition.x = event.clientX
  mousePosition.y = event.clientY
  if (!isPanning) return
  const scale = Math.max(1e-30, Math.abs(orbitSettings.pixelsPerMeter))
  const center = getCameraCenter()
  setCameraCenter({
    x: center.x - (event.clientX - previousPointer.x) / scale,
    y: center.y - (event.clientY - previousPointer.y) / scale
  })
  previousPointer = {x: event.clientX, y: event.clientY}
})
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 1 || !event.shiftKey) return
  event.preventDefault()
  isPanning = true
  previousPointer = {x: event.clientX, y: event.clientY}
  canvas.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointerup', event => {
  if (event.button === 1) isPanning = false
})
canvas.addEventListener('pointercancel', () => { isPanning = false })
canvas.addEventListener('auxclick', event => {
  if (event.button === 1) event.preventDefault()
})
canvas.addEventListener('wheel', event => {
  event.preventDefault()
  const worldBefore = canvasToMap({x: event.clientX, y: event.clientY})
  const oldCenter = getCameraCenter()
  const oldScale = Math.max(1e-30, Math.abs(orbitSettings.pixelsPerMeter))
  orbitSettings.pixelsPerMeter = oldScale * Math.exp(-event.deltaY * 0.0015)
  const worldAfter = canvasToMap({x: event.clientX, y: event.clientY})
  setCameraCenter({
    x: oldCenter.x + worldBefore.x - worldAfter.x,
    y: oldCenter.y + worldBefore.y - worldAfter.y
  })
}, {passive: false})
addEventListener('keydown', event => {
  const target = event.target as HTMLElement | null
  if (target?.matches('input, textarea, select') || target?.isContentEditable) return
  if (event.key.toLowerCase() === 'f') focusNearestBody()
})

function recordTail(elapsedSimulationTime: number) {
  tailSampleAccumulator += elapsedSimulationTime
  if (tailSampleAccumulator < orbitSettings.tailSampleInterval) return
  bodyTails.forEach((tail, index) => {
    tail.push({...bodies[index].pos})
    const overflow = tail.length - orbitSettings.tailLength
    if (overflow > 0) tail.splice(0, overflow)
  })
  tailSampleAccumulator %= orbitSettings.tailSampleInterval
}

async function frame(now: number) {
  fpsGraph.begin()
  const realTimeDt = Math.max(0, (now - lastTime) / 1000)
  lastTime = now
  timing.realTimeElapsed += realTimeDt
  if (!timing.paused) {
    accumulator += Math.min(realTimeDt, 0.25) * timing.timeSpeed
    let physicsDuration = 0
    let physicsSteps = 0
    let usedBatch = false

    if (gpuGravity && shouldUseGpu() && !precisionSettings.adaptiveDt && !collisionSettings.enabled) {
      const batchSteps = Math.min(gpuSettings.maxBatchSteps, Math.floor(accumulator / timing.physicsDt))
      timing.effectivePhysicsDt = timing.physicsDt
      timing.forcedSmallerDt = false
      timing.dtLimitReason = 'none'
      performanceStats.gpuBatching = batchSteps > 1 ? `${batchSteps} steps` : 'ready'
      usedBatch = true
      if (batchSteps > 0) {
        const physicsStart = performance.now()
        try {
          await gpuGravity.integrate(bodies, timing.physicsDt, batchSteps)
          physicsDuration = performance.now() - physicsStart
          physicsSteps = batchSteps
          const simulatedTime = batchSteps * timing.physicsDt
          timing.simulationTimeElapsed += simulatedTime
          accumulator -= simulatedTime
          cachedAccelerations = null
          recordTail(simulatedTime)
          performanceStats.gravityBackend = 'WebGPU batched'
        } catch (error) {
          console.warn('Batched WebGPU integration failed; switching to CPU.', error)
          gpuGravity = null
          usedBatch = false
        }
      }
    } else {
      performanceStats.gpuBatching = shouldUseGpu()
        ? 'disable adaptive dt + collisions'
        : 'off'
    }

    while (!usedBatch) {
      const effectiveStep = getEffectivePhysicsDt(timing.physicsDt)
      timing.effectivePhysicsDt = effectiveStep.dt
      timing.forcedSmallerDt = effectiveStep.dt < timing.physicsDt * (1 - 1e-9)
      timing.dtLimitReason = timing.forcedSmallerDt ? effectiveStep.reason : 'none'
      if (accumulator < effectiveStep.dt) break

      const physicsStart = performance.now()
      await doPhysics(effectiveStep.dt)
      physicsDuration += performance.now() - physicsStart
      timing.simulationTimeElapsed += effectiveStep.dt
      accumulator -= effectiveStep.dt
      physicsSteps++

      recordTail(effectiveStep.dt)
    }
    if (physicsSteps > 0) {
      const averageThisFrame = physicsDuration / physicsSteps
      performanceStats.averagePhysicsMs = performanceStats.averagePhysicsMs === 0
        ? averageThisFrame
        : performanceStats.averagePhysicsMs * 0.9 + averageThisFrame * 0.1
    }
  }
  render()
  pane.refresh()
  fpsGraph.end()
  requestAnimationFrame(frame)
}

resizeCanvas()
resetOrbit()
addEventListener('resize', resizeCanvas)

async function start() {
  gpuGravity = await GpuGravity.create(G)
  performanceStats.gravityBackend = gpuGravity ? 'WebGPU ready' : 'CPU (WebGPU unavailable)'
  requestAnimationFrame(frame)
}

start()
