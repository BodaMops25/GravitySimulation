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
  pos: {x: 1e4, y: 0},
  mass: 1,
  velocity: {x: -1e-4, y: .125e-4},
  radius: 10,
  color: 'aqua'
}))

export default particlesMap