import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// ———— Shaders ———————————————————————————————————————————————————————————————————————————

const holographicVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;

  varying vec3 vPosition;
  varying vec3 vNormal;

  float random2D(vec2 value)
  {
      return fract(sin(dot(value.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Glitch
    float gTime = uTime - modelPosition.y;
    float gStr = sin(gTime) + sin(gTime * 3.45) + sin(gTime * 8.76);
    gStr /= 3.0;
    gStr = smoothstep(0.3, 1.0, sin(gStr));
    gStr *= 0.25;
    gStr += uHover * 0.25;
    modelPosition.x += (random2D(modelPosition.xz - uTime) - 0.5) * gStr;
    modelPosition.z += (random2D(modelPosition.zx - uTime) - 0.5) * gStr;

    // Final position
    gl_Position = projectionMatrix * viewMatrix * modelPosition;

    // Model Normal
    vec4 modelNormal = modelMatrix * vec4(normal, 0.0);

    // Varyings
    vPosition = modelPosition.xyz;
    vNormal = modelNormal.xyz;
  }
`

const holographicFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;

  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    // Normal
    vec3 normal = normalize(vNormal);
    if(!gl_FrontFacing)
        normal *= - 1.0;

    // Stripes
    float stripes = mod((vPosition.y - uTime * 0.02) * 20.0, 1.0);
    stripes = pow(stripes, 3.0);

    // Fresnel
    vec3 viewDirection = normalize(vPosition - cameraPosition);
    float fresnel = dot(viewDirection, normal) + 1.0;
    fresnel = pow(fresnel, 2.0);

    // Falloff
    float falloff = smoothstep(0.8, 0.0, fresnel);

    // Holographic
    float holographic = stripes * fresnel;
    holographic += fresnel * 1.25;
    holographic *= falloff;

    gl_FragColor = vec4(uColor, holographic);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/**
 * Base
 */
// Debug
const gui = new GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const gltfLoader = new GLTFLoader()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const mouse = new THREE.Vector2({ x: 0, y: 0 })
window.addEventListener('mousemove', event => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - event.clientY / sizes.height * 2 + 1
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.set(7, 7, 7)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const rendererParameters = {}
rendererParameters.clearColor = '#1d1f2a'

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setClearColor(rendererParameters.clearColor)
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

gui
    .addColor(rendererParameters, 'clearColor')
    .onChange(() =>
    {
        renderer.setClearColor(rendererParameters.clearColor)
    })

/**
 * Material
 */
const materialParams = {
    color: '#70c1ff'
}

gui.addColor(materialParams, 'color').onChange(() => {
    hoverables.forEach(mesh => {
        mesh.material.uniforms.uColor.value.set(materialParams.color)
    })
})

const createHologramMaterial = () => new THREE.ShaderMaterial({
    vertexShader: holographicVertexShader,
    fragmentShader: holographicFragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(materialParams.color) },
        uHover: { value: 0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
})

const hoverables = []

/**
 * Objects
 */
// Torus knot
const torusKnot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.6, 0.25, 128, 32),
    createHologramMaterial()
)
torusKnot.position.x = 3
hoverables.push(torusKnot)
scene.add(torusKnot)

// Sphere
const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(),
    createHologramMaterial()
)
sphere.position.x = - 3
hoverables.push(sphere)
scene.add(sphere)

// Suzanne
let suzanne = null
gltfLoader.load(
    'assets/suzanne.glb',
    (gltf) =>
    {
        suzanne = gltf.scene
        suzanne.traverse((child) =>
        {
            if(child.isMesh) {
                child.material = createHologramMaterial()
                hoverables.push(child)
            }

        })
        scene.add(suzanne)
    }
)

const raycaster = new THREE.Raycaster()

/**
 * Animate
 */
const clock = new THREE.Clock()
let hoveredObject = null

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Raycaster Events
    raycaster.setFromCamera(mouse, camera)

    if (hoverables.length) {
        const intersects = raycaster.intersectObjects(hoverables)

        if (intersects.length) {
            hoveredObject = intersects[0].object
        } else {
            hoveredObject = null
        }
    }

    // Stripes
    hoverables.forEach((mesh) => {
        mesh.material.uniforms.uTime.value = elapsedTime

        const targetHover = mesh === hoveredObject ? 1 : 0
        mesh.material.uniforms.uHover.value = THREE.MathUtils.lerp(
            mesh.material.uniforms.uHover.value,
            targetHover,
            0.12
        )
    })

    // Rotate objects
    if(suzanne)
    {
        suzanne.rotation.x = - elapsedTime * 0.1
        suzanne.rotation.y = elapsedTime * 0.2
    }

    sphere.rotation.x = - elapsedTime * 0.1
    sphere.rotation.y = elapsedTime * 0.2

    torusKnot.rotation.x = - elapsedTime * 0.1
    torusKnot.rotation.y = elapsedTime * 0.2

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
