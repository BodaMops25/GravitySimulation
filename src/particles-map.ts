import { getOrbitalVelocity, minGravitySpeedDistance, setSatellite2Body } from "./game"
import { GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"

const particlesMap: Particle[] = []

const earth = new Particle({
  pos: { x: GAME_PARAMS.AU, y: 0 },
  mass: 6e24,
  velocity: { x: 0, y: 30e3 },
  color: 'aqua',
  radius: 6.4e6,
  label: 'earth'
}),
  moon = new Particle({
    mass: 7e22,
    color: 'gray',
    radius: 1.7e6,
    label: 'moon'
  })

setSatellite2Body(moon, earth, 380e6, 0)
moon.velocity.y += 1000

particlesMap.push(earth, moon)

// for(let i = 0; i < 200; i++) {
//   const p = new Particle({
//     pos: {x: randomBetween(-255e9, 255e9), y: randomBetween(-1e10, 1e10)},
//     mass: 1e20,
//     color: 'purple',
//     radius: 1e3
//   })

//   p.velocity = getOrbitalVelocity(p, sun)

//   const tmp = .05
//   p.velocity.x *= randomBetween(1-tmp, 1+tmp) 
//   p.velocity.y *= randomBetween(1-tmp, 1+tmp)

//   particlesMap.push(p)
// }

// for(let i = 1; i < 10; i++) {
//   const p = new Particle({
//     mass: 1e6,
//     radius: 1e3,
//     color: 'blue',
//     label: 'earth_sattelites_extras_' + i
//   })

//   setSatellite2Body(p, earth, i/18 * minGravitySpeedDistance(earth.mass), 90, true)
//   particlesMap.push(p)
// }

// for(let i = 0; i < 3; i++) {
//   const p = new Particle({
//     mass: 1e6,
//     radius: 1e3,
//     color: 'red',
//     label: 'earth_sattelites3_extras_' + i
//   })

//   setSatellite2Body(p, earth, 380e6, 360/3*i+60, true)
//   particlesMap.push(p)
// }

export default particlesMap