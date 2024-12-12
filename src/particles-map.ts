import { getOrbitalVelocity, minGravitySpeedDistance, setSatellite2Body } from "./game"
import { GAME_PARAMS, randomBetween } from "./helpers"
import { Particle } from "./particles"

const particlesMap: Particle[] = []

const sun = new Particle({
  mass: 2e30,
  color: 'yellow',
  radius: 7e8,
  label: 'sun'
}),
earth = new Particle({
  pos: {x: GAME_PARAMS.AU, y: 0},
  mass: 6e24,
  velocity: {x: 0, y: 30e3},
  color: 'aqua',
  radius: 6.4e6,
  label: 'earth'
}),
mars = new Particle({
  pos: {x: 1.5 * GAME_PARAMS.AU, y: 0},
  mass: 6e23,
  velocity: {x: 0, y: 24e3},
  color: 'darkred',
  radius: 3.3e6,
  label: 'mars'
}),
mercury = new Particle({
  pos: {x: .4 * GAME_PARAMS.AU, y: 0},
  mass: 3e23,
  velocity: {x: 0, y: 47e3},
  color: 'darkgray',
  radius: 2.4e6,
  label: 'mercury'
}),
venus = new Particle({
  pos: {x: .7 * GAME_PARAMS.AU, y: 0},
  mass: 5e24,
  velocity: {x: 0, y: 35e3},
  color: 'white',
  radius: 6e6,
  label: 'venus'
}),
moon = new Particle({
  // pos: {x: GAME_PARAMS.AU - minGravitySpeedDistance(earth.mass)/* 380e6 */, y: 0},
  mass: 7e22,
  // velocity: {x: 0, y: 30e3 + 1000},
  color: 'gray',
  radius: 1.7e6,
  label: 'moon'
})

setSatellite2Body(moon, earth, 380e6, 0)
moon.velocity.y += 1000

particlesMap.push(sun, earth, moon, mars, mercury, venus)

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