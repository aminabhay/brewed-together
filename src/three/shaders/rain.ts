import * as THREE from 'three'
import { NOISE } from './noise.glsl'

/**
 * Rain on glass over a blurred night-city backdrop (procedural bokeh lights).
 * `uQuality`: 0 static drops only, 1 + sliding trails, 2 + refraction of the backdrop.
 * `uWipe`: a small canvas the cursor paints on to clear the fog.
 */
export function makeRainMaterial(quality: number, wipe: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uQuality: { value: quality },
      uWipe: { value: wipe },
      uAspect: { value: 1 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uQuality; uniform sampler2D uWipe; uniform float uAspect;
      varying vec2 vUv;
      ${NOISE}
      vec3 city(vec2 uv, float blur){
        vec3 c = mix(vec3(0.03,0.05,0.10), vec3(0.10,0.12,0.22), uv.y);
        c += vec3(0.25,0.14,0.08) * smoothstep(0.55, 0.0, uv.y) * 0.6;
        for (int L = 0; L < 2; L++){
          float s = 6.0 + float(L)*5.0;
          vec2 g = uv*vec2(s*uAspect, s);
          vec2 id = floor(g); vec2 f = fract(g) - 0.5;
          float h = hash21(id + float(L)*13.1);
          vec2 o = (vec2(hash21(id+3.7), hash21(id+9.2)) - 0.5) * 0.6;
          float r = mix(0.12, 0.3, h) + blur*0.12;
          float d = length(f - o);
          float light = smoothstep(r, r*0.3*(1.0-blur*0.7), d) * step(0.45, h) * smoothstep(0.85, 0.3, uv.y);
          vec3 lc = h > 0.8 ? vec3(1.0,0.75,0.4) : h > 0.65 ? vec3(1.0,0.45,0.35) : vec3(0.75,0.85,1.0);
          c += lc * light * (0.55 - float(L)*0.2) * (0.8 + 0.2*sin(uTime*0.5 + h*20.0));
        }
        return c;
      }
      // returns xy offset (normal), z mask
      vec3 drops(vec2 uv, float t){
        vec2 g = uv * vec2(18.0*uAspect, 18.0);
        vec2 id = floor(g); vec2 f = fract(g) - 0.5;
        float h = hash21(id);
        vec2 o = (vec2(h, hash21(id+1.3)) - 0.5) * 0.7;
        float r = mix(0.06, 0.18, hash21(id+2.1));
        vec2 d = f - o;
        float m = smoothstep(r, r*0.6, length(d)) * step(0.35, h);
        vec3 res = vec3(d * m * 3.0, m);
        if (uQuality > 0.5) {
          // sliding drops in columns
          vec2 g2 = uv * vec2(7.0*uAspect, 1.0);
          float col = floor(g2.x);
          float ch = hash21(vec2(col, 4.0));
          float y = fract(uv.y + t*(0.08 + ch*0.12) + ch);
          vec2 p = vec2(fract(g2.x) - 0.5 + sin(uv.y*20.0+ch*6.0)*0.08, (y - 0.5) * 7.0);
          float drop = smoothstep(0.22, 0.12, length(p*vec2(1.0, 1.4)));
          float trail = smoothstep(0.06, 0.0, abs(p.x)) * smoothstep(0.0, 2.2, p.y) * smoothstep(3.5, 0.5, p.y) * 0.6;
          float tdots = trail * step(0.6, hash21(floor(vec2(col, uv.y*60.0))));
          res.xy += p * drop * 0.25;
          res.z = max(res.z, max(drop, tdots));
        }
        return res;
      }
      void main(){
        vec2 uv = vUv;
        float t = uQuality > 0.0 ? uTime : 0.0;
        vec3 d = drops(uv, t);
        float wipe = texture2D(uWipe, uv).r;
        float fog = clamp(1.0 - wipe, 0.0, 1.0);
        float blur = mix(0.2, 1.0, fog) * (1.0 - d.z);
        vec2 ruv = uv + (uQuality > 1.5 ? d.xy * 0.08 : vec2(0.0));
        vec3 c = city(ruv, blur);
        c = mix(c, c * 1.25 + 0.03, d.z);           // drops catch light
        c += vec3(0.08,0.09,0.12) * fog * (1.0 - d.z); // misted glass
        gl_FragColor = vec4(c, 1.0);
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2));
        #include <colorspace_fragment>
      }`,
  })
}
