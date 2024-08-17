const canvas = document.querySelector("#main-frame"),
      context = canvas.getContext("2d")

canvas.width = innerWidth
canvas.height = innerHeight

// ---- MATH ----

function degToRad(deg) {return deg/180 * Math.PI}
function radToDeg(rad) {return rad/Math.PI * 180}

function distance(x2, y2, x, y) {
  return ((x2 - x)**2 + (y2 - y)**2)**.5
}

// ---- CANVAS ----

function drawBall(x = 0, y = 0, scale = 50, color = '#fff') {
  context.beginPath()
  context.fillStyle = color
  context.arc(x, y, scale, 0, Math.PI*2)
  context.fill()
}

function drawVector(x = 0, y = 0, toX = 50, toY = 50, scale = 10, color = '#fff', mode = 0) {
  context.beginPath()
  context.fillStyle = color
  context.strokeStyle = color
  context.lineWidth = scale
  context.moveTo(x, y)

  let x2 = toX, y2 = toY

  if(mode === 1) {
    x2 = x + toX
    y2 = y + toY
  }

  context.lineTo(x2, y2)
  context.stroke()
  context.beginPath()
  drawBall(x2, y2, scale * 1.2, color)
}

function drawCursor() {
  const hh = canvas.width / 2,
        vh = canvas.height / 2,
        radius = 5

  context.strokeStyle = '#fff'
  context.lineWidth = 1

  context.beginPath()
  context.moveTo(hh - radius, vh)
  context.lineTo(hh + radius, vh)
  context.stroke()

  context.beginPath()
  context.moveTo(hh, vh - radius)
  context.lineTo(hh, vh + radius)
  context.stroke()
}

// drawBall(30, 30, 10)
// drawVector(60, 30, 120, 60, 3, undefined, 0)
// drawVector(150, 30, 60, 30, 3, undefined, 1)

// ---- PARTICLES ----

function Particle(x = 0, y = 0, mass = 1, force_x = 0, force_y = 0, radius = 10, color = '#fff') {
  this.x = x
  this.y = y
  this.mass = mass
  this.force_x = force_x
  this.force_y = force_y
  this.radius = radius
  this.color = color

  this.move = () => {
    this.x = this.x + this.force_x / this.mass * simulationSpeed
    this.y = this.y + this.force_y / this.mass * simulationSpeed
  }

  this.impulse = (x, y) => {
    this.force_x += x
    this.force_y += y
  }

  this.draw = (isDebug = false) => {
    drawBall(this.x, this.y, this.radius, this.color)

    if(isDebug === true) {
      drawVector(this.x, this.y, this.force_x * 4, this.force_y * 4, 3, undefined, 1)
    }
  }
}

// ---- CAMERA ----

function Camera(particles, x = 0, y = 0, scale = 1) {
  this.x = x
  this.y = y
  this.scale = scale
  this.particles = particles
  this.mousemove = false

  this.mouseDelta_x = 0
  this.mouseDelta_y = 0

  this.anchored_x = 0
  this.anchored_y = 0

  this.mapToCamera_x = x => {
    return (x - this.x) * this.scale + canvas.width / 2
  }

  this.mapToCamera_y = y => {
    return (y - this.y) * this.scale + canvas.height / 2
  }

  this.focus = particle => {
    this.x = particle.x
    this.y = particle.y
  }


  this.render = () => {

    for(const particle of particles) {

      const x = this.mapToCamera_x(particle.x),
            y = this.mapToCamera_y(particle.y),
            force_x = this.mapToCamera_x(particle.x + particle.force_x / particle.mass),
            force_y = this.mapToCamera_y(particle.y + particle.force_y / particle.mass)
            scale = particle.radius * this.scale

      drawBall(x, y, scale < 5 ? 5 : scale, particle.color)
      drawVector(x, y, force_x, force_y, 2, '#fff', 0)
    }

  }

  document.body.addEventListener("wheel", event => {
    if(event.deltaY > 0) this.scale /= 2
    else if(event.deltaY < 0) this.scale *= 2

    sessionStorage['map_scale'] = this.scale
  })

  document.body.addEventListener("mousedown", event => {
    if(event.buttons === 1) this.mousemove = true

    this.mouseDelta_x = event.offsetX
    this.mouseDelta_y = event.offsetY

    this.anchored_x = this.x
    this.anchored_y = this.y
  })

  document.body.addEventListener("mouseup", event => {
    if(event.buttons === 0) this.mousemove = false

    sessionStorage['map_x'] = this.x
    sessionStorage['map_y'] = this.y
  })

  document.body.addEventListener("mousemove", event => {
    if(this.mousemove === true) {
      const delta_x = event.offsetX - this.mouseDelta_x,
            delta_y = event.offsetY - this.mouseDelta_y

      this.x = this.anchored_x - delta_x / this.scale
      this.y = this.anchored_y - delta_y / this.scale
    }
  })
}

//  ---- PROGRAM ----



let GRAVITY_CONST = 6.674 * 1e-11,
    tickSpeed = 120, // count per second
    simulationSpeed = 1,
    particles = [],
    camera = new Camera(particles)

camera.scale = +sessionStorage['map_scale'] || 1
camera.x = +sessionStorage['map_x'] || 0
camera.y = +sessionStorage['map_y'] || 0

// particles.push(new Particle(10, 500, 2, 0, 11.9))
// particles.push(new Particle(-10000000, 0, 1, 0, 0.05))
// particles.push(new Particle(0, 0, 1e15, 0, 0, 500))

particles.push(new Particle(0, 0, 2e30, 0, 0, 7e8, 'yellow'))
particles.push(new Particle(150e9, 0, 6e24, 0, 30e3 * 6e24, 6e6, 'blue'))
particles.push(new Particle(150e9 + 380e6, 0, 7e22, 0, 1e3 * 7e22, 2e6, 'gray'))

const loop = setInterval(() => {
  context.clearRect(0, 0, canvas.width, canvas.height)

  for(const particle of particles) {

    for(const particle2 of particles) {
      if(particle !== particle2) {

        const r = distance(particle2.x, particle2.y, particle.x, particle.y),
              force = particle.mass * particle2.mass / r**2 * GRAVITY_CONST * simulationSpeed,
              angle = radToDeg(Math.atan2(particle2.x - particle.x, particle2.y - particle.y)),
              force_x = Math.sin(degToRad(angle)) * force,
              force_y = Math.cos(degToRad(angle)) * force

        particle.impulse(force_x, force_y)
      }
    }

    particle.move()

    camera.render()

    drawCursor()

    // particle.draw()
  }

}, 1000 / tickSpeed)