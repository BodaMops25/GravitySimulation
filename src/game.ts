import { angleBetweenVec, distance, GAME_PARAMS, polar2cartesian, Vec } from "./helpers"
import { Particle } from "./particles"

export function gravityForce(distance: number, mass1: number, mass2: number) {
  return mass1 * mass2 / distance**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulationSpeed
}

export function zeroGravitySpeedDistance(bodyMass: number) {
  return (bodyMass * GAME_PARAMS.gravity * GAME_PARAMS.simulationSpeed)**.5
}

export function applyGravityForce(target: Particle, body: Particle) {

  const force = gravityForce(distance(body.pos, target.pos), target.mass, body.mass),
          angle = angleBetweenVec(target.pos, body.pos),
          velocity = polar2cartesian(force / target.mass, angle)

    target.impulse(velocity)
    return velocity
}

export function gravityForceAll(particle: Particle, particles: Particle[]) {
  const arr = []

  for(const particle2 of particles) {
    if(particle === particle2) continue
    arr.push(
      applyGravityForce(particle, particle2)
    )
  }

  return arr
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