(() => {
  // particlesTree.js
  function randomBetween(max = 1, min = 0, precision = -1) {
    const num = min + Math.random() * (max - min);
    if (precision === -1) return num;
    return +num.toFixed(precision);
  }
  function randomId(length) {
    let id = "";
    for (let i = 0; i < length; i++) id += String.fromCharCode(randomBetween(65, 123, 0));
    return id;
  }
  function cartesianDistance(x1, y1, x2, y2) {
    const d1 = (x1 ** 2 + y1 ** 2) ** 0.5, d2 = (x2 ** 2 + y2 ** 2) ** 0.5;
    return d2 - d1;
  }
  function getAreaCorners(points2) {
    let min_x = points2[0].x, min_y = points2[0].y, max_x = points2[0].x, max_y = points2[0].y;
    for (const { x, y } of points2) {
      if (x < min_x) min_x = x;
      else if (x > max_x) max_x = x;
      if (y < min_y) min_y = y;
      else if (y > max_y) max_y = y;
    }
    return { min_x, min_y, max_x, max_y };
  }
  function setToBarnesHutTree(root, point, { min_x, min_y, max_x, max_y }, depth = 1) {
    if (depth > 1e3) {
      console.warn("Too much recursions!");
      return;
    }
    if (root.sectors === void 0) {
      root.sectors = {};
    }
    if (root.data === void 0) {
      root.data = {
        scale: max_x - min_x,
        id: randomId(4)
      };
    }
    const avarage_x = (max_x + min_x) / 2, avarage_y = (max_y + min_y) / 2;
    let sector = "", new_coords = { min_x, min_y, max_x, max_y };
    if (point.y < avarage_y) {
      sector += "n";
      new_coords.max_y = avarage_y;
    } else {
      sector += "s";
      new_coords.min_y = avarage_y;
    }
    if (point.x < avarage_x) {
      sector += "w";
      new_coords.max_x = avarage_x;
    } else {
      sector += "e";
      new_coords.min_x = avarage_x;
    }
    const { sectors, data: rootData } = root;
    if (sectors[sector] === void 0) {
      sectors[sector] = point;
    } else if (sectors[sector] !== void 0 && sectors[sector].sectors === void 0) {
      if (sectors[sector].x === point.x && sectors[sector].y === point.y) {
        console.warn("Trying put couple of points to the same position!");
        return;
      }
      const point_tmp = sectors[sector];
      sectors[sector] = {};
      setToBarnesHutTree(sectors[sector], point_tmp, new_coords, depth + 1);
      setToBarnesHutTree(sectors[sector], point, new_coords, depth + 1);
    } else if (sectors[sector].sectors !== void 0) setToBarnesHutTree(sectors[sector], point, new_coords, depth + 1);
    rootData.mass = 0;
    rootData.x = 0;
    rootData.y = 0;
    for (const sectorKey in sectors) {
      const sect = sectors[sectorKey], sectMass = sect.mass !== void 0 ? sect.mass : sect.data.mass, sectX = sect.x !== void 0 ? sect.x : sect.data.x, sectY = sect.y !== void 0 ? sect.y : sect.data.y;
      rootData.mass += sectMass;
      rootData.x += sectX * sectMass;
      rootData.y += sectY * sectMass;
    }
    rootData.x /= rootData.mass;
    rootData.y /= rootData.mass;
  }
  function createBarnesHutTree(points2) {
    const root = {}, pointsCorners = getAreaCorners(points2);
    for (const point of points2) {
      setToBarnesHutTree(root, point, pointsCorners);
    }
    return root;
  }
  function simplifyBodiesForTarget(target, bodiesTree, threshold) {
    const array = [];
    for (const sectorKey in bodiesTree.sectors) {
      const sector = bodiesTree.sectors[sectorKey];
      if (target === sector) continue;
      if (sector !== void 0 && sector.sectors === void 0) {
        array.push(sector);
        continue;
      }
      const dist = Math.abs(cartesianDistance(target.x, target.y, sector.data.x, sector.data.y)), k = sector.data.scale / dist;
      if (k < threshold) {
        array.push(sector);
      } else {
        array.push(...simplifyBodiesForTarget(target, sector, threshold));
      }
    }
    return array;
  }

  // visualisation.js
  function drawGrid(x, y, width, height, {
    ctx: ctx2,
    lineWidth = 1,
    strokeStyle = "black",
    points: points2,
    pointRadius = 5,
    pointColor = "black",
    pointLineWidth,
    pointStrokeStyle,
    pointCallback
  } = {}) {
    const c = ctx2;
    if (points2) {
      for (const point of points2) {
        const pointX = x + point.x, pointY = y + point.y;
        c.beginPath();
        c.arc(pointX, pointY, point.radius || pointRadius, 0, Math.PI * 2);
        c.fillStyle = point.color || pointColor;
        c.fill();
        if (point.strokeStyle || point.lineWidth || pointStrokeStyle || pointLineWidth) {
          c.lineWidth = point.lineWidth || pointLineWidth || 1;
          c.strokeStyle = point.strokeStyle || pointStrokeStyle || "black";
          c.stroke();
        }
        if (pointCallback) {
          pointCallback(c, pointX, pointY, point);
        }
      }
    }
    c.lineWidth = lineWidth;
    c.strokeStyle = strokeStyle;
    c.beginPath();
    c.rect(x, y, width, height);
    c.stroke();
    c.beginPath();
    c.moveTo(x, y + height / 2);
    c.lineTo(x + width, y + height / 2);
    c.stroke();
    c.beginPath();
    c.moveTo(x + width / 2, y);
    c.lineTo(x + width / 2, y + height);
    c.stroke();
  }
  function visualizeParticlesTreeInArea(particlesTree, {
    ctx: ctx2,
    lineWidth,
    strokeStyle,
    pointRadius,
    pointColor,
    pointLineWidth,
    pointStrokeStyle,
    pointCallback,
    sectorCallback,
    x,
    y,
    width,
    height
  } = {}, offsetX = 0, offsetY = 0) {
    const points2 = [], gridWidth = particlesTree.data.scale * width, gridHeight = particlesTree.data.scale * height;
    for (const sectorKey in particlesTree.sectors) {
      const sector = particlesTree.sectors[sectorKey];
      let additionalOffsetX = 0, additionalOffsetY = 0;
      if (sectorKey?.includes("e")) additionalOffsetX = particlesTree.data.scale / 2;
      if (sectorKey?.includes("s")) additionalOffsetY = particlesTree.data.scale / 2;
      if (sector !== void 0 && sector.sectors === void 0) points2.push({
        ...sector,
        x: (sector.x - offsetX) / particlesTree.data.scale * gridWidth,
        y: (sector.y - offsetY) / particlesTree.data.scale * gridHeight
      });
      else if (sector.sectors !== void 0) {
        if (sectorCallback) sectorCallback(
          ctx2,
          x + (sector.data.x - offsetX) / particlesTree.data.scale * gridWidth,
          y + (sector.data.y - offsetY) / particlesTree.data.scale * gridHeight,
          sector,
          points2
        );
        visualizeParticlesTreeInArea(sector, {
          ctx: ctx2,
          lineWidth,
          strokeStyle,
          points: points2,
          pointRadius,
          pointColor,
          pointLineWidth,
          pointStrokeStyle,
          pointCallback,
          sectorCallback,
          x,
          y,
          width,
          height
        }, offsetX + additionalOffsetX, offsetY + additionalOffsetY);
      }
    }
    const gridX = x + width * offsetX, gridY = y + height * offsetY;
    drawGrid(gridX, gridY, gridWidth, gridHeight, {
      ctx: ctx2,
      lineWidth,
      strokeStyle,
      points: points2,
      pointRadius,
      pointColor,
      pointLineWidth,
      pointStrokeStyle,
      pointCallback
    });
  }

  // index.js
  var points = [
    { label: "A", x: 0, y: 0, mass: 0, color: "black" },
    // {label: 'B', x: 6.875, y: 0.625, mass: 5},
    // {label: 'C1', x: 5.3125, y: 1.5625, mass: 5},
    // {label: 'C2', x: 5.9375, y: 2.1875, mass: 5},
    { label: "D", x: 1e3, y: 1e3, mass: 0, color: "black" }
  ];
  for (let i = 0; i < 50; i++) points.push({
    label: i.toString(),
    x: randomBetween(1e3, 1, 1),
    y: randomBetween(1e3, 1, 1),
    mass: 5
  });
  var cnvs = document.querySelector("canvas");
  var ctx = cnvs.getContext("2d");
  cnvs.width = window.innerWidth;
  cnvs.height = window.innerHeight;
  ctx.font = "20px sans-serif";
  var tree = createBarnesHutTree(points);
  visualizeParticlesTreeInArea(tree, {
    ctx,
    pointColor: "orange",
    pointRadius: 5,
    lineWidth: 2,
    strokeStyle: "random",
    x: 40,
    y: 40,
    width: 1,
    height: 1,
    pointCallback: (ctx2, x, y, point) => {
      ctx2.fillText(point.label, x + 6, y + 6);
    },
    sectorCallback: (ctx2, x, y, sector, points2) => {
    }
  });
  var firstPoint = points[20];
  var simplifiedBodies = simplifyBodiesForTarget(firstPoint, tree, 0.5);
  console.log(simplifiedBodies);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  var ox = 40;
  var oy = 40;
  for (const body of simplifiedBodies) {
    const x = body.x !== void 0 ? body.x : body.data.x, y = body.y !== void 0 ? body.y : body.data.y;
    ctx.beginPath();
    ctx.moveTo(ox + firstPoint.x, oy + firstPoint.y);
    ctx.lineTo(ox + x, oy + y);
    ctx.stroke();
  }
})();
