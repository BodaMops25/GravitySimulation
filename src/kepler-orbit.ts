import { GAME_PARAMS } from "./helpers"
import { Particle } from "./particles"
import { Vec } from "./types"

export type KeplerOrbitParams = {
  periapsis: number
  apoapsis: number
  orientation: number
  phase: number
  clockwise: boolean
}

const normalizeAngle = (angle: number) => {
  const circle = Math.PI * 2
  return ((angle % circle) + circle) % circle
}

const rotate = (vec: Vec, angle: number): Vec => ({
  x: vec.x * Math.cos(angle) - vec.y * Math.sin(angle),
  y: vec.x * Math.sin(angle) + vec.y * Math.cos(angle)
})

export class KeplerOrbit {
  primary: Particle
  secondary: Particle
  params: KeplerOrbitParams
  epoch = 0
  centerPos: Vec = {x: 0, y: 0}
  centerVelocity: Vec = {x: 0, y: 0}

  constructor(primary: Particle, secondary: Particle, epoch = 0) {
    this.primary = primary
    this.secondary = secondary
    this.params = this.paramsFromState()
    this.resetEpoch(epoch)
  }

  private paramsFromState = (): KeplerOrbitParams => {
    const relativePos = {
      x: this.secondary.pos.x - this.primary.pos.x,
      y: this.secondary.pos.y - this.primary.pos.y
    }
    const relativeVelocity = {
      x: this.secondary.velocity.x - this.primary.velocity.x,
      y: this.secondary.velocity.y - this.primary.velocity.y
    }
    const distance = Math.hypot(relativePos.x, relativePos.y)
    const speedSquared = relativeVelocity.x ** 2 + relativeVelocity.y ** 2
    const mu = GAME_PARAMS.gravity * (this.primary.mass + this.secondary.mass)
    const energy = speedSquared / 2 - mu / distance
    const semiMajorAxis = energy < 0 ? -mu / (2 * energy) : distance
    const dot = relativePos.x * relativeVelocity.x + relativePos.y * relativeVelocity.y
    const eccentricityVector = {
      x: ((speedSquared - mu / distance) * relativePos.x - dot * relativeVelocity.x) / mu,
      y: ((speedSquared - mu / distance) * relativePos.y - dot * relativeVelocity.y) / mu
    }
    const eccentricity = Math.min(.999999, Math.hypot(eccentricityVector.x, eccentricityVector.y))
    const orientation = eccentricity > 1e-8
      ? Math.atan2(eccentricityVector.y, eccentricityVector.x)
      : Math.atan2(relativePos.y, relativePos.x)
    const localPos = rotate(relativePos, -orientation)
    const cosE = Math.max(-1, Math.min(1, localPos.x / semiMajorAxis + eccentricity))
    const sinE = localPos.y / (semiMajorAxis * Math.sqrt(1 - eccentricity ** 2))
    const eccentricAnomaly = Math.atan2(sinE, cosE)
    const meanAnomaly = normalizeAngle(eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly))
    const angularMomentum = relativePos.x * relativeVelocity.y - relativePos.y * relativeVelocity.x

