export const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tick_speed: 65 || 120
}

export function randomBetween(min, max) {
  return (max - min) * Math.random() + min
}

export function distance(pos2, pos) {
  return ((pos2.x - pos.x)**2 + (pos2.y - pos.y)**2)**.5
}

export function CanvasHelper(canvas) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')

  this.drawBall = ({x = 0, y = 0} = {}, scale = 50, color = '#fff') => {
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.arc(x, y, scale, 0, Math.PI*2)
    this.ctx.fill()
  }
  
  this.drawVector = ({x = 0, y = 0} = {}, {x: to_x = 50, y: to_y = 50} = {}, scale = 10, color = '#fff', mode = 'absolute') => {
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
  
  this.drawCursor = () => {
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