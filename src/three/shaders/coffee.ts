import * as THREE from 'three'

/** Coffee surface with a latte-art heart. `uSwirl` 0 → 1 swirls the heart into place. */
export function makeCoffeeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSwirl: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uSwirl; varying vec2 vUv;
      float heart(vec2 p){ p.x = abs(p.x); if (p.y + p.x > 1.0) return sqrt(dot(p - vec2(0.25,0.75), p - vec2(0.25,0.75))) - sqrt(2.0)/4.0;
        return sqrt(min(dot(p - vec2(0.0,1.0), p - vec2(0.0,1.0)), dot(p - 0.5*max(p.x+p.y,0.0), p - 0.5*max(p.x+p.y,0.0)))) * sign(p.x - p.y); }
      void main(){
        vec2 p = vUv*2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x) + (1.0 - uSwirl) * (1.0 - r) * 9.0 + sin(uTime*0.4)*0.05*(1.0-r);
        vec2 q = vec2(cos(a), sin(a)) * r;
        vec3 coffee = mix(vec3(0.36,0.2,0.1), vec3(0.2,0.1,0.05), r);
        float h = heart(vec2(q.x, -q.y*1.05 + 0.55) * 1.7);
        float foam = smoothstep(0.03, -0.03, h) * uSwirl;
        float rim = smoothstep(0.78, 0.98, r);
        vec3 crema = vec3(0.95,0.86,0.72);
        vec3 c = mix(coffee, crema, max(foam, rim*0.85));
        c += pow(max(0.0, 1.0 - length(p - vec2(-0.35, 0.4))*2.2), 3.0) * 0.25; // glossy highlight
        gl_FragColor = vec4(c, 1.0);
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(2.2));
        #include <colorspace_fragment>
      }`,
  })
}
