import { createBarnesHutTree, simplifyBodiesForTarget } from "./barnes-hun"
import { getAllGravityForces, getGravityBodies2body, minGravitySpeedDistance } from "./game"
import { _game_params, CanvasHelper, distance, GAME_PARAMS, metricalIMS, number2avarageGroup, number2MS, vecMagnitude } from "./helpers"
import { KeyboardListener } from "./hotkeys"
import { Particle } from "./particles"
import { CanvasColor, PolarVec, Vec } from "./types"

type CameraConstructor = {
  particles: Particle[],
  pos?: Vec,
  scale?: number,
  focusedBody?: Particle,
  canvasHelper: CanvasHelper,
  tweakpane?: any,
  keyboardHandler?: KeyboardListener,
  bodyVelocityPanes?: {
    number?: any
    graph?: any
  }
}

export type CanvasSize = {
  value: number,
  status: 'original' | 'minSize'
}

export class Camera {

  _pos: Vec
  scale: number
  particles: Particle[]
  canvasHelper: CanvasHelper
  tweakpane?: any
  keyboardHandler?: KeyboardListener
  bodyVelocityPanes?: {
    number?: any
    graph?: any
  }
  focusedBody?: Particle
  mousemove: boolean
  lastPos: Vec
  anchored: Vec

