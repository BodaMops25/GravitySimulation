export const GAME_PARAMS = {
  tps: 70,
  fps: 70,
  simulationSpeed: 3600 * 6,
  focusBody: 'none',
  cameraCoords: {x: 0, y: 0},
  cameraScale: 5e-10,

  GRAVITY_CONST: 6.7e-11,
  AU: 150e9
}

export const metricalIMS = [
  {exp: -6, mark: 'mk'},
  {exp: -3, mark: 'm'},
  {exp: 0, mark: 'm'},
  {exp: 3, mark: 'k'},
  {exp: 6, mark: 'M'},
  {exp: 9, mark: 'G'},
]

// ---- MATH ----

export function randomBetween(min, max) {
  return min + Math.random()*(max-min)
}

export function degToRad(deg) {return deg/180 * Math.PI}
export function radToDeg(rad) {return rad/Math.PI * 180}

export function vecsModule(vec2, vec1) {
  return ((vec2.x - vec1.x)**2 + (vec2.y - vec1.y)**2)**.5
}

export function number2MS(number, marks, zeroMark, digits) {
  const isNegative = number < 0

  if(isNegative) number *= -1

  if(number < 10**marks[0].exp) return (isNegative ? '-' : '') + (number / 10**marks[0].exp).toFixed(digits) + ' ' + marks[0].mark + zeroMark
  else if(number > 10**marks[marks.length-1].exp) return (isNegative ? '-' : '') + (number / 10**marks[marks.length-1].exp).toFixed(digits) + ' ' + marks[marks.length-1].mark + zeroMark

  for(let i = 0; i < marks.length-1; i++) {
    const {exp, mark} = marks[i],
          {exp: exp2} = marks[i+1]

    if(10**exp <= number && number < 10**exp2) return (isNegative ? '-' : '') + (number / 10**exp).toFixed(digits) + ' ' + mark + (exp !== 0 ? zeroMark : '')
  }
}