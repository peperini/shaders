import { Renderer, Camera, Program, Mesh, Plane, Transform, Orbit } from 'ogl'

const vertex = /* glsl */ `
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  attribute vec3 position;
  attribute vec2 uv;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
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
  fragment
})

const mesh = new Mesh(gl, { geometry, program })
mesh.rotation.x = - Math.PI * 0.5
mesh.setParent(scene)

const update = (t) => {
  requestAnimationFrame(update)

  controls.update()
  renderer.render({ scene, camera })
}
requestAnimationFrame(update)
