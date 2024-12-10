import { distance, GAME_PARAMS } from "./helpers"
import { Particle } from "./particles"
import { Vec } from "./types"

type KeyboardKey = 
    'Space' | 'KeyF'

type KeyboardMap = {
    [key in KeyboardKey]: (event: KeyboardEvent) => void
}

export class KeyboardListener {
    keymap: KeyboardMap
    tweakpane?: any
    camera?: any

    mouse_pos: Vec
    focus_body_request: boolean

    mousemove: boolean
    lastPos: Vec
    anchored: Vec

    isMouseClickTimeout?: number
    mouseClickMaxDelay: number
    mouseClickListeners: ((event: MouseEvent) => void)[]

    middleMouseMultiplier?: Vec
    middleMouseInterval?: number
    middleMouseHoldingFunc?: (multiplier: Vec) => void

    constructor({tweakpane, camera, mouseClickMaxDelay = 300}: {tweakpane?: any, camera?: any, mouseClickMaxDelay?: number}) {
        this.tweakpane = tweakpane
        this.camera = camera
        this.mouse_pos = {x: 0, y: 0}
        this.focus_body_request = false

        this.mousemove = false
        this.lastPos = {x: 0, y: 0}
        this.anchored = {x: 0, y: 0}

        this.mouseClickMaxDelay = mouseClickMaxDelay
        this.mouseClickListeners = []

        document.addEventListener('keypress', (event) => {

            if(event.code in this.keymap) {
                const key = event.code as KeyboardKey
                this.keymap[key](event)

                this.tweakpane?.refresh()
            }
        })

        document.body.addEventListener("wheel", event => {
            if(this.camera) {

                if(event.deltaY > 0) this.camera.scale /= 2
                else if(event.deltaY < 0) this.camera.scale *= 2
            }
        })

        document.body.addEventListener("mousedown", event => {
            this.isMouseClickTimeout = setTimeout(() => {
                this.isMouseClickTimeout = undefined
            }, 300)
            
            if(this.camera && event.shiftKey) {
                if(event.button !== 1) return

                this.mousemove = true

                this.lastPos.x = event.clientX
                this.lastPos.y = event.clientY

                this.anchored = this.camera.getPos('relative')

                document.body.style.cursor = 'grabbing'
            }
        })

        document.body.addEventListener("mouseup", event => {
            if(this.isMouseClickTimeout !== undefined) {
                clearTimeout(this.isMouseClickTimeout)
                this.isMouseClickTimeout = undefined

                this.mouseClickListeners.forEach(callback => callback(event))
            }

            if(this.camera) {
                if(event.button !== 1) return
                this.mousemove = false
                if(document.body.style.cursor === 'grabbing') document.body.style.cursor = ''
            }
        })

        document.addEventListener('mousemove', (event) => {
            this.mouse_pos.x = event.clientX
            this.mouse_pos.y = event.clientY

            if(this.camera) {
                if(this.mousemove === false) return
            
                const delta_x = event.clientX - this.lastPos.x,
                    delta_y = event.clientY - this.lastPos.y

                this.camera.setPos({
                    x: this.anchored.x - delta_x / this.camera.scale,
                    y: this.anchored.y - delta_y / this.camera.scale
                }, 'relative')
            }
        })

        this.mouseClickListeners.push((event) => {
            if(event.button !== 1 || event.shiftKey) return

            if(this.middleMouseMultiplier === undefined) {
                this.middleMouseMultiplier = {x: 0, y: 0}

                this.middleMouseInterval = setInterval(() => {

                    this.middleMouseMultiplier = {
                        x: this.mouse_pos.x - event.clientX,
                        y: this.mouse_pos.y - event.clientY
                    }

                    this.middleMouseHoldingFunc && this.middleMouseHoldingFunc(this.middleMouseMultiplier)
                    
                }, 1000 / GAME_PARAMS.fps)

                document.body.style.cursor = 'move'
            }
            else {
                this.middleMouseMultiplier = undefined
                clearInterval(this.middleMouseInterval)
                document.body.style.cursor = ''
            }
        })

        this.mouseClickListeners.push((event) => {
            if(document.body.style.cursor === 'move') {
                this.middleMouseHoldingFunc = (vec: Vec) => {
                    this.camera.scale *= 1 + -vec.y / 1e4
                }
            }
            else this.middleMouseHoldingFunc = undefined
        })

        this.keymap = {
            'Space': () => {
        
                if(GAME_PARAMS.tps > 0) {
                    sessionStorage['saved_tps'] = GAME_PARAMS.tps
                    GAME_PARAMS.tps = 0
                }
                else {
                    GAME_PARAMS.tps = +sessionStorage['saved_tps']
                }
            },
        
            'KeyF': (event) => {

                const mapMousePos: Vec = this.camera.camera2mapPos(this.mouse_pos),
                    focusBody = this.camera.particles.find((particle: Particle) => {
                        return distance(mapMousePos, particle.pos) <= particle.radius + 1/this.camera.scale * GAME_PARAMS.mapBodyCircleOffset * 2
                    })

                if(focusBody) this.camera.focusBody(focusBody)
                else this.camera.removeFocusBody()
            },
        }
    }
}