import { angleBetweenVec, distance, GAME_PARAMS, polar2cartesian, Vec, vecMagnitude } from "./helpers"
import { Particle } from "./particles"

export function gravityForce(distance: number, mass1: number, mass2: number) {
  return mass1 * mass2 / distance**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulationSpeed
}

export function zeroGravitySpeedDistance(bodyMass: number) {
  return (bodyMass * GAME_PARAMS.gravity * GAME_PARAMS.simulationSpeed)**.5
}

export function gravityForce2body(target: Particle, body: Particle) {

  const force = gravityForce(distance(body.pos, target.pos), target.mass, body.mass),
          angle = angleBetweenVec(target.pos, body.pos),
          velocity = polar2cartesian(force / target.mass, angle)

    return {force, angle, velocity, target, body}
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
  return gravityPoinst.reduce<{angle: number, distance: number, target: Particle, body: Particle}[]>((arr, force) => {
    const distance = vecMagnitude(force.velocity) / GAME_PARAMS.simulationSpeed
    if(distance > minGravitySpeed) arr.push({
      angle: force.angle,
      distance: distance,
      target: force.target,
      body: force.body
    })
    return arr
  }, [])
}

export function isBodyOnOrbit(target: Particle, body: Particle, particles: Particle[]) {
  const forces = getAllGravityForces(target, particles),
        orbitBody = getGravityBodies2body(forces, 1e-3).find(force => force.body === body)
  return orbitBody ? true : false
}

export function getAllOrbitBodies(target: Particle, particles: Particle[]) {
  const forces = getAllGravityForces(target, particles)
  return getGravityBodies2body(forces, 1e-3).map(force => force.body)
}

export function getOrbitalVelocity(target: Particle, gravityBody: Particle, isAnticlockwise?: boolean) {
  const r = distance(gravityBody.pos, target.pos),
        speed = (GAME_PARAMS.gravity * gravityBody.mass / r)**.5,
        angle = angleBetweenVec(target.pos, gravityBody.pos),
        velocity = polar2cartesian(speed, angle + (isAnticlockwise ? Math.PI/2 : -Math.PI/2))

  return velocity
}

export function setSatellite2Body(target: Particle, body: Particle, height: number, angle: number, isOrbital?: boolean) {
  const pos = polar2cartesian(height, angle/180*Math.PI)

  target.pos.x = body.pos.x + pos.x
  target.pos.y = body.pos.y + pos.y

  if(isOrbital) {
    const orbitalVelocity = getOrbitalVelocity(target, body)
    target.velocity.x = body.velocity.x + orbitalVelocity.x
    target.velocity.y = body.velocity.y + orbitalVelocity.y
  }
}