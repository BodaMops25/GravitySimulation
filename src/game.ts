import { distance, GAME_PARAMS } from "./helpers"
import { Particle } from "./particles"

export function gravityForce(particle: Particle, particles: Particle[]) {
  particles.forEach(particle2 => {
    if(particle === particle2) return

    const r = distance(particle2.pos, particle.pos),
          force = particle.mass * particle2.mass / r**2 * GAME_PARAMS.gravity * GAME_PARAMS.simulation_speed,
          angle = Math.atan2(particle2.pos.x - particle.pos.x, particle2.pos.y - particle.pos.y),
          velocity = {
            x: Math.sin(angle) * force,
            y: Math.cos(angle) * force
          }

    particle.impulse(velocity)
  })
}