import { GAME_PARAMS } from "./helpers"

type KeyboardKey = 
    'Space'

type KeyboardMap = {
    [key in KeyboardKey]: (event: KeyboardEvent) => void
}

export class KeyboardListener {
    keymap: KeyboardMap
    tweakpane?: any

    constructor({keymap, tweakpane}: {keymap: KeyboardMap, tweakpane?: any}) {
        this.keymap = keymap
        this.tweakpane = tweakpane

        document.addEventListener('keypress', (event) => {

            if(event.code in this.keymap) {
                const key = event.code as KeyboardKey
                this.keymap[key](event)

                this.tweakpane?.refresh()
            }
        })
    }
}

const keysData = {
    tmpTPS: 0
}
export const keys: KeyboardMap = {
    'Space': (event: KeyboardEvent) => {

        if(GAME_PARAMS.tps > 0) {
            keysData.tmpTPS = GAME_PARAMS.tps
            GAME_PARAMS.tps = 0
        }
        else {
            GAME_PARAMS.tps = keysData.tmpTPS
        }
    }
}