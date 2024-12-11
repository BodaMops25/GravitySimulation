import { angleBetweenVec, distance, GAME_PARAMS, polar2cartesian, vecMagnitude } from "./helpers"
import { Particle } from "./particles"
import { Vec } from "./types"

export function gravityForce(distance: number, mass1: number, mass2: number) {
  return mass1 * mass2 / distance**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulationSpeed
}

export function minGravitySpeedDistance(bodyMass: number) {
  return (bodyMass * (1/GAME_PARAMS.minCountedGravityVeclocity) * GAME_PARAMS.gravity)**.5
}

export function gravityForce2body(target: Particle, body: Particle) {

  const range = distance(body.pos, target.pos),
        force = gravityForce(range, target.mass, body.mass),
        angle = angleBetweenVec(target.pos, body.pos),
        velocity = polar2cartesian({magnitude: force / target.mass, angle})

    return {distance: range, force, angle, velocity, target, body}
}

export function getAllGravityForces(particle: Particle, particles: Particle[]) {
  const arr = []
  for(const particle2 of particles) {
    if(particle === particle2) continue
    arr.push(
      gravityForce2body(particle, particle2)
    )
  }
  return arr
}

export function getGravityBodies2body(gravityPoinst: {angle: number, velocity: Vec, target: Particle, body: Particle}[], minGravitySpeed = 1) {
  return gravityPoinst.reduce<{angle: number, magnitude: number, target: Particle, body: Particle}[]>((arr, force) => {
    const magnitude = vecMagnitude(force.velocity) / GAME_PARAMS.simulationSpeed
    if(magnitude > minGravitySpeed) arr.push({
      angle: force.angle,
      magnitude,
      target: force.target,
      body: force.body
    })
    return arr
  }, [])
}

export function isBodyOnOrbit(target: Particle, body: Particle, particles: Particle[]) {
  const forces = getAllGravityForces(target, particles),
        orbitBody = getGravityBodies2body(forces, GAME_PARAMS.minCountedGravityVeclocity).find(force => force.body === body)
  return orbitBody ? true : false
}

export function getAllOrbitBodies(target: Particle, particles: Particle[]) {
  const forces = getAllGravityForces(target, particles)
  return getGravityBodies2body(forces, GAME_PARAMS.minCountedGravityVeclocity).map(force => force.body)
}

export function getOrbitalVelocity(target: Particle, gravityBody: Particle, isAnticlockwise?: boolean) {
  const r = distance(gravityBody.pos, target.pos),
        speed = (GAME_PARAMS.gravity * gravityBody.mass / r)**.5,
        angle = angleBetweenVec(target.pos, gravityBody.pos),
        velocity = polar2cartesian({magnitude: speed, angle: angle + (isAnticlockwise ? Math.PI/2 : -Math.PI/2)})

  return velocity
}

export function setSatellite2Body(target: Particle, body: Particle, height: number, angle: number, isOrbital?: boolean, isAntyclockwise?: boolean) {
  const pos = polar2cartesian({magnitude: height, angle: angle/180*Math.PI})

  target.pos.x = body.pos.x + pos.x
  target.pos.y = body.pos.y + pos.y

  target.velocity.x = body.velocity.x
  target.velocity.y = body.velocity.y

  if(isOrbital) {
    const orbitalVelocity = getOrbitalVelocity(target, body, isAntyclockwise)
    target.velocity.x = body.velocity.x + orbitalVelocity.x
    target.velocity.y = body.velocity.y + orbitalVelocity.y
  }
}

window.zeroGravitySpeedDistance = minGravitySpeedDistance