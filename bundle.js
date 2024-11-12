(() => {
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
  window.createGrid = createGrid;

  // index.js
  var cnvs = document.querySelector("canvas");
  var ctx = cnvs.getContext("2d");
  cnvs.width = window.innerWidth;
  cnvs.height = window.innerHeight;
  createGrid(50, 50, 500, 500, {
    ctx,
    lineWidth: 5,
    strokeStyle: "darkGray",
    points: [
      { x: 5, y: 5, radius: 10, color: "orange" },
      { x: 80, y: 80, radius: 10, color: "orange" }
    ]
  });
})();
