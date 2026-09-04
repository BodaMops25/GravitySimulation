const fps = 60 // (16ms)

function doPhysics(deltaTime: number) { } // ~ 1-16s

const physicsDt = 1 // (represent how much simulated seconds go by one do_phis() update)
const timeSpeed = 1 // (represent how much times multiplied one real second in simulation)

let simulationTime = 0;
let accumulator = 0
let lastTime = performance.now()

setInterval(() => {

  const now = performance.now()
  const realTimeDt = (now - lastTime) / 1000
  lastTime = now

  accumulator += realTimeDt * timeSpeed

  while (accumulator >= physicsDt) {
    doPhysics(physicsDt)

    simulationTime += physicsDt
    accumulator -= physicsDt
  }

}, 1000 / fps)