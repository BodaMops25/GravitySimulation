import { setSatellite2Body } from "./game"
import { Particle } from "./particles"

const particlesMap: Particle[] = []

particlesMap.push(new Particle({
  pos: {x: 0, y: 0},
  mass: 1e12,
  velocity: {x: 0, y: 0},
  radius: 1e3,
  color: 'yellow',
  label: 'sun'
}))

particlesMap.push(new Particle({
  pos: {x: 1e4, y: 0},
  mass: 1,
  velocity: {x: -1e-3, y: .5e-3},
  radius: 10,
  color: 'aqua',
  label: 'earth'
}))

particlesMap.push(new Particle({
  // pos: {x: 1e4, y: 0},
  mass: 1,
  // velocity: {x: -1e-3, y: .5e-3},
  radius: 10,
  color: 'aqua',
  label: 'earth2'
}))

setSatellite2Body(
  particlesMap[1],
  particlesMap[0],
  1e4, 0, true
)

setSatellite2Body(
  particlesMap[2],
  particlesMap[0],
  1e4, 180, true
)

export default particlesMap