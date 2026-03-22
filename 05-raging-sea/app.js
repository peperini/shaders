import { Renderer, Camera, Program, Mesh, Plane, Transform, Orbit, Vec2 } from 'ogl'
import GUI from 'lil-gui'

const vertex = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  uniform float uWavesElevation;
  uniform vec2 uWavesFrequency;

  attribute vec3 position;
  attribute vec2 uv;

  varying vec2 vUv;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = sin(modelPosition.x * uWavesFrequency.x) * sin(modelPosition.z * uWavesFrequency.y) * uWavesElevation;
    modelPosition.y += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
  }
`

const fragment = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(0.5, 0.8, 1.0, 1.0);

    /* #include <colorspace_fragment> */
  }
`

const renderer = new Renderer()
const gl = renderer.gl
document.body.appendChild(gl.canvas)

const camera = new Camera(gl)
camera.position.set(1, 0.5, 1);

const controls = new Orbit(camera, {
  element: gl.canvas
})

const resize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.perspective({
    aspect: gl.canvas.width / gl.canvas.height
  })
}
window.addEventListener('resize', resize, false)
resize()

const scene = new Transform()

const geometry = new Plane(gl, {
  width: 1,
  height: 1,
  widthSegments: 128,
  heightSegments: 128
})

const program = new Program(gl, {
  vertex,
  fragment,
  uniforms: {
    uWavesElevation: { value: 0.2 },
    uWavesFrequency: { value: new Vec2(4, 1.5) }
  }
})

const gui = new GUI()
gui.add(program.uniforms.uWavesElevation, 'value').min(0).max(1).step(0.001)

const mesh = new Mesh(gl, { geometry, program })
mesh.rotation.x = - Math.PI * 0.5
mesh.setParent(scene)

const update = (t) => {
  requestAnimationFrame(update)

  controls.update()
  renderer.render({ scene, camera })
}
requestAnimationFrame(update)
