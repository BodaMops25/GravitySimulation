import { _game_params, CanvasHelper, GAME_PARAMS, Vec, vecMagnitude } from "./helpers"
import { Particle } from "./particles"

type CameraConstructor = {
  particles: Particle[],
  pos?: Vec,
  scale?: number,
  focusedBody?: Particle,
  canvasHelper: CanvasHelper,
  tweakpane?: any
}

export class Camera {

  _pos: Vec
  scale: number
  particles: Particle[]
  canvasHelper: CanvasHelper
  tweakpane?: any
  focusedBody?: Particle
  mousemove: boolean
  lastPos: Vec
  anchored: Vec

  constructor({particles, pos = {x: 0, y: 0}, scale = 1, focusedBody, canvasHelper, tweakpane}: CameraConstructor) {
    
    this._pos = {...pos}

    this.scale = scale
    this.particles = particles
    this.canvasHelper = canvasHelper
    this.tweakpane = tweakpane
    this.focusedBody = focusedBody

    this.mousemove = false
    this.lastPos = {x: 0, y: 0}
    this.anchored = {x: 0, y: 0}

    document.body.addEventListener("wheel", event => {
      if(event.deltaY > 0) this.scale /= 2
      else if(event.deltaY < 0) this.scale *= 2
  
      sessionStorage['camera_scale'] = this.scale
    })
  
    document.body.addEventListener("mousedown", event => {
      if(event.button !== 1) return

      this.mousemove = true
  
      this.lastPos.x = event.clientX
      this.lastPos.y = event.clientY

      this.anchored = this.getPos('relative')
    })
  
    document.body.addEventListener("mousemove", event => {
      if(this.mousemove === false) return
      
      const delta_x = event.clientX - this.lastPos.x,
            delta_y = event.clientY - this.lastPos.y

      this.setPos({
        x: this.anchored.x - delta_x / this.scale,
        y: this.anchored.y - delta_y / this.scale
      }, 'relative')
    })

    document.body.addEventListener("mouseup", event => {
      if(event.button !== 1) return

      this.mousemove = false

      // sessionStorage['camera_pos'] = JSON.stringify(this.pos)
    })
  }

  getPos = (type: 'absolute' | 'relative'): Vec => {
    switch (true) {
      case type === 'absolute' && !this.focusedBody:
      case type === 'relative' && !this.focusedBody:
      case type === 'relative' && this.focusedBody !== undefined:
        return {...this._pos}

      case type === 'absolute' && this.focusedBody !== undefined:
        return {
          x: this.focusedBody.pos.x + this._pos.x,
          y: this.focusedBody.pos.y + this._pos.y
        }
        
      default:
        console.warn('Must set type absolute or relative')
        return {x: 0, y: 0}
    }
  }

  setPos = (pos: Vec, type: 'absolute' | 'relative') => {
    switch (true) {
      case type === 'absolute' && !this.focusedBody:
      case type === 'relative' && !this.focusedBody:
      case type === 'relative' && this.focusedBody !== undefined:
        this._pos = {...pos}
        return type

      case type === 'absolute' && this.focusedBody !== undefined:
        this._pos.x = pos.x - this.focusedBody.pos.x
        this._pos.y = pos.y - this.focusedBody.pos.y
        return type
    
      default:
        console.warn('Must set type absolute or relative')
        return {x: 0, y: 0}
    }
  }

  map2CameraPos = (pos: Vec) => {
    const cameraPos = this.getPos('absolute')
    return {
      x: (pos.x - cameraPos.x) * this.scale + this.canvasHelper.canvas.width / 2,
      y: (pos.y - cameraPos.y) * this.scale + this.canvasHelper.canvas.height / 2
    }
  }

  focusBody = (particle: Particle) => {
    this.focusedBody = particle
    this.setPos({x: 0, y: 0}, 'relative')
  }
  
  removeFocusBody = () => {
    const coords = this.getPos('absolute')
    this.focusedBody = undefined
    this.setPos(coords, 'absolute')
    _game_params.camera.focusBodyVelocity = 0
  }

  render = ({debug}: {debug?: boolean} = {}) => {

    for(const particle of this.particles) {

      const pos = this.map2CameraPos(particle.pos),
            velocity = this.map2CameraPos({
              x: particle.pos.x + particle.velocity.x * GAME_PARAMS.simulation_speed,
              y: particle.pos.y + particle.velocity.y * GAME_PARAMS.simulation_speed
            }),
            scale = particle.radius * this.scale

      this.canvasHelper.drawBall(pos, scale < 5 ? 5 : scale, particle.color)

      if(debug) this.canvasHelper.drawVector(pos, velocity, 2, '#000')
    }

    _game_params.camera.pos = this.getPos('relative')
    _game_params.camera.scale = this.scale
    if(this.focusedBody) _game_params.camera.focusBodyVelocity = vecMagnitude(this.focusedBody.velocity)

    this.tweakpane?.refresh()
  }
}