import { Renderer, Program, Mesh, Camera, Plane, Transform, Orbit } from 'ogl'

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
  #define PI 3.1415926535897932384626433832795

  precision mediump float;

  varying vec2 vUv;

  float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
  }

  //	Classic Perlin 2D Noise
  //	by Stefan Gustavson
  //
  vec2 fade(vec2 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
  }

  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x,gy.x);
    vec2 g10 = vec2(gx.y,gy.y);
    vec2 g01 = vec2(gx.z,gy.z);
    vec2 g11 = vec2(gx.w,gy.w);
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
    return 2.3 * n_xy;
  }

  vec2 rotate(vec2 uv, float rotation, vec2 mid)
  {
    return vec2(
      cos(rotation) * (uv.x - mid.x) + sin(rotation) * (uv.y - mid.y) + mid.x,
      cos(rotation) * (uv.y - mid.y) - sin(rotation) * (uv.x - mid.x) + mid.y
    );
  }

  void main() {
    // ———— Pattern 3 ———————————————————————————————————————————————————————————————————————————
    // Grayscale gradient on x axis
    /* float strength = vUv.x;*/

    /* // ———— Pattern 4 ———————————————————————————————————————————————————————————————————————————
    // Grayscale gradient on y axis
    float strength = vUv.y;*/

    // ———— Pattern 5 ———————————————————————————————————————————————————————————————————————————
    // Grayscale gradient on y axis starting from the top
    /* float strength = 1.0 - vUv.y;*/

    // ———— Pattern 6 ———————————————————————————————————————————————————————————————————————————
    // Grayscale gradient on y axis with a kind of 'smoothstep'
    /* float strength = vUv.y * 10.0;*/

    // ———— Pattern 7 ———————————————————————————————————————————————————————————————————————————
    // Grayscale gradient on y axis with a kind of 'smoothstep' and limit effect with modular
    /* float strength = mod(vUv.y * 10.0, 1.0);*/

    // ———— Pattern 8 ———————————————————————————————————————————————————————————————————————————
    // Bars on y axis
    /* float strength = mod(vUv.y * 10.0, 1.0);
    strength = step(0.5, strength);*/

    // ———— Pattern 9 ———————————————————————————————————————————————————————————————————————————
    // Bars on y axis (bigger step limit)
    /* float strength = mod(vUv.y * 10.0, 1.0);
    strength = step(0.8, strength);*/

    // ———— Pattern 10 ———————————————————————————————————————————————————————————————————————————
    // Bars on X axis (bigger step limit)
    /* float strength = mod(vUv.x * 10.0, 1.0);
    strength = step(0.8, strength);*/

    // ———— Pattern 11  ———————————————————————————————————————————————————————————————————————————
    // Grid (combining them to get kind of a grid)
    /* float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
    strength += step(0.8, mod(vUv.y * 10.0, 1.0)); */

    // ———— Pattern 12  ———————————————————————————————————————————————————————————————————————————
    // Dots (Instead of adding, multiplying)
    /* float strength = step(0.8, mod(vUv.x * 10.0, 1.0));
    strength *= step(0.8, mod(vUv.y * 10.0, 1.0));*/

    // ———— Pattern 13 ———————————————————————————————————————————————————————————————————————————
    // Dotted bars (same as before but bigger step on the y to get wider doted lines)
    /* float strength = step(0.4, mod(vUv.x * 10.0, 1.0));
    strength *= step(0.8, mod(vUv.y * 10.0, 1.0));*/

    // ———— Pattern 14 ———————————————————————————————————————————————————————————————————————————
    // Dotted bars on both axis (L shapes)
    /* float barsX = step(0.4, mod(vUv.x * 10.0, 1.0));
    barsX *= step(0.8, mod(vUv.y * 10.0, 1.0));
    float barsY = step(0.8, mod(vUv.x * 10.0, 1.0));
    barsY *= step(0.4, mod(vUv.y * 10.0, 1.0));

    float strength = barsX + barsY;*/

    // ———— Pattern 15 ———————————————————————————————————————————————————————————————————————————
    // Dotted bars on both axis (+ shapes)
    /* float barsX = step(0.4, mod(vUv.x * 10.0, 1.0));
    barsX *= step(0.8, mod(vUv.y * 10.0 + 0.2, 1.0));
    float barsY = step(0.8, mod(vUv.x * 10.0 + 0.2, 1.0));
    barsY *= step(0.4, mod(vUv.y * 10.0, 1.0));

    float strength = barsX + barsY; */

    // ———— Pattern 16 & 16 extra ———————————————————————————————————————————————————————————————————————————
    /* float strength = abs(vUv.x - 0.5); */
    /* float strength = step(0.1, abs(vUv.x - 0.5)); */

    // ———— Pattern 17 ———————————————————————————————————————————————————————————————————————————
    /* float strength = min(abs(vUv.x - 0.5), abs(vUv.y - 0.5)); */

    // ———— Pattern 18 ———————————————————————————————————————————————————————————————————————————
    /* float strength = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)); */

    // ———— Pattern 19  ———————————————————————————————————————————————————————————————————————————
    /* float strength = step(0.2, max(abs(vUv.x - 0.5), abs(vUv.y - 0.5))); */

    // ———— Pattern 20 ———————————————————————————————————————————————————————————————————————————
    /* float sqr1 = step(0.2 , max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
    float qsr2 = 1.0 - step(0.21 , max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
    float strength = sqr1 * qsr2; */

    // ———— Pattern 21 ———————————————————————————————————————————————————————————————————————————
    /* float strength = floor(vUv.x * 10.0) / 10.0; */

    // ———— Pattern 22 ———————————————————————————————————————————————————————————————————————————
    /* float strength = floor(vUv.x * 10.0) / 10.0;
    strength *= floor(vUv.y   * 10.0) / 10.0; */

    // ———— Pattern 23 ———————————————————————————————————————————————————————————————————————————
    /* float strength  = random(vUv); */

    // ———— Pattern 24  ———————————————————————————————————————————————————————————————————————————
    /* vec2 gridUv = vec2(floor(vUv.x * 10.0) / 10.0, floor(vUv.y * 10.0) / 10.0);
    float strength  = random(gridUv); */

    // ———— Pattern 25 ———————————————————————————————————————————————————————————————————————————
    /* vec2 gridUv = vec2(floor(vUv.x * 10.0) / 10.0, floor((vUv.y + vUv.x * 0.5) * 10.0) / 10.0);
    float strength  = random(gridUv); */

    // ———— Pattern 26 ———————————————————————————————————————————————————————————————————————————
    /* float strength = length(vUv); */

    // ———— Pattern 27 ———————————————————————————————————————————————————————————————————————————
    /* float strength = distance(vUv, vec2(0.5)); */

    // ———— Pattern 28 ———————————————————————————————————————————————————————————————————————————
    /* float strength = 1.0 - distance(vUv, vec2(0.5)); */

    // ———— Pattern 29 ———————————————————————————————————————————————————————————————————————————
    /* float strength =  0.02 / distance(vUv, vec2(0.5)); */

    // ———— Pattern 30 ———————————————————————————————————————————————————————————————————————————
    /* vec2 lightUv = vec2(
      vUv.x * 0.1 + 0.45,
      vUv.y * 0.5 + 0.25
    );
    float strength =  0.02 / distance(lightUv, vec2(0.5)); */

    // ———— Pattern 31 ———————————————————————————————————————————————————————————————————————————
    /* vec2 lightUvX = vec2(vUv.x * 0.1 + 0.45, vUv.y * 0.5 + 0.25);
    float lightX = 0.02 / distance(lightUvX, vec2(0.5));

    vec2 lightUvY = vec2(vUv.y * 0.1 + 0.45, vUv.x * 0.5 + 0.25);
    float lightY = 0.02 / distance(lightUvY, vec2(0.5));

    float strength = lightX * lightY; */

    // ———— Pattern 32 ———————————————————————————————————————————————————————————————————————————
    /* vec2 rotatedUv = rotate(vUv, PI * 0.25, vec2(0.5));
    vec2 lightUvX = vec2(rotatedUv.x * 0.1 + 0.45, rotatedUv.y * 0.5 + 0.25);
    float lightX = 0.02 / distance(lightUvX, vec2(0.5));

    vec2 lightUvY = vec2(rotatedUv.y * 0.1 + 0.45, rotatedUv.x * 0.5 + 0.25);
    float lightY = 0.02 / distance(lightUvY, vec2(0.5));

    float strength = lightX * lightY; */

    // ———— Pattern 33 ———————————————————————————————————————————————————————————————————————————
    /* float strength = step(0.25, distance(vUv, vec2(0.5))); */

    // ———— Pattern 34 ———————————————————————————————————————————————————————————————————————————
    /* float strength = abs(distance(vUv, vec2(0.5)) - 0.25); */

    // ———— Pattern 35 ———————————————————————————————————————————————————————————————————————————
    /* float strength = step(0.01, abs(distance(vUv, vec2(0.5)) - 0.25)); */

    // ———— Pattern 36 ———————————————————————————————————————————————————————————————————————————
    /* float strength = 1.0 -  step(0.01, abs(distance(vUv, vec2(0.5)) - 0.25)); */

    // ———— Pattern 37 ———————————————————————————————————————————————————————————————————————————
    /* vec2 wavedUv = vec2(vUv.x, vUv.y + sin(vUv.x * 30.0) * 0.1);
    float strength = 1.0 -  step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25)); */

    // ———— Pattern 38 ———————————————————————————————————————————————————————————————————————————
    /* vec2 wavedUv = vec2(vUv.x + sin(vUv.y * 30.0) * 0.1, vUv.y + sin(vUv.x * 30.0) * 0.1);
    float strength = 1.0 -  step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25)); */

    // ———— Pattern 39 ———————————————————————————————————————————————————————————————————————————
    /* vec2 wavedUv = vec2(vUv.x + sin(vUv.y * 100.0) * 0.1, vUv.y + sin(vUv.x * 100.0) * 0.1);
    float strength = 1.0 -  step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25)); */

    // ———— Pattern 40 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x, vUv.y);
    float strength = angle; */

    // ———— Pattern 41 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    float strength = angle; */

    // ———— Pattern 42 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle /= PI * 2.0;
    angle += 0.5;
    float strength = angle; */

    // ———— Pattern 43 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle /= PI * 2.0;
    angle += 0.5;
    angle *= 20.0;
    angle = mod(angle, 1.0);
    float strength = angle; */

    // ———— Pattern 44 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle /= PI * 2.0;
    angle += 0.5;
    float strength = sin(angle * 100.0); */

    // ———— Pattern 45 ———————————————————————————————————————————————————————————————————————————
    /* float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
    angle /= PI * 2.0;
    angle += 0.5;
    float sinusoid = sin(angle * 100.0);

    float radius = 0.25 + sinusoid * 0.02;
    float strength = 1.0 - step(0.01, abs(distance(vUv, vec2(0.5)) - radius)); */

    // ———— Pattern 46 ———————————————————————————————————————————————————————————————————————————
    /* float strength = cnoise(vUv * 10.0); */

    // ———— Pattern 47 ———————————————————————————————————————————————————————————————————————————
    /* float strength = step(0.0, cnoise(vUv * 10.0)); */

    // ———— Pattern 48 ———————————————————————————————————————————————————————————————————————————
    /* float strength = 1.0 - abs(cnoise(vUv * 10.0)); */

    // ———— Pattern 49 ———————————————————————————————————————————————————————————————————————————
    /* float strength = sin(cnoise(vUv * 10.0) * 20.0); */

    // ———— Pattern 50 ———————————————————————————————————————————————————————————————————————————
    float strength = step(0.9, sin(cnoise(vUv * 10.0) * 20.0));

    // Strength clamped
    strength = clamp(strength, 0.0, 1.0);

    vec3 blackCol = vec3(0.0);
    vec3 uvCol = vec3(vUv, 1.0);
    vec3 mixCol = mix(blackCol, uvCol, strength);

    gl_FragColor = vec4(mixCol, 1.0);
  }
`

const renderer = new Renderer()
const gl = renderer.gl
document.body.appendChild(gl.canvas)

const camera = new Camera(gl)
camera.position.z = 2

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
  heightSegments: 32
})

const program = new Program(gl, {
  vertex,
  fragment
})

const mesh = new Mesh(gl, { geometry, program })
mesh.setParent(scene)

const update = (t) => {
  requestAnimationFrame(update)

  controls.update()
  renderer.render({ scene, camera })
}
requestAnimationFrame(update)
