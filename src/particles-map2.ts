import { getOrbitalVelocity, minGravitySpeedDistance, setSatellite2Body } from "./game"
import { GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"

const particlesMap: Particle[] = []

particlesMap.push(new Particle({
  pos: {x: 0, y: 0},
  mass: 1e6,
  radius: 1e3,
  color: 'yellow'
}))

particlesMap.push(new Particle({
  mass: 1,
  radius: 10,
  color: 'aqua'
}))

setSatellite2Body(
  particlesMap[1],
  particlesMap[0],
  1e4, 0, true
)

// particlesMap[1].pos.y -= particlesMap[1].velocity.y * GAME_PARAMS.simulationSpeed

export default particlesMap