export const GAME_PARAMS = {
  simulation_speed: 3600 * 6,
  gravity: 6.674 * 1e-11,
  AU: 150e9,
  tick_speed: 120
}

export function randomBetween(min, max) {
  return (max - min) * Math.random() + min
}

export function distance(pos2, pos) {
  return ((x2 - x)**2 + (y2 - y)**2)**.5
}

export function CanvasHelper(canvas) {
  this.canvas = canvas
  this.ctx = canvas.getContext('2d')

  this.drawBall = ({x = 0, y = 0} = {}, scale = 50, color = '#fff') => {
    context.beginPath()
    context.fillStyle = color
    context.arc(x, y, scale, 0, Math.PI*2)
    context.fill()
  }
  
  this.drawVector = ({x = 0, y = 0} = {}, {to_x = 50, to_y = 50} = {}, scale = 10, color = '#fff', mode = 'absolute') => {
    context.beginPath()
    context.fillStyle = color
    context.strokeStyle = color
    context.lineWidth = scale
    context.moveTo(x, y)
  
    const to = {
      x: to_x,
      y: to_y
    }
  
    if(mode === 'relative') {
      to.x = x + to_x
      to.y = y + to_y
    }
  
    context.lineTo(to.x, to.y)
    context.stroke()
    context.beginPath()
    drawBall(to.x, to.y, scale * 1.2, color)
  }
  
  this.drawCursor = () => {
    const hh = this.canvas.width / 2,
          vh = this.canvas.height / 2,
          radius = 5
  
    context.strokeStyle = '#fff'
    context.lineWidth = 1
  
    context.beginPath()
    context.moveTo(hh - radius, vh)
    context.lineTo(hh + radius, vh)
    context.stroke()
  
    context.beginPath()
    context.moveTo(hh, vh - radius)
    context.lineTo(hh, vh + radius)
    context.stroke()
  }
}