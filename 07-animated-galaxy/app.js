import { Renderer, Camera, Transform, Geometry, Program, Mesh, Orbit, Color } from 'ogl'
import * as lil from 'lil-gui'
import { lerp } from '../shared/utils.js'

// ———— Vertext Shader ———————————————————————————————————————————————————————————————————————————
const vertex = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  uniform float uTime;
  uniform float uSize;

  attribute vec3 position;
  attribute vec3 color;
  attribute float aScales;
  attribute vec3 aRandomness;

  varying vec3 vColor;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Spin
    float angle = atan(modelPosition.x, modelPosition.z);
    float distToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distToCenter) * uTime * 0.2;
    angle += angleOffset;

    modelPosition.x = cos(angle) * distToCenter;
    modelPosition.z = sin(angle) * distToCenter;

    // Randomness
    modelPosition.xzy += aRandomness;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

    // gl_PointSize only applicable for gl.POINTS draw mode
    gl_PointSize = uSize * aScales;
    gl_PointSize *= ( 1.0 / - viewPosition.z);

    vColor = color;
  }
`

// ———— Fragment Shader ———————————————————————————————————————————————————————————————————————————
const fragment = /* glsl */ `
  precision mediump float;

  varying vec3 vColor;

  void main() {
    // Disc
    /* float str = distance(gl_PointCoord, vec2(0.5));
    str = 1.0 - step(0.5, str); */

    // Difusse point
   /*  float str = distance(gl_PointCoord, vec2(0.5));
    str *= 2.0;
    str = 1.0 - str; */

    // Point light
    float str = distance(gl_PointCoord, vec2(0.5));
    str = 1.0 - str;
    str = pow(str, 10.0);

    // Final color
    vec3 color = mix(vec3(0.0), vColor, str);

    gl_FragColor = vec4(color, 1.0);
  }
`

// ———— Debug ———————————————————————————————————————————————————————————————————————————
const gui = new lil.GUI()

// ———— Renderer ———————————————————————————————————————————————————————————————————————————
const renderer = new Renderer({
  dpr: Math.min(window.devicePixelRatio, 2)
})
const gl = renderer.gl
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
document.body.appendChild(gl.canvas)

// ———— Camera ———————————————————————————————————————————————————————————————————————————
const camera = new Camera(gl)
camera.position.set(0, 3, 10)

// ———— Orbit ———————————————————————————————————————————————————————————————————————————
const controls = new Orbit(camera, {
  element: gl.canvas
})

// ———— Resize ———————————————————————————————————————————————————————————————————————————
const resize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.perspective({
    aspect: gl.canvas.width / gl.canvas.height
  })
}
window.addEventListener('resize', resize, false)
resize()

// ———— Scene ———————————————————————————————————————————————————————————————————————————
const scene = new Transform()

// ———— Galaxy ———————————————————————————————————————————————————————————————————————————
const params = {}
params.count = 100000
params.radius = 5
params.branches = 3
params.randomness = 0.5
params.randomnessPower = 3
params.insideColor = '#ff6030'
params.outsideColor = '#1b3984'

class GalaxyGenerator {
  constructor (params, scene) {
    this.params = params
    this.scene = scene

    this.geometry = this.getGeometry()
    this.program = this.getProgram()
    this.galaxy = this.getGalaxy()
  }

  getGeometry () {
    const positions = new Float32Array(this.params.count * 3)
    const colors = new Float32Array(this.params.count * 3)
    const scales = new Float32Array(this.params.count)
    const randomness = new Float32Array(this.params.count * 3)

    const colorInside = new Color(this.params.insideColor)
    const colorOutside = new Color(this.params.outsideColor)

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3

      // Position
      const radius = Math.random() * this.params.radius
      const branchAngle = (i % this.params.branches) / this.params.branches * Math.PI * 2

      positions[i3    ] = Math.cos(branchAngle) * radius
      positions[i3 + 1] = 0.0
      positions[i3 + 2] = Math.sin(branchAngle) * radius

      // Randomness

      const randomX = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
      const randomY = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
      const randomZ = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness

      randomness[i3    ] = randomX
      randomness[i3 + 1] = randomY
      randomness[i3 + 2] = randomZ

      // Colors
      const t = radius / this.params.radius

      colors[i3    ] = colorInside.r + (colorOutside.r - colorInside.r) * t;
      colors[i3 + 1] = colorInside.g + (colorOutside.g - colorInside.g) * t;
      colors[i3 + 2] = colorInside.b + (colorOutside.b - colorInside.b) * t;

      // Scales
      scales[i] = Math.random()
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      color: { size: 3, data: colors },
      aScales: { size: 1, data: scales },
      aRandomness: { size: 3, data: randomness}
    })

    return geometry
  }

  getProgram () {
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 30 * renderer.dpr }
      },
      transparent: true,
      depthWrite: false
    })
    return program
  }

  getGalaxy () {
    this.mesh = new Mesh(gl, { mode: gl.POINTS, geometry: this.geometry, program: this.program })
    this.mesh.setParent(this.scene)
    return this.mesh
  }

  destroy() {
    if (!this.galaxy) return

    this.scene.removeChild(this.galaxy)
    this.geometry.remove()
    this.program.remove()

    this.galaxy = null
    this.geometry = null
    this.program = null
  }
}

let proxima = new GalaxyGenerator(params, scene)

gui.add(params, 'count').min(100).max(1000000).step(100).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'radius').min(0.01).max(20).step(0.01).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'branches').min(2).max(20).step(1).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'randomness').min(0).max(2).step(0.001).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.add(params, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.addColor(params, 'insideColor').onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})
gui.addColor(params, 'outsideColor').onFinishChange(() => {
    proxima.destroy()
    proxima = new GalaxyGenerator(params, scene)
})

// ———— Animate ———————————————————————————————————————————————————————————————————————————
const update = (t) => {
  // Call update again on the next frame
  requestAnimationFrame(update)
  const elapsedTime = t * 0.001

  proxima.program.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update()
  // Render
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
  renderer.render({ scene, camera })
}
requestAnimationFrame(update)
