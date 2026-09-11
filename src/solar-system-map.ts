export type SolarSystemBody = {
  name: string
  mass: number
  radius: number
  displayRadius: number
  color: string
  pos: {x: number, y: number}
  velocity: {x: number, y: number}
}

export function createSolarSystemMap(): SolarSystemBody[] {
  const sun: SolarSystemBody = {
    name: 'Sun', mass: 1.98847e30, radius: 6.957e8, displayRadius: 10,
    color: '#ffd84d', pos: {x: 0, y: 0}, velocity: {x: 0, y: 0}
  }
  const planet = (
    name: string, mass: number, radius: number, distance: number,
    speed: number, color: string, displayRadius: number
  ): SolarSystemBody => ({
    name, mass, radius, displayRadius, color,
    pos: {x: distance, y: 0},
    velocity: {x: 0, y: speed}
  })

  // All bodies begin at 0 degrees: +X position and +Y tangential velocity.
  const mercury = planet('Mercury', 3.3011e23, 2.4397e6, 57.909e9, 47_360, '#9b9187', 3)
  const venus = planet('Venus', 4.8675e24, 6.0518e6, 108.210e9, 35_020, '#e6b86a', 5)
  const mars = planet('Mars', 6.4171e23, 3.3895e6, 227.956e9, 24_077, '#c75b3a', 4)
  const earth = planet('Earth', 5.97237e24, 6.371e6, 149.598e9, 29_780, '#70b7ff', 5)

  const moonDistance = 384.4e6
  const moonSpeed = 1_022
  const moon: SolarSystemBody = {
    name: 'Moon', mass: 7.342e22, radius: 1.7374e6, displayRadius: 3,
    color: '#c9c9c9',
    pos: {x: earth.pos.x + moonDistance, y: 0},
    velocity: {x: 0, y: earth.velocity.y + moonSpeed}
  }

  return [sun, mercury, venus, mars, earth, moon]
}
