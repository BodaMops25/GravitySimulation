import { GAME_PARAMS } from "./helpers"
import { Vec } from "./types"

type KeyboardKey = 
    'Space' | 'KeyF'

type KeyboardMap = {
    [key in KeyboardKey]: (event: KeyboardEvent) => void
}

export class KeyboardListener {
    keymap: KeyboardMap
    tweakpane?: any

    mouse_pos: Vec
    focus_body_request: boolean

    constructor({tweakpane}: {tweakpane?: any}) {
        this.tweakpane = tweakpane
        this.mouse_pos = {x: 0, y: 0}
        this.focus_body_request = false

        document.addEventListener('keypress', (event) => {

            if(event.code in this.keymap) {
                const key = event.code as KeyboardKey
                this.keymap[key](event)

                this.tweakpane?.refresh()
            }
        })

        document.addEventListener('mousemove', (event) => {

            this.mouse_pos.x = event.clientX
            this.mouse_pos.y = event.clientY
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
        
            'KeyF': (event) => this.focus_body_request = true,
        }
    }
}