import { useEffect, useRef } from 'react';

// A small, decorative WebGL surface; CSS remains visible if WebGL is unavailable.
export default function StaffGradient() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!surface || motion.matches) return;
    const gl = surface.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    if (!program || !buffer) return;
    const sources = [
      'attribute vec2 position; varying vec2 uv; void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }',
      `precision mediump float;
      varying vec2 uv; uniform float time;
      void main(){
        vec2 p=uv*vec2(3.,1.);
        float wave=sin(p.x*2.4+sin(p.y*3.+time*.12)+time*.08);
        float fold=sin(p.y*4.-p.x+wave*.8);
        float light=smoothstep(-.8,1.,wave*fold);
        float gray=mix(.035,.19,light)*(.6+.4*uv.x);
        gl_FragColor=vec4(vec3(gray),1.);
      }`,
    ];
    for (const [index, source] of sources.entries()) {
      const shader = gl.createShader(index === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
      if (!shader) continue;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    let frame = 0;
    let visible = true;
    let last = 0;
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }
    const time = gl.getUniformLocation(program, 'time');
    const draw = (now: number) => {
      if (!visible || document.hidden || motion.matches || gl.isContextLost()) return;
      if (now - last >= 1000 / 24) {
        gl.uniform1f(time, now / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        last = now;
      }
      frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(() => {
      // Decorative resolution is deliberately capped, independent of device pixel ratio.
      surface.width = Math.min(800, Math.max(1, surface.clientWidth));
      surface.height = Math.min(200, Math.max(1, surface.clientHeight));
      gl.viewport(0, 0, surface.width, surface.height);
      resume();
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      resume();
    });
    resize.observe(surface);
    intersection.observe(surface);
    document.addEventListener('visibilitychange', resume);
    motion.addEventListener('change', resume);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', resume);
      motion.removeEventListener('change', resume);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);
  return <canvas ref={canvas} className="staff-gradient" aria-hidden="true" />;
}
