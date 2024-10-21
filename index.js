const root = {},
      points = [
      {label: 'A', x: 0, y: 0, mass: 5},
      {label: 'B', x: 6.3, y: 1.1, mass: 5},
      {label: 'C', x: 5.6, y: 1.8, mass: 5},
      {label: 'D', x: 10, y: 10, mass: 5}
]

function getAreaCorners(points) {
  let min_x = points[0].x, min_y = points[0].y, max_x = points[0].x, max_y = points[0].y
  
  for(const {x, y} of points) {
    if(x < min_x) min_x = x
    else if(x > max_x) max_x = x

    if(y < min_y) min_y = y
    else if(y > max_y) max_y = y
  }

  return {min_x, min_y, max_x, max_y}
}

function foo(root, point, {min_x, min_y, max_x, max_y}) {
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

  if(root[sector] === undefined) {
    root[sector] = point
  }
  else if(root[sector].label !== undefined) {
    const point_tmp = root[sector]
    root[sector] = {}

    foo(root[sector], point_tmp, new_coords)
    foo(root[sector], point, new_coords)
  }
  else if(root[sector].label === undefined) foo(root[sector], point, new_coords)
  
  root.mass = 0
  root.x = 0
  root.y = 0
  root.scale = max_x - min_x

  for(const sectorKey in root) {
    const sector = root[sectorKey]
    if(sector.mass !== undefined) root.mass += sector.mass
    if(sector.x !== undefined && sector.y !== undefined) {
      root.x += sector.x * sector.mass
      root.y += sector.y * sector.mass
    }
  }

  root.x /= root.mass
  root.y /= root.mass
}

const coords = getAreaCorners(points)

for(const point of points) {
  foo(root, point, coords)
}

console.log(root)