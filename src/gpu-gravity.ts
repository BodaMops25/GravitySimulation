export type GravityBody = {
  mass: number
  pos: {x: number, y: number}
}

export type GravityAcceleration = {x: number, y: number}

const shader = /* wgsl */ `
struct Body {
  position: vec2f,
  mass: f32,
  padding: f32,
}

struct Params {
  bodyCount: u32,
  gravity: f32,
  softeningSquared: f32,
  padding: f32,
}

@group(0) @binding(0) var<storage, read> bodies: array<Body>;
@group(0) @binding(1) var<storage, read_write> accelerations: array<vec2f>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.bodyCount) { return; }

  let ownPosition = bodies[index].position;
  var acceleration = vec2f(0.0);
  for (var other = 0u; other < params.bodyCount; other++) {
    if (other == index) { continue; }
    let difference = bodies[other].position - ownPosition;
    let distanceSquared = dot(difference, difference) + params.softeningSquared;
    let inverseDistance = inverseSqrt(distanceSquared);
    let inverseDistanceCubed = inverseDistance * inverseDistance * inverseDistance;
    acceleration += params.gravity * bodies[other].mass * difference * inverseDistanceCubed;
  }
  accelerations[index] = acceleration;
}
`

const integrationShader = /* wgsl */ `
struct BodyState {
  position: vec2f,
  velocity: vec2f,
  mass: f32,
  padding0: f32,
  padding1: f32,
  padding2: f32,
}

struct Params {
  bodyCount: u32,
  gravity: f32,
  softeningSquared: f32,
  dt: f32,
}

@group(0) @binding(0) var<storage, read> inputBodies: array<BodyState>;
@group(0) @binding(1) var<storage, read_write> outputBodies: array<BodyState>;
@group(0) @binding(2) var<uniform> params: Params;

fn acceleration(index: u32) -> vec2f {
  let ownPosition = inputBodies[index].position;
  var result = vec2f(0.0);
  for (var other = 0u; other < params.bodyCount; other++) {
    if (other == index) { continue; }
    let difference = inputBodies[other].position - ownPosition;
    let distanceSquared = dot(difference, difference) + params.softeningSquared;
    let inverseDistance = inverseSqrt(distanceSquared);
    result += params.gravity * inputBodies[other].mass * difference *
      inverseDistance * inverseDistance * inverseDistance;
  }
  return result;
}

@compute @workgroup_size(64)
fn kickDrift(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.bodyCount) { return; }
  let halfVelocity = inputBodies[index].velocity + acceleration(index) * params.dt * 0.5;
  outputBodies[index].position = inputBodies[index].position + halfVelocity * params.dt;
  outputBodies[index].velocity = halfVelocity;
  outputBodies[index].mass = inputBodies[index].mass;
}

@compute @workgroup_size(64)
fn kick(@builtin(global_invocation_id) id: vec3u) {
  let index = id.x;
  if (index >= params.bodyCount) { return; }
  outputBodies[index].position = inputBodies[index].position;
  outputBodies[index].velocity = inputBodies[index].velocity + acceleration(index) * params.dt * 0.5;
  outputBodies[index].mass = inputBodies[index].mass;
}
`

export class GpuGravity {
  private device: any
  private pipeline: any
  private paramsBuffer: any
  private bodyBuffer: any
  private accelerationBuffer: any
  private readBuffer: any
  private bindGroup: any
  private capacity = 0
  private gravity: number
  private bufferUsage: any
  private mapMode: any
  private integrationPipelines: any[]
  private integrationParamsBuffer: any
  private integrationBuffers: any[] = []
  private integrationReadBuffer: any
  private integrationBindGroups: any[] = []
  private integrationCapacity = 0

