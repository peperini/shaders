import { Renderer, Camera, Transform, Plane, Program, Mesh, Orbit, Vec2, Color, Texture } from 'ogl'
import GUI from 'lil-gui'


// ———— Shaders ———————————————————————————————————————————————————————————————————————————
const vertex = /* glsl */ `
  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 modelMatrix;
  uniform vec2 uFrequency;
  uniform float uTime;

  attribute vec3 position;
  attribute vec2 uv;
  /* attribute float aRandom; */

  /* varying float vRandom; */
  varying vec2 vUv;
  varying float vElevation;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    // Produces a wave efefct with the sin on the model position z
    float elevation = sin(modelPosition.x * uFrequency.x + uTime) * 0.1;
    elevation += sin(modelPosition.y * uFrequency.y + uTime) * 0.1;
    modelPosition.z += elevation;

    // Produces an elevation 'spikes' effect with a random attribute
    /* modelPosition.z += aRandom * 0.1; */
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    /* vRandom = aRandom; */
    vUv = uv;
    vElevation = elevation;
  }
`
const fragment = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform sampler2D tMap;

  /* varying float vRandom; */
  varying vec2 vUv;
  varying float vElevation;

  void main() {
      vec4 textureColor = texture2D(tMap, vUv);
      textureColor.rgb *= vElevation * 2.0 + 0.5;
      gl_FragColor = textureColor;
  }
`

// ———— GUI ———————————————————————————————————————————————————————————————————————————
const gui = new GUI()
const debug = {
    speed: 0.001
}

// ———— Creates Rendered and retrives WebGL Rendering Context ———————————————————————————————————————————————————————————————————————————
const renderer = new Renderer()
const gl = renderer.gl
document.body.appendChild(gl.canvas)

const camera = new Camera(gl)
camera.position.set(0.25, - 0.25, 2)

// Craete Controls
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
    widthSegments: 32,
    heightSegments: 32,
})

// ———— Custom Attrib ———————————————————————————————————————————————————————————————————————————
const count = geometry.attributes.position.count
const randoms = new Float32Array(count)

for (let i = 0; i < count; i++) {
    randoms[i] = Math.random()
}

geometry.addAttribute('aRandom', {
    data: randoms,
    size: 1
})

// ———— Texture ———————————————————————————————————————————————————————————————————————————
// Upload empty texture while source loading
const texture = new Texture(gl)

const img = new Image()
img.src = 'assets/textures/flag-french.jpg'
img.onload = () => (texture.image = img)

// Alternatively, you can use the TextureLoader class's load method that handles
// these steps for you. It also handles compressed textures and fallbacks.
// const texture = TextureLoader.load(gl, { src: 'assets/saddle.jpg'});

const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
        uFrequency: { value: new Vec2(10, 5) },
        uTime: { value: 0 },
        uColor: { value: new Color('orange')},
        tMap: { value: texture }
    }
})

// ———— GUI Tweaks ———————————————————————————————————————————————————————————————————————————
gui.add(program.uniforms.uFrequency.value, 'x').min(0).max(20).step(0.01).name("X Freq")
gui.add(program.uniforms.uFrequency.value, 'y').min(0).max(10).step(0.01).name("Y Freq")
gui.add(debug, 'speed').min(0).max(0.01).step(0.001)

const mesh = new Mesh(gl, { geometry, program })
mesh.scale.y = 2 / 3
mesh.setParent(scene)

const update = (t) => {
    requestAnimationFrame(update)

    // Animation
    program.uniforms.uTime.value = t * debug.speed

    // Update controls every frame
    controls.update()
    // Renders every frame
    renderer.render({ scene, camera })
}
requestAnimationFrame(update)
