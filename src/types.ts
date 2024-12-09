export type Vec = {x: number, y: number}
export type PolarVec = {angle: number, magnitude: number}

export type _game_params_type = {
  camera: {
    pos: Vec,
    focusBodyVelocity: number,
    focusBodyGravityPoints: PolarVec[],
    scale: number
  }
}

export type PhisMarks = {exp: number, mark: string}

export type CanvasColor = string | CanvasGradient | CanvasPattern