  private constructor(device: any, gravity: number) {
    this.device = device
    this.gravity = gravity
    this.bufferUsage = (globalThis as any).GPUBufferUsage
    this.mapMode = (globalThis as any).GPUMapMode
    const module = device.createShaderModule({label: 'N-body gravity shader', code: shader})
    this.pipeline = device.createComputePipeline({
      label: 'N-body gravity pipeline',
      layout: 'auto',
      compute: {module, entryPoint: 'main'}
    })
    this.paramsBuffer = device.createBuffer({
      label: 'Gravity parameters', size: 16,
      usage: this.bufferUsage.UNIFORM | this.bufferUsage.COPY_DST
    })
    const integrationModule = device.createShaderModule({label: 'Batched gravity integration shader', code: integrationShader})
    this.integrationPipelines = [
      device.createComputePipeline({layout: 'auto', compute: {module: integrationModule, entryPoint: 'kickDrift'}}),
      device.createComputePipeline({layout: 'auto', compute: {module: integrationModule, entryPoint: 'kick'}})
    ]
    this.integrationParamsBuffer = device.createBuffer({
      size: 16, usage: this.bufferUsage.UNIFORM | this.bufferUsage.COPY_DST
    })
  }

  static create = async (gravity: number): Promise<GpuGravity | null> => {
    try {
      const gpu = (navigator as any).gpu
      if (!gpu) return null
      const adapter = await gpu.requestAdapter()
      if (!adapter) return null
      const device = await adapter.requestDevice()
      return new GpuGravity(device, gravity)
    } catch (error) {
      console.warn('WebGPU gravity unavailable; using CPU.', error)
      return null
    }
  }

