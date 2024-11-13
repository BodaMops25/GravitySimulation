(() => {
  // particlesTree.js
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
  function createParticlesTree(root2, point, { min_x, min_y, max_x, max_y }) {
    if (root2.sectors === void 0) {
      root2.sectors = {};
    }
    if (root2.data === void 0) {
      root2.data = {
        scale: max_x - min_x
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
    const { sectors, data: rootData } = root2;
    if (sectors[sector] === void 0) {
      sectors[sector] = point;
    } else if (sectors[sector].label !== void 0) {
      const point_tmp = sectors[sector];
      sectors[sector] = {};
      createParticlesTree(sectors[sector], point_tmp, new_coords);
      createParticlesTree(sectors[sector], point, new_coords);
    } else if (sectors[sector].label === void 0) createParticlesTree(sectors[sector], point, new_coords);
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

  // visualisation.js
  function createGrid(x, y, width, height, options) {
    const c = options.ctx;
    if (options.points) {
      for (const point of options.points) {
        c.beginPath();
        c.arc(x + point.x, y + point.y, point.radius, 0, Math.PI * 2);
        c.fillStyle = point.color;
        c.fill();
      }
    }
    c.lineWidth = options.lineWidth;
    c.strokeStyle = options.strokeStyle;
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
  function visualizeParticlesTreeInArea(particlesTree, options, initalScale) {
    if (initalScale === void 0) initalScale = particlesTree.data.scale;
    if (options.offsetX === void 0) options.offsetX = 0;
    if (options.offsetY === void 0) options.offsetY = 0;
    const points2 = [], gridWidth = particlesTree.data.scale * options.width, gridHeight = particlesTree.data.scale * options.height;
    for (const sectorKey in particlesTree.sectors) {
      const sector = particlesTree.sectors[sectorKey];
      let offsetX = 0, offsetY = 0;
      if (sectorKey?.includes("e")) offsetX = particlesTree.data.scale / 2;
      if (sectorKey?.includes("s")) offsetY = particlesTree.data.scale / 2;
      if (sector.label !== void 0) points2.push({
        x: (sector.x - options.offsetX) / particlesTree.data.scale * gridWidth,
        y: (sector.y - options.offsetY) / particlesTree.data.scale * gridHeight,
        color: sector.color !== void 0 ? sector.color : options.pointColor,
        radius: sector.radius !== void 0 ? sector.radius : options.pointRadius,
        label: sector.label
      });
      if (sector.sectors !== void 0) {
        visualizeParticlesTreeInArea(sector, {
          ...options,
          offsetX: options.offsetX + offsetX,
          offsetY: options.offsetY + offsetY
        }, initalScale);
      }
    }
    createGrid(options.x + options.width * options.offsetX, options.y + options.height * options.offsetY, gridWidth, gridHeight, {
      ctx: options.ctx,
      lineWidth: options.lineWidth,
      strokeStyle: options.strokeStyle,
      points: points2
    });
  }

  // index.js
  var threshold = 0.5;
  var root = {};
  var points = [
    { label: "A", x: 0, y: 0, mass: 5 },
    { label: "B", x: 6.875, y: 0.625, mass: 5 },
    { label: "C1", x: 5.3125, y: 1.5625, mass: 5 },
    { label: "C2", x: 5.9375, y: 2.1875, mass: 5 },
    { label: "D", x: 10, y: 10, mass: 5 }
  ];
  var cnvs = document.querySelector("canvas");
  var ctx = cnvs.getContext("2d");
  cnvs.width = window.innerWidth;
  cnvs.height = window.innerHeight;
  var area = getAreaCorners(points);
  for (const point of points) {
    createParticlesTree(root, point, area);
  }
  console.log(root);
  visualizeParticlesTreeInArea(root, {
    ctx,
    pointColor: "orange",
    pointRadius: 12,
    lineWidth: 3,
    strokeStyle: "black",
    x: 40,
    y: 40,
    width: 100,
    height: 100
  });
})();
