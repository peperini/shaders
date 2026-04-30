import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import gsap from 'gsap'

const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform vec2 uResolution;
  uniform float uProgress;

  attribute float aSize;
  attribute float aTimeMultiplier;
  attribute float aTrailOffset;
  attribute float aTrailStrength;

  varying float vTrailStrength;
  varying float vLife;

  float remap(float value, float originMin, float originMax, float destinationMin, float destinationMax)
  {
      return destinationMin + (value - originMin) * (destinationMax - destinationMin) / (originMax - originMin);
  }


  void main() {
      /* float progress = uProgress * aTimeMultiplier;
      progress -= aTrailOffset * 0.18;*/
      float headProgress = uProgress * aTimeMultiplier;
      headProgress = clamp(headProgress, 0.0, 1.0);

      float trailProgress = headProgress - aTrailOffset * 0.18;
      trailProgress = clamp(trailProgress, 0.0, 1.0);

      float trailPhase = 1.0 - smoothstep(0.09, 0.14, headProgress);
      float progress = mix(headProgress, trailProgress, trailPhase);

      float headOnly = step(0.999, aTrailStrength);
      float particleVisibility = mix(headOnly, 1.0, trailPhase);

      progress = clamp(progress, 0.0, 1.0);

      vec3 newPosition = position;

      // Explotion
      float explodingProgress = remap(progress, 0.0, 0.1, 0.0, 1.0);
      explodingProgress = clamp(explodingProgress, 0.0, 1.0);
      explodingProgress = 1.0 - pow(1.0 - explodingProgress, 3.0);
      newPosition *= explodingProgress;

      // Falling
      float fallingProgress = remap(progress, 0.1, 1.0, 0.0, 1.0);
      fallingProgress = clamp(fallingProgress, 0.0, 1.0);
      fallingProgress = 1.0 - pow(1.0 - fallingProgress, 3.0);
      newPosition.y -= fallingProgress * 0.05;

      float burstTime = remap(progress, 0.1, 1.0, 0.0, 1.0);
      burstTime = clamp(burstTime, 0.0, 1.0);
      float drag = 1.0 - exp(-3.5 * burstTime);
      vec3 radialOffset = position * burstTime * (0.35 - drag * 0.45);
      radialOffset *= trailPhase;
      newPosition += radialOffset;

      // Scaling
      float sizeOpeningProgress = remap(progress, 0.0, 0.125, 0.0, 1.0);
      float sizeClosingProgress = remap(progress, 0.125, 1.0, 1.0, 0.0);
      float sizeProgress = min(sizeOpeningProgress, sizeClosingProgress);
      sizeProgress = clamp(sizeProgress, 0.0, 1.0);

      // Twinkling
      float twinklingProgress = remap(progress, 0.2, 0.8, 0.0, 1.0);
      twinklingProgress = clamp(twinklingProgress, 0.0, 1.0);
      float sizeTwinkling = sin(progress * 30.0) * 0.5 + 0.5;
      sizeTwinkling = 1.0 - sizeTwinkling * twinklingProgress;

      // Final Position
      vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      gl_Position = projectionMatrix * viewPosition;

      gl_PointSize = uSize * uResolution.y * aSize * sizeProgress * sizeTwinkling;
      gl_PointSize *= particleVisibility;
      gl_PointSize *= mix(0.45, 1.0, aTrailStrength);
      gl_PointSize *= 1.0 / - viewPosition.z;

      vTrailStrength = mix(headOnly, aTrailStrength, trailPhase);
      vLife = progress;

      if(gl_PointSize < 1.0)
          gl_Position = vec4(9999.9);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform sampler2D tMap;

  varying float vTrailStrength;
  varying float vLife;

  void main() {
      float tAlpha = texture2D(tMap, gl_PointCoord).r;
      float headToTail = mix(0.12, 1.0, vTrailStrength);
      float lifeFade = smoothstep(1.0, 0.15, vLife);
      vec3 finalColor = mix(uColor * 0.65, uColor, vTrailStrength);

      gl_FragColor = vec4(finalColor, tAlpha * headToTail * lifeFade);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
  }
`

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}
sizes.resolution = new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
    sizes.resolution.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

/**
 * Fireworks
 */

const textures = [
  textureLoader.load('assets/particles/1.png'),
  textureLoader.load('assets/particles/2.png'),
  textureLoader.load('assets/particles/3.png'),
  textureLoader.load('assets/particles/4.png'),
  textureLoader.load('assets/particles/5.png'),
  textureLoader.load('assets/particles/6.png'),
  textureLoader.load('assets/particles/7.png'),
  textureLoader.load('assets/particles/8.png'),
]

const createFirework = (count, position, size, texture, radius, color) => {
    // Positions Calc
    const trailSegments = 7
    const totalCount = count * trailSegments

    const positionsArray = new Float32Array(totalCount * 3)
    const sizesArray = new Float32Array(totalCount)
    const timeMultipliersArray = new Float32Array(totalCount)
    const trailOffsetArray = new Float32Array(totalCount)
    const trailStrengthArray = new Float32Array(totalCount)

    for (let i = 0; i < count; i++) {
        const spherical = new THREE.Spherical(
            radius * (0.5 + Math.random() * 0.25),
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2,
        )

        const direction = new THREE.Vector3()
        direction.setFromSpherical(spherical)

        const particleSize = Math.random()
        const timeMultiplier = 1 + Math.random()

        for (let j = 0; j < trailSegments; j++) {
            const index = i * trailSegments + j
            const i3 = index * 3
            const t = j / (trailSegments - 1)

            positionsArray[i3 + 0] = direction.x
            positionsArray[i3 + 1] = direction.y
            positionsArray[i3 + 2] = direction.z

            sizesArray[index] = particleSize * (1.0 - t * 0.55)
            timeMultipliersArray[index] = timeMultiplier
            trailOffsetArray[index] = t
            trailStrengthArray[index] = 1.0 - t
        }
        /* const position = new THREE.Vector3()
        position.setFromSpherical(spherical)

        positionsArray[i + 0] = position.x
        positionsArray[i + 1] = position.y
        positionsArray[i + 2] = position.z

        sizesArray[i/3] = Math.random()
        timeMultipliersArray[i/3] = 1 + Math.random() */
    }

    // Geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesArray, 1))
    geometry.setAttribute('aTimeMultiplier', new THREE.Float32BufferAttribute(timeMultipliersArray, 1))
    geometry.setAttribute('aTrailOffset', new THREE.Float32BufferAttribute(trailOffsetArray, 1))
    geometry.setAttribute('aTrailStrength', new THREE.Float32BufferAttribute(trailStrengthArray, 1))

    // Material
    texture.flipY = false
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uSize: { value: size },
            uResolution: { value: sizes.resolution },
            tMap: { value: texture },
            uColor: { value: color },
            uProgress: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    })

    // Mesh
    const mesh = new THREE.Points( geometry, material )
    mesh.position.copy(position)
    scene.add(mesh)

    const destroy = () => {
        scene.remove(mesh)
        geometry.dispose()
        material.dispose()
    }

    gsap.to(
        material.uniforms.uProgress, {
            value: 1,
            duration: 3,
            ease: 'lienar',
            onComplete: destroy
        }
    )
}

const createRandomFireWork = (x, y) => {
    const count = Math.round(400 + Math.random() * 1000)
    const position = new THREE.Vector3(
        /* (Math.random() - 0.5) * 2,
        Math.random(), */
        x,
        y,
        0
        /* (Math.random() - 0.5) * 2 */
    )
    const size = 0.1 + Math.random() * 0.1
    const texture = textures[Math.floor(Math.random() * textures.length)]
    const radius = 0.5 + Math.random()
    const color = new THREE.Color()
    color.setHSL(Math.random(), 1, 0.7)

    createFirework(count, position, size, texture, radius, color)
}

createRandomFireWork()

// On click
window.addEventListener('click', (c) => {
    const x = c.clientX / window.innerWidth * 5 - 2.5
    const y = - c.clientY / window.innerHeight * 5 + 2.5
    console.log(x, y)

    createRandomFireWork(x, y)
})


/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}
tick()
