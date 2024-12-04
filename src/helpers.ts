export const GAME_PARAMS = {
  simulationSpeed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tps: 65,
  fps: 65,
  gravityAlgorithmType: 'all', // 'all', 'barnes-hut'
  barnesHutThreshold: 1, // working only with gravityAlgorithmType: 'barnes-hut', less value == more comparison => less performance
  mapBodyMinSize: 3,
  mapBodyCircleOffset: 2,
}

window.GAME_PARAMS = GAME_PARAMS

export const _game_params: {
  camera: {
    pos: {
      x: number,
      y: number
    },
    focusBodyVelocity: number,
    focusBodyGravityPoints: Vec[],
    scale: number
  }
} = {
  camera: {
    pos: {
      x: 0,
      y: 0
    },
    focusBodyVelocity: 0,
    focusBodyGravityPoints: [],
    scale: 9e-10
  },
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

  const func = function(newDelay: number) {
    if(interval !== undefined) clearInterval(interval)
    if(newDelay === Infinity) newDelay = 0
    if(newDelay > 0) interval = setInterval(callback, newDelay, ...params)
  }

  return func
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

export function angleBetweenVec(vec2: Vec, vec1: Vec) {
  return Math.atan2(vec2.y - vec1.y, vec2.x - vec1.x)
}

export function polar2cartesian(magninude: number, angle: number): Vec {
  return {
    x: Math.cos(angle) * magninude,
    y: Math.sin(angle) * magninude
  }
}

export class CanvasHelper {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
  }

  nonLinearGradient = ({
    pos1, r,
    pos2, R,
    hexColor,
    opacityFunction,
    steps = 16,
    shape = 'linear'
  }: {
    pos1: Vec,
    r?: number,
    pos2: Vec,
    R?: number,
    hexColor: string,
    opacityFunction: (x: number) => number,
    steps?: number,
    shape?: 'linear' | 'radial'
  }) => {
    if(!this.ctx) return

    let gradient: CanvasGradient

    if(shape === 'linear') gradient = this.ctx.createLinearGradient(pos1.x, pos1.y, pos2.x, pos2.y);
    else if(shape === 'radial') {
      if(r === undefined || R === undefined) {
        console.error('no inner radius or outer radius param')
        return
      }
      gradient = this.ctx.createRadialGradient(pos1.x, pos1.y, r, pos2.x, pos2.y, R);
    }
    else {
      console.error('invalid gradient shape')
        return
    }

    for (let i = 0; i <= steps; i++) {
      const position = i / steps, // Linear position [0, 1]
            opacity = opacityFunction(position), // Apply f(x) to determine opacity
            opacityAsHex = (opacity > 1 ? 0 : opacity < 0 ? 255 : Math.round(255 - opacity*255)).toString(16).padStart(2, '0')

      gradient.addColorStop(position, hexColor + opacityAsHex);
    }

    return gradient;
  }

  drawBall = ({
    pos: {x, y},
    scale,
    color,
    strokeScale,
    strokeColor
  }: {
    pos: Vec,
    scale: number,
    color?: string | CanvasGradient | CanvasPattern,
    strokeScale?: number,
    strokeColor?: string | CanvasGradient | CanvasPattern
  }) => {
    if(!this.ctx) {
      console.warn('No canvas context2D!')
      return
    }

    this.ctx.beginPath()
    this.ctx.arc(x, y, scale, 0, Math.PI*2)

    if(color) {
      this.ctx.fillStyle = color
      this.ctx.fill()
    }

    if(strokeScale || strokeColor) {
      this.ctx.lineWidth = strokeScale || scale / 10
      this.ctx.strokeStyle = strokeColor || '#000'
      this.ctx.stroke()
    }
  }
  
  drawVector = ({
    pos: {x, y},
    posTo: {x: to_x, y: to_y},
    size = 10,
    color = '#fff',
    mode ='relative',
    text
  }: {
    pos: Vec,
    posTo: Vec,
    size?: number,
    color?: string | CanvasGradient | CanvasPattern,
    mode?: 'relative' | 'absolute'
    text?: {
      size: number,
      color?: string | CanvasGradient | CanvasPattern,
      pos?: Vec,
      string: string
    }
  }) => {
    if(!this.ctx) {
      console.warn('No canvas context2D!')
      return
    }

    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = size
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
    
    const arrowAngle = Math.atan2(to.x - x, to.y - y),
          arrowAngleSharpness = .72,
          arrowLengthMultiplier = 6

    this.ctx.moveTo(
      to.x - size * arrowLengthMultiplier * Math.sin(arrowAngle + arrowAngleSharpness),
      to.y - size * arrowLengthMultiplier * Math.cos(arrowAngle + arrowAngleSharpness)
    )

    this.ctx.lineTo(to.x, to.y)

    this.ctx.lineTo(
      to.x - size * arrowLengthMultiplier * Math.sin(arrowAngle - arrowAngleSharpness),
      to.y - size * arrowLengthMultiplier * Math.cos(arrowAngle - arrowAngleSharpness)
    )

    this.ctx.stroke()

    if(text) {
      if(text.color) this.ctx.fillStyle = text.color
      this.ctx.font = text.size + 'px sans-serif'

      text.string.split('/n').forEach((line, i) => {
        this.ctx?.fillText(line, to.x + (text.pos?.x ?? 0), to.y + (text.pos?.y ?? 0) + text.size*i)
      })
    }
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

export function findPaneChildByLable(paneObj: any, label: string, deep = 0) {
  if(deep > 1000) {
    console.warn('Too much recursion!')
    return
  }
  if(paneObj.label === label) return paneObj

  for(const child of paneObj.children) {
    if(child.label === label) return child
    else return findPaneChildByLable(child, label)
  }
}