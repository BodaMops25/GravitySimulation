import { distance, randomId, Vec } from "./helpers"

export function getAreaCorners(points: Point[]) {
  const min: Vec = {...points[0].pos},
        max: Vec = {...points[0].pos}

  for(const {pos: {x, y}} of points) {
    if(x < min.x) min.x = x
    else if(x > max.x) max.x = x

    if(y < min.y) min.y = y
    else if(y > max.y) max.y = y
  }

  return {min, max}
}

export type SectorDirects = 'nw' | 'ne' | 'sw' | 'se'
export type Point = {pos: Vec} & {[key: string]: any}

export type BarnesHutRootType = {
  sectors: {
    [key in SectorDirects]?: Point | BarnesHutRootType
  },
  data: {
    id: string,
    scale: number,
    pos: Vec
    mass: number
  }
}

function setToBarnesHutTree(root: BarnesHutRootType, point: Point, {min, max}: {min: Vec, max: Vec}, depth=1) {
  if(depth>1000) {
    console.warn("Too much recursions!")
    return
  }

  const middleCoords = {
    x: (max.x + min.x) / 2,
    y: (max.y + min.y) / 2
  }

  let sector = '',
      newCoords = {min: {...min}, max: {...max}}

  if(point.pos.y < middleCoords.y) {
    sector += 'n'
    newCoords.max.y = middleCoords.y
  }
  else {
    sector += 's'
    newCoords.min.y = middleCoords.y
  }

  if(point.pos.x < middleCoords.x) {
    sector += 'w'
    newCoords.max.x = middleCoords.x
  }
  else {
    sector += 'e'
    newCoords.min.x = middleCoords.x
  }

  const {sectors, data: rootData} = root
  const sectorDir = sector as SectorDirects
  let sectorAsPoint = sectors[sectorDir] && !sectors[sectorDir].sectors ? sectors[sectorDir] as Point : undefined
  let sectorAsSector = sectors[sectorDir] && sectors[sectorDir].sectors ? sectors[sectorDir] as BarnesHutRootType : undefined

  if(!sectorAsPoint && !sectorAsSector) {
    sectors[sectorDir] = point
  }
  else if(sectorAsPoint && !sectorAsSector) {
    if(sectorAsPoint.pos.x === point.pos.x && sectorAsPoint.pos.y === point.pos.y) {
      console.warn('Trying put couple of points to the same position!')
      return
    }

    const point_tmp = sectorAsPoint
    sectors[sectorDir] = {
      sectors: {},
      data: {
        id: randomId(4),
        pos: {
          x: 0,
          y: 0
        },
        mass: 0,
        scale: max.x - min.x
      }
    }

    setToBarnesHutTree(sectors[sectorDir], point_tmp, newCoords, depth+1)
    setToBarnesHutTree(sectors[sectorDir], point, newCoords, depth+1)
  }
  else if(!sectorAsPoint && sectorAsSector) setToBarnesHutTree(sectorAsSector, point, newCoords, depth+1)

  rootData.mass = 0
  rootData.pos.x = 0
  rootData.pos.y = 0

  for(const sectorKey in sectors) {
    const sect = sectors[sectorKey as SectorDirects] as Point | BarnesHutRootType,
          sectObj = (sect.sectors ? sect.data : sect) as Point

    rootData.mass += sectObj.mass
    rootData.pos.x += sectObj.pos.x * sectObj.mass
    rootData.pos.y += sectObj.pos.y * sectObj.mass
  }

  rootData.pos.x /= rootData.mass
  rootData.pos.y /= rootData.mass
}

export function createBarnesHutTree(points: Point[], pointsCorners?: {min: Vec, max: Vec}) {
  if(!pointsCorners) pointsCorners = getAreaCorners(points)

  const root: BarnesHutRootType = {
    sectors: {},
    data: {
      id: randomId(4),
      pos: {
        x: 0,
        y: 0
      },
      mass: 0,
      scale: pointsCorners.max.x - pointsCorners.min.x
    }
  }

  for(const point of points) {
    setToBarnesHutTree(root, point, pointsCorners)
  }

  return root
}

export function simplifyBodiesForTarget(target: Point | BarnesHutRootType, bodiesTree: BarnesHutRootType, threshold: number) {

  const array: (BarnesHutRootType | Point)[] = []

  for(const sectorKey in bodiesTree.sectors) {
    const sectorOrPoint = bodiesTree.sectors[sectorKey as SectorDirects]

    if(target === sectorOrPoint) continue

    if(sectorOrPoint && !sectorOrPoint.sectors) {
      const point = sectorOrPoint as Point
      array.push(point)
      // console.log('from point', sector, 'to', target)
      continue
    }

    const sector = sectorOrPoint as BarnesHutRootType

    const dist = Math.abs(distance((target as Point).pos || (target as BarnesHutRootType).data.pos, sector.data.pos)),
        k = sector.data.scale / dist

      if(k < threshold) {
        // console.log('from sectors', sector, 'to', target)
        array.push(sector)
      }
      else {
        array.push(...simplifyBodiesForTarget(target, sector, threshold))
      }
  }

  return array
}