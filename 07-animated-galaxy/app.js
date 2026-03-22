import { Renderer, Camera, Transform, Geometry, Program, Mesh, Orbit, Color } from 'ogl'
import * as lil from 'lil-gui'
import { lerp } from '../shared/utils.js'

// ———— Vertext Shader ———————————————————————————————————————————————————————————————————————————
const vertex = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  uniform float uSize;

  attribute vec3 position;

  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    // gl_PointSize only applicable for gl.POINTS draw mode
    gl_PointSize = uSize;
  }
`

// ———— Fragment Shader ———————————————————————————————————————————————————————————————————————————
const fragment = /* glsl */ `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`

// ———— Debug ———————————————————————————————————————————————————————————————————————————
const gui = new lil.GUI()

// ———— Renderer ———————————————————————————————————————————————————————————————————————————
const renderer = new Renderer()
const gl = renderer.gl
document.body.appendChild(gl.canvas)

// ———— Camera ———————————————————————————————————————————————————————————————————————————
const camera = new Camera(gl)
camera.position.set(0, 5, 15)

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
    console.log(this.geometry)
    this.program = this.getProgram()
    this.galaxy = this.getGalaxy()
  }

  getGeometry () {
    const positions = new Float32Array(this.params.count * 3)
    const colors = new Float32Array(this.params.count * 3)

    const colorInside = new Color(this.params.insideColor)
    const colorOutside = new Color(this.params.outsideColor)

    for (let i = 0; i < this.params.count; i++) {
      const i3 = i * 3

      // Position
      const radius = Math.random() * this.params.radius
      const branchAngle = (i % this.params.branches) / this.params.branches * Math.PI * 2

      const randomX = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
      const randomY = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness
      const randomZ = Math.pow(Math.random(), this.params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * this.params.randomness

      positions[i3    ] = Math.cos(branchAngle) * radius + randomX
      positions[i3 + 1] = randomY
      positions[i3 + 2] = Math.sin(branchAngle) * radius + randomZ

      // Colors
      /* const mixedColor = colorInside.copy(colorInside) */
      const mixedColor = lerp(colorInside, colorOutside, radius / this.params.radius)

      colors[i3    ] = mixedColor.r
      colors[i3 + 1] = mixedColor.g
      colors[i3 + 2] = mixedColor.b
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      color: { size: 3, data: colors },
    })
    return geometry
  }

  getProgram () {
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uSize: { value: 8 }
      },
      depthWrite: false,
      vertexColors: true
    })
    /* program.depthWrite = false
    program.blending = THREE.AdditiveBlending
    program.vertexColors = true */
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
  const elapsedTime = t

  // Update controls
  controls.update()
  // Render
  renderer.render({ scene, camera })
}
requestAnimationFrame(update)
