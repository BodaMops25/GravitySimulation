function cartesianDistance(x1, y1, x2, y2) {
  const d1 = (x1**2 + y1**2)**.5,
        d2 = (x2**2 + y2**2)**.5

  return d2 - d1
}

export function getAreaCorners(points) {
  let min_x = points[0].x, min_y = points[0].y, max_x = points[0].x, max_y = points[0].y
  
  for(const {x, y} of points) {
    if(x < min_x) min_x = x
    else if(x > max_x) max_x = x

    if(y < min_y) min_y = y
    else if(y > max_y) max_y = y
  }

  return {min_x, min_y, max_x, max_y}
}

export function createParticlesTree(root, point, {min_x, min_y, max_x, max_y}) {
  if(root.sectors === undefined) {
    root.sectors = {}
  }
  if(root.data === undefined) {
    root.data = {
      scale: max_x - min_x
    }
  }

  const avarage_x = (max_x + min_x) / 2,
        avarage_y = (max_y + min_y) / 2

  let sector = '',
      new_coords = {min_x, min_y, max_x, max_y}

  if(point.y < avarage_y) {
    sector += 'n'
    new_coords.max_y = avarage_y
  }
  else {
    sector += 's'
    new_coords.min_y = avarage_y
  }

  if(point.x < avarage_x) {
    sector += 'w'
    new_coords.max_x = avarage_x
  }
  else {
    sector += 'e'
    new_coords.min_x = avarage_x
  }

  const {sectors, data: rootData} = root
  
  if(sectors[sector] === undefined) {
    sectors[sector] = point
  }
  else if(sectors[sector].label !== undefined) {
    const point_tmp = sectors[sector]
    sectors[sector] = {}

    createParticlesTree(sectors[sector], point_tmp, new_coords)
    createParticlesTree(sectors[sector], point, new_coords)
  }
  else if(sectors[sector].label === undefined) createParticlesTree(sectors[sector], point, new_coords)
  
  rootData.mass = 0
  rootData.x = 0
  rootData.y = 0

  for(const sectorKey in sectors) {
    const sect = sectors[sectorKey],
          sectMass = sect.mass !== undefined ? sect.mass : sect.data.mass,
          sectX = sect.x !== undefined ? sect.x : sect.data.x,
          sectY = sect.y !== undefined ? sect.y : sect.data.y

    rootData.mass += sectMass
    rootData.x += sectX * sectMass
    rootData.y += sectY * sectMass
  }

  rootData.x /= rootData.mass
  rootData.y /= rootData.mass
}

export function bodyForce(body, bodiesTree, threshold) {

  for(const sectorKey in bodiesTree.sectors) {
    const sector = bodiesTree.sectors[sectorKey]

    if(body === sector) continue

    if(sector.label !== undefined) {
      console.log('from point', sector, 'to', body)
      return
    }
    
    const dist = cartesianDistance(body.x, body.y, sector.data.x, sector.data.y),
        k = sector.data.scale / dist

      if(k > threshold) console.log('from sectors', sector, 'to', body)

      bodyForce(body, sector)
  }
}