  constructor({particles, pos = {x: 0, y: 0}, scale = 1, focusedBody, canvasHelper, tweakpane, keyboardHandler, bodyVelocityPanes}: CameraConstructor) {
    
    this._pos = {...pos}

    this.scale = scale
    this.particles = particles
    this.canvasHelper = canvasHelper
    this.tweakpane = tweakpane
    this.keyboardHandler = keyboardHandler
    this.bodyVelocityPanes = bodyVelocityPanes
    this.focusedBody = focusedBody

    this.mousemove = false
    this.lastPos = {x: 0, y: 0}
    this.anchored = {x: 0, y: 0}

    document.body.addEventListener("wheel", event => {
      if(event.deltaY > 0) this.scale /= 2
      else if(event.deltaY < 0) this.scale *= 2
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

  map2CameraSize = (number: number, minSize?: number) => {
    const size: CanvasSize = {value: this.scale * number, status: 'original'}
    if(minSize && size.value < minSize) {
      size.value = minSize
      size.status = 'minSize'
    }
    return size
  }

  map2CameraPos = (pos: Vec) => {
    const cameraPos = this.getPos('absolute')
    return {
      x: (pos.x - cameraPos.x) * this.scale + this.canvasHelper.canvas.width / 2,
      y: (pos.y - cameraPos.y) * this.scale + this.canvasHelper.canvas.height / 2
    }
  }

  // center, center
  camera2mapPos = (pos: Vec) => {
    const cameraPos = this.getPos('absolute')
    return {
      x: (pos.x - this.canvasHelper.canvas.width / 2) / this.scale + cameraPos.x,
      y: (pos.y - this.canvasHelper.canvas.height / 2) / this.scale + cameraPos.y,
    }
  }

  isObjectInCamera = ({pos, size = 0, context}: {pos: Vec, size: number, context: 'canvas' | 'map'}) => {

    let canvasPos: Vec, canvasSize: number

    switch (context) {
      case 'canvas':
        canvasPos = {...pos}
        canvasSize = size
        break;
      case 'map':
        canvasPos = this.map2CameraPos(pos),
        canvasSize = this.map2CameraSize(size).value
        break;
    }

    if(
      (canvasPos.x + canvasSize < 0 || this.canvasHelper.canvas.width < canvasPos.x - canvasSize) ||
      (canvasPos.y + canvasSize < 0 || this.canvasHelper.canvas.height < canvasPos.y - canvasSize)
    ) return false

    return true
  }

  drawRadialGradient = (pos: Vec, radius: number, hexColor: string, func: (x: number) => number, steps?: number) => {
    const canvasPos = this.map2CameraPos(pos),
          size = this.map2CameraSize(radius).value

    const gradient = this.canvasHelper.nonLinearGradient({
      pos1: canvasPos, r: 0,
      pos2: canvasPos, R: size,
      hexColor,
      opacityFunction: func,
      shape: 'radial',
      steps
    })
    this.canvasHelper.drawBall({pos: canvasPos, scale: size, color: gradient})
  }

  drawVector = ({
    pos,
    posTo,
    size,
    color,
    mode,
    textStart,
    textEnd
  }: {
    pos: Vec,
    posTo: Vec,
    size: {size: number, minSize?: number},
    color?: CanvasColor,
    mode?: 'relative' | 'absolute',
    textStart?: {
      size: number,
      color?: CanvasColor,
      pos?: Vec,
      string: string
    },
    textEnd?: {
      size: number,
      color?: CanvasColor,
      pos?: Vec,
      string: string
    },
  }) => {

    const cnvsPos = this.map2CameraPos(pos),
          cnvsPosTo = this.map2CameraPos(mode === 'relative' ? {x: pos.x + posTo.x, y: pos.y + posTo.y} : posTo),
          dist = distance(cnvsPosTo, cnvsPos)

    this.canvasHelper.drawVector({
      pos: cnvsPos,
      posTo: cnvsPosTo,
      size: this.map2CameraSize(size.size, size.minSize).value,
      arrowSize: dist > 5 ? 5 : dist,
      color,
      textStart: textStart !== undefined ? {
        size: this.map2CameraSize(textStart.size).value,
        string: textStart.string,
        color: textStart.color,
        pos: textStart.pos !== undefined ? {
          x: this.map2CameraSize(textStart.pos.x).value,
          y: this.map2CameraSize(textStart.pos.y).value,
        } : undefined
      } : undefined,
      textEnd: textEnd !== undefined ? {
        size: this.map2CameraSize(textEnd.size).value,
        string: textEnd.string,
        color: textEnd.color,
        pos: textEnd.pos !== undefined ? {
          x: this.map2CameraSize(textEnd.pos.x).value,
          y: this.map2CameraSize(textEnd.pos.y).value,
        } : undefined
      } : undefined,
      mode: 'absolute'
    })
  }

  drawBody = (particle: Particle) => {

    const pos = this.map2CameraPos(particle.pos),
          scale = this.map2CameraSize(particle.radius, GAME_PARAMS.mapBodyMinSize)

    if(!this.isObjectInCamera({
      pos,
      size: scale.value + GAME_PARAMS.mapBodyCircleOffset,
      context: 'canvas'
    })) return false
    
    this.canvasHelper.drawBall({
      pos, 
      scale: scale.value,
      color: particle.color,
    })

    if(scale.status === 'minSize') {
      this.canvasHelper.drawBall({
        pos,
        scale: scale.value + GAME_PARAMS.mapBodyCircleOffset,
        strokeScale: 1,
        strokeColor: '#fff'
      })
    }

    return {
      pos,
      size: scale.value + GAME_PARAMS.mapBodyCircleOffset
    }
  }

  focusBody = (particle: Particle) => {
    this.focusedBody = particle
    this.setPos({x: 0, y: 0}, 'relative')
    if(this.bodyVelocityPanes?.number) {
      this.bodyVelocityPanes.number.hidden = false
    }
    if(this.bodyVelocityPanes?.graph) {
      this.bodyVelocityPanes.graph.hidden = false
    }

    sessionStorage['focus-body'] = particle.label

    let bodies = this.particles

    if(GAME_PARAMS.gravityAlgorithmType === 'barnes-hut') {
      const BHRoot = createBarnesHutTree(this.particles)
      bodies = simplifyBodiesForTarget(this.focusedBody, BHRoot, GAME_PARAMS.barnesHutThreshold) as any
    }

    const forces = getAllGravityForces(this.focusedBody, bodies)
    _game_params.camera.focusBodyGravityPoints = getGravityBodies2body(forces, GAME_PARAMS.minCountedGravityVeclocity)
  }
  
  removeFocusBody = () => {
    const coords = this.getPos('absolute')
    this.focusedBody = undefined
    this.setPos(coords, 'absolute')
    _game_params.camera.focusBodyVelocity = 0

    if(this.bodyVelocityPanes?.number) {
      this.bodyVelocityPanes.number.hidden = true
    }
    if(this.bodyVelocityPanes?.graph) {
      this.bodyVelocityPanes.graph.hidden = true
    }

    sessionStorage['focus-body'] = undefined
  }

  render = ({debug}: {debug?: boolean} = {}) => {

    for(const particle of this.particles) {

      const particleDrawn = this.drawBody(particle)

      if(this.keyboardHandler) {
        if(this.keyboardHandler.focus_body_request && particleDrawn) {
          if(
            distance(this.keyboardHandler.mouse_pos, particleDrawn.pos) < particleDrawn.size
          ) {
            this.focusBody(particle)
            this.keyboardHandler.focus_body_request = false
          }
        }
      }

      if(debug) {

        if(particleDrawn) {
          const realVelocity = {
            x: particle.velocity.x * GAME_PARAMS.simulationSpeed,
            y: particle.velocity.y * GAME_PARAMS.simulationSpeed
          }
  
          if(particle !== this.focusedBody) this.drawVector({
            pos: particle.pos,
            posTo: realVelocity,
            size: {size: 1, minSize: 2},
            color: '#fff',
            mode: 'relative'
          })
          else {

            const speed = vecMagnitude(particle.velocity),
                  bodyCnvsPos = this.map2CameraPos(particle.pos),
                  gravityDistance = minGravitySpeedDistance(this.focusedBody.mass),
                  cnvsGravityDistance = this.map2CameraSize(gravityDistance)

            this.drawVector({
              pos: particle.pos,
              posTo: realVelocity,
              size: {size: 1, minSize: 2},
              color: '#fff',
              mode: 'relative',
              textEnd: { 
                size: 20 / this.scale,
                string: speed.toFixed() + ' m/t',
                color: '#fff',
                pos: {x: 8 / this.scale, y: -8 / this.scale}
              }
            })

            this.drawRadialGradient(
              particle.pos,
              gravityDistance,
              '#ffffff',
              x => x**.25, 128
            )

            this.canvasHelper.drawBall({
              pos: bodyCnvsPos,
              scale: cnvsGravityDistance.value,
              strokeScale: 1,
              strokeColor: '#fff'
            })

            if(_game_params.camera.focusBodyGravityPoints.length > 0) {

              const gravityPoints = _game_params.camera.focusBodyGravityPoints.sort((a, b) => a.angle - b.angle)
              
              const groups = number2avarageGroup(gravityPoints.map(item => item.angle), Math.PI/16)
              const polarVelocities2display = groups.map((group) => {
                if(typeof group === 'number') {
                  return gravityPoints.find(point => point.angle === group)
                }

                const sumPolVec = group.reduce((vec, angle) => {
                  const polarVelocity = gravityPoints.find(point => point.angle === angle)
                  if(polarVelocity) {
                    vec.magnitude += polarVelocity.magnitude
                    vec.angle += polarVelocity.angle
                  }
                  return vec
                }, {magnitude: 0, angle: 0})

                sumPolVec.angle /= group.length

                return sumPolVec
              }) as PolarVec[]

              for(const velocity of polarVelocities2display) {

                this.drawVector({
                  pos: particle.pos, 
                  posTo: {
                    x: Math.cos(velocity.angle) * 100 / this.scale,
                    y: Math.sin(velocity.angle) * 100 / this.scale
                  },
                  size: {size: 1, minSize: 1},
                  color: '#fff',
                  mode: 'relative',
                  textEnd: { 
                    size: 20 / this.scale,
                    string: number2MS(velocity.magnitude, metricalIMS, 'm') + '/t',
                    color: '#fff',
                    pos: {x: 8 / this.scale, y: -8 / this.scale}
                  }
                })
              }
            }
          }
        }
      }
    }

    if(this.keyboardHandler?.focus_body_request) {
      this.removeFocusBody()
      this.keyboardHandler.focus_body_request = false
    }

    _game_params.camera.pos = this.getPos('relative')
    _game_params.camera.scale = this.scale
    if(this.focusedBody) _game_params.camera.focusBodyVelocity = vecMagnitude(this.focusedBody.velocity)

    this.tweakpane?.refresh()
  }
}