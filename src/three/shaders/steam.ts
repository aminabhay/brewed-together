import * as THREE from 'three'
import { NOISE } from './noise.glsl'

/**
 * Steam: scrolling fbm wisps. With a mask texture, `uForm` pulls the wisps into the
 * mask's shape (writes titles, forms the heart).
 */
export function makeSteamMaterial(color = '#fff4e6') {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.55 },
      uWind: { value: 0 },
      uMask: { value: null as THREE.Texture | null },
      uHasMask: { value: 0 },
      uForm: { value: 0 },
      uSeed: { value: Math.random() * 10 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uWind; uniform float uForm; uniform float uSeed;
      varying vec2 vUv;
      void main(){
        vUv = uv;
        vec3 p = position;
        float sway = (sin(uTime*1.3 + uv.y*4.0 + uSeed) * 0.06 + uWind*0.15) * uv.y * (1.0-uForm);
        p.x += sway;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uColor; uniform float uOpacity; uniform sampler2D uMask;
      uniform float uHasMask; uniform float uForm; uniform float uSeed;
      varying vec2 vUv;
      ${NOISE}
      void main(){
        vec2 uv = vUv;
        vec2 p = vec2(uv.x*2.0, uv.y*1.6 - uTime*0.35) + uSeed;
        float n = fbm(p*2.2 + fbm(p*1.5 + uTime*0.1));
        float bend = (fbm(vec2(uv.y*2.0 - uTime*0.3, uSeed)) - 0.5) * 0.5 * uv.y;
        float col = smoothstep(0.32 + uv.y*0.12, 0.0, abs(uv.x - 0.5 + bend));
        float a = col * smoothstep(0.35, 0.8, n) * smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.45, uv.y);
        if (uHasMask > 0.5) {
          vec2 d = (vec2(n, fbm(p*1.7)) - 0.5) * 0.12 * (1.0 - uForm*0.8);
          float m = texture2D(uMask, uv + d).a;
          float wisp = smoothstep(0.25, 0.75, fbm(uv*6.0 + vec2(0.0, -uTime*0.4)));
          float shaped = m * (0.55 + 0.45*wisp) * smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
          a = mix(a, shaped, uForm);
        }
        gl_FragColor = vec4(uColor, a * uOpacity);
      }`,
  })
}
