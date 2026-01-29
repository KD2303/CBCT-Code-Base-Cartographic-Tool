import React, { useRef, useEffect } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Plane } from 'ogl';

const vertex = `
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    // Simple wave effect
    pos.z += sin(pos.x * 2.0 + uTime) * 0.2;
    pos.y += cos(pos.x * 2.0 + uTime) * 0.2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 light = normalize(vec3(0.5, 1.0, 1.0));
    float d = dot(normal, light) * 0.5 + 0.5;
    
    vec3 colorA = vec3(0.1, 0.1, 0.3); // Dark Blue
    vec3 colorB = vec3(0.2, 0.6, 1.0); // Light Blue
    vec3 colorC = vec3(0.8, 0.2, 0.9); // Pink/Purple

    vec3 finalColor = mix(colorA, colorB, vUv.y + sin(uTime * 0.5) * 0.2);
    finalColor = mix(finalColor, colorC, sin(vUv.x * 4.0 + uTime) * 0.2 * d);

    gl_FragColor = vec4(finalColor, 0.4);
  }
`;

export default function Prism() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const renderer = new Renderer({ alpha: true, dpr: 2 });
    const gl = renderer.gl;
    containerRef.current.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, 0, 5);

    function resize() {
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const scene = new Transform();
    
    // Create a mesh with a plane geometry
    const geometry = new Plane(gl, { width: 5, height: 5, widthSegments: 20, heightSegments: 20 });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      cullFace: null, // Render both sides
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);
    mesh.rotation.x = -0.5;

    let animateId;
    function update(t) {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      
      mesh.rotation.z += 0.001;
      mesh.rotation.y = Math.sin(t * 0.0005) * 0.2;

      renderer.render({ scene, camera });
    }
    animateId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animateId);
      if (containerRef.current && containerRef.current.contains(gl.canvas)) {
        containerRef.current.removeChild(gl.canvas);
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}