  private ensureCapacity(bodyCount: number) {
    if (bodyCount <= this.capacity) return
    this.capacity = 2 ** Math.ceil(Math.log2(Math.max(1, bodyCount)))
    this.bodyBuffer?.destroy()
    this.accelerationBuffer?.destroy()
    this.readBuffer?.destroy()

    this.bodyBuffer = this.device.createBuffer({
      label: 'Gravity body input', size: this.capacity * 16,
      usage: this.bufferUsage.STORAGE | this.bufferUsage.COPY_DST
    })
    this.accelerationBuffer = this.device.createBuffer({
      label: 'Gravity acceleration output', size: this.capacity * 8,
      usage: this.bufferUsage.STORAGE | this.bufferUsage.COPY_SRC
    })
    this.readBuffer = this.device.createBuffer({
      label: 'Gravity acceleration readback', size: this.capacity * 8,
      usage: this.bufferUsage.COPY_DST | this.bufferUsage.MAP_READ
    })
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.bodyBuffer}},
        {binding: 1, resource: {buffer: this.accelerationBuffer}},
        {binding: 2, resource: {buffer: this.paramsBuffer}}
      ]
    })
  }

  calculate = async (bodies: readonly GravityBody[]): Promise<GravityAcceleration[]> => {
    if (bodies.length === 0) return []
    this.ensureCapacity(bodies.length)

    const input = new Float32Array(bodies.length * 4)
    bodies.forEach((body, index) => {
      input[index * 4] = body.pos.x
      input[index * 4 + 1] = body.pos.y
      input[index * 4 + 2] = body.mass
    })
    const params = new ArrayBuffer(16)
    const paramsView = new DataView(params)
    paramsView.setUint32(0, bodies.length, true)
    paramsView.setFloat32(4, this.gravity, true)
    paramsView.setFloat32(8, 1, true)
    this.device.queue.writeBuffer(this.bodyBuffer, 0, input)
    this.device.queue.writeBuffer(this.paramsBuffer, 0, params)

    const encoder = this.device.createCommandEncoder({label: 'Gravity commands'})
    const pass = encoder.beginComputePass()
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, this.bindGroup)
    pass.dispatchWorkgroups(Math.ceil(bodies.length / 64))
    pass.end()
    encoder.copyBufferToBuffer(this.accelerationBuffer, 0, this.readBuffer, 0, bodies.length * 8)
    this.device.queue.submit([encoder.finish()])

    await this.readBuffer.mapAsync(this.mapMode.READ, 0, bodies.length * 8)
    const output = new Float32Array(this.readBuffer.getMappedRange(0, bodies.length * 8)).slice()
    this.readBuffer.unmap()
    return bodies.map((_, index) => ({x: output[index * 2], y: output[index * 2 + 1]}))
  }

  private ensureIntegrationCapacity(bodyCount: number) {
    if (bodyCount <= this.integrationCapacity) return
    this.integrationCapacity = 2 ** Math.ceil(Math.log2(Math.max(1, bodyCount)))
    this.integrationBuffers.forEach(buffer => buffer.destroy())
    this.integrationReadBuffer?.destroy()
    const size = this.integrationCapacity * 32
    this.integrationBuffers = Array.from({length: 3}, (_, index) => this.device.createBuffer({
      label: `Integration state ${index}`, size,
      usage: this.bufferUsage.STORAGE | this.bufferUsage.COPY_DST | this.bufferUsage.COPY_SRC
    }))
    this.integrationReadBuffer = this.device.createBuffer({
      label: 'Integration readback', size,
      usage: this.bufferUsage.COPY_DST | this.bufferUsage.MAP_READ
    })
    const makeBindGroup = (pipeline: any, input: any, output: any) => this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: input}},
        {binding: 1, resource: {buffer: output}},
        {binding: 2, resource: {buffer: this.integrationParamsBuffer}}
      ]
    })
    const [stateA, stateB, temporary] = this.integrationBuffers
    this.integrationBindGroups = [
      makeBindGroup(this.integrationPipelines[0], stateA, temporary),
      makeBindGroup(this.integrationPipelines[1], temporary, stateB),
      makeBindGroup(this.integrationPipelines[0], stateB, temporary),
      makeBindGroup(this.integrationPipelines[1], temporary, stateA)
    ]
  }

  integrate = async <T extends GravityBody & {velocity: GravityAcceleration}>(bodies: T[], dt: number, steps: number) => {
    if (bodies.length === 0 || steps < 1) return
    this.ensureIntegrationCapacity(bodies.length)
    const state = new Float32Array(bodies.length * 8)
    bodies.forEach((body, index) => {
      const offset = index * 8
      state[offset] = body.pos.x
      state[offset + 1] = body.pos.y
      state[offset + 2] = body.velocity.x
      state[offset + 3] = body.velocity.y
      state[offset + 4] = body.mass
    })
    const params = new ArrayBuffer(16)
    const view = new DataView(params)
    view.setUint32(0, bodies.length, true)
    view.setFloat32(4, this.gravity, true)
    view.setFloat32(8, 1, true)
    view.setFloat32(12, dt, true)
    this.device.queue.writeBuffer(this.integrationBuffers[0], 0, state)
    this.device.queue.writeBuffer(this.integrationParamsBuffer, 0, params)

    const encoder = this.device.createCommandEncoder({label: `${steps} batched physics steps`})
    for (let step = 0; step < steps; step++) {
      const parityOffset = step % 2 === 0 ? 0 : 2
      for (let passIndex = 0; passIndex < 2; passIndex++) {
        const pass = encoder.beginComputePass()
        pass.setPipeline(this.integrationPipelines[passIndex])
        pass.setBindGroup(0, this.integrationBindGroups[parityOffset + passIndex])
        pass.dispatchWorkgroups(Math.ceil(bodies.length / 64))
        pass.end()
      }
    }
    const finalBuffer = this.integrationBuffers[steps % 2 === 0 ? 0 : 1]
    encoder.copyBufferToBuffer(finalBuffer, 0, this.integrationReadBuffer, 0, bodies.length * 32)
    this.device.queue.submit([encoder.finish()])
    await this.integrationReadBuffer.mapAsync(this.mapMode.READ, 0, bodies.length * 32)
    const output = new Float32Array(this.integrationReadBuffer.getMappedRange(0, bodies.length * 32)).slice()
    this.integrationReadBuffer.unmap()
    bodies.forEach((body, index) => {
      const offset = index * 8
      body.pos.x = output[offset]
      body.pos.y = output[offset + 1]
      body.velocity.x = output[offset + 2]
      body.velocity.y = output[offset + 3]
    })
  }
}