    return {
      periapsis: semiMajorAxis * (1 - eccentricity),
      apoapsis: semiMajorAxis * (1 + eccentricity),
      orientation: orientation * 180 / Math.PI,
      phase: meanAnomaly * 180 / Math.PI,
      clockwise: angularMomentum < 0
    }
  }

  resetEpoch = (epoch: number) => {
    const totalMass = this.primary.mass + this.secondary.mass
    this.epoch = epoch
    this.centerPos = {
      x: (this.primary.pos.x * this.primary.mass + this.secondary.pos.x * this.secondary.mass) / totalMass,
      y: (this.primary.pos.y * this.primary.mass + this.secondary.pos.y * this.secondary.mass) / totalMass
    }
    this.centerVelocity = {
      x: (this.primary.velocity.x * this.primary.mass + this.secondary.velocity.x * this.secondary.mass) / totalMass,
      y: (this.primary.velocity.y * this.primary.mass + this.secondary.velocity.y * this.secondary.mass) / totalMass
    }
  }

  syncFromState = (epoch: number) => {
    Object.assign(this.params, this.paramsFromState())
    this.resetEpoch(epoch)
  }

  get period() {
    const semiMajorAxis = (this.params.periapsis + this.params.apoapsis) / 2
    const mu = GAME_PARAMS.gravity * (this.primary.mass + this.secondary.mass)
    return 2 * Math.PI * Math.sqrt(semiMajorAxis ** 3 / mu)
  }

  getTrajectories = (time: number) => {
    const periapsis = Math.max(1, Math.min(this.params.periapsis, this.params.apoapsis))
    const apoapsis = Math.max(periapsis, this.params.apoapsis)
    const semiMajorAxis = (periapsis + apoapsis) / 2
    const eccentricity = (apoapsis - periapsis) / (apoapsis + periapsis)
    const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2)
    const orientation = this.params.orientation * Math.PI / 180
    const relativeCenter = rotate({x: -semiMajorAxis * eccentricity, y: 0}, orientation)
    const elapsed = time - this.epoch
    const centerOfMass = {
      x: this.centerPos.x + this.centerVelocity.x * elapsed,
      y: this.centerPos.y + this.centerVelocity.y * elapsed
    }
    const totalMass = this.primary.mass + this.secondary.mass
    const primaryShare = this.secondary.mass / totalMass
    const secondaryShare = this.primary.mass / totalMass

    return [
      {
        body: this.primary,
        center: {
          x: centerOfMass.x - relativeCenter.x * primaryShare,
          y: centerOfMass.y - relativeCenter.y * primaryShare
        },
        semiMajorAxis: semiMajorAxis * primaryShare,
        semiMinorAxis: semiMinorAxis * primaryShare,
        orientation
      },
      {
        body: this.secondary,
        center: {
          x: centerOfMass.x + relativeCenter.x * secondaryShare,
          y: centerOfMass.y + relativeCenter.y * secondaryShare
        },
        semiMajorAxis: semiMajorAxis * secondaryShare,
        semiMinorAxis: semiMinorAxis * secondaryShare,
        orientation
      }
    ]
  }

  update = (time: number) => {
    const periapsis = Math.max(1, Math.min(this.params.periapsis, this.params.apoapsis))
    const apoapsis = Math.max(periapsis, this.params.apoapsis)
    const semiMajorAxis = (periapsis + apoapsis) / 2
    const eccentricity = (apoapsis - periapsis) / (apoapsis + periapsis)
    const mu = GAME_PARAMS.gravity * (this.primary.mass + this.secondary.mass)
    const direction = this.params.clockwise ? -1 : 1
    const meanMotion = direction * Math.sqrt(mu / semiMajorAxis ** 3)
    const meanAnomaly = normalizeAngle(this.params.phase * Math.PI / 180 + meanMotion * (time - this.epoch))

    let eccentricAnomaly = meanAnomaly
    for(let i = 0; i < 8; i++) {
      eccentricAnomaly -= (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
        (1 - eccentricity * Math.cos(eccentricAnomaly))
    }

    const root = Math.sqrt(1 - eccentricity ** 2)
    const localPos = {
      x: semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity),
      y: semiMajorAxis * root * Math.sin(eccentricAnomaly)
    }
    const anomalySpeed = meanMotion / (1 - eccentricity * Math.cos(eccentricAnomaly))
    const localVelocity = {
      x: -semiMajorAxis * Math.sin(eccentricAnomaly) * anomalySpeed,
      y: semiMajorAxis * root * Math.cos(eccentricAnomaly) * anomalySpeed
    }
    const orientation = this.params.orientation * Math.PI / 180
    const relativePos = rotate(localPos, orientation)
    const relativeVelocity = rotate(localVelocity, orientation)
    const elapsed = time - this.epoch
    const center = {
      x: this.centerPos.x + this.centerVelocity.x * elapsed,
      y: this.centerPos.y + this.centerVelocity.y * elapsed
    }
    const totalMass = this.primary.mass + this.secondary.mass
    const primaryShare = this.secondary.mass / totalMass
    const secondaryShare = this.primary.mass / totalMass

    this.primary.pos = {x: center.x - relativePos.x * primaryShare, y: center.y - relativePos.y * primaryShare}
    this.secondary.pos = {x: center.x + relativePos.x * secondaryShare, y: center.y + relativePos.y * secondaryShare}
    this.primary.velocity = {
      x: this.centerVelocity.x - relativeVelocity.x * primaryShare,
      y: this.centerVelocity.y - relativeVelocity.y * primaryShare
    }
    this.secondary.velocity = {
      x: this.centerVelocity.x + relativeVelocity.x * secondaryShare,
      y: this.centerVelocity.y + relativeVelocity.y * secondaryShare
    }
  }
}
