import { setSatellite2Body } from "./game"
import { Particle } from "./particles"

const particlesMap: Particle[] = []

particlesMap.push(new Particle({
  pos: {x: -10e3, y: 0},
  mass: 1e12,
  velocity: {x: 0, y: -.042},
  radius: 1e3,
  color: 'yellow',
  label: 'sun1'
}))

particlesMap.push(new Particle({
  pos: {x: 10e3, y: 0},
  mass: 1e12,
  velocity: {x: 0, y: .042},
  radius: 1e3,
  color: 'yellow',
  label: 'sun2'
}))

// setSatellite2Body(
//   particlesMap[1],
//   particlesMap[0],
//   20e3, 0, true
// )
particlesMap.push(new Particle({
  pos: {x: 0, y: 0},
  mass: 1,
  velocity: {x: -1e-2, y: 1e-2},
  radius: 10,
  color: 'aqua',
  label: 'earth'
}))

export default particlesMap