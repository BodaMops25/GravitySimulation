import { angleBetweenVec, distance, GAME_PARAMS, polar2cartesian } from "./helpers"
import { Particle } from "./particles"

export function gravityForce(particle: Particle, particle2: Particle) {
  if(particle === particle2) return

  const r = distance(particle2.pos, particle.pos),
          force = particle.mass * particle2.mass / r**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulation_speed,
          angle = angleBetweenVec(particle2.pos, particle.pos) /* Math.atan2(particle2.pos.x - particle.pos.x, particle2.pos.y - particle.pos.y) */,
          velocity = polar2cartesian(force / particle.mass, angle)

    particle.impulse(velocity)
}

export function gravityForceAll(particle: Particle, particles: Particle[]) {
  particles.forEach(particle2 => gravityForce(particle, particle2))
}

export function getOrbitalVelocity(target: Particle, gravityBody: Particle) {
  const r = distance(gravityBody.pos, target.pos),
        speed = (GAME_PARAMS.gravity * gravityBody.mass / r)**.5,
        angle = angleBetweenVec(gravityBody.pos, target.pos),
        velocity = polar2cartesian(speed, angle)

  console.log(speed, angle/Math.PI*180)

  return velocity
}

window.getOrbitalVelocity = getOrbitalVelocity