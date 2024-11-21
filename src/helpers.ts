export const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tps: 65,
  fps: 65,
  gravityAlgorithmType: 'all', // 'all', 'barnes-hut'
  barnesHutThreshold: 1 // working only with gravityAlgorithmType: 'barnes-hut', less value == more comparison => less performance
}

export const _game_params = {
  camera: {
    pos: {
      x: 0,
      y: 0
    },
    focusBodyVelocity: 0,
    scale: 1
  }
}

export const metricalIMS = [
  {exp: -6, mark: 'mk'},
  {exp: -3, mark: 'm'},
  {exp: 0, mark: 'm'},
  {exp: 3, mark: 'k'},
  {exp: 6, mark: 'M'},
  {exp: 9, mark: 'G'},
]

export function number2MS(number: number, marks: {exp: number, mark: string}[], zeroMark: string, digits: number) {
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

export function getIntervalChangableDelay(callback: (...params: any[]) => void, ...params: any[]) {
  let interval: number | undefined = undefined

  return function(newDelay: number) {
    if(interval !== undefined) clearInterval(interval)
    if(newDelay > 0 && newDelay < Infinity) interval = setInterval(callback, newDelay, ...params)
  }
}

export function randomBetween(min: number, max: number) {
  return (max - min) * Math.random() + min
}

export function randomId(length: number) {
  let id = ''
  for(let i = 0; i < length; i++) id += String.fromCharCode(Math.round(randomBetween(65, 123)))
  return id
}

export function vecMagnitude(vec: Vec) {
  return (vec.x**2 + vec.y**2)**.5
}

export function distance(pos2: Vec, pos: Vec) {
  return ((pos2.x - pos.x)**2 + (pos2.y - pos.y)**2)**.5
}

export class CanvasHelper {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  drawBall = ({x, y}: Vec, scale: number = 50, color: string = '#fff') => {
    if(!this.ctx) {
      console.warn('No canvas context2D!')
      return
    }

    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.arc(x, y, scale, 0, Math.PI*2)
    this.ctx.fill()
  }
  
  drawVector = ({x, y}: Vec, {x: to_x, y: to_y}: Vec, scale = 10, color = '#fff', mode?: 'relative') => {
    if(!this.ctx) {
      console.warn('No canvas context2D!')
      return
    }

    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = scale
    this.ctx.moveTo(x, y)
  
    const to = {
      x: to_x,
      y: to_y
    }
  
    if(mode === 'relative') {
      to.x = x + to_x
      to.y = y + to_y
    }
  
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
    this.ctx.beginPath()
    this.drawBall(to, scale * 1.5, color)
  }
  
  drawCursor = () => {
    if(!this.ctx) {
      console.warn('No canvas context2D!')
      return
    }

    const hh = this.canvas.width / 2,
          vh = this.canvas.height / 2,
          radius = 5
  
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 1
  
    this.ctx.beginPath()
    this.ctx.moveTo(hh - radius, vh)
    this.ctx.lineTo(hh + radius, vh)
    this.ctx.stroke()
  
    this.ctx.beginPath()
    this.ctx.moveTo(hh, vh - radius)
    this.ctx.lineTo(hh, vh + radius)
    this.ctx.stroke()
  }
}

export type Vec = {
  x: number,
  y: number
} 