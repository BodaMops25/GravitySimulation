export const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tick_speed: 65 || 120
}

export function randomBetween(min: number, max: number) {
  return (max - min) * Math.random() + min
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