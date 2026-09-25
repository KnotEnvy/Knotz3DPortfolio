const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./SMAAPass-LePNBE7g.js","./three-Z4IPvQxA.js"])))=>i.map(i=>d[i]);
import{M as b,O as Zt,B as Ae,F as yt,S as V,U as Ze,V as q,W as Ke,H as Xe,N as es,C as ts,a as x,b as g,A as O,c as K,R as ss,d as is,e as as,L as os,f as ns,g as rs,h as jt,i as ls,j as hs,k as cs,l as ds,m as us,P as ps,n as ms,G as F,o as $,I as re,p as ft,q as R,r as Se,s as gt,t as Vt,T as U,u as Q,D as Me,v as Ce,Q as ie,w as xt,x as Gt,E as fs,y as gs,z as vs,J as bs,K as ws,X as ys,Y as xs,Z as st,_ as Pe,$ as H,a0 as Ot,a1 as ks,a2 as Ss,a3 as Nt,a4 as Ie,a5 as Ms,a6 as _s,a7 as Ht,a8 as qt,a9 as dt,aa as kt}from"./three-Z4IPvQxA.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=t(i);fetch(i.href,a)}})();const Ts="modulepreload",As=function(l,e){return new URL(l,e).href},St={},Cs=function(e,t,s){let i=Promise.resolve();if(t&&t.length>0){let o=function(c){return Promise.all(c.map(u=>Promise.resolve(u).then(f=>({status:"fulfilled",value:f}),f=>({status:"rejected",reason:f}))))};const r=document.getElementsByTagName("link"),h=document.querySelector("meta[property=csp-nonce]"),d=h?.nonce||h?.getAttribute("nonce");i=o(t.map(c=>{if(c=As(c,s),c in St)return;St[c]=!0;const u=c.endsWith(".css"),f=u?'[rel="stylesheet"]':"";if(!!s)for(let m=r.length-1;m>=0;m--){const k=r[m];if(k.href===c&&(!u||k.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${f}`))return;const p=document.createElement("link");if(p.rel=u?"stylesheet":Ts,u||(p.as="script"),p.crossOrigin="",p.href=c,d&&p.setAttribute("nonce",d),document.head.appendChild(p),u)return new Promise((m,k)=>{p.addEventListener("load",m),p.addEventListener("error",()=>k(new Error(`Unable to preload CSS for ${c}`)))})}))}function a(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return i.then(o=>{for(const r of o||[])r.status==="rejected"&&a(r.reason);return e().catch(a)})},Ye={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class De{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Ps=new Zt(-1,1,1,-1,0,1);class Ds extends Ae{constructor(){super(),this.setAttribute("position",new yt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new yt([0,2,0,0,2,0],2))}}const Es=new Ds;class vt{constructor(e){this._mesh=new b(Es,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Ps)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class ut extends De{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof V?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Ze.clone(e.uniforms),this.material=new V({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new vt(this.material)}render(e,t,s){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=s.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class Mt extends De{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,s){const i=e.getContext(),a=e.state;a.buffers.color.setMask(!1),a.buffers.depth.setMask(!1),a.buffers.color.setLocked(!0),a.buffers.depth.setLocked(!0);let o,r;this.inverse?(o=0,r=1):(o=1,r=0),a.buffers.stencil.setTest(!0),a.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),a.buffers.stencil.setFunc(i.ALWAYS,o,4294967295),a.buffers.stencil.setClear(r),a.buffers.stencil.setLocked(!0),e.setRenderTarget(s),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),a.buffers.color.setLocked(!1),a.buffers.depth.setLocked(!1),a.buffers.color.setMask(!0),a.buffers.depth.setMask(!0),a.buffers.stencil.setLocked(!1),a.buffers.stencil.setFunc(i.EQUAL,1,4294967295),a.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),a.buffers.stencil.setLocked(!0)}}class Ls extends De{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class Is{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const s=e.getSize(new q);this._width=s.width,this._height=s.height,t=new Ke(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Xe}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new ut(Ye),this.copyPass.material.blending=es,this.clock=new ts}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let s=!1;for(let i=0,a=this.passes.length;i<a;i++){const o=this.passes[i];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,s),o.needsSwap){if(s){const r=this.renderer.getContext(),h=this.renderer.state.buffers.stencil;h.setFunc(r.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),h.setFunc(r.EQUAL,1,4294967295)}this.swapBuffers()}Mt!==void 0&&(o instanceof Mt?s=!0:o instanceof Ls&&(s=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new q);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const s=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(s,i),this.renderTarget2.setSize(s,i);for(let a=0;a<this.passes.length;a++)this.passes[a].setSize(s,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Fs extends De{constructor(e,t,s=null,i=null,a=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=s,this.clearColor=i,this.clearAlpha=a,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new x}render(e,t,s){const i=e.autoClear;e.autoClear=!1;let a,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(a=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:s),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(a),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=i}}const zs={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new x(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class _e extends De{constructor(e,t=1,s,i){super(),this.strength=t,this.radius=s,this.threshold=i,this.resolution=e!==void 0?new q(e.x,e.y):new q(256,256),this.clearColor=new x(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let a=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new Ke(a,o,{type:Xe}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let c=0;c<this.nMips;c++){const u=new Ke(a,o,{type:Xe});u.texture.name="UnrealBloomPass.h"+c,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const f=new Ke(a,o,{type:Xe});f.texture.name="UnrealBloomPass.v"+c,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),a=Math.round(a/2),o=Math.round(o/2)}const r=zs;this.highPassUniforms=Ze.clone(r.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new V({uniforms:this.highPassUniforms,vertexShader:r.vertexShader,fragmentShader:r.fragmentShader}),this.separableBlurMaterials=[];const h=[3,5,7,9,11];a=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let c=0;c<this.nMips;c++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(h[c])),this.separableBlurMaterials[c].uniforms.invSize.value=new q(1/a,1/o),a=Math.round(a/2),o=Math.round(o/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const d=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=d,this.bloomTintColors=[new g(1,1,1),new g(1,1,1),new g(1,1,1),new g(1,1,1),new g(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Ze.clone(Ye.uniforms),this.blendMaterial=new V({uniforms:this.copyUniforms,vertexShader:Ye.vertexShader,fragmentShader:Ye.fragmentShader,blending:O,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new x,this._oldClearAlpha=1,this._basic=new K,this._fsQuad=new vt(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let s=Math.round(e/2),i=Math.round(t/2);this.renderTargetBright.setSize(s,i);for(let a=0;a<this.nMips;a++)this.renderTargetsHorizontal[a].setSize(s,i),this.renderTargetsVertical[a].setSize(s,i),this.separableBlurMaterials[a].uniforms.invSize.value=new q(1/s,1/i),s=Math.round(s/2),i=Math.round(i/2)}render(e,t,s,i,a){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),a&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=s.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=s.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let r=this.renderTargetBright;for(let h=0;h<this.nMips;h++)this._fsQuad.material=this.separableBlurMaterials[h],this.separableBlurMaterials[h].uniforms.colorTexture.value=r.texture,this.separableBlurMaterials[h].uniforms.direction.value=_e.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[h]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[h].uniforms.colorTexture.value=this.renderTargetsHorizontal[h].texture,this.separableBlurMaterials[h].uniforms.direction.value=_e.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[h]),e.clear(),this._fsQuad.render(e),r=this.renderTargetsVertical[h];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(s),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){const t=[];for(let s=0;s<e;s++)t.push(.39894*Math.exp(-.5*s*s/(e*e))/e);return new V({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new q(.5,.5)},direction:{value:new q(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}_getCompositeMaterial(e){return new V({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}_e.BlurDirectionX=new q(1,0);_e.BlurDirectionY=new q(0,1);const Be={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class Rs extends De{constructor(){super(),this.uniforms=Ze.clone(Be.uniforms),this.material=new ss({name:Be.name,uniforms:this.uniforms,vertexShader:Be.vertexShader,fragmentShader:Be.fragmentShader}),this._fsQuad=new vt(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,s){this.uniforms.tDiffuse.value=s.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},is.getTransfer(this._outputColorSpace)===as&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===os?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===ns?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===rs?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===jt?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===ls?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===hs?this.material.defines.NEUTRAL_TONE_MAPPING="":this._toneMapping===cs&&(this.material.defines.CUSTOM_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}const Bs={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new q(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;

			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {

				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );

		}`},L=(l,e,t)=>l<e?e:l>t?t:l,js=(l,e,t)=>l+(e-l)*t,D=(l,e,t,s)=>js(l,e,1-Math.exp(-t*s)),ot=(l,e,t)=>{const s=L((t-l)/(e-l),0,1);return s*s*(3-2*s)};function bt(l){let e=l>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}const Vs={uniforms:{tDiffuse:{value:null},time:{value:0},resolution:{value:new q(1,1)},amount:{value:.028},vignette:{value:.85},uBoost:{value:0},uDamage:{value:0},uFlash:{value:0},uAccent:{value:new x(5104065)},uShock:{value:new ds(.5,.5,1,0)},uWarp:{value:0}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float amount;
    uniform float vignette;
    uniform float uBoost;
    uniform float uDamage;
    uniform float uFlash;
    uniform vec3 uAccent;
    uniform vec2 resolution;
    uniform vec4 uShock;
    uniform float uWarp;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(443.897, 441.423));
      p += dot(p, p + 19.19);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 uv = vUv;

      // Shockwave. A ring of refraction racing out from a detonation's screen
      // position: the frame itself bends where the blast front is. Aspect-
      // corrected so the ring is a circle, not an ellipse the shape of the
      // window, and faded as it grows so it never reaches the edges at strength.
      float ring = 0.0;
      if (uShock.w > 0.001 && uShock.z < 1.0) {
        float aspect = resolution.x / max(resolution.y, 1.0);
        vec2 d = (uv - uShock.xy) * vec2(aspect, 1.0);
        float dist = length(d);
        float radius = uShock.z * 0.95;
        float band = 1.0 - smoothstep(0.0, 0.07, abs(dist - radius));
        ring = band * (1.0 - uShock.z) * uShock.w;
        uv -= (d / max(dist, 1e-4)) * vec2(1.0 / aspect, 1.0) * ring * 0.035;
      }

      vec2 c = uv - 0.5;
      float r2 = dot(c, c);

      // Chromatic aberration, stronger toward the edges and under boost. Kept
      // subtle: the starfield is made of near-pixel-sized points, and splitting
      // a one-pixel feature by two pixels does not fringe it, it triples it into
      // three coloured dots and the whole sky turns to rainbow confetti.
      float ca = (r2 * 0.0014) * (1.0 + uBoost * 1.8 + uFlash * 1.6 + uWarp * 5.0) + ring * 0.006;

      // Radial streak. Taps are pulled toward the centre, weighted so the frame
      // edges smear hard under boost while the middle stays readable — the
      // cheapest convincing speed cue there is.
      //
      // The per-channel offsets are applied *inside* this loop on purpose. An
      // earlier version streaked into the colour and then re-sampled tDiffuse
      // for the red and blue channels afterwards, which threw the streak away on
      // two channels out of three and left boost looking green and noisy rather
      // than fast.
      // Boost has to read as direction, not as brightness. At 0.06 the radial
      // pull was subtle enough that the frame's speckle read as noise sitting on
      // a still image rather than as the frame moving — the streak has to be the
      // loudest thing about a boosted frame or the effect is doing nothing.
      float streak = uBoost * 0.105 + uFlash * 0.02 + uWarp * 0.16;
      vec3 col;
      if (streak > 0.0005) {
        vec3 accum = vec3(0.0);
        float total = 0.0;
        for (int i = 0; i < 5; i++) {
          float f = float(i) / 4.0;
          float w = 1.0 - f * 0.72;
          vec2 base = uv - c * f * streak * (0.35 + r2 * 2.2);
          accum.r += texture2D(tDiffuse, base + c * ca).r * w;
          accum.g += texture2D(tDiffuse, base).g * w;
          accum.b += texture2D(tDiffuse, base - c * ca).b * w;
          total += w;
        }
        col = accum / total;
      } else {
        col.r = texture2D(tDiffuse, uv + c * ca).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - c * ca).b;
      }

      // Grain.
      float n = hash(uv * resolution + fract(time) * 373.0);
      col += (n - 0.5) * amount;

      // Vignette.
      col *= mix(1.0, 1.0 - r2 * 1.2, vignette);

      // Damage: a red rim that breathes, so low hull is felt before it is read.
      //
      // The stops matter. r2 only reaches 0.5 in the corners, so an inner stop
      // of 0.06 saturated across most of the frame — during a boss fight, where
      // sentries fire continuously, the whole screen sat under a red wash and
      // the sector's own colour identity disappeared. Keep it on the edges.
      if (uDamage > 0.001) {
        float edge = smoothstep(0.26, 0.5, r2);
        float beat = 0.7 + 0.3 * sin(time * 7.0);
        col = mix(col, vec3(0.85, 0.06, 0.16), edge * uDamage * 0.4 * beat);
      }

      // Explosion flash, tinted with the sector accent so it never reads grey.
      // Deliberately modest: a flash should be a punch you feel over a few
      // frames, not a white-out you have to sit through.
      col += mix(vec3(1.0), uAccent, 0.28) * uFlash * 0.34;

      // The blast front carries a little light of its own, so the ring reads as
      // energy rather than as a lens defect.
      col += uAccent * ring * 0.16;

      // Arrival: the edges glow in the new sector's colour as the frame
      // un-stretches, which is what sells "we just dropped out of warp".
      col += uAccent * smoothstep(0.08, 0.5, r2) * uWarp * 0.45;

      // Scanline. Subtle enough to survive on a phone, present enough to sell
      // the terminal fiction on a desktop.
      col *= 1.0 - 0.012 * step(0.5, fract(uv.y * resolution.y * 0.5));

      gl_FragColor = vec4(col, 1.0);
    }
  `},ee=[{id:0,name:"Low",pixelRatio:1,bloomStrength:.5,starCount:1800,detail:.5,particles:1500,grain:!1,aa:"fxaa"},{id:1,name:"Medium",pixelRatio:1.3,bloomStrength:.66,starCount:2800,detail:.8,particles:3e3,grain:!0,aa:"fxaa"},{id:2,name:"High",pixelRatio:1.85,bloomStrength:.8,starCount:4200,detail:1,particles:5e3,grain:!0,aa:"smaa"}];class Gs{constructor(e){this.canvas=e,this.tier=Os();const t=new URLSearchParams(location.search).get("tier");if(t!==null){const s=Number(t);Number.isFinite(s)&&ee[L(s,0,ee.length-1)]&&(this.tier=ee[L(s,0,ee.length-1)])}this.renderer=new us({canvas:e,antialias:!1,powerPreference:"high-performance",stencil:!1,alpha:!1}),this.renderer.setClearColor(197642,1),this.renderer.toneMapping=jt,this.renderer.toneMappingExposure=.95,this.camera=new ps(66,1,.6,6e3),this.camera.position.set(0,6,40),this.composer=new Is(this.renderer),this.renderPass=new Fs(this.scene,this.camera),this.composer.addPass(this.renderPass),this.bloomPass=new _e(new q(1,1),this.tier.bloomStrength,.45,.62),this.composer.addPass(this.bloomPass),this.compositePass=new ut(Vs),this.composer.addPass(this.compositePass),this.fxaaPass=new ut(Bs),this.composer.addPass(this.fxaaPass),this.outputPass=new Rs,this.composer.addPass(this.outputPass),this.applyTier(this.tier),this.resize(),window.addEventListener("resize",this.resize,{passive:!0}),window.addEventListener("orientationchange",this.resize,{passive:!0})}renderer;scene=new ms;camera;composer;bloomPass;compositePass;renderPass;outputPass;smaaPass=null;fxaaPass;boost=0;damage=0;flash=0;warpAmt=0;shockAge=1;shockTtl=1;shockProj=new g;tier;frameSamples=[];lastDowngrade=0;smaaLoading=!1;applyTier(e){this.tier=e,this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,e.pixelRatio)),this.bloomPass.strength=e.bloomStrength,this.compositePass.uniforms.amount.value=e.grain?.028:0,e.aa==="smaa"&&this.loadSmaa(),this.applyAa(),this.resize()}async loadSmaa(){if(!(this.smaaPass||this.smaaLoading)){this.smaaLoading=!0;try{const e=await Cs(()=>import("./SMAAPass-LePNBE7g.js"),__vite__mapDeps([0,1]),import.meta.url),t=new e.SMAAPass,s=this.composer.passes.indexOf(this.outputPass);this.composer.insertPass(t,s<0?this.composer.passes.length:s),this.smaaPass=t,t.setSize(window.innerWidth,window.innerHeight),this.applyAa()}catch{}finally{this.smaaLoading=!1}}}applyAa(){const e=this.tier.aa==="smaa"&&!!this.smaaPass;this.smaaPass&&(this.smaaPass.enabled=e),this.fxaaPass.enabled=!e}setTier(e){const t=ee[L(e,0,ee.length-1)];t.id!==this.tier.id&&this.applyTier(t)}resize=()=>{const e=window.innerWidth,t=window.innerHeight;this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.renderer.setSize(e,t,!1),this.composer.setSize(e,t);const s=this.renderer.getPixelRatio();this.compositePass.uniforms.resolution.value.set(e*s,t*s),this.fxaaPass.material.uniforms.resolution.value.set(1/(e*s),1/(t*s)),this.smaaPass?.setSize(e,t)};setPost(e,t,s){this.boost=e,this.damage=t,this.compositePass.uniforms.uAccent.value.lerp(s,.08)}punch(e){this.flash=Math.min(.7,this.flash+e)}shockwave(e,t=1,s=.9){const i=this.shockProj.copy(e).project(this.camera);if(i.z>1||i.z<-1)return;this.compositePass.uniforms.uShock.value.set(i.x*.5+.5,i.y*.5+.5,0,L(t,0,1.5)),this.shockAge=0,this.shockTtl=s}get warpLevel(){return this.warpAmt}warp(e=1){this.warpAmt=Math.max(this.warpAmt,e)}governQuality(e,t){if(this.frameSamples.push(e),this.frameSamples.length<90)return;const s=this.frameSamples.reduce((i,a)=>i+a,0)/this.frameSamples.length;this.frameSamples.length=0,s>1/38&&this.tier.id>0&&t-this.lastDowngrade>6e3&&(this.lastDowngrade=t,this.applyTier(ee[this.tier.id-1]))}render(e,t){const s=this.compositePass.uniforms;if(s.time.value=t,s.uBoost.value=D(s.uBoost.value,this.boost,3,e),s.uDamage.value=D(s.uDamage.value,this.damage,4,e),this.flash=Math.max(0,this.flash-e*8),s.uFlash.value=this.flash,this.warpAmt=Math.max(0,this.warpAmt-e*1.4),s.uWarp.value=this.warpAmt*this.warpAmt,this.shockAge<this.shockTtl){this.shockAge+=e;const i=Math.min(1,this.shockAge/this.shockTtl);s.uShock.value.z=1-Math.pow(1-i,2.2)}else s.uShock.value.w=0;this.composer.render(),this.governQuality(e,performance.now())}dispose(){window.removeEventListener("resize",this.resize),window.removeEventListener("orientationchange",this.resize),this.composer.dispose(),this.renderer.dispose()}}function Os(){const l=navigator,e=l.hardwareConcurrency??4,t=l.deviceMemory??4,s=window.matchMedia("(pointer: coarse)").matches,i=Math.min(window.innerWidth,window.innerHeight)<700;return s&&(e<=4||t<=3)?ee[0]:s||i||e<=4||t<=4?ee[1]:ee[2]}const _t={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",ShiftLeft:"boost",ShiftRight:"boost",Space:"fire",KeyJ:"fire",KeyC:"brake",ControlLeft:"brake"},Tt=88;class Ns{constructor(e){this.target=e,this.coarse=window.matchMedia("(pointer: coarse)").matches,this.bind()}state={steer:0,pitch:0,boost:0,fire:!1,brake:!1};pressed={up:!1,down:!1,left:!1,right:!1,boost:!1,fire:!1,brake:!1};aimX=0;aimY=0;usingPointer=!1;mouseFire=!1;touchId=null;touchOx=0;touchOy=0;stickX=0;stickY=0;touchBoost=!1;touchFire=!1;moved=!1;coarse;disposers=[];bind(){const e=c=>{const u=_t[c.code];u&&(c.target instanceof HTMLInputElement||c.target instanceof HTMLTextAreaElement||(c.code==="Space"&&c.preventDefault(),this.pressed[u]=!0,(u==="left"||u==="right"||u==="up"||u==="down")&&(this.usingPointer=!1),this.moved=!0))},t=c=>{const u=_t[c.code];u&&(this.pressed[u]=!1)},s=()=>{for(const c of Object.keys(this.pressed))this.pressed[c]=!1;this.mouseFire=!1,this.touchId=null,this.stickX=0,this.stickY=0},i=c=>{const u=this.target.getBoundingClientRect();this.aimX=L((c.clientX-u.left)/u.width*2-1,-1,1),this.aimY=L((c.clientY-u.top)/u.height*2-1,-1,1),this.usingPointer=!0,this.moved=!0},a=c=>{if(c.pointerType==="touch"){if(c.pointerId!==this.touchId)return;this.stickX=L((c.clientX-this.touchOx)/Tt,-1,1),this.stickY=L((c.clientY-this.touchOy)/Tt,-1,1),this.moved=!0;return}i(c)},o=c=>{if(c.pointerType==="touch"){if(this.touchId!==null)return;this.touchId=c.pointerId,this.touchOx=c.clientX,this.touchOy=c.clientY,this.stickX=0,this.stickY=0,this.moved=!0;return}i(c),this.mouseFire=!0},r=c=>{c.pointerId===this.touchId&&(this.touchId=null,this.stickX=0,this.stickY=0),c.pointerType!=="touch"&&(this.mouseFire=!1)},h=()=>{this.usingPointer=!1,this.aimX=0,this.aimY=0,this.mouseFire=!1},d=c=>c.preventDefault();this.target.addEventListener("pointermove",a,{passive:!0}),this.target.addEventListener("pointerdown",o,{passive:!0}),this.target.addEventListener("pointerleave",h,{passive:!0}),this.target.addEventListener("contextmenu",d),window.addEventListener("pointerup",r,{passive:!0}),window.addEventListener("pointercancel",r,{passive:!0}),window.addEventListener("keydown",e),window.addEventListener("keyup",t),window.addEventListener("blur",s),this.disposers.push(()=>this.target.removeEventListener("pointermove",a),()=>this.target.removeEventListener("pointerdown",o),()=>this.target.removeEventListener("pointerleave",h),()=>this.target.removeEventListener("contextmenu",d),()=>window.removeEventListener("pointerup",r),()=>window.removeEventListener("pointercancel",r),()=>window.removeEventListener("keydown",e),()=>window.removeEventListener("keyup",t),()=>window.removeEventListener("blur",s))}get reticle(){return this.touchId!==null?{x:this.stickX,y:this.stickY,active:!0}:{x:this.aimX,y:this.aimY,active:this.usingPointer}}sample(e){const t=this.state;if(!e)return t.steer=0,t.pitch=0,t.boost=0,t.fire=!1,t.brake=!1,t;const s=(this.pressed.right?1:0)-(this.pressed.left?1:0),i=(this.pressed.up?1:0)-(this.pressed.down?1:0);return this.touchId!==null?(t.steer=this.stickX,t.pitch=-this.stickY):s!==0||i!==0?(t.steer=s,t.pitch=i):this.usingPointer?(t.steer=Math.abs(this.aimX)<.06?0:this.aimX,t.pitch=Math.abs(this.aimY)<.06?0:-this.aimY):(t.steer=0,t.pitch=0),t.boost=this.pressed.boost||this.touchBoost?1:0,t.fire=this.pressed.fire||this.mouseFire||this.touchFire||this.coarse&&this.touchId!==null,t.brake=this.pressed.brake,t}dispose(){for(const e of this.disposers)e();this.disposers=[]}}const At=["pad","arp","bass","kick","snare","hat","lead"],T=null,je=[{name:"Cold Open",root:45,bpm:96,prog:[0,8,3,10],quality:["m","M","M","M"],arp:"up",busy:!1,lead:[4,T,3,T,2,T,1,2,4,T,5,T,4,3,T,T]},{name:"Payroll",root:48,bpm:104,prog:[0,10,8,10],quality:["m","M","M","M"],arp:"updown",busy:!1,lead:[2,T,4,T,5,4,T,2,3,T,2,T,1,T,0,T]},{name:"The Forge",root:50,bpm:110,prog:[0,8,5,7],quality:["m","M","m","M"],arp:"pulse",busy:!1,lead:[0,0,4,T,3,T,2,T,0,0,4,T,5,6,4,T]},{name:"Insert Coin",root:52,bpm:116,prog:[0,3,10,8],quality:["m","M","M","M"],arp:"cascade",busy:!0,lead:[4,5,6,4,T,2,3,T,4,5,6,8,T,6,4,T]},{name:"Track Record",root:42,bpm:120,prog:[8,10,0,7],quality:["M","M","m","M"],arp:"updown",busy:!0,lead:[4,T,4,5,6,T,5,4,2,T,3,4,T,2,1,T]},{name:"Uplink",root:45,bpm:124,prog:[5,8,10,0],quality:["m","M","M","m"],arp:"up",busy:!0,lead:[6,T,5,4,T,4,5,6,8,T,6,T,5,4,2,T]}],Hs={name:"Signal",root:45,bpm:100,prog:[8,10,3,3],quality:["M","M","M","M"],arp:"updown",busy:!1,lead:[4,T,5,T,6,T,4,T,8,T,6,5,4,T,T,T]},he=(l,e,t,s,i,a,o)=>({pad:l,arp:e,bass:t,kick:s,snare:i,hat:a,lead:o}),Ct={silent:{layers:he(0,0,0,0,0,0,0),cutoff:800},title:{layers:he(.9,.45,0,0,0,0,0),cutoff:1500},travel:{layers:he(.75,.75,.7,.55,0,.5,0),cutoff:6e3},combat:{layers:he(.6,.7,1,1,.85,.85,0),cutoff:14e3},boss:{layers:he(.6,.75,1,1,1,1,.85),cutoff:16e3},dossier:{layers:he(.85,.3,0,0,0,0,0),cutoff:1100},paused:{layers:he(.7,.3,.4,0,0,0,0),cutoff:700},finale:{layers:he(.9,.7,.6,.5,.4,.5,.75),cutoff:9e3}},Ve={silent:0,dossier:1,paused:1,title:1,travel:2,finale:2,combat:3,boss:4},qs=.2,$s=25,ce=l=>440*Math.pow(2,(l-69)/12),nt=(l,e)=>{let t=l;for(;t<e;)t+=12;for(;t>=e+12;)t-=12;return t};class Us{constructor(e,t,s){this.ctx=e,this.noise=s,this.out=e.createGain(),this.out.gain.value=.55,this.out.connect(t),this.duckGain=e.createGain(),this.duckGain.connect(this.out),this.filter=e.createBiquadFilter(),this.filter.type="lowpass",this.filter.frequency.value=Ct.silent.cutoff,this.filter.Q.value=.6,this.filter.connect(this.duckGain),this.pump=e.createGain(),this.pump.connect(this.filter),this.drums=e.createGain(),this.drums.connect(this.filter);for(const r of At){const h=e.createGain();h.gain.value=0;const d=r==="pad"||r==="arp"||r==="bass"||r==="lead";h.connect(d?this.pump:this.drums),this.layer[r]=h,this.want[r]=0,this.tail[r]=0}const i=e.createConvolver();i.buffer=Ks(e,2.4,2.6),this.reverbSend=e.createGain(),this.reverbSend.gain.value=.32,this.reverbSend.connect(i),i.connect(this.pump);for(const r of["pad","arp","lead","snare"])this.layer[r].connect(this.reverbSend);this.delay=e.createDelay(2);const a=e.createGain();a.gain.value=.36;const o=e.createBiquadFilter();o.type="lowpass",o.frequency.value=2600,this.delaySend=e.createGain(),this.delaySend.gain.value=.28,this.delaySend.connect(this.delay),this.delay.connect(o),o.connect(a),a.connect(this.delay),o.connect(this.pump),this.layer.arp.connect(this.delaySend),this.layer.lead.connect(this.delaySend),this.syncDelay(),this.nextTime=e.currentTime+.08,this.timer=window.setInterval(()=>this.schedule(),$s)}out;duckGain;filter;pump;drums;layer={};reverbSend;delaySend;delay;mood="silent";want={};tail={};track=je[0];pending=null;trackIndex=0;finaleOn=!1;crashNext=!1;kicks=[];step=0;nextTime=0;timer=0;enabled=!0;setMood(e){if(e===this.mood)return;const t=Ve[e]>Ve[this.mood]&&Ve[e]>=3;this.mood=e;const s=Ct[e],i=this.ctx.currentTime;for(const o of At){const r=s.layers[o];this.want[o]=r,r<=.001&&(this.tail[o]=i+2.5);const h=o==="kick"||o==="snare"||o==="hat"?.12:.7;this.layer[o].gain.cancelScheduledValues(i),this.layer[o].gain.setTargetAtTime(r,i,h)}this.filter.frequency.cancelScheduledValues(i),this.filter.frequency.setTargetAtTime(s.cutoff,i,e==="dossier"||e==="paused"?.35:.9),t&&(this.crashNext=!0);const a=e==="finale";a!==this.finaleOn&&(this.finaleOn=a,this.pending=a?Hs:je[this.trackIndex])}setSector(e){const t=Math.max(0,Math.min(je.length-1,e));t!==this.trackIndex&&(this.trackIndex=t,this.finaleOn||(this.pending=je[t]))}setEnabled(e){this.enabled=e;const t=this.ctx.currentTime;this.out.gain.cancelScheduledValues(t),this.out.gain.setTargetAtTime(e?.55:0,t,.3)}get isEnabled(){return this.enabled}duck(e,t){const s=this.ctx.currentTime,i=this.duckGain.gain;i.cancelScheduledValues(s),i.setValueAtTime(i.value,s),i.linearRampToValueAtTime(1-e,s+.03),i.setTargetAtTime(1,s+t,.35)}resync(){this.nextTime=this.ctx.currentTime+.06}get state(){return{mood:this.mood,track:this.track.name,bpm:this.track.bpm,bar:Math.floor(this.step/16)}}get trackName(){return this.track.name}pulse(){if(!this.enabled)return 0;const e=this.ctx.currentTime;let t=-1;for(const s of this.kicks)s<=e&&s>t&&(t=s);return t<0?0:Math.exp(-(e-t)*9)*Math.min(1,this.layer.kick.gain.value)}chordAt(e){const t=e%4,s=this.track.prog[t];return this.track.quality[t]==="m"?[s,s+3,s+7,s+10]:[s,s+4,s+7,s+14]}tones(e,t=Math.floor(this.step/16)){const s=this.track.root;return this.chordAt(t).map(i=>nt(s+i,e)).sort((i,a)=>i-a)}tone(e,t,s){const i=this.tones(t,s);return i[e%i.length]+12*Math.floor(e/i.length)}chordFreq(e,t=72){return ce(this.tone(e,t))}nextSixteenth(){const e=this.ctx.currentTime,t=60/this.track.bpm/4;let s=this.nextTime;for(;s-t>e+.01;)s-=t;return Math.max(e+.005,s)}stinger(e){if(!this.enabled)return;const t=this.nextSixteenth(),s=60/this.track.bpm/4,i=e?9:5;for(let a=0;a<i;a++){const o=t+a*s*.5;this.bell(ce(this.tone(a+(e?0:2),64)),o,e?.13:.09,s*(a===i-1?6:2))}this.crash(t,e?.3:.14),e&&this.kickVoice(t,1.3)}active(e,t){return this.want[e]>.001||t<this.tail[e]}schedule(){const e=this.ctx.currentTime;if(this.ctx.state==="running")for(this.nextTime<e-.2&&(this.nextTime=e+.05);this.nextTime<e+qs;)this.play(this.step,this.nextTime),this.nextTime+=60/this.track.bpm/4,this.step++}play(e,t){const s=e%16;if(s===0&&this.pending&&(this.track=this.pending,this.pending=null,this.syncDelay(),this.crashNext=this.crashNext||Ve[this.mood]>=2),!this.enabled)return;const i=this.track,a=Math.floor(e/16),o=60/i.bpm/4,r=this.mood==="combat"||this.mood==="boss",h=this.mood==="boss";if(s===0&&(this.crashNext&&(this.crashNext=!1,this.crash(t,.22)),this.active("pad",t)&&this.padChord(a,t,o*16)),this.active("kick",t)){const d=r?s%4===0:s===0||s===8,c=h&&a%4===3&&s===14;(d||c)&&this.kickVoice(t,1)}if(this.active("snare",t)&&((s===4||s===12)&&this.snareVoice(t,1),h&&a%4===3&&(s===13||s===15)&&this.snareVoice(t,.55)),this.active("hat",t)&&(r&&i.busy?this.hatVoice(t,s%2===0?.55:.32,s%4===2&&h):(r?s%2===0:s%4===2)&&this.hatVoice(t,s%4===2?.7:.45,s===14)),this.active("bass",t)){const d=nt(i.root-12+i.prog[a%4],33);if(r){if(s%4!==0){let c=s%4===3?d+12:d;h&&s>=13&&(c=d+7),this.bassVoice(ce(c),t,o*.9,.9)}}else s%2===0&&this.bassVoice(ce(s%8===6?d+12:d),t,o*1.7,.75)}if(this.active("arp",t)){const d=Ws(i.arp,s),c=s%4===0?1:.7;this.arpVoice(ce(this.tone(d,60,a)),t,o*.85,c)}if(this.active("lead",t)&&s%2===0){const d=a%2*8+s/2|0,c=i.lead[d];if(c!=null){let u=1;for(;u<4&&i.lead[(d+u)%16]===null;)u++;this.leadVoice(ce(this.tone(c,67,a)),t,o*2*u*.92)}}}syncDelay(){const e=60/this.track.bpm;this.delay.delayTime.setTargetAtTime(e*.75,this.ctx.currentTime,.05)}env(e,t,s,i,a,o){e.setValueAtTime(1e-4,t),e.linearRampToValueAtTime(s,t+i),e.setValueAtTime(s,t+i+a),e.exponentialRampToValueAtTime(1e-4,t+i+a+o)}padChord(e,t,s){const i=this.ctx,a=i.createBiquadFilter();a.type="lowpass",a.Q.value=.8,a.frequency.setValueAtTime(900,t),a.frequency.linearRampToValueAtTime(2300,t+s*.7),a.connect(this.layer.pad);const o=t+s+1.4;for(const d of this.tones(55,e))for(const c of[-9,9]){const u=i.createOscillator();u.type="sawtooth",u.frequency.value=ce(d),u.detune.value=c;const f=i.createGain();this.env(f.gain,t,.034,s*.22,s*.6,1.2),u.connect(f),f.connect(a),u.start(t),u.stop(o)}const r=i.createOscillator();r.type="sine",r.frequency.value=ce(nt(this.track.root+this.track.prog[e%4],40));const h=i.createGain();this.env(h.gain,t,.07,s*.2,s*.6,1),r.connect(h),h.connect(this.layer.pad),r.start(t),r.stop(o)}arpVoice(e,t,s,i){const a=this.ctx,o=a.createOscillator();o.type="square",o.frequency.value=e;const r=a.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(3800,t),r.frequency.exponentialRampToValueAtTime(900,t+s);const h=a.createGain();this.env(h.gain,t,.05*i,.004,s*.3,s*.7),o.connect(r),r.connect(h),h.connect(this.layer.arp),o.start(t),o.stop(t+s+.05)}bassVoice(e,t,s,i){const a=this.ctx,o=a.createOscillator();o.type="sawtooth",o.frequency.value=e;const r=a.createOscillator();r.type="square",r.frequency.value=e/2;const h=a.createBiquadFilter();h.type="lowpass",h.Q.value=5,h.frequency.setValueAtTime(1500,t),h.frequency.exponentialRampToValueAtTime(260,t+s);const d=a.createGain();this.env(d.gain,t,.17*i,.004,s*.5,s*.5),o.connect(h),r.connect(h),h.connect(d),d.connect(this.layer.bass),o.start(t),r.start(t),o.stop(t+s+.05),r.stop(t+s+.05)}leadVoice(e,t,s){const i=this.ctx,a=i.createBiquadFilter();a.type="lowpass",a.frequency.value=3200,a.Q.value=2;const o=i.createGain();this.env(o.gain,t,.07,.015,Math.max(0,s-.18),.22),a.connect(o),o.connect(this.layer.lead);const r=i.createOscillator();r.frequency.value=5.6;const h=i.createGain();h.gain.setValueAtTime(0,t),h.gain.linearRampToValueAtTime(e*.006,t+Math.min(.5,s)),r.connect(h);for(const[d,c]of[["sawtooth",-6],["square",7]]){const u=i.createOscillator();u.type=d,u.frequency.value=e,u.detune.value=c,h.connect(u.frequency),u.connect(a),u.start(t),u.stop(t+s+.3)}r.start(t),r.stop(t+s+.3)}bell(e,t,s,i){const a=this.ctx,o=a.createGain();this.env(o.gain,t,s,.004,.02,i),o.connect(this.layer.lead.gain.value>.05?this.layer.lead:this.pump),o.connect(this.reverbSend);for(const[r,h,d]of[["triangle",1,1],["sine",2,.4],["sine",3.01,.15]]){const c=a.createOscillator();c.type=r,c.frequency.value=e*h;const u=a.createGain();u.gain.value=d,c.connect(u),u.connect(o),c.start(t),c.stop(t+i+.1)}}kickVoice(e,t){const s=this.ctx,i=s.createOscillator();i.type="sine",i.frequency.setValueAtTime(150,e),i.frequency.exponentialRampToValueAtTime(44,e+.11);const a=s.createGain();a.gain.setValueAtTime(1e-4,e),a.gain.linearRampToValueAtTime(.55*t,e+.003),a.gain.exponentialRampToValueAtTime(1e-4,e+.42),i.connect(a),a.connect(this.layer.kick),i.start(e),i.stop(e+.45),this.kicks.push(e),this.kicks.length>8&&this.kicks.shift(),this.noiseHit(e,.012,.12*t,"highpass",3e3,this.layer.kick);const o=this.pump.gain;o.cancelScheduledValues(e),o.setValueAtTime(1,e),o.linearRampToValueAtTime(.42,e+.01),o.setTargetAtTime(1,e+.04,.085)}snareVoice(e,t){this.noiseHit(e,.2,.22*t,"bandpass",1900,this.layer.snare,.7),this.noiseHit(e,.09,.12*t,"highpass",6e3,this.layer.snare);const s=this.ctx,i=s.createOscillator();i.type="triangle",i.frequency.setValueAtTime(230,e),i.frequency.exponentialRampToValueAtTime(150,e+.08);const a=s.createGain();a.gain.setValueAtTime(.16*t,e),a.gain.exponentialRampToValueAtTime(1e-4,e+.12),i.connect(a),a.connect(this.layer.snare),i.start(e),i.stop(e+.14)}hatVoice(e,t,s){this.noiseHit(e,s?.16:.035,.1*t,"highpass",7600,this.layer.hat)}crash(e,t){this.noiseHit(e,1.6,t,"highpass",4200,this.layer.hat.gain.value>.05?this.layer.hat:this.pump),this.noiseHit(e,1.6,t*.5,"highpass",4200,this.reverbSend)}noiseHit(e,t,s,i,a,o,r=.9){const h=this.ctx,d=h.createBufferSource();d.buffer=this.noise;const c=h.createBiquadFilter();c.type=i,c.frequency.value=a,c.Q.value=r;const u=h.createGain();u.gain.setValueAtTime(s,e),u.gain.exponentialRampToValueAtTime(1e-4,e+t),d.connect(c),c.connect(u),u.connect(o),d.start(e,Math.random()*(this.noise.duration-t-.05),t+.02)}dispose(){window.clearInterval(this.timer),this.out.disconnect()}}function Ws(l,e){switch(l){case"up":return e%8;case"updown":return[0,1,2,3,4,3,2,1][e%8];case"pulse":return[0,4,1,4,2,4,3,4][e%8];case"cascade":return[7,6,5,4,3,2,1,0][e%8]}}function Ks(l,e,t){const s=Math.floor(l.sampleRate*e),i=l.createBuffer(2,s,l.sampleRate);for(let a=0;a<2;a++){const o=i.getChannelData(a);for(let r=0;r<s;r++)o[r]=(Math.random()*2-1)*Math.pow(1-r/s,t)}return i}class Xs{ctx=null;master=null;sfx=null;noiseBuf=null;music=null;meter=null;meterBuf=null;_muted=!1;_musicOn=!0;started=!1;mood="silent";sector=0;get muted(){return this._muted}unlock(){if(this.started){this.ctx?.state==="suspended"&&!document.hidden&&this.ctx.resume();return}const e=window.AudioContext??window.webkitAudioContext;if(!e)return;const t=new e;this.ctx=t;const s=t.createDynamicsCompressor();s.threshold.value=-10,s.knee.value=6,s.ratio.value=12,s.attack.value=.003,s.release.value=.2,s.connect(t.destination),this.meter=t.createAnalyser(),this.meter.fftSize=2048,this.meterBuf=new Float32Array(this.meter.fftSize),s.connect(this.meter),this.master=t.createGain(),this.master.gain.value=this._muted?0:.7,this.master.connect(s),this.sfx=t.createGain(),this.sfx.gain.value=.9,this.sfx.connect(this.master);const i=t.sampleRate*3;this.noiseBuf=t.createBuffer(1,i,t.sampleRate);const a=this.noiseBuf.getChannelData(0);let o=0;for(let r=0;r<i;r++)o=o*.34+(Math.random()*2-1)*.66,a[r]=o;this.music=new Us(t,this.master,this.noiseBuf),this.music.setEnabled(this._musicOn),this.music.setSector(this.sector),this.music.setMood(this.mood),this.started=!0}setMuted(e){this._muted=e,this.master&&this.ctx&&(this.master.gain.cancelScheduledValues(this.ctx.currentTime),this.master.gain.setTargetAtTime(e?0:.7,this.ctx.currentTime,.15))}setMusic(e){this._musicOn=e,this.music?.setEnabled(e)}get musicOn(){return this._musicOn}setMood(e){this.mood=e,this.music?.setMood(e)}setSector(e){this.sector=e,this.music?.setSector(e)}setHidden(e){this.ctx&&(e?this.ctx.suspend():this.ctx.resume().then(()=>{this.music?.resync()}))}get musicState(){return this.music?{...this.music.state,on:this._musicOn,level:this.level,ctx:this.ctx?.state}:{mood:this.mood,on:this._musicOn,started:!1}}get level(){if(!this.meter||!this.meterBuf)return-1/0;this.meter.getFloatTimeDomainData(this.meterBuf);let e=0;for(const s of this.meterBuf)e+=s*s;const t=Math.sqrt(e/this.meterBuf.length);return t>0?+(20*Math.log10(t)).toFixed(1):-1/0}get pulse(){return this.music?.pulse()??0}get trackName(){return this.music?.trackName??"—"}blip(e,t,s,i,a,o=0){const r=this.ctx,h=this.sfx;if(!r||!h)return;const d=r.currentTime+o,c=r.createOscillator();c.type=s,c.frequency.setValueAtTime(e,d),a!==void 0&&c.frequency.exponentialRampToValueAtTime(a,d+t);const u=r.createGain();u.gain.setValueAtTime(1e-4,d),u.gain.exponentialRampToValueAtTime(i,d+.008),u.gain.exponentialRampToValueAtTime(1e-4,d+t),c.connect(u),u.connect(h),c.start(d),c.stop(d+t+.02)}shard(e){const t=this.music?.chordFreq(Math.min(e,9))??523.25*Math.pow(2,Math.min(e,9)/12);this.blip(t,.18,"triangle",.16),this.blip(t*2,.1,"sine",.06)}enterSector(){this.whoosh(.9,.09,300,5200),this.blip(196,.5,"sine",.1,392),this.blip(294,.4,"triangle",.06,588)}ui(){this.blip(880,.05,"square",.035),this.blip(1320,.07,"square",.025,void 0,.05)}boost(){this.blip(120,.22,"sawtooth",.05,60),this.whoosh(.55,.07,400,3800)}whoosh(e,t,s,i){const a=this.ctx,o=this.sfx;if(!a||!o||!this.noiseBuf)return;const r=a.currentTime,h=a.createBufferSource();h.buffer=this.noiseBuf;const d=a.createBiquadFilter();d.type="bandpass",d.Q.value=1.6,d.frequency.setValueAtTime(s,r),d.frequency.exponentialRampToValueAtTime(i,r+e*.8);const c=a.createGain();c.gain.setValueAtTime(1e-4,r),c.gain.exponentialRampToValueAtTime(t,r+e*.35),c.gain.exponentialRampToValueAtTime(1e-4,r+e),h.connect(d),d.connect(c),c.connect(o),h.start(r,Math.random()*1.5,e+.05)}noise(e,t,s,i,a=1.4){const o=this.ctx,r=this.sfx;if(!o||!r||!this.noiseBuf)return;const h=o.currentTime,d=o.createBufferSource();d.buffer=this.noiseBuf;const c=o.createBiquadFilter();c.type="lowpass",c.Q.value=a,c.frequency.setValueAtTime(s,h),c.frequency.exponentialRampToValueAtTime(Math.max(60,i),h+e);const u=o.createGain();u.gain.setValueAtTime(t,h),u.gain.exponentialRampToValueAtTime(1e-4,h+e),d.connect(c),c.connect(u),u.connect(r),d.start(h,Math.random()*Math.max(0,this.noiseBuf.duration-e-.05),e+.02)}shoot(){const e=1+(Math.random()-.5)*.08;this.blip(1750*e,.055,"square",.022,520*e),this.noise(.05,.018,5200,1400)}ping(){this.blip(2300,.04,"triangle",.018,1500)}pop(e=1,t=0){if(this.noise(.26*e,.13,2600,180,1.1),this.blip(150,.2*e,"sawtooth",.05,52),t>1){const s=this.music?.chordFreq(Math.min(t,10),76)??660*Math.pow(2,Math.min(t,10)/12);this.blip(s,.12,"triangle",.05,void 0,.02)}}shieldBreak(){this.noise(.75,.2,6200,140,2.6),this.blip(880,.5,"triangle",.09,190),this.blip(1320,.36,"sine",.05,300),this.music?.duck(.4,.25)}nodeBreak(){this.noise(1.5,.3,7200,70,3.2),this.blip(110,1.1,"sawtooth",.1,34),this.blip(55,1.4,"sine",.22,30),this.music?.duck(.75,.5),this.music?.stinger(!0)}rankUp(){this.music?.stinger(!1)}hurt(){this.noise(.4,.22,900,90,.8),this.blip(88,.3,"square",.055,44),this.music?.duck(.3,.12)}waveClear(){const e=this.music?.chordFreq(4)??659.25,t=this.music?.chordFreq(6)??880;this.blip(e,.16,"triangle",.07),this.blip(t,.22,"triangle",.07,void 0,.08)}alarm(){this.blip(440,.1,"square",.04,330),this.blip(440,.1,"square",.03,330,.14)}heartbeat(){this.blip(62,.16,"sine",.24,40),this.blip(58,.2,"sine",.18,38,.2)}dispose(){this.music?.dispose(),this.ctx?.close()}}class Ys{map=new Map;on(e,t){let s=this.map.get(e);return s||(s=new Set,this.map.set(e,s)),s.add(t),()=>s.delete(t)}emit(e,t){const s=this.map.get(e);if(s)for(const i of s)i(t)}}const _=new Ys,rt="signal.save.v2",Ge=()=>({v:2,xp:0,shards:{},achievements:[],visited:[],brief:!1,seenIntro:!1,muted:!1,music:!0,kills:0,nodes:0}),Oe={load(){try{const l=localStorage.getItem(rt);if(!l)return Ge();const e=JSON.parse(l);return e.v!==2?Ge():{...Ge(),...e}}catch{return Ge()}},write(l){try{localStorage.setItem(rt,JSON.stringify(l))}catch{}},clear(){try{localStorage.removeItem(rt)}catch{}}},y={name:"Jay W. Snyder",handle:"KnotEnvy",callsign:"SIGNAL",title:"AI Engineer · Business Builder · Game Developer",location:"Daytona Beach, Florida",email:"jwsnyder@gmail.com",phone:"(386) 301-5775",github:"https://github.com/KnotEnvy",linkedin:"https://www.linkedin.com/in/jay-snyder-3b1a9b1b1/",siteDazzle:"https://www.dazzledivascleaning.com/",siteSkyrun:"https://skyrun.com/daytona/",tagline:"I build AI systems that make real businesses more money — and I run the businesses that prove it.",pitch:["Most people selling you AI have never had to make payroll. I have. I own a cleaning company that turns over 550+ vacation rentals a year, and I run sales, marketing and technology for a Daytona vacation-rental management firm.","Then I go home and write the software. Agents, pipelines, dashboards, physics engines, game loops — 30+ repositories of it. The same hands that build the tooling also carry the P&L, which means I ship automation that survives contact with a real operation instead of a demo.","This site is the argument. You are inside a Three.js game engine I wrote. Fly it, break it, collect the data shards. Everything you need to know about hiring me is scattered across this world."],values:[{k:"Relationships first",v:"Every business I have grown was grown on the ground — handshakes, referrals, showing up. AI multiplies that. It never replaces it."},{k:"Ship the whole thing",v:"Strategy decks are cheap. I deliver the working system: the model, the data, the interface, the deploy, and the docs your team can actually run."},{k:"Own the outcome",v:"I am the owner, the operator and the engineer. When the automation fails at 6am on a turnover day, it is my phone that rings."}],stats:[{label:"Public repositories",value:"30+",note:"AI, games, web, tooling"},{label:"Turnovers cleaned / yr",value:"550+",note:"Dazzle Divas Cleaning"},{label:"Guest satisfaction",value:"98%",note:"across managed properties"},{label:"Years operating businesses",value:"15+",note:"owner or operator"}]},et=[{id:"dazzle",name:"Dazzle Divas Cleaning",role:"Owner",period:"2018 — Present",url:y.siteDazzle,summary:"Volusia County vacation-rental turnover and residential cleaning company. Built from a single van and a phone number into the crew property managers call first.",points:["Grew the book of business entirely through grassroots marketing, local relationships and referral loops — no paid acquisition.","Standardized a 2–4 hour guest-ready turnover with photo verification, so managers can trust the unit is listing-ready without driving out to it.","Wrote the company website (Next.js), the internal inspection-checklist app, and the quoting flow myself.","Sell a Review Protection Guarantee: if a guest review mentions cleanliness, we re-clean free. It converts because the operation can back it.","Serve 15+ cities: Daytona Beach, Ormond Beach, New Smyrna, Port Orange, Ponce Inlet and the rest of the county."],metrics:[{label:"Properties / year",value:"550+"},{label:"Guest satisfaction",value:"98%"},{label:"Turnover window",value:"2–4 hr"},{label:"Cities covered",value:"15+"}],accent:16727425},{id:"skyrun",name:"SkyRun Daytona Vacation Rentals",role:"Director of Sales, Marketing & Technology",period:"Aug 2026 — Present",url:y.siteSkyrun,summary:"Short-term rental management across Daytona Beach, Daytona Beach Shores, Ormond Beach, New Smyrna Beach and Ponce Inlet. I own the revenue side and the systems that run it.",points:["Own owner acquisition end to end: outreach, pitch, onboarding, and the retention conversations that keep doors under management.","Run the marketing engine — direct-booking funnel, listing quality, local partnerships and the community presence that feeds referrals.","Build the internal technology: owner surveys, reporting, and the automations that move work between listing platforms, cleaners and maintenance.","Sit between the guest experience and the owner P&L, which is exactly where AI tooling earns its keep.","Coordinate directly with the cleaning operation — I have run both sides of that handoff, so the SLAs are written by someone who has to meet them."],metrics:[{label:"Coastal markets",value:"5"},{label:"Discipline",value:"Sales · Marketing · Tech"},{label:"Focus",value:"Direct bookings"},{label:"Model",value:"Locally owned"}],accent:5104065},{id:"hacktivate",name:"Hacktivate Nation",role:"Founder · AI Engineer",period:"2023 — Present",summary:"My software practice and the community around it. Where the client work, the research and the open-source arcade all get built.",points:["Shipped 40+ projects: AI agents and assistants, full-stack SaaS, internal ops tooling, and a lot of games.","Built and moderated a 500+ member public community across Discord, X and YouTube for people learning to build with AI.","Grew the practice’s reach by over 55% in a single fiscal year through content and community rather than ad spend.","Run continuous AI research — model selection, prompt architecture, retrieval, evaluation, and the unglamorous plumbing that makes agents reliable."],metrics:[{label:"Projects shipped",value:"40+"},{label:"Community",value:"500+"},{label:"Public repos",value:"30+"},{label:"Reach growth",value:"+55%"}],accent:16757844}],tt=[{id:"arcade",name:"HacktivateNations Arcade",kind:"ai",headline:"A full arcade platform with a shared economy, built like a product.",body:"A modular arcade hub where every mini-game plugs into one progression system: a shared wallet, tier unlocks, achievements and leaderboards that sync across devices. The registry pattern keeps released games and the catalog honest with each other, and the whole progression layer is locked down at the database level before anything ships publicly.",stack:["Next.js","TypeScript","Supabase","PostgreSQL","Tailwind","Jest","Playwright","Vercel"],highlights:["17 playable games registered against a shared progression loop","Row-level security migration that locks progression writes server-side","Procedural audio system — no sample downloads, all synthesised","Sign-in-first auth with real-time wallet and achievement sync"],repo:"https://github.com/KnotEnvy/hacktivate-nations-arcade",scale:"Platform"},{id:"harddrivin",name:"KnotzHardDrivin",kind:"game",headline:"Rigid-body stunt driving in the browser. Real physics, no shortcuts.",body:"A 3D stunt driving simulator built on Three.js with the Rapier physics engine compiled to WebAssembly. Suspension, weight transfer, tyre friction and airborne rotation are simulated rather than faked, and the whole thing is covered by a Vitest unit suite plus Playwright end-to-end runs so a physics regression cannot sneak into a build.",stack:["Three.js","Rapier3D (WASM)","TypeScript","Vite","Howler","Vitest","Playwright"],highlights:["Rapier rigid-body vehicle model — suspension, traction, aerial control","Fixed-timestep simulation decoupled from render rate","Unit + end-to-end test coverage over gameplay systems","Strict TypeScript with lint, format and type-check gates"],repo:"https://github.com/KnotEnvy/KnotzHardDrivin",scale:"3D engine"},{id:"galaxia",name:"VOID ASCENDANT: GALAXIA",kind:"game",headline:"Galaga rebuilt in 2.5D on a hand-rolled entity-component system.",body:"A reimagining of classic Galaga formation-attack mechanics rendered in Three.js and driven by a custom ECS. Entities are data, systems are pure functions over that data, and the render layer is the only part that knows about the GPU — the architecture a real engine wants, written small enough to read in an afternoon.",stack:["Three.js","TypeScript","ECS","Vite","lil-gui"],highlights:["Custom entity-component-system with data-oriented storage","2.5D formation-attack AI faithful to the arcade original","Live tuning panel for gameplay constants","Type-check gate wired into the build script"],repo:"https://github.com/KnotEnvy/KnotzGalaga2",scale:"3D engine"},{id:"eclipse",name:"Eclipse Vector: Fracture of the Veil",kind:"game",headline:"A narrative space shooter with branching missions and a content compiler.",body:"Browser-native TypeScript shooter with authored enemy archetypes, five branching missions, fail-forward consequences that persist into later runs, salvage upgrades and a save shell. The part I am proudest of is not the combat — it is the content-validation CLI that schema-checks every mission, dialogue node, weapon and status effect and refuses to build on a broken cross-reference.",stack:["TypeScript","PixiJS","Vite","Custom content CLI","Vitest"],highlights:["Fixed-step simulation loop with typed event bus","Content validation CLI with schema mirrors for every authored type","Branching missions with persistent fail-forward consequences","Status-effect system built as reusable extension points"],repo:"https://github.com/KnotEnvy/KnotzEclipseVector",scale:"Systems design"},{id:"mathquest",name:"MathQuest Florida",kind:"ai",headline:"AI tutoring for the SAT and Florida college-readiness exams.",body:"A gamified math tutor that meets a student where they are: GPT-4o generates and explains problems against the actual Florida standards, progress is tracked per skill, and the loop is built to keep a teenager coming back. Product requirements, roadmap, design system and API are documented in-repo because education software gets audited.",stack:["Next.js 15","TypeScript","Supabase","OpenAI GPT-4o","PostHog","Sentry","Tailwind"],highlights:["LLM-generated practice aligned to published exam standards","Per-skill mastery tracking on Supabase with row-level auth","Product analytics and error monitoring wired in from day one","Full PRD, roadmap, design and API docs committed alongside the code"],repo:"https://github.com/KnotEnvy/mathquest-florida",scale:"AI product"},{id:"casino",name:"Knotz Crapz N Cardz",kind:"game",headline:"Casino games where the math is as honest as the physics.",body:"A collection of casino games built properly. The craps table runs genuine rigid-body dice physics that always resolve to exactly what the RNG called — the hard problem is making a real simulation land on a predetermined result without looking rigged. Dragon’s Shrine is a 5x4 video slot with free spins, hold-and-win and four jackpot tiers, with a measured return-to-player rather than a guessed one.",stack:["TypeScript","Canvas/WebGL","Physics simulation","Docker","nginx","docker-compose"],highlights:["Dice physics reconciled to a provably fair RNG outcome","5x4 slot with true odds, free spins, hold-and-win and four jackpots","Each game is an independent app; compose file runs the arcade together","Static builds shipped as separate nginx containers"],repo:"https://github.com/KnotEnvy/KnotzCrapzNCardz",scale:"Simulation"},{id:"knotzflix",name:"KnotzFlix",kind:"ai",headline:"A Netflix-grade media library that never phones home.",body:"A local-first media manager in Python with a PyQt6 desktop interface. SQLite FTS5 gives instant type-ahead search across a whole library, ffmpeg generates posters with deterministic heuristics and falls back to offline placeholders, and the codebase is split MVVM-style across ui, domain and infra so the interface never touches the filesystem directly.",stack:["Python 3.11","PyQt6","SQLite FTS5","ffmpeg","MVVM"],highlights:["Full-text search with type-ahead filtering via FTS5","Deterministic poster generation with graceful offline fallback","Shelves: Library, Recently Added, By Folder, Continue Watching","Layered architecture with 31 unit tests"],repo:"https://github.com/KnotEnvy/KnotzFlix",scale:"Desktop app"},{id:"raven",name:"Knotz Raven Mayhem",kind:"game",headline:"A click-target prototype rebuilt into a full arcade cabinet.",body:"What started as a canvas experiment is now a Phaser 3 arcade shooter with an attract screen, an armory of guns and assist chips, staged waves, bosses, bonus rounds, star-graded run reports and coin-based persistent progression. It is the clearest example of how I take a prototype and drive it to a finished, replayable product.",stack:["Phaser 3","TypeScript","Vite","localStorage persistence"],highlights:["Nine raven runs with boss fights and a Jackpot Alley bonus round","Persistent armory upgrades funded by run performance","S-rank stage grading and local records","Motion, shake and audio accessibility toggles"],repo:"https://github.com/KnotEnvy/Knotz-Raven-Mayhem",live:"https://knotenvy.github.io/Knotz-Raven-Mayhem/",scale:"Arcade"},{id:"invadespace",name:"Knotz: Invade Space",kind:"game",headline:"A story-driven space-shooter roguelite that runs in a tab.",body:"A five-sector campaign to break the siege of Earth, structured as a roguelite: clear a sector, dock with the UES Orion carrier, spend what you earned on permanent upgrades, go back out further than last time. There is an endless mode for score chasers and seeded daily challenges so everyone gets the same run — which means the generator had to be deterministic, not merely random. Keyboard, mouse and touch all play it, with no install and no account.",stack:["TypeScript","Canvas","Vite","Seeded procedural generation","localStorage persistence"],highlights:["Five-sector campaign with a carrier hub between missions","Roguelite meta-progression: credits spent on permanent upgrades","Seeded daily challenges — deterministic runs shared by every player","One build plays on keyboard, mouse and touch"],repo:"https://github.com/KnotEnvy/KnotzInvadeSpace",live:"https://knotenvy.github.io/KnotzInvadeSpace/",scale:"Roguelite"},{id:"dazzlesite",name:"Dazzle Divas Cleaning",kind:"business",headline:"My own company’s production site — and the ops tools behind it.",body:"The live storefront for the cleaning business: a Next.js site built to convert vacation-rental managers, not to win design awards. Behind it sits a TypeScript inspection-checklist app the crews use on-site, so the photo verification we promise on the sales page is a real workflow and not a marketing line.",stack:["Next.js","React","TypeScript","Vercel"],highlights:["Conversion-first structure: service, proof, guarantee, quote","Companion inspection-checklist app used by the crews daily","Local SEO across 15+ Volusia County service areas","Owned end to end — I write it, I run the business it sells"],repo:"https://github.com/KnotEnvy/dazzle-divas-cleaning",live:y.siteDazzle,live2:{label:"Field Checklist app",href:"https://app.dazzledivascleaning.com/"},scale:"Production"},{id:"knotzgpt",name:"KnotzGPT-Plus",kind:"ai",headline:"A multi-model chat platform with persistence and its own data layer.",body:"A Next.js AI workspace with Prisma-backed conversation storage, custom hooks for streaming responses, and a component system built to swap model providers without rewriting the interface. Deployed and live.",stack:["Next.js","TypeScript","Prisma","Tailwind","Vercel"],highlights:["Provider-agnostic chat layer with streaming responses","Prisma schema and migrations for durable conversation history","Custom hooks isolating transport from presentation","Shipped to production on Vercel"],repo:"https://github.com/KnotEnvy/KnotzGPT-Plus",scale:"AI product"}],$t="Three of these run at once, and that is the point rather than an accident. Dazzle Divas is the operating business I own; SkyRun is the revenue and technology role that business qualified me for; Hacktivate Nation is the practice where the software gets built. Each one feeds the other two — the cleaning company is the customer that keeps the automation honest.",Ut=[{company:"SkyRun Daytona Vacation Rentals",title:"Director of Sales, Marketing & Technology",period:"Aug 2026 — Present",place:"Daytona Beach, FL",current:!0,points:["Lead sales, marketing and technology for short-term rental management across five coastal Volusia markets.","Own owner acquisition and retention, the direct-booking funnel and the local partnerships that feed it.","Build the internal tooling — owner surveys, reporting and the automations connecting listings, cleaning and maintenance."]},{company:"Dazzle Divas Cleaning",title:"Owner",period:"2018 — Present",place:"Volusia County, FL",current:!0,points:["Founded and run a vacation-rental turnover and residential cleaning company covering 15+ cities.","Grew to 550+ properties a year on referrals and community presence, holding a 98% guest satisfaction rate.","Wrote the company website and the crew-facing inspection app; I am the owner and the engineering department."]},{company:"Hacktivate Nation",title:"Founder · AI Engineer",period:"2023 — Present",place:"Daytona Beach, FL",current:!0,points:["Shipped 40+ projects spanning AI agents, full-stack SaaS, internal tooling and game engines.","Built a 500+ member technology community across Discord, X and YouTube; grew reach 55% in one fiscal year.","Run ongoing applied AI research — retrieval, evaluation, agent reliability and cost control."]},{company:"MarketOnce Holding, LLC",title:"Company Estimator",period:"2021 — 2023",place:"Daytona Beach, FL",points:["Owned all quoting across mail print, wide format, promotional and fulfillment lines.","Ran vendor relationships and competitive pricing to protect margin.","Supported sales through deal close, using operational knowledge to open new revenue lines."]},{company:"DME Delivers, LLC",title:"Estimator → Implementation Manager",period:"2017 — 2021",place:"Daytona Beach, FL",points:["Launched and maintained multiple B2B and B2C e-commerce platforms; annual sales up 30% four years running.","Administered Avanti Slingshot, Cyrious, Salesforce, BMS and IPN, lifting operational efficiency ~25%.","Led pricing and cost analysis company-wide and built the estimation models behind it."]},{company:"Action Pools & Spas, LLC",title:"Co-Owner / Operator",period:"2010 — 2017",place:"Ormond Beach, FL",points:["Ran the whole business: P&L, tax, payroll structure, customer satisfaction and crew development.","Built the marketing that grew the route, years before anyone called it growth marketing.","First lesson in the thing I still trade on — local trust compounds faster than any ad budget."]}],se={school:"University of Central Florida",place:"Orlando, FL",degree:"B.S. Business Administration",notes:["Project lead for the Cornerstone capstone, managing teams supporting the Red Cross and other nonprofits.","Coursework in accounting, finance, marketing and business operations — the vocabulary I still use with clients."],training:["How to Use the OpenAI API to Build AI Apps & Fine-Tune Models","Become an AI-Powered Engineer: ChatGPT & GitHub Copilot","Microsoft Azure AI Fundamentals","Searching Algorithms in AI","ChatGPT Prompt Engineering","SEO Fundamentals: Post-AI","Game Development with JavaScript"]},Wt=[{id:"audit",name:"AI Leverage Audit",promise:"Find the hours your business is burning, and the ones AI can buy back.",detail:"I walk your operation the way I walk my own: quoting, scheduling, dispatch, follow-up, reporting. You get a ranked map of what to automate first, what to leave alone, and what the honest payback looks like — written by someone who has had to live with the answer.",deliverables:["Process map of where the hours actually go","Ranked automation backlog with effort and payback","Tooling recommendation with real cost modeling","A 90-day sequence your team can execute"]},{id:"agents",name:"Custom AI Agents & Internal Tools",promise:"The assistant that knows your business, not the internet’s.",detail:"Retrieval over your own documents, agents wired into the systems you already pay for, and interfaces your staff will actually open. Built with evaluation and guardrails from the start, because an assistant that is confidently wrong costs more than no assistant at all.",deliverables:["Retrieval pipeline over your documents and records","Agent workflows integrated with your existing stack","Evaluation harness so quality is measured, not assumed","Staff-facing UI plus the runbook to maintain it"]},{id:"web",name:"Websites That Close",promise:"A site built to convert, by someone who has to sell for a living.",detail:"Next.js and React front ends with the structure a buyer actually needs — proof, guarantee, price, path to contact — plus the local SEO and analytics to know it is working. My own companies run on the sites I build.",deliverables:["Conversion-first architecture and copy structure","Fast, accessible, mobile-first build","Local SEO and structured data","Analytics and lead routing that you own"]},{id:"interactive",name:"Interactive & Game Experiences",promise:"When a page will not do the job, build a world.",detail:"Three.js and WebGL experiences, product configurators, training simulations and browser games. Real-time rendering, real physics, and the discipline of a fixed-step game loop — the same engine work that produced the site you are standing in.",deliverables:["Three.js / WebGL experiences tuned for mobile","Game loops, physics and procedural content","Interactive product and training simulations","Performance budgets and graceful degradation"]}],oe=[{group:"AI Engineering",items:["LLM application architecture","Retrieval-augmented generation","Agent design & tool use","Prompt architecture & evaluation","OpenAI / Anthropic / Gemini APIs","Fine-tuning & model selection","Vector search","Cost & latency optimization"]},{group:"Engineering",items:["TypeScript","Python","React / Next.js","Node.js","Three.js / WebGL / GLSL","Supabase / PostgreSQL","Prisma","Flask / Django","Docker","Vite","Playwright / Vitest / Jest","Tailwind CSS"]},{group:"Game Development",items:["Entity-component systems","Fixed-timestep simulation","Rapier / rigid-body physics","Phaser 3 & PixiJS","Procedural audio (WebAudio)","Progression & economy design","Shader authoring","Performance profiling"]},{group:"Business",items:["P&L ownership","Sales leadership","Grassroots & local marketing","Estimating & pricing strategy","Operations & SOP design","Vendor management","Community building","Team development"]}],Qs=et.map(l=>({title:l.name,sub:`${l.role} · ${l.period}`,text:l.summary,meta:l.metrics.map(e=>`${e.value} ${e.label}`),links:l.url?[{label:"Visit site",href:l.url,live:!0}]:[]})),Z=l=>{const e=tt.find(s=>s.id===l),t=[];return e.live&&t.push({label:e.kind==="game"?"Play it now":"Open it live",href:e.live,live:!0}),e.live2&&t.push({label:e.live2.label,href:e.live2.href,live:!0}),e.repo&&t.push({label:"Source",href:e.repo}),{title:e.name,sub:e.headline,text:e.body,meta:e.stack,links:t}},A=[{id:"origin",index:0,code:"SEC-01",name:"ORIGIN",subtitle:"Who you are dealing with",form:"knot",color:5104065,position:[0,0,-260],shards:5,radius:58,blocks:[{t:"lead",text:y.tagline},...y.pitch.map(l=>({t:"para",text:l})),{t:"stats",items:y.stats.map(l=>({...l}))},{t:"list",items:y.values.map(l=>`**${l.k}** — ${l.v}`)}],bonus:[{t:"quote",text:"The reason my automation works is that I am the one who gets called when it does not. Owner, operator and engineer are the same person here.",by:y.name}]},{id:"ventures",index:1,code:"SEC-02",name:"VENTURES",subtitle:"Businesses I own and run",form:"twin",color:16727425,position:[-190,40,-700],shards:6,radius:60,blocks:[{t:"lead",text:"Two operating companies, one technology practice. This is the part most AI consultants cannot show you."},{t:"cards",items:Qs},{t:"para",text:"Cleaning crews, turnover windows, owner statements and guest reviews are not abstractions to me — they are Tuesday. That is why the systems I build for clients survive the first real week."}],bonus:[{t:"list",items:et[0].points},{t:"list",items:et[1].points}]},{id:"forge",index:2,code:"SEC-03",name:"THE FORGE",subtitle:"AI engineering",form:"reactor",color:9133302,position:[150,-30,-1180],shards:7,radius:62,blocks:[{t:"lead",text:"Retrieval, agents, evaluation and the unglamorous plumbing that turns a demo into something a business can depend on."},{t:"cards",items:[Z("arcade"),Z("mathquest"),Z("knotzgpt"),Z("knotzflix")]},{t:"chips",group:oe[0].group,items:[...oe[0].items]},{t:"chips",group:oe[1].group,items:[...oe[1].items]}],bonus:[{t:"para",text:"How I actually work: pick the smallest model that clears the bar, measure it against a real evaluation set, keep a human in the loop wherever a wrong answer costs money, and instrument everything so cost and latency are facts rather than surprises."}]},{id:"arcade",index:3,code:"SEC-04",name:"ARCADE",subtitle:"Game development",form:"cabinet",color:16757844,position:[-160,60,-1660],shards:6,radius:60,blocks:[{t:"lead",text:"Engines, physics, entity-component systems and progression economies. Games are where you learn to make software that has to be right sixty times a second. Two of these are playable in your browser right now — press the link and judge them yourself."},{t:"cards",items:[Z("raven"),Z("invadespace"),Z("harddrivin"),Z("galaxia"),Z("eclipse"),Z("casino")]},{t:"chips",group:oe[2].group,items:[...oe[2].items]}],bonus:[{t:"para",text:"You are inside the argument right now. This site is a hand-written Three.js engine: fixed-step simulation, custom GLSL, procedural WebAudio, an adaptive quality tier that watches your frame time, and a save system tracking every shard you have collected."}]},{id:"track",index:4,code:"SEC-05",name:"TRACK RECORD",subtitle:"Fifteen years of operating",form:"spine",color:6003967,position:[190,10,-2140],shards:6,radius:60,blocks:[{t:"lead",text:"Estimator, implementation manager, co-owner, owner, director. The technical career is recent; the business career is not."},{t:"para",text:$t},{t:"timeline",items:Ut.map(l=>({title:l.title,sub:`${l.company} · ${l.place}`,period:l.period,points:l.points,current:l.current}))},{t:"cards",items:[{title:se.school,sub:se.degree,text:se.notes.join(" "),meta:[se.place]}]},{t:"chips",group:"Applied AI training",items:se.training},{t:"chips",group:oe[3].group,items:[...oe[3].items]}],bonus:[{t:"quote",text:"Fifteen years of P&L, pricing and payroll is not a detour from engineering. It is the reason I know which problem is worth automating.",by:y.name}]},{id:"uplink",index:5,code:"SEC-06",name:"UPLINK",subtitle:"Work with me",form:"beacon",color:5104065,position:[0,-20,-2620],shards:5,radius:64,blocks:[{t:"lead",text:"If your business is running on people doing work a system should be doing, that is a solvable problem. Let us find out how much it is costing you."},{t:"cards",items:Wt.map(l=>({title:l.name,sub:l.promise,text:l.detail,meta:l.deliverables}))},{t:"cta",label:`Email ${y.email}`,href:`mailto:${y.email}?subject=AI%20project%20enquiry`,kind:"primary"},{t:"cta",label:`Call ${y.phone}`,href:"tel:+13863015775",kind:"ghost"},{t:"cta",label:"GitHub — KnotEnvy",href:y.github,kind:"ghost"},{t:"cta",label:"LinkedIn",href:y.linkedin,kind:"ghost"}],bonus:[{t:"para",text:"Every shard collected. You read the whole thing at speed, in a browser, inside a game engine — which is roughly the experience I would like your customers to have with whatever we build together."}]}],it=new Map(A.map(l=>[l.id,l])),Pt=A.reduce((l,e)=>l+e.shards,0),be=[{at:0,name:"VISITOR"},{at:120,name:"OPERATOR"},{at:320,name:"ANALYST"},{at:600,name:"ARCHITECT"},{at:940,name:"PARTNER"}],Dt=25,Js=40,Zs=60,ei=90,wt=[{id:"first-contact",name:"First Contact",note:"Reached your first sector"},{id:"first-shard",name:"Data Miner",note:"Collected a data shard"},{id:"streak-5",name:"On A Roll",note:"Five shards without stopping"},{id:"decrypt-1",name:"Decrypted",note:"Cleared every shard in a sector"},{id:"ventures",name:"Due Diligence",note:"Read the ventures dossier"},{id:"terminal",name:"Console Cowboy",note:"Opened the terminal"},{id:"warp",name:"Shortcut",note:"Warped with a terminal command"},{id:"all-sectors",name:"Full Sweep",note:"Visited all six sectors"},{id:"completionist",name:"Completionist",note:"Collected every shard on the map"},{id:"brief",name:"Straight To Business",note:"Switched to the written brief"},{id:"first-blood",name:"First Blood",note:"Destroyed your first hostile"},{id:"node-1",name:"Codebreaker",note:"Broke an encryption node"},{id:"sharpshooter",name:"Sharpshooter",note:"Twenty-five hostiles destroyed"},{id:"gunner",name:"Gunnery Certified",note:"One hundred hostiles destroyed"},{id:"unshaken",name:"Unshaken",note:"Broke a node at full hull integrity"},{id:"chain-5",name:"Chain Reaction",note:"Five kills in one unbroken chain"}],ti=new Map(wt.map(l=>[l.id,l]));class si{data;streak=0;streakTimer=0;startedAt=performance.now();constructor(){this.data=Oe.load(),_.on("codex:open",({id:e})=>{e==="ventures"&&this.unlock("ventures")})}get xp(){return this.data.xp}get level(){return be.filter(e=>this.xp>=e.at).length}get rank(){let e=be[0].name;for(const t of be)this.xp>=t.at&&(e=t.name);return e}get rankPct(){const e=this.level-1,t=be[e],s=be[e+1];return s?(this.xp-t.at)/(s.at-t.at):1}get collected(){return Object.values(this.data.shards).reduce((e,t)=>e+t.length,0)}get totalShards(){return Pt}shardsIn(e){return this.data.shards[e]??[]}isDecrypted(e){const t=A.find(s=>s.id===e);return!!t&&this.shardsIn(e).length>=t.shards}hasVisited(e){return this.data.visited.includes(e)}addXp(e){const t=this.level;this.data.xp+=e,_.emit("xp:change",{xp:this.xp,level:this.level,rank:this.rank,pct:this.rankPct}),this.level>t&&_.emit("achievement",{id:"rank",name:`Rank up — ${this.rank}`,note:`${this.xp} XP`}),this.persist()}collectShard(e,t){const s=this.data.shards[e]??(this.data.shards[e]=[]);if(s.includes(t))return!1;s.push(t);const i=performance.now();return this.streak=i-this.streakTimer<2600?this.streak+1:0,this.streakTimer=i,this.addXp(Dt),_.emit("shard:collect",{sector:e,total:this.collected,xp:Dt}),this.unlock("first-shard"),this.streak>=4&&this.unlock("streak-5"),this.isDecrypted(e)&&(this.addXp(Zs),this.unlock("decrypt-1")),this.collected>=Pt&&this.unlock("completionist"),!0}recordKill(e){this.data.kills+=1,this.addXp(e),this.unlock("first-blood"),this.data.kills>=25&&this.unlock("sharpshooter"),this.data.kills>=100&&this.unlock("gunner")}recordNode(e){this.data.nodes+=1,this.addXp(ei),this.unlock("node-1"),e&&this.unlock("unshaken")}get kills(){return this.data.kills}get nodesBroken(){return this.data.nodes}get achievements(){return this.data.achievements}visit(e){this.hasVisited(e)||(this.data.visited.push(e),this.addXp(Js),this.unlock("first-contact"),this.data.visited.length>=A.length&&this.unlock("all-sectors"),this.persist())}unlock(e){if(this.data.achievements.includes(e))return;const t=ti.get(e);t&&(this.data.achievements.push(e),_.emit("achievement",{id:t.id,name:t.name,note:t.note}),this.persist())}markIntroSeen(){this.data.seenIntro=!0,this.persist()}setMuted(e){this.data.muted=e,this.persist()}setMusic(e){this.data.music=e,this.persist()}setBrief(e){this.data.brief=e,e&&this.unlock("brief"),this.persist()}reset(){Oe.clear(),this.data=Oe.load(),_.emit("xp:change",{xp:0,level:1,rank:be[0].name,pct:0})}persist(){Oe.write(this.data)}}const ii=`
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vDepth;

  void main() {
    vLocal = position;
    #ifdef USE_INSTANCING
      vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    #else
      vec4 world = modelMatrix * vec4(position, 1.0);
      vNormalW = normalize(mat3(modelMatrix) * normal);
    #endif
    vViewDir = normalize(cameraPosition - world.xyz);
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,ai=`
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uBase;
  uniform float uRim;
  uniform float uPower;
  uniform float uGlow;
  uniform float uTime;
  uniform float uHit;
  uniform float uScan;
  uniform float uOpacity;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uPanel;

  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  varying float vDepth;

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);

    // Two fixed lights: a cool key from high right, a warm fill from low left.
    // Hard-coded because the whole scene shares one lighting story and a real
    // light rig would only ever be told to reproduce this.
    float key = max(dot(N, normalize(vec3(0.45, 0.8, 0.35))), 0.0);
    float fill = max(dot(N, normalize(vec3(-0.6, -0.25, -0.7))), 0.0);

    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uPower);

    vec3 col = uBase * (0.22 + key * 0.75 + fill * 0.3);

    /*
     * Procedural panelling.
     *
     * Triplanar so it works on any shape without UVs, and weighted by the
     * surface normal so the lines run across faces rather than smearing down
     * them. Two frequencies: wide plates, and a finer seam every fourth plate.
     *
     * This is the cheapest available answer to "everything is flat emissive
     * with no material variation" — it gives every hull, prop, enemy and
     * landmark a sense of being fabricated out of parts, from one extra dozen
     * instructions, with no texture fetch and no extra draw.
     */
    if (uPanel > 0.0) {
      vec3 p = vLocal / uPanel;
      vec3 seam = abs(fract(p) - 0.5);
      vec3 fw = fwidth(p) * 1.5;
      vec3 lines = 1.0 - smoothstep(vec3(0.0), max(fw, vec3(0.015)), seam);
      vec3 an = abs(N);
      // Triplanar weights: a line only counts on the two axes across the face.
      float plate = clamp(lines.x * (1.0 - an.x) + lines.y * (1.0 - an.y) + lines.z * (1.0 - an.z), 0.0, 1.0);

      vec3 q = p * 0.25;
      vec3 seam2 = abs(fract(q) - 0.5);
      vec3 fw2 = fwidth(q) * 1.5;
      vec3 lines2 = 1.0 - smoothstep(vec3(0.0), max(fw2, vec3(0.01)), seam2);
      float major = clamp(lines2.x * (1.0 - an.x) + lines2.y * (1.0 - an.y) + lines2.z * (1.0 - an.z), 0.0, 1.0);

      /*
       * Seam lines are high frequency, and high frequency is exactly what
       * distance destroys. Worse than destroys: once a plate is about a pixel
       * across, every fragment is "on a line", plate saturates to 1, and the
       * whole surface goes uniformly dark — panelling that actively makes
       * things look worse the further away they are. Fade the line terms out
       * before they reach that point.
       */
      float cellPx = max(max(fw.x, fw.y), fw.z);
      float lineFade = 1.0 - smoothstep(0.22, 0.5, cellPx);

      // Recessed seams read as shadow; the wider joins pick up a little of the
      // accent, as though light is leaking out of the structure.
      col *= 1.0 - plate * 0.62 * lineFade;
      col += uColor * major * 0.28 * lineFade;

      /*
       * Per-plate tone, which is what actually carries the material story at
       * gameplay range. Reviewers kept saying the panelling "all but disappears
       * under fog and bloom" at combat distance, and they were right: lines
       * alone cannot survive it. Plate *values* are low frequency, so they
       * survive any distance the geometry itself does — a distant hull reads as
       * assembled out of slightly mismatched panels rather than as one flat
       * shape, which is the whole point.
       */
      vec3 cell = floor(p);
      float tone = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      col *= 0.90 + tone * 0.20;
    }

    col += uColor * fres * uRim * 1.9;
    col += uColor * uGlow;

    // Travelling band: reads as data moving through the structure.
    if (uScan > 0.5) {
      float band = smoothstep(0.9, 1.0, sin(vLocal.y * 0.22 - uTime * 1.7) * 0.5 + 0.5);
      col += uColor * band * 0.28;
    }

    // Damage flash: blow the whole surface toward white on a hit so the player
    // gets unambiguous feedback even when the impact particles are off-screen.
    col = mix(col, vec3(2.4), uHit * 0.8);

    // Exponential-squared fog, matching three's own FogExp2 so custom-shaded
    // objects sit in the same atmosphere as everything else.
    //
    // This is doing far more work than "a bit of haze". Without it nothing in
    // the scene recedes: a structure six hundred metres down a curving corridor
    // renders exactly as crisp as the ship, so it reads as an object directly in
    // front of the player rather than as distant scenery, and the corridor loses
    // all sense of depth.
    float fogFactor = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
    col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(col, uOpacity);
  }
`;function ke(l){const e=new V({uniforms:{uColor:{value:new x(l.color)},uBase:{value:new x(l.base??527640)},uRim:{value:l.rim??1},uPower:{value:l.power??2.6},uGlow:{value:l.glow??.05},uTime:{value:0},uHit:{value:0},uScan:{value:l.scan?1:0},uOpacity:{value:l.opacity??1},uFogColor:{value:new x(329487)},uFogDensity:{value:0},uPanel:{value:l.panel??0}},vertexShader:ii,fragmentShader:ai,transparent:l.transparent??!1});return Kt.add(e),e}const Kt=new Set;function oi(l,e){for(const t of Kt)t.uniforms.uFogColor.value.copy(l),t.uniforms.uFogDensity.value=e}function j(l,e=1){return new K({color:l,transparent:!0,opacity:e,blending:O,depthWrite:!1,toneMapped:!1})}const pt=[],C=l=>(pt.push(l),l),G=(l,e=1)=>C(new K({color:l,transparent:e<1,opacity:e,toneMapped:!1})),ue=l=>C(ke({color:l,base:66e4,rim:1.5,power:2.1,glow:.08,panel:3.5})),ni=(l,e)=>C(new gs({color:l,transparent:!0,opacity:e,toneMapped:!1}));function Te(l,e,t=.55,s=18){return new Gt(C(new fs(l,s)),ni(e,t))}function ri(l){switch(l.form){case"knot":return li(l.color);case"twin":return hi(l.color);case"reactor":return ci(l.color);case"cabinet":return di(l.color);case"spine":return ui(l.color);case"beacon":return pi(l.color)}}function li(l){const e=new F,t=new b(C(new xt(13,3.1,180,20,2,3)),ue(l)),s=new b(C(new xt(13.4,3.35,72,8,2,3)),C(new K({color:l,wireframe:!0,transparent:!0,opacity:.26,toneMapped:!1}))),i=new b(C(new re(5.2,1)),G(l)),a=new b(C(new U(23,.3,6,110)),G(l,.55)),o=new b(C(new U(28,.22,6,110)),G(l,.3));return o.rotation.y=Math.PI/2,e.add(t,s,i,a,o),{object:e,update(r,h,d){e.rotation.y=r*.16,t.rotation.x=Math.sin(r*.11)*.22,s.rotation.x=t.rotation.x,i.scale.setScalar((1+Math.sin(r*1.6)*.05)*(.9+d*.35)),a.rotation.z=r*.35,a.rotation.x=Math.PI/2+Math.sin(r*.4)*.35,o.rotation.z=-r*.25},dispose(){}}}function hi(l){const e=new F,t=[];for(const[r,h]of[-13,13].entries()){const d=r===0?34:26,c=C(new R(9,d,9,1,4,1)),u=new F,f=new b(c,ue(l)),v=Te(c,l,.55),p=new b(C(new R(11,.9,11)),G(l,.85));p.position.y=d/2+1.2,u.add(f,v,p),u.position.set(h,d/2-10,r===0?-3:4),t.push(u),e.add(u)}const s=C(new R(28,.6,2.4)),i=new b(s,G(l,.6));i.position.y=4,i.rotation.y=-.2,e.add(i);const a=C(new U(24,.35,8,120)),o=new b(a,G(l,.5));return o.rotation.x=Math.PI/2,o.position.y=-12,e.add(o),{object:e,update(r,h,d){e.rotation.y=Math.sin(r*.14)*.3,o.rotation.z=r*.32,o.position.y=-12+Math.sin(r*.7)*1.6,t.forEach((c,u)=>{c.position.y+=Math.sin(r*.9+u*1.7)*.012}),i.scale.x=1+d*.04},dispose(){}}}function ci(l){const e=new F,t=C(new re(9,2)),s=new b(t,ue(l)),i=Te(t,l,.5,12),a=new b(C(new re(5.4,1)),G(l));e.add(s,i,a);const o=[],r=[17,21.5,26];for(let m=0;m<3;m++){const k=new b(C(new U(r[m],.34,8,140)),G(l,.62-m*.12));k.rotation.set(Math.PI/2+m*.5,m*.9,m*.3),o.push(k),e.add(k)}const h=C(new Se(1.1,0)),d=G(l,.9),c=new Q(h,d,14);c.instanceMatrix.setUsage(Me),e.add(c);const u=new Ce,f=new ie,v=new g,p=new g(1,1,1);return{object:e,update(m,k,S){e.rotation.y=m*.1,o.forEach((w,M)=>{w.rotation.z=m*(.35+M*.18)*(M%2?-1:1),w.rotation.x=Math.PI/2+M*.5+Math.sin(m*.3+M)*.2}),a.scale.setScalar(1+Math.sin(m*2.4)*.08+S*.2),s.rotation.y=-m*.2;for(let w=0;w<14;w++){const M=w/14*Math.PI*2+m*(.5+w%3*.2),I=14+w%4*4;v.set(Math.cos(M)*I,Math.sin(M*1.7+w)*6,Math.sin(M)*I),f.setFromAxisAngle(new g(0,1,0),M),u.compose(v,f,p),c.setMatrixAt(w,u)}c.instanceMatrix.needsUpdate=!0},dispose(){}}}function di(l){const e=new F,t=C(new R(18,30,12)),s=new b(t,ue(l));e.add(s,Te(t,l,.6));const i=C(new V({uniforms:{uTime:{value:0},uColor:{value:new x(l)},uAct:{value:0}},transparent:!0,toneMapped:!1,vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`
        uniform float uTime; uniform vec3 uColor; uniform float uAct; varying vec2 vUv;
        float box(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
        void main(){
          vec2 uv = vUv;
          // Marching invader-ish blocks.
          vec2 g = fract(uv * vec2(9.0, 7.0) + vec2(floor(uTime*2.0)*0.11, uTime * 0.18));
          float cell = step(0.62, g.x) * step(0.62, g.y);
          float scan = 0.5 + 0.5 * sin(uv.y * 90.0 - uTime * 6.0);
          float glow = 0.22 + cell * 0.9;
          vec3 c = uColor * (glow + scan * 0.12) * (0.7 + uAct * 0.8);
          gl_FragColor = vec4(c, 0.95);
        }`})),a=new b(C(new gt(13,10)),i);a.position.set(0,6,6.1),a.rotation.x=-.14,e.add(a);const o=C(new R(19,3.2,1)),r=new b(o,G(l,.9));r.position.set(0,16,5.6),e.add(r);const h=new b(C(new R(17,1.2,7)),ue(l));h.position.set(0,-2.6,8),h.rotation.x=-.25,e.add(h);const d=new b(C(new Vt(.5,2.6,4,8)),G(16777215,.9));d.position.set(-4,-.6,8),e.add(d);for(let u=0;u<3;u++){const f=new b(C(new $(.8,.8,.5,16)),G(l,.95));f.position.set(1+u*2.6,-1.4,8),f.rotation.x=-.25,e.add(f)}const c=new b(C(new $(16,18,1.4,48,1,!0)),G(l,.28));return c.position.y=-16,e.add(c),e.scale.setScalar(.85),{object:e,update(u,f,v){e.rotation.y=Math.sin(u*.2)*.35+.15,e.position.y=Math.sin(u*.6)*.9,i.uniforms.uTime.value=u,i.uniforms.uAct.value=v,d.rotation.z=Math.sin(u*3.1)*.35,c.rotation.y=-u*.3},dispose(){}}}function ui(l){const e=new F,t=[],s=6;for(let o=0;o<s;o++){const r=22-o*1.9,h=C(new R(r,.9,11)),d=new F;d.add(new b(h,ue(l)),Te(h,l,.7)),d.position.y=-14+o*6.2,d.rotation.y=o*.42,t.push(d),e.add(d)}const i=new b(C(new $(.5,.5,42,12)),G(l,.55));i.position.y=2,e.add(i);const a=new b(C(new Se(3.4,0)),G(l));return a.position.y=25,e.add(a),{object:e,update(o,r,h){t.forEach((d,c)=>{d.rotation.y=c*.42+o*(.12+c*.02),d.position.y=-14+c*6.2+Math.sin(o*.8+c*.6)*.5}),a.rotation.y=o*.9,a.rotation.x=o*.5,a.scale.setScalar(1+h*.35+Math.sin(o*2)*.06)},dispose(){}}}function pi(l){const e=new F,t=C(new $(.9,2.6,42,10)),s=new b(t,ue(l));e.add(s,Te(t,l,.45));const i=new b(C(new re(5,2)),G(l));i.position.y=24,e.add(i);const a=new b(C(new re(8.2,1)),C(new K({color:l,wireframe:!0,transparent:!0,opacity:.35,toneMapped:!1})));a.position.y=24,e.add(a);const o=[];for(let h=0;h<4;h++){const d=new b(C(new ft(1,1.35,80)),G(l,.5));d.rotation.x=Math.PI/2,d.position.y=24,o.push(d),e.add(d)}const r=new b(C(new $(14,17,2,6)),ue(l));return r.position.y=-22,e.add(r,(()=>{const h=Te(C(new $(14,17,2,6)),l,.7);return h.position.y=-22,h})()),{object:e,update(h,d,c){e.rotation.y=h*.14,i.rotation.y=-h*.6,i.scale.setScalar(1+Math.sin(h*2.2)*.07+c*.25),a.rotation.y=h*.35,a.rotation.z=h*.2,o.forEach((u,f)=>{const v=(h*.35+f/o.length)%1,p=1+v*34;u.scale.setScalar(p),u.material.opacity=(1-v)*.55*(.5+c*.5)})},dispose(){}}}function mi(){for(const l of pt)l.dispose();pt.length=0}function fi(l,e,t,s){const i=Math.min(window.devicePixelRatio||1,2),a=1024,o=420,r=document.createElement("canvas");r.width=a*i,r.height=o*i;const h=r.getContext("2d");h.scale(i,i);const d=`#${s.toString(16).padStart(6,"0")}`,c=a/2;h.textAlign="center",h.textBaseline="middle";const u=h.createLinearGradient(0,250,0,o);u.addColorStop(0,d),u.addColorStop(1,"rgba(0,0,0,0)"),h.strokeStyle=u,h.lineWidth=2,h.beginPath(),h.moveTo(c,250),h.lineTo(c,o-10),h.stroke();const f=250,v=44,p=524,m=190,k=34;h.strokeStyle=d,h.globalAlpha=.85,h.lineWidth=3;for(const[I,Y,ve,le]of[[f,v,1,1],[f+p,v,-1,1],[f,v+m,1,-1],[f+p,v+m,-1,-1]])h.beginPath(),h.moveTo(I+ve*k,Y),h.lineTo(I,Y),h.lineTo(I,Y+le*k),h.stroke();h.globalAlpha=1,h.font='600 26px "JetBrains Mono", ui-monospace, monospace',h.fillStyle=d,h.globalAlpha=.9,h.fillText(l.toUpperCase(),c,78),h.globalAlpha=1,h.font='700 84px "Space Grotesk", system-ui, sans-serif',h.shadowColor=d,h.shadowBlur=34,h.fillStyle="#eafcff",h.fillText(e,c,140),h.shadowBlur=0,h.font='400 27px "Inter", system-ui, sans-serif',h.fillStyle=d,h.globalAlpha=.8,h.fillText(t,c,200),h.globalAlpha=1,h.globalCompositeOperation="destination-out",h.fillStyle="rgba(0,0,0,0.35)";for(let I=v;I<v+m;I+=4)h.fillRect(f,I,p,1.6);h.globalCompositeOperation="source-over";const S=new vs(r);S.colorSpace=bs,S.anisotropy=4,S.generateMipmaps=!0,S.minFilter=ws,S.needsUpdate=!0;const w=new ys({map:S,transparent:!0,depthWrite:!1,blending:O,toneMapped:!1}),M=new xs(w);return M.scale.set(58,24,1),{sprite:M,dispose:()=>{S.dispose(),w.dispose()}}}const gi=`
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,vi=`
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uHealth;
  uniform float uFlash;
  uniform vec3 uHitPoint;
  uniform float uHitAge;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  // Hex distance field on a spherical shell, derived from the two dominant
  // axes of the local position. Cheap, and the seams read as panel joins.
  float hexGrid(vec2 p) {
    p *= 5.5;
    vec2 q = vec2(p.x * 1.1547, p.y + p.x * 0.5774);
    vec2 f = fract(q);
    vec2 i = floor(q);
    float d = min(min(f.x, f.y), 1.0 - max(f.x, f.y));
    // Silence the unused-warning-free path: i participates via jitter.
    d += 0.02 * fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
    return smoothstep(0.0, 0.09, d);
  }

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.2);

    vec3 d = normalize(vLocal);
    float cells = 1.0 - hexGrid(vec2(atan(d.z, d.x) * 0.7, d.y * 1.6));

    // Impact ripple: a ring expanding from the last hit point.
    float ring = 0.0;
    if (uHitAge < 1.0) {
      float dist = distance(normalize(uHitPoint), d);
      float r = uHitAge * 1.7;
      ring = smoothstep(0.22, 0.0, abs(dist - r)) * (1.0 - uHitAge);
    }

    float breathe = 0.5 + 0.5 * sin(uTime * 1.4 + d.y * 3.0);

    // Restrained on purpose. This is a 26-metre additive sphere with the
    // sector's landmark inside it — push the brightness and the shield stops
    // reading as a shield and becomes an opaque glowing ball that hides the
    // thing the visitor came to look at. Impact ripples and the hit flash are
    // the only parts allowed to go genuinely bright.
    float a = (0.02 + cells * 0.06 + fres * 0.2) * uHealth;
    a += ring * 0.6 + uFlash * 0.26;

    // Held well down. The Fresnel term peaks at the silhouette, which is
    // exactly where an additive sphere overlaps the core behind it — pushed
    // any harder the shield stops reading as a shell and becomes a white smear
    // with no geometry left in it, taking the boss with it.
    vec3 col = uColor * (0.2 + cells * 0.2 + fres * 0.45 + ring * 2.2 + uFlash * 1.3);
    col += vec3(1.0) * ring * 0.9;
    col *= 0.7 + breathe * 0.3;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;class bi{constructor(e,t,s){this.def=e,this.particles=t,this.impacts=s,this.object.position.set(...e.position),this.object.name=`sector:${e.id}`,this.radius=26;const i=a=>(this.bin.push(a),a);this.landmark=ri(e),this.object.add(this.landmark.object),this.label=fi(e.code,e.name,e.subtitle,e.color),this.label.sprite.position.set(0,56,0),this.object.add(this.label.sprite),this.shieldMat=i(new V({uniforms:{uColor:{value:new x(e.color)},uTime:{value:0},uHealth:{value:1},uFlash:{value:0},uHitPoint:{value:new g(0,1,0)},uHitAge:{value:2}},vertexShader:gi,fragmentShader:vi,transparent:!0,depthWrite:!1,side:st,blending:O})),this.shield=new b(i(new Pe(this.radius,48,32)),this.shieldMat),this.object.add(this.shield),this.cageMat=i(new K({color:e.color,wireframe:!0,transparent:!0,opacity:.12,toneMapped:!1,blending:O,depthWrite:!1})),this.cage=new b(i(new re(this.radius*1.03,2)),this.cageMat),this.object.add(this.cage),this.ringMat=i(j(e.color,.32)),this.ring=new b(i(new U(this.radius*1.5,.34,6,96)),this.ringMat),this.ring.rotation.x=Math.PI/2.1,this.object.add(this.ring),this.coreMat=i(j(new x(e.color).lerp(new x(16777215),.45).getHex(),0)),this.core=new b(i(new re(6.4,1)),this.coreMat),this.core.visible=!1,this.object.add(this.core)}object=new F;landmark;distance=0;state="idle";labelled=!1;maxHp=20;hp=20;shieldShare=.45;radius;label;shield;shieldMat;cage;cageMat;ring;ringMat;core;coreMat;hitFlash=0;hitAge=2;decryptTime=-1;activation=0;bin=[];get position(){return this.object.position}get decrypted(){return this.state==="decrypted"}get shielded(){return this.hp>this.maxHp*(1-this.shieldShare)}get healthPct(){return L(this.hp/this.maxHp,0,1)}get shieldPct(){const e=this.maxHp*this.shieldShare,t=this.hp-(this.maxHp-e);return L(t/e,0,1)}get corePct(){const e=this.maxHp*(1-this.shieldShare);return L(this.hp/e,0,1)}arm(e){this.maxHp=e,this.hp=e,this.state="engaged"}disarm(){this.state="idle",this.hp=this.maxHp,this.decryptTime=-1,this.core.visible=!1,this.coreMat.opacity=0,this.shieldMat.uniforms.uHealth.value=1,this.shield.visible=!0,this.cage.visible=!0}forceDecrypt(){this.state!=="decrypted"&&(this.hp=0,this.state==="idle"&&(this.state="engaged"),this.breachShield(),this.beginDecrypt())}markDecrypted(){this.state="decrypted",this.hp=0,this.decryptTime=0,this.shield.visible=!1,this.cage.visible=!1,this.core.visible=!0,this.coreMat.opacity=.9}hit(e,t){if(this.state==="decrypted"||this.state==="idle")return!1;const s=this.shielded;return this.hp=Math.max(0,this.hp-e),this.hitFlash=1,this.hitAge=0,this.shieldMat.uniforms.uHitPoint.value.copy(t).sub(this.object.position).normalize(),s&&!this.shielded&&this.breachShield(),this.hp<=0&&this.beginDecrypt(),!0}breachShield(){this.state="breached";const e=this.object.position;_.emit("node:breached",{id:this.def.id}),this.impacts.ring(e,this.radius*2.6,this.def.color,.7),this.impacts.ring(e,this.radius*1.6,16777215,.45),this.impacts.flash(e,this.radius*1.4,this.def.color,.3),this.particles.burst(e,{count:120,color:this.def.color,color2:16777215,speed:96,life:1.1,size:2.6,drag:1.5}),this.core.visible=!0}beginDecrypt(){this.state="decrypted",this.decryptTime=0;const e=this.object.position;this.impacts.explosion(e,12,this.def.color,16777215),this.impacts.ring(e,this.radius*5.5,16777215,1.1),this.impacts.ring(e,this.radius*4.2,this.def.color,.9),this.particles.burst(e,{count:260,color:16777215,color2:this.def.color,speed:150,life:1.6,size:3.4,drag:1.1}),this.particles.burst(e,{count:90,color:this.def.color,color2:1708080,speed:60,life:2.6,size:2,drag:.5,gravity:6})}update(e,t,s){const i=s.distanceTo(this.object.position),a=1-ot(120,620,i);this.activation=D(this.activation,a,3,t),this.landmark.update(e,t,this.activation,this.decrypted),this.hitFlash>0&&(this.hitFlash=Math.max(0,this.hitFlash-t*4)),this.hitAge=Math.min(2,this.hitAge+t*1.6);const o=ot(1500,700,i),r=ot(520,260,i),h=this.labelled?1:0;if(this.label.sprite.material.opacity=L(o*(1-r)*h,0,1),this.label.sprite.position.y=52+Math.sin(e*.7)*1.4,this.label.sprite.scale.set(56,23,1),this.shieldMat.uniforms.uTime.value=e,this.shieldMat.uniforms.uFlash.value=this.hitFlash,this.shieldMat.uniforms.uHitAge.value=this.hitAge,this.state==="decrypted"){this.decryptTime+=t;const d=Math.min(1,this.decryptTime*1.4);this.shieldMat.uniforms.uHealth.value=0,this.shield.visible=!1,this.cage.visible=!1,this.core.visible=!0,this.coreMat.opacity=.24+.32*d,this.core.scale.setScalar(1+Math.sin(e*1.8)*.06+(1-d)*2.4),this.ringMat.opacity=.28+Math.sin(e*1.4)*.1,this.ring.scale.setScalar(1+(1-d)*.5)}else{const d=this.state==="idle"?1:this.shieldPct;this.shieldMat.uniforms.uHealth.value=.25+d*.75,this.cageMat.opacity=.04+d*.11+this.hitFlash*.25;const c=.9+d*.1;this.shield.scale.setScalar(c),this.cage.scale.setScalar(c),this.ringMat.opacity=.2+this.activation*.14+this.hitFlash*.35,this.state==="breached"&&(this.coreMat.opacity=.32+Math.sin(e*9)*.13+this.hitFlash*.28,this.core.scale.setScalar(1+Math.sin(e*7)*.12),Math.random()<t*16&&this.particles.burst(this.object.position,{count:3,color:16777215,color2:this.def.color,speed:44,life:.6,size:2,drag:2.2}))}this.core.rotation.y=e*.7,this.core.rotation.x=e*.4,this.cage.rotation.y=e*.16,this.cage.rotation.x=e*.09,this.ring.rotation.z=e*.22}dispose(){this.label.dispose(),this.landmark.dispose();for(const e of this.bin)e.dispose();this.bin.length=0}}const wi=`
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.65 + 0.35 * sin(uTime * 1.4 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (260.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`,yi=`
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    // Soft core with a wide falloff halo.
    float core = smoothstep(0.5, 0.0, r);
    float halo = smoothstep(0.5, 0.15, r);
    gl_FragColor = vec4(vColor * (core * 0.55 + halo * 0.75) * vTwinkle, core * 0.9);
  }
`;class xi{object;material;constructor(e,t){const s=bt(20835),i=new Float32Array(e*3),a=new Float32Array(e*3),o=new Float32Array(e),r=new Float32Array(e),h=[new x(10475263),new x(16777215),new x(5104065),new x(16748479),new x(16767392)];for(let c=0;c<e;c++){i[c*3+0]=(s()-.5)*2600,i[c*3+1]=(s()-.5)*1100,i[c*3+2]=s()*-2600+400;const u=h[s()*h.length|0],f=.26+s()*.44;a[c*3+0]=u.r*f,a[c*3+1]=u.g*f,a[c*3+2]=u.b*f,o[c]=1.2+s()*s()*2.8,r[c]=s()*Math.PI*2}const d=new Ae;d.setAttribute("position",new H(i,3)),d.setAttribute("aColor",new H(a,3)),d.setAttribute("aSize",new H(o,1)),d.setAttribute("aPhase",new H(r,1)),this.material=new V({uniforms:{uTime:{value:0},uPixelRatio:{value:t}},vertexShader:wi,fragmentShader:yi,transparent:!0,depthWrite:!1,blending:O}),this.object=new Ot(d,this.material),this.object.frustumCulled=!1}update(e,t){this.material.uniforms.uTime.value=e,this.material.uniforms.uPixelRatio.value=t}dispose(){this.object.geometry.dispose(),this.material.dispose()}}const W=54,we=3e3,ki=new g(0,1,0),ze=()=>({position:new g,tangent:new g(0,0,-1),right:new g(1,0,0),up:new g(0,1,0)});class Si{curve;length;sectorDistance=[];cumulative;samples=[];tmpA=new g;constructor(){const e=[new g(0,14,150),...A.map(a=>new g(...a.position))],t=e[e.length-1];e.push(new g(t.x,t.y+30,t.z-420)),this.curve=new ks(e,!1,"catmullrom",.5),this.cumulative=new Float32Array(we+1);let s=0,i=null;for(let a=0;a<=we;a++){const o=this.curve.getPoint(a/we);this.samples.push(o),i&&(s+=o.distanceTo(i)),this.cumulative[a]=s,i=o}this.length=s;for(const a of A){const o=this.tmpA.set(...a.position);let r=0,h=1/0;for(let d=0;d<=we;d++){const c=this.samples[d].distanceToSquared(o);c<h&&(h=c,r=d)}this.sectorDistance.push(this.cumulative[r])}}tAt(e){const t=Math.max(0,Math.min(this.length,e));let s=0,i=we;for(;s<i;){const d=s+i>>1;this.cumulative[d]<t?s=d+1:i=d}const a=Math.max(1,s),o=this.cumulative[a-1],r=this.cumulative[a],h=r>o?(t-o)/(r-o):0;return(a-1+h)/we}poseAt(e,t){const s=this.tAt(e);return this.curve.getPoint(s,t.position),this.curve.getTangent(s,t.tangent).normalize(),t.right.crossVectors(t.tangent,ki),t.right.lengthSq()<1e-6&&t.right.set(1,0,0),t.right.normalize(),t.up.crossVectors(t.right,t.tangent).normalize(),t}approachDistance(e,t){return Math.max(0,this.sectorDistance[e]-t)}dispose(){this.samples.length=0}}const pe=360,Mi=24,_i=`
  attribute float aRun;
  attribute float aSide;
  uniform float uHalfWidth;
  varying vec2 vGrid;
  varying float vDepth;

  void main() {
    // uv.x is normalised across the ribbon (-1 at the left hem, +1 at the
    // right); vGrid is in metres so the rules stay square whatever the spline
    // is doing. Conflating the two is what made the first version invisible —
    // the edge fade read a 360-metre coordinate as a 0..1 ratio and clamped
    // every fragment's alpha to zero.
    // aSide is -1 at the left hem and +1 at the right. Deliberately a custom
    // attribute rather than the built-in uv: three only guarantees uv is
    // declared for materials it believes need texture coordinates, and a custom
    // shader leaning on it is one release away from silently receiving nothing
    // — which is exactly what happened here. It zeroed the edge fade, so the
    // whole surface discarded every fragment it drew.
    vGrid = vec2(aSide * uHalfWidth, aRun);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,Ti=`
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uMinor;
  uniform float uMajor;
  uniform float uPulse;

  varying vec2 vGrid;
  varying float vDepth;

  /*
   * Screen-space-derivative antialiased rules.
   *
   * The clamp on the filter width is load-bearing. A floor is viewed at a
   * grazing angle almost everywhere, where fwidth explodes and the smoothstep
   * widens until every line washes out to nothing — which is exactly why the
   * first version of this surface rendered as an invisible plane. Capping the
   * filter keeps the far half of the corridor drawn instead of dissolved.
   */
  float rule(vec2 p, float spacing, float lineWidth) {
    // Distance, in metres, to the nearest rule on each axis.
    vec2 q = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
    // Filter width, clamped at both ends. The lower bound matters because a
    // zero derivative collapses the smoothstep; the upper bound matters because
    // a floor is viewed at a grazing angle almost everywhere, where fwidth
    // explodes and every line washes out to nothing.
    vec2 w = clamp(fwidth(p) * lineWidth, vec2(0.4), vec2(spacing * 0.35));
    // Note the edge order: smoothstep is undefined when edge0 >= edge1, and
    // writing it backwards is why the first version of this surface discarded
    // every fragment it drew.
    vec2 l = 1.0 - smoothstep(vec2(0.0), w, q);
    return max(l.x, l.y);
  }

  void main() {
    float minor = rule(vGrid, uMinor, 1.2);
    float major = rule(vGrid, uMajor, 1.6);

    // A band of light travelling down the corridor: data moving through the
    // structure, and a second, slower speed cue underneath the gates.
    float band = 0.5 + 0.5 * sin(vGrid.y * 0.02 - uTime * 1.6);

    // Pull the surface back very close to the lens so it never slaps across the
    // camera, and let fog hide the far hem. There is deliberately no fade based
    // on distance across the ribbon: several attempts at one all ended up
    // multiplying the whole surface by zero and rendering nothing at all, and a
    // hem that fog already swallows is not worth that risk.
    float near = smoothstep(8.0, 55.0, vDepth);

    // Additive, with every term folded into the colour and alpha pinned at 1.
    //
    // This surface is the largest object in the scene and it went through
    // several rounds of rendering as literally nothing, each time because one
    // factor in an alpha product had quietly gone to zero and taken the whole
    // thing with it. Additive intensity fails gracefully: a term that drops too
    // low makes the grid dim, never absent, and there is no discard to hide
    // behind. It is also how every other glowing surface here is drawn.
    float strength = (0.035 + minor * 0.22 + major * 0.55) * near * uOpacity;
    strength *= 0.65 + 0.35 * band;

    // Fog attenuates an additive surface rather than tinting it — mixing toward
    // the fog colour would *add* haze in the distance instead of removing it.
    float fogFactor = 1.0 - exp(-pow(uFogDensity * vDepth, 2.0));
    strength *= 1.0 - clamp(fogFactor, 0.0, 1.0);

    vec3 col = uColor * (0.5 + major * 0.9 + band * 0.35) * strength;
    // The floor moves with the score: every kick lifts the major rules most and
    // the minor ones a little, so the grid breathes in time without the whole
    // surface flashing.
    col *= 1.0 + uPulse * (0.25 + major * 0.9);

    gl_FragColor = vec4(col, 1.0);
  }
`;class Ai{object=new F;surfaces=[];accent=new x(5104065);constructor(e){this.surfaces.push(this.build(e,-100,1,26,130)),this.surfaces.push(this.build(e,W+104,.26,40,200));for(const t of this.surfaces)this.object.add(t.mesh)}build(e,t,s,i,a){const o=ze(),r=Math.max(2,Math.floor(e.length/Mi)),h=new Float32Array((r+1)*2*3),d=new Float32Array((r+1)*2),c=new Float32Array((r+1)*2),u=[],f=new g;for(let k=0;k<=r;k++){const S=k/r*e.length;e.poseAt(S,o),f.copy(o.position).addScaledVector(o.up,t);const w=k*6;if(h[w+0]=f.x-o.right.x*pe,h[w+1]=f.y-o.right.y*pe,h[w+2]=f.z-o.right.z*pe,h[w+3]=f.x+o.right.x*pe,h[w+4]=f.y+o.right.y*pe,h[w+5]=f.z+o.right.z*pe,d[k*2+0]=-1,d[k*2+1]=1,c[k*2+0]=S,c[k*2+1]=S,k<r){const M=k*2;u.push(M,M+1,M+2,M+1,M+3,M+2)}}const v=new Ae;v.setAttribute("position",new H(h,3)),v.setAttribute("aSide",new H(d,1)),v.setAttribute("aRun",new H(c,1)),v.setIndex(u);const p=new V({uniforms:{uColor:{value:new x(5104065)},uFogColor:{value:new x(329487)},uFogDensity:{value:0},uTime:{value:0},uOpacity:{value:s},uMinor:{value:i},uMajor:{value:a},uHalfWidth:{value:pe},uPulse:{value:0}},vertexShader:_i,fragmentShader:Ti,transparent:!0,depthWrite:!1,blending:O,side:st}),m=new b(v,p);return m.frustumCulled=!1,m.renderOrder=-10,{mesh:m,mat:p}}update(e,t,s,i,a=0){this.accent.copy(t).multiplyScalar(.55);for(const o of this.surfaces)o.mat.uniforms.uTime.value=e,o.mat.uniforms.uColor.value.lerp(this.accent,.06),o.mat.uniforms.uFogColor.value.copy(s),o.mat.uniforms.uFogDensity.value=i,o.mat.uniforms.uPulse.value=a}dispose(){for(const e of this.surfaces)e.mesh.geometry.dispose(),e.mat.dispose()}}const Ci=new x(5925508),lt=58,ht=W+15,Ne=360;class Pi{object=new F;gates;ribs;debris;gateMat;ribMat;debrisMat;gateGeo;ribGeo;debrisGeo;debrisSeeds;m=new Ce;q=new ie;v=new g;up=new g(0,1,0);scaleVec=new g;axis=new g(0,0,1);pose=ze();constructor(e){const t=Math.floor(e.length/lt);this.gateGeo=new U(ht,.42,5,64),this.gateMat=new K({transparent:!0,opacity:.3,depthWrite:!1,blending:O,toneMapped:!1});const s=c=>{c.vertexShader=c.vertexShader.replace("#include <common>",`#include <common>
varying float vViewDepth;`).replace("#include <fog_vertex>",`#include <fog_vertex>
	vViewDepth = -mvPosition.z;`),c.fragmentShader=c.fragmentShader.replace("#include <common>",`#include <common>
varying float vViewDepth;`).replace("#include <opaque_fragment>",`	diffuseColor.a *= smoothstep(26.0, 150.0, vViewDepth) * (1.0 - smoothstep(1100.0, 1900.0, vViewDepth));
#include <opaque_fragment>`)};this.gateMat.onBeforeCompile=s,this.ribMat=new K({transparent:!0,opacity:.22,depthWrite:!1,blending:O,toneMapped:!1}),this.ribMat.onBeforeCompile=s;const i=[],a=[],o=new x,r=new x;for(let c=0;c<t;c++){const u=(c+.5)*lt;e.poseAt(u,this.pose);const{a:f,b:v,f:p}=mt(e,u);o.set(A[f].color),r.set(A[v].color);const m=o.clone().lerp(r,p);if(e.sectorDistance.some(w=>Math.abs(w-u)<130))continue;const S=new ie().setFromUnitVectors(this.axis,this.pose.tangent);if(i.push({pos:this.pose.position.clone(),quat:S,color:m}),c%2===0)for(const[w,M]of[[.72,.72],[-.72,.72],[.72,-.72],[-.72,-.72]]){const I=this.pose.position.clone().addScaledVector(this.pose.right,w*ht).addScaledVector(this.pose.up,M*ht);a.push({pos:I,quat:S,color:m,len:lt*1.9})}}this.gates=new Q(this.gateGeo,this.gateMat,Math.max(1,i.length)),this.gates.name="corridor:gates",this.gates.frustumCulled=!1,i.forEach((c,u)=>{this.m.compose(c.pos,c.quat,this.scaleVec.set(1,1,1)),this.gates.setMatrixAt(u,this.m),this.gates.setColorAt(u,c.color)}),this.gates.instanceMatrix.needsUpdate=!0,this.gates.instanceColor&&(this.gates.instanceColor.needsUpdate=!0),this.object.add(this.gates),this.ribGeo=new R(.5,.5,1),this.ribs=new Q(this.ribGeo,this.ribMat,Math.max(1,a.length)),this.ribs.name="corridor:ribs",this.ribs.frustumCulled=!1,a.forEach((c,u)=>{this.m.compose(c.pos,c.quat,this.scaleVec.set(1,1,c.len)),this.ribs.setMatrixAt(u,this.m),this.ribs.setColorAt(u,c.color)}),this.ribs.instanceMatrix.needsUpdate=!0,this.ribs.instanceColor&&(this.ribs.instanceColor.needsUpdate=!0),this.object.add(this.ribs),this.debrisGeo=new Ss(1,0),this.debrisMat=new K({transparent:!0,opacity:.2,depthWrite:!1,toneMapped:!1}),this.debris=new Q(this.debrisGeo,this.debrisMat,Ne),this.debris.instanceMatrix.setUsage(Me),this.debris.name="corridor:debris",this.debris.frustumCulled=!1;const h=bt(40511);this.debrisSeeds=new Float32Array(Ne*6);const d=new x;for(let c=0;c<Ne;c++){const u=h()*e.length;e.poseAt(u,this.pose);const f=h()*Math.PI*2,v=W+40+h()*320,p=this.pose.position.clone().addScaledVector(this.pose.right,Math.cos(f)*v).addScaledVector(this.pose.up,Math.sin(f)*v*.62);this.debrisSeeds[c*6+0]=p.x,this.debrisSeeds[c*6+1]=p.y,this.debrisSeeds[c*6+2]=p.z,this.debrisSeeds[c*6+3]=h()*Math.PI*2,this.debrisSeeds[c*6+4]=1.4+h()*h()*8,this.debrisSeeds[c*6+5]=.1+h()*.4;const{a:m}=mt(e,u);d.set(A[m].color).lerp(Ci,.68).multiplyScalar(.35+h()*.5),this.debris.setColorAt(c,d)}this.debris.instanceColor&&(this.debris.instanceColor.needsUpdate=!0),this.object.add(this.debris)}update(e){this.gateMat.opacity=.24+Math.sin(e*.9)*.05,this.ribMat.opacity=.16+Math.sin(e*.9+1)*.04;for(let t=0;t<Ne;t++){const s=t*6,i=this.debrisSeeds[s+3],a=this.debrisSeeds[s+4],o=this.debrisSeeds[s+5];this.v.set(this.debrisSeeds[s+0],this.debrisSeeds[s+1]+Math.sin(e*.2+i)*4,this.debrisSeeds[s+2]),this.q.setFromAxisAngle(this.up,e*o+i),this.m.compose(this.v,this.q,this.scaleVec.setScalar(a)),this.debris.setMatrixAt(t,this.m)}this.debris.instanceMatrix.needsUpdate=!0}dispose(){this.gateGeo.dispose(),this.ribGeo.dispose(),this.debrisGeo.dispose(),this.gateMat.dispose(),this.ribMat.dispose(),this.debrisMat.dispose(),this.gates.dispose(),this.ribs.dispose(),this.debris.dispose()}}function mt(l,e){const t=l.sectorDistance;if(e<=t[0])return{a:0,b:0,f:0};for(let s=0;s<t.length-1;s++)if(e<=t[s+1]){const i=(e-t[s])/Math.max(1,t[s+1]-t[s]);return{a:s,b:s+1,f:i}}return{a:t.length-1,b:t.length-1,f:0}}const Qe=[{sector:"origin",lead:185,nodeHp:11,nodeName:"ORIGIN CIPHER",brief:"First contact. Light resistance — use it to learn the guns.",waves:[{at:.1,units:[{kind:"drone",count:3}],label:"Clear the scout drones"},{at:.5,units:[{kind:"drone",count:4}],label:"Clear the second flight"}]},{sector:"ventures",lead:300,nodeHp:20,nodeName:"LEDGER VAULT",brief:"Two operating companies behind this one. The vault is well defended.",waves:[{at:.14,units:[{kind:"drone",count:5}],label:"Clear the picket line"},{at:.52,units:[{kind:"lancer",count:3},{kind:"drone",count:3}],label:"Break the charge run"}]},{sector:"forge",lead:330,nodeHp:26,nodeName:"FORGE CORE",brief:"Automated defences. They shoot back — keep moving.",waves:[{at:.14,units:[{kind:"sentry",count:3}],label:"Silence the sentries"},{at:.5,units:[{kind:"weaver",count:5},{kind:"lancer",count:2}],label:"Cut through the swarm"}]},{sector:"arcade",lead:340,nodeHp:30,nodeName:"CABINET MAINFRAME",brief:"Attract mode is over. This one plays back.",waves:[{at:.13,units:[{kind:"weaver",count:6}],label:"Clear the formation"},{at:.5,units:[{kind:"lancer",count:4},{kind:"sentry",count:2}],label:"Survive the boss rush"}]},{sector:"track",lead:350,nodeHp:33,nodeName:"ARCHIVE SPINE",brief:"Fifteen years of records, and something guarding all of them.",waves:[{at:.13,units:[{kind:"sentry",count:4}],label:"Suppress the archive guns"},{at:.5,units:[{kind:"drone",count:6},{kind:"weaver",count:4}],label:"Push through the screen"}]},{sector:"uplink",lead:360,nodeHp:38,nodeName:"UPLINK RELAY",brief:"Last gate. Open the relay and the channel is yours.",waves:[{at:.12,units:[{kind:"lancer",count:4},{kind:"weaver",count:4}],label:"Clear the approach"},{at:.5,units:[{kind:"sentry",count:3},{kind:"drone",count:5},{kind:"lancer",count:2}],label:"Hold the line"}]}],ye={drone:{hp:1,size:3.6,speed:26,fireRate:0,xp:8,color:16726822},weaver:{hp:2,size:3.4,speed:40,fireRate:0,xp:12,color:16734750},lancer:{hp:2,size:4.4,speed:82,fireRate:0,xp:16,color:16723786},sentry:{hp:4,size:5.6,speed:16,fireRate:1.9,xp:22,color:16719677}};class Di{constructor(e,t=1){this.detail=t;const s=i=>(this.bin.push(i),i);A.forEach((i,a)=>{const o=Qe[a],r=e.sectorDistance[a],h=a===0?0:Math.max(0,e.sectorDistance[a-1]+120),d=r+150,c=Math.max(120,d-h),u=bt(4660+a*7919),f=s(ke({color:new x(i.color).lerp(new x(2765638),.45).getHex(),base:659226,rim:.62,power:2.6,glow:.015,scan:!0})),v=Ei(i.form).map(E=>{const B=s(E);return B.computeBoundingSphere(),B}),p=v.map(E=>E.boundingSphere?.radius??20),m=Math.round((o.lead>0?96:68)*this.detail),k=Math.ceil(m/v.length)+4,S=v.map((E,B)=>{const N=new Q(E,f,k);return N.name=`env:props:${i.id}:${B}`,N.frustumCulled=!1,N}),w=v.map(()=>0);for(let E=0;E<m;E++){const B=(E+.5)/m,N=h+c*B;if(e.sectorDistance.some(Jt=>Math.abs(Jt-N)<110))continue;e.poseAt(N,this.pose);const X=E%v.length,ae=Li(i.form,u),Re=E%2===0?1:-1,at=p[X]*Math.max(ae.x,ae.y,ae.z),Yt=W+82+at+u()*u()*260,Qt=-W-20+u()*u()*150;this.p.copy(this.pose.position).addScaledVector(this.pose.right,Re*Yt).addScaledVector(this.pose.up,Qt),this.q.setFromUnitVectors(this.axisZ,this.pose.tangent),this.euler.set(0,(u()-.5)*1.2,(u()-.5)*.22),this.q.multiply(new ie().setFromEuler(this.euler)),this.m.compose(this.p,this.q,ae),w[X]<k&&S[X].setMatrixAt(w[X]++,this.m)}S.forEach((E,B)=>{E.count=w[B],E.instanceMatrix.needsUpdate=!0,this.object.add(E)});let M=null,I=null;if(i.form==="reactor"||i.form==="beacon"||i.form==="spine"){I=s(j(i.color,.13));const E=s(Ii(i.form)),B=Math.max(3,Math.round(6*this.detail));M=new Q(E,I,B),M.name=`env:arches:${i.id}`,M.frustumCulled=!1;let N=0;for(let X=0;X<B;X++){const ae=h+c*((X+.6)/B);if(e.sectorDistance.some(at=>Math.abs(at-ae)<110))continue;e.poseAt(ae,this.pose),this.q.setFromUnitVectors(this.axisZ,this.pose.tangent);const Re=1+X*.06;this.m.compose(this.pose.position,this.q,this.s.set(Re,Re,1)),M.setMatrixAt(N++,this.m)}M.count=N,M.instanceMatrix.needsUpdate=!0,this.object.add(M)}const Y=s(j(i.color,.26)),ve=s(new Pe(1,6,5)),le=Math.round(70*this.detail),J=new Q(ve,Y,le);J.name=`env:accents:${i.id}`,J.frustumCulled=!1;for(let E=0;E<le;E++){const B=h+c*u();e.poseAt(B,this.pose);const N=u()*Math.PI*2,X=W+16+u()*190;this.p.copy(this.pose.position).addScaledVector(this.pose.right,Math.cos(N)*X).addScaledVector(this.pose.up,Math.sin(N)*X*.7);const ae=.5+u()*1.6;this.m.compose(this.p,this.q.identity(),this.s.setScalar(ae)),J.setMatrixAt(E,this.m)}J.instanceMatrix.needsUpdate=!0,this.object.add(J),this.bands.push({def:i,props:S,arches:M,mats:[f],archMat:I,accents:J,accentMat:Y,rim:.62,glow:.015})})}combat=0;object=new F;bands=[];bin=[];m=new Ce;q=new ie;s=new g;p=new g;euler=new Nt;pose=ze();axisZ=new g(0,0,1);get combatLevel(){return this.combat}update(e,t=0,s=!1){const i=s?1:0;this.combat+=(i-this.combat)*Math.min(1,t*2.2);const a=1-this.combat*.42,o=1-this.combat*.55;for(const r of this.bands){for(const h of r.mats)h.uniforms.uTime.value=e,h.uniforms.uRim.value=r.rim*a,h.uniforms.uGlow.value=r.glow*a;r.archMat&&(r.archMat.opacity=(.09+Math.sin(e*.7+r.def.index)*.035)*o),r.accentMat&&(r.accentMat.opacity=(.19+Math.sin(e*2.1+r.def.index*1.7)*.08)*o)}}dispose(){for(const e of this.bands){for(const t of e.props)t.dispose();e.arches?.dispose(),e.accents?.dispose()}for(const e of this.bin)e.dispose();this.bin.length=0}}function de(l,e,t,s=6,i=0){const a=new $(e,l,t,s,2);return i!==0&&a.rotateY(i),a}function Ei(l){switch(l){case"knot":return[new Ie(7,34,5,1),new Se(9,0),new $(1.4,5.5,40,5)];case"twin":return[de(11,7,78,4,Math.PI/4),de(13,8,62,6),de(20,16,30,8,.2)];case"reactor":return[new Vt(6,26,5,10),new U(14,3.2,6,20),de(7,5,44,6)];case"cabinet":return[de(18,15,22,4,Math.PI/4),de(11,7,32,5),new $(1.6,1.6,42,8)];case"spine":return[de(26,22,3.2,8),de(9,6,34,6),new U(19,1.8,5,12)];case"beacon":return[new $(.8,3.2,66,7),new Ie(11,18,7,1,!0),new re(7,0)]}}function Li(l,e){const t=.6+e()*.85;switch(l){case"twin":return new g(t,.6+e()*1.6,t);case"spine":return new g(.7+e()*.9,t,.7+e()*.7);case"beacon":return new g(t,.5+e()*1.5,t);default:return new g(t,t,t)}}function Ii(l){switch(l){case"reactor":return new U(W+46,4.2,6,40);case"spine":return new U(W+52,2.4,4,6);default:return new U(W+58,1.8,4,32)}}const Fi=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Skybox: strip translation, keep rotation, force to the far plane.
    vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
    gl_Position = p.xyww;
  }
`,zi=`
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uDeep;
  uniform float uTime;
  uniform float uDensity;
  uniform vec3 uEye;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);

    // Very slow drift keeps the sky alive without ever drawing attention.
    /*
     * Parallax.
     *
     * A skybox is pinned to the camera's rotation and nothing else, so for the
     * whole length of a six-sector flight the backdrop is rigid: the ship moves
     * thousands of units and the sky behind it does not shift by a pixel. That
     * is why the corridor read as objects in a void — everything with depth cues
     * was in the foreground, and the largest surface in frame was flat.
     *
     * True parallax is impossible on a sphere at the far plane, but the noise
     * field it samples is volumetric, so drifting the sample point with the
     * camera gives the same read for one uniform.
     *
     * The rates matter more than the magnitude. The deep cloud barely moves,
     * which is correct — a nebula light-years out should not swim past the
     * canopy — while the filaments drift an order of magnitude faster. It is
     * that *difference* the eye reads as distance, not the absolute motion, so
     * the sky stays still enough to feel vast and still shifts enough that you
     * can tell you are travelling through it rather than dragging it along.
     */
    vec3 drift = uEye * 0.00045;
    vec3 p = d * 2.2 + drift + vec3(0.0, 0.0, uTime * 0.006);

    float base = fbm(p);
    // Domain warp: feed the first field back in to get filaments and voids
    // instead of the cotton-wool look plain fbm gives you.
    float wisp = fbm(p * 2.6 + drift * 4.0 + vec3(base * 2.4));

    /*
     * Thresholds are the whole ballgame here, and this shader has now been
     * wrong in both directions.
     *
     * Too generous and cloud covers the sky; since the sky sits behind
     * everything, bloom then lifts the entire frame into a pale wash and every
     * neon edge disappears into it. Too mean — which is what shipped after that
     * correction — and the fbm never clears the threshold at all, so an entire
     * noise field costs its shader time and renders as flat black. A reviewer
     * described the backdrop as "just a static starfield", which was a fair
     * description of a nebula that was not being drawn.
     *
     * These values are tuned to sit *under* the bloom threshold at their
     * brightest, so the nebula reads as depth rather than as a light source.
     */
    float cloud = pow(clamp(base * 1.1 + wisp * 0.4 - 0.52, 0.0, 1.0), 2.0) * uDensity;
    float hot = pow(clamp(wisp * 1.6 - 0.74, 0.0, 1.0), 2.6);

    // Ridged filaments: folding the noise about its midpoint turns soft blobs
    // into strands, which is what actually reads as a nebula rather than fog.
    float ridge = 1.0 - abs(wisp * 2.0 - 1.0);
    ridge = pow(clamp(ridge, 0.0, 1.0), 3.5) * cloud;

    /*
     * The galactic band.
     *
     * This is the difference between "a noise field" and "a place". A nebula
     * field with even coverage reads as haze no matter how much structure the
     * fbm carries, because nothing in it establishes an orientation or a scale
     * — the eye has no lane to follow. Real skies have a plane: a dense, tilted
     * belt of dust running across them, thinning out either side. Concentrating
     * the same amount of cloud into a belt costs nothing extra and gives the
     * corridor an implied up, a horizon and a direction of travel.
     *
     * Tilted off-axis so it never looks like a horizontal gradient, and
     * softened by the noise itself so the edges are ragged rather than banded.
     */
    vec3 planeAxis = normalize(vec3(0.19, 0.94, -0.28));
    float off = dot(d, planeAxis);
    float belt = 1.0 - smoothstep(0.0, 0.62, abs(off) - wisp * 0.13);
    belt = pow(clamp(belt, 0.0, 1.0), 1.6);

    // Voids matter as much as clouds: without genuinely empty sky the belt has
    // nothing to be dense against.
    cloud *= 0.28 + belt * 1.15;
    hot *= 0.2 + belt * 1.5;
    ridge *= 0.25 + belt * 1.4;

    // A cool rim well off the plane, so the empty half of the sky is not simply
    // black — it is the far side of the same volume.
    float rim = pow(clamp(abs(off), 0.0, 1.0), 2.2) * 0.16;

    vec3 col = uDeep * (0.68 + belt * 0.55);
    col += uColorA * cloud * 1.05;
    col += uColorA * rim;
    col += uColorB * hot * 0.95;
    col += uColorB * ridge * 0.6;

    /*
     * Distant unresolved star haze.
     *
     * This was sampled at near-pixel frequency, which is the difference between
     * "stars too far to resolve" and "sensor noise": at 620 cells the specks
     * were smaller than a pixel and dense enough that a reviewer read the whole
     * boosted frame as compression artefacts sitting on top of the scene. It
     * also doubled up with the real starfield, which is already drawing stars.
     *
     * Sparser and larger. Fewer cells clear the threshold, each one is big
     * enough to read as a point of light, and the field beneath stays haze.
     */
    float grain = hash(floor(d * 300.0));
    col += vec3(0.85, 0.9, 1.0) * pow(grain, 110.0) * 0.7;

    gl_FragColor = vec4(col, 1.0);
  }
`;class Ri{object;material;targetA=new x(1911395);targetB=new x(5104065);targetDeep=new x(263436);constructor(e=1){this.material=new V({uniforms:{uColorA:{value:new x(1911395)},uColorB:{value:new x(5104065)},uDeep:{value:new x(263436)},uTime:{value:0},uDensity:{value:e},uEye:{value:new g}},vertexShader:Fi,fragmentShader:zi,side:Ms,depthWrite:!1,depthTest:!1,toneMapped:!1}),this.object=new b(new Pe(1,32,20),this.material),this.object.frustumCulled=!1,this.object.renderOrder=-1e3}setPalette(e,t,s){this.targetA.set(e),this.targetB.set(t),this.targetDeep.set(s)}setDensity(e){this.material.uniforms.uDensity.value=e}update(e,t,s){this.material.uniforms.uTime.value=e,s&&this.material.uniforms.uEye.value.copy(s);const i=Math.min(1,t*1.1);this.material.uniforms.uColorA.value.lerp(this.targetA,i),this.material.uniforms.uColorB.value.lerp(this.targetB,i),this.material.uniforms.uDeep.value.lerp(this.targetDeep,i)}dispose(){this.object.geometry.dispose(),this.material.dispose()}}const Bi=new x(16777215),Et={origin:16727425,ventures:6003967,forge:16757844,arcade:5104065,track:16738877,uplink:9133302},Lt={origin:330260,ventures:1312277,forge:722464,arcade:1445125,track:264988,uplink:200975};class ji{group=new F;sectors=[];route;starfield;causeway;corridor;environment;nebula;colA=new x;colB=new x;accent=new x;deep=new x;cloud=new x;hotCloud=new x;emission=new x;fogTint=new x;fog;constructor(e,t,s,i,a,o){this.route=new Si;for(const r of A){const h=new bi(r,t,s);this.sectors.push(h),this.group.add(h.object)}this.sectors.forEach((r,h)=>{r.distance=this.route.sectorDistance[h]}),this.nebula=new Ri(o>.6?1:.75),e.add(this.nebula.object),this.starfield=new xi(i,a),this.group.add(this.starfield.object),this.causeway=new Ai(this.route),this.group.add(this.causeway.object),this.corridor=new Pi(this.route),this.group.add(this.corridor.object),this.environment=new Di(this.route,o),this.group.add(this.environment.object),this.fog=new _s(329487,.0012),e.fog=this.fog}get combat(){return this.environment.combatLevel}setLabelled(e){this.sectors.forEach((t,s)=>{t.labelled=s===e})}sector(e){return this.sectors.find(t=>t.def.id===e)}paletteAt(e){const{a:t,b:s,f:i}=mt(this.route,e);return this.colA.set(A[t].color),this.colB.set(A[s].color),this.accent.copy(this.colA).lerp(this.colB,i),this.deep.set(Lt[A[t].id]).lerp(new x(Lt[A[s].id]),i),this.emission.set(Et[A[t].id]).lerp(new x(Et[A[s].id]),i),{accent:this.accent,deep:this.deep,hot:this.emission}}update(e,t,s,i,a=!1,o=0){this.starfield.update(e,i),this.corridor.update(e),this.environment.update(e,t,a);const{accent:r,deep:h,hot:d}=this.paletteAt(s.distance);this.cloud.copy(r).multiplyScalar(.46),this.hotCloud.copy(d).lerp(Bi,.18).multiplyScalar(.62),this.nebula.setPalette(this.cloud.getHex(),this.hotCloud.getHex(),h.getHex()),this.nebula.update(e,t,s.object.position),this.fogTint.copy(h).lerp(r,.1).multiplyScalar(.8),this.fog.color.lerp(this.fogTint,Math.min(1,t*1.2)),oi(this.fog.color,this.fog.density),this.causeway.update(e,r,this.fog.color,this.fog.density,o);for(const c of this.sectors)c.update(e,t,s.object.position);return r}dispose(){for(const e of this.sectors)e.dispose();this.starfield.dispose(),this.causeway.dispose(),this.corridor.dispose(),this.environment.dispose(),this.nebula.dispose(),mi()}}class Vi{constructor(e,t,s,i=.6){this.segments=e,this.width=t,this.minStep=i;const a=e*2;this.pos=new Float32Array(a*3),this.prog=new Float32Array(a);for(let r=0;r<e;r++)this.points.push(new g);const o=[];for(let r=0;r<e-1;r++){const h=r*2;o.push(h,h+1,h+2,h+1,h+3,h+2)}this.geo=new Ae,this.geo.setAttribute("position",new H(this.pos,3)),this.geo.setAttribute("aProg",new H(this.prog,1)),this.geo.setIndex(o),this.geo.setDrawRange(0,0),this.mat=new V({uniforms:{uColor:{value:new x(s)},uHot:{value:new x(16777215)},uIntensity:{value:1}},vertexShader:`
        attribute float aProg;
        varying float vProg;
        varying float vDepth;
        void main() {
          vProg = aProg;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        precision highp float;
        uniform vec3 uColor;
        uniform vec3 uHot;
        uniform float uIntensity;
        varying float vProg;
        varying float vDepth;
        void main() {
          // vProg is 1 at the nozzle, 0 at the tail.
          float a = pow(vProg, 1.7);

          // The chase camera sits *behind* the ship, so the tail of this ribbon
          // runs straight through the lens — and a two-metre-wide strip a metre
          // from the near plane fills a third of the screen. Fading by view
          // depth is what keeps the trail a trail instead of a fog bank.
          a *= smoothstep(8.0, 34.0, vDepth);

          vec3 c = mix(uColor, uHot, pow(vProg, 3.0));
          gl_FragColor = vec4(c * (a * 2.2) * uIntensity, a * 0.85 * uIntensity);
        }
      `,transparent:!0,depthWrite:!1,blending:O,side:st}),this.object=new b(this.geo,this.mat),this.object.frustumCulled=!1}object;geo;mat;points=[];pos;prog;head=0;filled=0;tmpDir=new g;tmpSide=new g;toCam=new g;reset(e){for(const t of this.points)t.copy(e);this.head=0,this.filled=0,this.geo.setDrawRange(0,0)}setIntensity(e){this.mat.uniforms.uIntensity.value=e}update(e,t){const s=this.points[this.head];if(this.filled===0||s.distanceToSquared(e)>this.minStep*this.minStep?(this.head=(this.head+1)%this.segments,this.points[this.head].copy(e),this.filled=Math.min(this.segments,this.filled+1)):this.points[this.head].copy(e),this.filled<3){this.geo.setDrawRange(0,0);return}const i=t.getWorldPosition(this.toCam);for(let a=0;a<this.filled;a++){const o=(this.head-a+this.segments*2)%this.segments,r=this.points[o],h=(o-1+this.segments)%this.segments,d=(o+1)%this.segments;this.tmpDir.subVectors(this.points[d],this.points[h]),this.tmpDir.lengthSq()<1e-8&&this.tmpDir.set(0,0,1),this.tmpDir.normalize(),this.tmpSide.subVectors(i,r).cross(this.tmpDir),this.tmpSide.lengthSq()<1e-8&&this.tmpSide.set(1,0,0),this.tmpSide.normalize();const c=1-a/(this.filled-1),u=this.width*(.15+c*.85),f=a*6;this.pos[f+0]=r.x+this.tmpSide.x*u,this.pos[f+1]=r.y+this.tmpSide.y*u,this.pos[f+2]=r.z+this.tmpSide.z*u,this.pos[f+3]=r.x-this.tmpSide.x*u,this.pos[f+4]=r.y-this.tmpSide.y*u,this.pos[f+5]=r.z-this.tmpSide.z*u,this.prog[a*2+0]=c,this.prog[a*2+1]=c}this.geo.setDrawRange(0,(this.filled-1)*6),this.geo.getAttribute("position").needsUpdate=!0,this.geo.getAttribute("aProg").needsUpdate=!0}dispose(){this.geo.dispose(),this.mat.dispose()}}const Le=68,It=132,Gi=34,Oi=110,Ee=62;class Ni{object=new F;hull=new F;trail;distance=0;offset=new q;offsetVel=new q;speed=Le;cruise=Le;boostAmount=0;bank=0;nose=0;integrity=1;damageFlash=0;mercy=0;barrier=1/0;held=!1;boosting=!1;hold=!1;combat=0;recoil=0;pose=ze();velocity=new g;prevPos=new g;basis=new Ce;quat=new ie;tilt=new ie;euler=new Nt(0,0,0,"YXZ");tmp=new g;engines=[];bellMats=[];enginePlume;plumeMat;intakeMat;canards=[];disposables=[];muzzles=[new g(2.2,-.1,-2.4),new g(-2.2,-.1,-2.4)];constructor(e=5104065){const t=w=>(this.disposables.push(w),w),s=t(ke({color:e,base:461846,rim:1.3,power:2.2,glow:.05,panel:.85})),i=t(ke({color:e,base:395794,rim:.7,power:3,panel:1.2})),a=new b(t(new Ie(.88,6.2,5,1)),s);a.rotation.x=-Math.PI/2,a.rotation.z=Math.PI/10,a.position.z=-2.2,this.hull.add(a);const o=t(new R(.16,.22,5.4));for(const w of[1,-1]){const M=new b(o,s);M.position.set(w*.72,-.12,-1.9),M.rotation.y=w*.06,this.hull.add(M)}const r=new b(t(new R(.34,.5,4.6)),i);r.position.set(0,.62,1.1),this.hull.add(r);const h=new b(t(new $(.95,1.15,3.4,6,1)),s);h.rotation.x=Math.PI/2,h.position.z=1.4,this.hull.add(h),this.intakeMat=t(j(e,.42));const d=new b(t(new U(1.2,.14,6,24)),this.intakeMat);d.position.z=.1,this.hull.add(d);const c=new b(t(new Pe(.62,18,12,0,Math.PI*2,0,Math.PI/2)),t(ke({color:6277352,base:662572,rim:.85,power:2.4,glow:.02,transparent:!0,opacity:.5})));c.position.set(0,.46,-1.1),c.scale.z=1.9,this.hull.add(c);const u=new Ht;u.moveTo(0,-2.4),u.lineTo(.5,1.4),u.lineTo(3.9,2.5),u.lineTo(4.2,1.55),u.lineTo(1.5,-2.7),u.lineTo(0,-2.4);const f=t(new qt(u,{depth:.18,bevelEnabled:!1})),v=t(new R(.1,.1,4.2)),p=t(j(e,.44));for(const w of[1,-1]){const M=new b(f,i);M.rotation.x=-Math.PI/2,M.scale.x=w,M.position.set(0,-.12,0),this.hull.add(M);const I=new b(v,p);I.position.set(w*2.25,-.06,-.1),I.rotation.y=w*-.62,this.hull.add(I);const Y=new F,ve=new b(t(new R(1.5,.1,.62)),i);ve.position.x=w*.75,Y.add(ve),Y.position.set(w*.85,.1,-2.5),this.canards.push(Y),this.hull.add(Y);const le=new b(t(new R(.14,1.3,1.5)),i);le.position.set(w*3.5,.5,1.1),le.rotation.z=w*.34,this.hull.add(le);const J=new b(t(new R(.12,.95,1.2)),i);J.position.set(w*1.5,-.62,1.9),J.rotation.z=w*-.55,this.hull.add(J);const E=new b(t(new $(.34,.44,2.1,10)),s);E.rotation.x=Math.PI/2,E.position.set(w*2.5,-.05,1.7),this.hull.add(E);const B=t(j(8382684,.4));this.bellMats.push({mat:B,base:.4});const N=new b(t(new dt(.42,18)),B);N.position.set(w*2.5,-.05,2.78),this.engines.push(N),this.hull.add(N)}const m=t(new R(.12,1.35,1.5));for(const w of[1,-1]){const M=new b(m,i);M.position.set(w*.7,.68,2.2),M.rotation.z=w*.28,this.hull.add(M)}const k=t(j(9433314,.44));this.bellMats.push({mat:k,base:.44});const S=new b(t(new dt(.72,20)),k);S.position.set(0,0,3.15),this.engines.push(S),this.hull.add(S),this.plumeMat=t(j(e,.22)),this.enginePlume=new b(t(new Ie(.5,3,12,1,!0)),this.plumeMat),this.enginePlume.rotation.x=-Math.PI/2,this.enginePlume.position.set(0,0,4.4),this.hull.add(this.enginePlume),this.hull.scale.setScalar(.62),this.object.add(this.hull),this.trail=new Vi(46,.42,e,.9)}muzzle(e,t){return t.copy(this.muzzles[e%this.muzzles.length]).multiplyScalar(.62).applyMatrix4(this.object.matrixWorld)}forward(e){return e.set(0,0,-1).applyQuaternion(this.object.quaternion).normalize()}tail(e){return e.set(0,0,2.4).multiplyScalar(.62).applyMatrix4(this.object.matrixWorld)}reset(e,t){this.distance=t,this.offset.set(0,0),this.offsetVel.set(0,0),this.speed=Le,this.cruise=Le,this.boostAmount=0,this.bank=0,this.nose=0,this.hold=!1,this.sync(e,0),this.prevPos.copy(this.object.position),this.trail.reset(this.object.position)}kickback(){this.recoil=Math.min(.5,this.recoil+.22)}damage(e){return this.mercy>0?!1:(this.integrity=L(this.integrity-e,0,1),this.damageFlash=1,this.mercy=.9,!0)}step(e,t,s,i){this.mercy=Math.max(0,this.mercy-t),this.damageFlash=Math.max(0,this.damageFlash-t*1.5),this.mercy<=0&&(this.integrity=Math.min(1,this.integrity+t*.055)),this.boostAmount=D(this.boostAmount,this.hold?0:e.boost,4,t);let a;this.hold?a=0:e.brake?a=Gi:a=this.cruise+Math.max(0,It-this.cruise)*this.boostAmount;const o=this.barrier-this.distance;o<90&&(a=Math.min(a,Math.max(0,o*.9))),this.held=o<3&&this.barrier!==1/0,this.speed=D(this.speed,a,this.hold?2.6:3.2,t),this.boosting=this.boostAmount>.35&&this.speed>this.cruise+1,this.speed<.05&&(this.speed=0),this.distance=Math.min(this.barrier,this.distance+this.speed*t);const r=e.steer*Ee,h=e.pitch*Ee*.82;this.offsetVel.x=D(this.offsetVel.x,this.hold?0:r,7,t),this.offsetVel.y=D(this.offsetVel.y,this.hold?0:h,7,t),this.offset.x+=this.offsetVel.x*t,this.offset.y+=this.offsetVel.y*t;const d=Math.hypot(this.offset.x,this.offset.y);if(d>W){const p=W/d;this.offset.x*=p,this.offset.y*=p;const m=this.offset.x/W,k=this.offset.y/W,S=this.offsetVel.x*m+this.offsetVel.y*k;S>0&&(this.offsetVel.x-=m*S,this.offsetVel.y-=k*S)}this.bank=D(this.bank,L(-this.offsetVel.x/Ee,-1,1)*.78,6,t),this.nose=D(this.nose,L(this.offsetVel.y/Ee,-1,1)*.34,6,t),this.sync(i,s),t>0&&this.velocity.subVectors(this.object.position,this.prevPos).multiplyScalar(1/t);const c=.42+this.boostAmount*.58+this.speed/It*.2;this.enginePlume.scale.set(.85+this.boostAmount*.25,.6+this.boostAmount*1.5,.85+this.boostAmount*.25);const u=1-this.combat*.5;this.plumeMat.opacity=(.07+this.boostAmount*.2)*(this.speed>1?1:.15)*u;for(const p of this.engines)p.scale.setScalar(.6+c*.35+Math.sin(s*26)*.035);for(const p of this.bellMats)p.mat.opacity=p.base*u;this.intakeMat.opacity=(.6+Math.sin(s*3.1)*.14+this.boostAmount*.3)*(1-this.combat*.35),this.canards.forEach((p,m)=>{p.rotation.x=this.bank*(m===0?.5:-.5)+this.nose*.4});const f=1-this.boostAmount*.7;this.hull.position.y=Math.sin(s*2.1)*.06*f,this.recoil=Math.max(0,this.recoil-t*3.2),this.hull.position.z=this.recoil;const v=Math.min(1,this.speed/24);this.trail.setIntensity((.14+c*.5)*v)}sync(e,t){e.poseAt(this.distance,this.pose);const s=this.pose;this.prevPos.copy(this.object.position),this.object.position.copy(s.position).addScaledVector(s.right,this.offset.x).addScaledVector(s.up,this.offset.y),this.tmp.copy(s.tangent).negate(),this.basis.makeBasis(s.right,s.up,this.tmp),this.quat.setFromRotationMatrix(this.basis);const i=L(this.offsetVel.x/Ee,-1,1)*-.36;this.euler.set(this.nose,i,this.bank+Math.sin(t*1.3)*.012),this.tilt.setFromEuler(this.euler),this.object.quaternion.copy(this.quat).multiply(this.tilt),this.object.updateMatrixWorld(!0)}updateTrail(e){this.trail.update(this.tail(this.tmp),e)}get worldVelocity(){return this.velocity}dispose(){for(const e of this.disposables)e.dispose();this.disposables=[],this.trail.dispose()}}const ct=66,Hi=84;class qi{constructor(e){this.camera=e}desired=new g;lookTarget=new g;lookCurrent=new g;shake=0;shakeDecay=1.8;lagX=0;lagY=0;back=17;high=4.2;tmp=new g;up=new g(0,1,0);initialised=!1;roll=0;fovKick=0;fovBase=ct;addShake(e,t=1.8){this.shake=Math.min(1.6,this.shake+e),this.shakeDecay=t}kick(e){this.fovKick=Math.max(-16,Math.min(22,this.fovKick+e))}snap(e){this.lagX=e.offset.x,this.lagY=e.offset.y,this.compute(e),this.camera.position.copy(this.desired),this.lookCurrent.copy(this.lookTarget),this.up.copy(e.pose.up),this.camera.up.copy(this.up),this.camera.lookAt(this.lookCurrent),this.initialised=!0}compute(e){const t=e.pose;this.desired.copy(t.position).addScaledVector(t.tangent,-this.back).addScaledVector(t.right,this.lagX).addScaledVector(t.up,this.lagY+this.high),this.lookTarget.copy(t.position).addScaledVector(t.tangent,46).addScaledVector(t.right,e.offset.x*.72).addScaledVector(t.up,e.offset.y*.72+1.6)}update(e,t,s){if(!this.initialised){this.snap(e);return}if(this.lagX=D(this.lagX,e.offset.x,6.5,t),this.lagY=D(this.lagY,e.offset.y,7.5,t),this.back=D(this.back,17+e.boostAmount*7.5,3.4,t),this.high=D(this.high,4.2-e.boostAmount*1.1,3.4,t),this.compute(e),this.camera.position.x=D(this.camera.position.x,this.desired.x,9,t),this.camera.position.y=D(this.camera.position.y,this.desired.y,9,t),this.camera.position.z=D(this.camera.position.z,this.desired.z,9,t),this.lookCurrent.x=D(this.lookCurrent.x,this.lookTarget.x,11,t),this.lookCurrent.y=D(this.lookCurrent.y,this.lookTarget.y,11,t),this.lookCurrent.z=D(this.lookCurrent.z,this.lookTarget.z,11,t),this.up.lerp(e.pose.up,Math.min(1,t*5)),this.camera.up.copy(this.up).normalize(),this.shake>.001){const o=this.shake*this.shake;this.tmp.copy(e.pose.right).multiplyScalar((Math.sin(s*61)+Math.sin(s*97)*.6)*o*.9).addScaledVector(e.pose.up,(Math.cos(s*73)+Math.cos(s*113)*.6)*o*.9),this.camera.position.add(this.tmp),this.shake=Math.max(0,this.shake-t*this.shakeDecay)}this.camera.lookAt(this.lookCurrent),this.roll=D(this.roll,e.bank*.42,5,t),this.camera.rotateZ(this.roll),this.fovKick=D(this.fovKick,0,3.2,t);const i=ct+(Hi-ct)*L(e.boostAmount,0,1);this.fovBase=Math.abs(this.fovBase-i)>.02?D(this.fovBase,i,5,t):i;const a=this.fovBase+this.fovKick;Math.abs(this.camera.fov-a)>.01&&(this.camera.fov=a,this.camera.updateProjectionMatrix())}}function $i(l,e,t){const s=[],i=v=>(s.push(v),v),a=new F,o=[],r=[],h=[],d=i(ke({color:e,base:1837576,rim:2.4,power:1.5,glow:.16,panel:.9}));o.push(d);const c=(v,p,m=16777215)=>{const k=i(j(m,.95));r.push(k);const S=new b(i(new Pe(v,12,10)),k);return S.position.z=p,S};switch(l){case"drone":{const v=new b(i(new $(1.5,1.1,.42,6)),d);v.rotation.x=Math.PI/2,a.add(v),a.add(c(.42,-.32,e));for(const k of[1,-1]){const S=i(new R(.14,.9,1.1)),w=new b(S,d);w.position.set(k*1.3,0,.5),w.rotation.z=k*.4,a.add(w)}const p=i(j(e,.4));r.push(p);const m=new b(i(new U(1.7,.06,4,24)),p);m.rotation.x=Math.PI/2,h.push(m),a.add(m);break}case"weaver":{const v=new Ht;v.moveTo(0,-2),v.lineTo(1.5,1.3),v.lineTo(.45,1.6),v.lineTo(0,.4),v.lineTo(-.45,1.6),v.lineTo(-1.5,1.3),v.lineTo(0,-2);const p=i(new qt(v,{depth:.34,bevelEnabled:!1})),m=new b(p,d);m.rotation.x=Math.PI/2,m.position.y=.17,a.add(m),a.add(c(.3,-1.2,16777215));const k=i(j(e,.85));r.push(k);const S=new b(i(new R(.12,.12,3.1)),k);S.position.z=-.2,a.add(S);break}case"lancer":{const v=new b(i(new Ie(.62,5.2,5)),d);v.rotation.x=-Math.PI/2,a.add(v);const p=new b(i(new $(.55,.3,1.6,5)),d);p.rotation.x=Math.PI/2,p.position.z=2.9,a.add(p);for(let m=0;m<3;m++){const k=i(j(e,.75-m*.16));r.push(k);const S=new b(i(new U(.85+m*.16,.075,4,20)),k);S.position.z=.4+m*1,h.push(S),a.add(S)}a.add(c(.34,-2.5,16773328));break}case"sentry":{const v=new b(i(new Se(1.55,1)),d);a.add(v),h.push(v);const p=i(new K({color:e,wireframe:!0,transparent:!0,opacity:.42,toneMapped:!1,blending:O,depthWrite:!1}));r.push(p);const m=new b(i(new re(2.5,0)),p);h.push(m),a.add(m);const k=new b(i(new $(.3,.42,2.6,10)),d);k.rotation.x=Math.PI/2,k.position.z=-1.5,a.add(k);const S=i(j(16765168,.95));r.push(S);const w=new b(i(new dt(.34,14)),S);w.position.z=-2.82,w.rotation.y=Math.PI,a.add(w);break}}const u=i(new V({uniforms:{uColor:{value:new x(e)},uTime:{value:0},uHit:{value:0}},vertexShader:`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          // Billboard: strip rotation from the model-view matrix so the quad
          // always faces the camera regardless of how the hull is oriented.
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          // Hold a minimum apparent size. Left to shrink with the hull, a marker
          // on a hostile 300 units out is a couple of pixels, and the only lever
          // left is brightness — which trades invisibility for a bloom blob and
          // destroys the bracket shape that carries the meaning. Past this range
          // the marker stops shrinking; inside it, it tracks the hull normally.
          float grow = max(1.0, -mv.z / 150.0);
          mv.xy += position.xy * grow;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        precision highp float;
        uniform vec3 uColor;
        uniform float uTime;
        uniform float uHit;
        varying vec2 vUv;
        void main() {
          vec2 q = vUv - 0.5;
          float r = length(q) * 2.0;
          if (r > 1.0) discard;

          /*
           * Four rotating brackets, not a ring.
           *
           * Colour alone could not carry this. Threat owns the red-orange
           * wedge, but two sectors are lit in hot pink and crimson, so against
           * their architecture a red ring is a red shape among red shapes and
           * reviewers kept reporting that they could not tell a hostile from
           * scenery at a glance. Hue was the wrong channel to fight over.
           *
           * Nothing else in this world rotates on its own axis at a constant
           * rate, and no piece of architecture is drawn as a broken bracket. A
           * marker that spins and is cut into four arcs is therefore
           * unmistakable at any size, against any backdrop, in any sector,
           * without spending a colour it does not have to spend.
           */
          float ang = atan(q.y, q.x) + uTime * 0.9;
          float seg = abs(fract(ang / 1.5707963 + 0.5) - 0.5) * 2.0;
          float bracket = smoothstep(0.30, 0.52, seg);

          // The arc the brackets are cut out of.
          float band = smoothstep(0.60, 0.71, r) * smoothstep(0.90, 0.80, r);
          float ring = band * bracket;

          // A dark moat outside the brackets, and the reason this is drawn with
          // normal blending rather than additively. Hostiles cluster around the
          // node, the brightest object in the frame; an additive marker over a
          // bloom source has nothing left to add and dissolves into the glow,
          // so the one layer that must stay readable was the first to go. A
          // band that takes light away separates against any background.
          float moat = smoothstep(0.84, 0.93, r) * smoothstep(1.0, 0.95, r);

          // A slow pulse, so a stationary hostile still moves.
          float pulse = 0.86 + 0.14 * sin(uTime * 3.4);

          /*
           * The brackets are nearly white, not threat-red.
           *
           * Red is the threat identity and the hull keeps it, but a marker has
           * a different job from an identity: it has to be found against
           * whatever happens to be behind it, and two of the six sectors are
           * lit in hot pink and crimson. A red bracket inside a pink shield is
           * camouflage. Near-white over a dark moat reads against every
           * backdrop in the game, and no sector owns it — which is exactly why
           * reticles are neutral in almost everything that ships.
           */
          vec3 markCol = mix(uColor, vec3(1.0), 0.5);

          // Unpremultiplied: the moat contributes alpha but no colour, so it
          // reads as a shadow under the brackets.
          float a = clamp(ring * 0.95 * pulse + moat * 0.55 + uHit * 0.35, 0.0, 1.0);
          // Kept under the bloom threshold on purpose. Pushed past it the brackets
          // stop being brackets and become white blobs: the shape carries the
          // meaning here, and bloom is what destroys shape.
          vec3 col = markCol * (0.95 * ring * pulse) + vec3(1.0) * uHit * 0.45;
          gl_FragColor = vec4(col, a);
        }
      `,transparent:!0,depthWrite:!1})),f=new b(i(new gt(9,9)),u);return f.renderOrder=5,a.add(f),a.scale.setScalar(t/2.6),{group:a,mats:o,marker:u,glows:r,spin:h,radius:t*1.05,dispose(){for(const v of s)v.dispose();s.length=0}}}const Ft={drone:14,weaver:12,lancer:8,sentry:8},He=110,qe=70,Ui=430,Wi=1.05,Ki=.11,Xi=82,Yi=4.2,Qi=26;class Ji{constructor(e,t,s,i){this.route=e,this.particles=t,this.impacts=s,this.hooks=i,this.pools={drone:[],weaver:[],lancer:[],sentry:[]};for(const a of Object.keys(Ft)){const o=ye[a];for(let r=0;r<Ft[a];r++){const h=$i(a,o.color,o.size);h.group.visible=!1,this.group.add(h.group),this.pools[a].push({kind:a,visual:h,alive:!1,hp:o.hp,lead:0,targetLead:120,offX:0,offY:0,baseX:0,baseY:0,ampX:0,ampY:0,freq:1,phase:0,age:0,fireTimer:0,flash:0,wave:-1,spinRate:1})}}this.boltGeo=new R(.34,.34,7),this.boltMat=new K({color:10485744,transparent:!0,opacity:.95,blending:O,depthWrite:!1,toneMapped:!1}),this.boltMesh=new Q(this.boltGeo,this.boltMat,He),this.boltMesh.instanceMatrix.setUsage(Me),this.boltMesh.frustumCulled=!1,this.group.add(this.boltMesh),this.plasmaGeo=new Pe(.9,10,8),this.plasmaMat=new K({color:16735944,transparent:!0,opacity:.95,blending:O,depthWrite:!1,toneMapped:!1}),this.plasmaMesh=new Q(this.plasmaGeo,this.plasmaMat,qe),this.plasmaMesh.instanceMatrix.setUsage(Me),this.plasmaMesh.frustumCulled=!1,this.group.add(this.plasmaMesh);for(let a=0;a<He;a++)this.bolts.push({pos:new g,prev:new g,vel:new g,life:0}),this.boltMesh.setMatrixAt(a,this.m.identity().scale(this.hidden));for(let a=0;a<qe;a++)this.plasma.push({pos:new g,prev:new g,vel:new g,life:0}),this.plasmaMesh.setMatrixAt(a,this.m.identity().scale(this.hidden))}group=new F;pools;bolts=[];plasma=[];boltMesh;plasmaMesh;boltGeo;plasmaGeo;boltMat;plasmaMat;node=null;waveSeq=0;waveAge=new Map;fireTimer=0;muzzleFlip=0;shotsFired=0;damageDealt=0;pose=ze();m=new Ce;q=new ie;scale=new g;v=new g;w=new g;seg=new g;toC=new g;muzzlePos=new g;fwd=new g;hidden=new g(0,0,0);axisZ=new g(0,0,1);killPos=new g;setNode(e){this.node=e}spawnWave(e){const t=++this.waveSeq;this.waveAge.set(t,0);let s=0;for(const i of e)for(let a=0;a<i.count;a++){const o=this.pools[i.kind].find(c=>!c.alive);if(!o)continue;const r=ye[i.kind];o.alive=!0,o.hp=r.hp,o.wave=t,o.age=0,o.flash=0,o.fireTimer=.6+Math.random()*1.4,o.phase=Math.random()*Math.PI*2,o.spinRate=.6+Math.random()*1.6;const h=s%5/4-.5,d=Math.floor(s/5);switch(o.baseX=h*58+(Math.random()-.5)*10,o.baseY=4+d*17-8+(Math.random()-.5)*9,i.kind){case"drone":o.targetLead=76+Math.random()*40,o.ampX=12+Math.random()*10,o.ampY=6+Math.random()*6,o.freq=.5+Math.random()*.4;break;case"weaver":o.targetLead=68+Math.random()*34,o.ampX=26+Math.random()*14,o.ampY=12+Math.random()*8,o.freq=1.1+Math.random()*.6;break;case"lancer":o.targetLead=-90,o.ampX=4,o.ampY=3,o.freq=.8;break;case"sentry":o.targetLead=118+Math.random()*40,o.ampX=5,o.ampY=4,o.freq=.3;break}o.lead=240+Math.random()*90+s*7,o.offX=o.baseX,o.offY=o.baseY,o.visual.group.visible=!0,o.visual.group.scale.setScalar(ye[i.kind].size/2.6),s++}return t}aliveInWave(e){let t=0;for(const s of Object.keys(this.pools))for(const i of this.pools[s])i.alive&&i.wave===e&&t++;return t}get aliveCount(){let e=0;for(const t of Object.keys(this.pools))for(const s of this.pools[t])s.alive&&e++;return e}shoot(e,t,s){if(this.fireTimer-=t,!s||this.fireTimer>0)return;this.fireTimer=Ki;const i=this.bolts.find(a=>a.life<=0);i&&(this.shotsFired++,e.muzzle(this.muzzleFlip,this.muzzlePos),this.muzzleFlip=(this.muzzleFlip+1)%2,e.forward(this.fwd),i.pos.copy(this.muzzlePos),i.prev.copy(this.muzzlePos),i.vel.copy(this.fwd).multiplyScalar(Ui+e.speed),i.life=Wi,this.particles.jet(this.muzzlePos,this.fwd,11468786,4,30),this.hooks.onShoot(this.muzzlePos))}update(e,t,s){this.updateEnemies(e,t,s),this.updateBolts(e,s),this.updatePlasma(e,s)}updateEnemies(e,t,s){for(const[i,a]of this.waveAge)this.waveAge.set(i,a+e);for(const i of Object.keys(this.pools)){const a=ye[i];for(const o of this.pools[i]){if(!o.alive)continue;if(o.age+=e,o.flash>0){o.flash=Math.max(0,o.flash-e*5);for(const d of o.visual.mats)d.uniforms.uHit.value=o.flash}for(const d of o.visual.mats)d.uniforms.uTime.value=t;if(o.visual.marker.uniforms.uTime.value=t,o.visual.marker.uniforms.uHit.value=o.flash,(this.waveAge.get(o.wave)??0)>Qi){this.disengage(o);continue}if(i==="lancer"){if(o.lead-=(a.speed+o.age*26)*e,o.lead<-110){this.disengage(o,!1);continue}o.baseX=D(o.baseX,s.offset.x,1.1,e),o.baseY=D(o.baseY,s.offset.y,1.1,e)}else o.lead=D(o.lead,o.targetLead,1.35,e);const r=t*o.freq+o.phase;o.offX=o.baseX+Math.sin(r)*o.ampX,o.offY=o.baseY+Math.sin(r*.73+1.1)*o.ampY;const h=L(s.distance+o.lead,0,this.route.length);this.route.poseAt(h,this.pose),o.visual.group.position.copy(this.pose.position).addScaledVector(this.pose.right,o.offX).addScaledVector(this.pose.up,o.offY),i==="sentry"||i==="lancer"?(o.visual.group.up.copy(this.pose.up),o.visual.group.lookAt(s.object.position)):(this.v.copy(this.pose.position).addScaledVector(this.pose.tangent,-60),o.visual.group.up.copy(this.pose.up),o.visual.group.lookAt(this.v));for(const d of o.visual.spin)d.rotation.z+=e*o.spinRate*1.6,d.rotation.y+=e*o.spinRate*.7;a.fireRate>0&&o.lead>40&&(o.fireTimer-=e,o.fireTimer<=0&&(o.fireTimer=a.fireRate*(.75+Math.random()*.5),this.firePlasma(o,s)))}}}firePlasma(e,t){const s=this.plasma.find(a=>a.life<=0);if(!s)return;const i=e.visual.group.position;s.pos.copy(i),s.prev.copy(i),this.v.subVectors(t.object.position,i).normalize(),s.vel.copy(this.v).multiplyScalar(Xi),s.life=Yi,this.particles.jet(i,this.v,16743124,5,18)}updateBolts(e,t){for(let s=0;s<He;s++){const i=this.bolts[s];if(i.life<=0){this.boltMesh.setMatrixAt(s,this.m.identity().scale(this.hidden));continue}if(i.life-=e,i.prev.copy(i.pos),i.pos.addScaledVector(i.vel,e),i.life<=0){this.boltMesh.setMatrixAt(s,this.m.identity().scale(this.hidden));continue}let a=!1;for(const o of Object.keys(this.pools)){if(a)break;for(const r of this.pools[o]){if(!r.alive)continue;const h=r.visual.radius+2.6;if(this.segmentHitsSphere(i.prev,i.pos,r.visual.group.position,h)){this.hitEnemy(r,i.pos,1),a=!0;break}}}if(!a&&this.node){const o=this.node.radius+2.6;if(this.segmentHitsSphere(i.prev,i.pos,this.node.position,o)){this.v.subVectors(i.pos,this.node.position).normalize().multiplyScalar(this.node.radius),this.w.copy(this.node.position).add(this.v);const r=this.node.hit(1,this.w);r&&(this.damageDealt+=1),this.particles.burst(this.w,{count:r?12:8,color:r?16777215:9427199,color2:r?16761994:6003967,speed:34,life:.4,size:2.1,drag:4}),this.impacts.flash(this.w,r?7:5,r?16773320:10475263,.16),a=!0}}if(a){i.life=0,this.boltMesh.setMatrixAt(s,this.m.identity().scale(this.hidden));continue}this.v.copy(i.vel).normalize(),this.q.setFromUnitVectors(this.axisZ,this.v),this.scale.set(1,1,1+t.boostAmount*.6),this.m.compose(i.pos,this.q,this.scale),this.boltMesh.setMatrixAt(s,this.m)}this.boltMesh.instanceMatrix.needsUpdate=!0}updatePlasma(e,t){for(let i=0;i<qe;i++){const a=this.plasma[i];if(a.life<=0){this.plasmaMesh.setMatrixAt(i,this.m.identity().scale(this.hidden));continue}if(a.life-=e,a.prev.copy(a.pos),a.pos.addScaledVector(a.vel,e),a.life<=0){this.plasmaMesh.setMatrixAt(i,this.m.identity().scale(this.hidden));continue}if(this.segmentHitsSphere(a.prev,a.pos,t.object.position,4)){a.life=0,this.plasmaMesh.setMatrixAt(i,this.m.identity().scale(this.hidden)),t.damage(.2)&&(this.particles.burst(a.pos,{count:26,color:16735944,color2:16777215,speed:40,life:.5,size:2.6,drag:3.4}),this.impacts.explosion(a.pos,1.5,16727425,16777215),this.hooks.onPlayerHit(a.pos));continue}const o=1+Math.sin(a.life*22)*.16;this.scale.set(o,o,o),this.m.compose(a.pos,this.q.identity(),this.scale),this.plasmaMesh.setMatrixAt(i,this.m)}this.plasmaMesh.instanceMatrix.needsUpdate=!0}hitEnemy(e,t,s){this.damageDealt+=s,e.hp-=s,e.flash=1;for(const o of e.visual.mats)o.uniforms.uHit.value=1;if(e.hp>0){this.particles.burst(t,{count:9,color:16777215,color2:ye[e.kind].color,speed:26,life:.3,size:1.7,drag:5}),this.impacts.flash(t,4.2,16777215,.12),this.hooks.onEnemyHit(t,!1);return}const i=ye[e.kind],a=this.killPos.copy(e.visual.group.position);this.particles.burst(a,{count:46,color:16777215,color2:i.color,speed:62,life:.72,size:3.1,drag:2.1}),this.particles.burst(a,{count:22,color:i.color,color2:3679802,speed:30,life:1.5,size:1.5,drag:.7,gravity:5}),this.impacts.explosion(a,i.size*.85,i.color,16777215),e.alive=!1,e.visual.group.visible=!1,this.hooks.onEnemyHit(a,!0),this.hooks.onKill(e.kind,a,i.xp)}disengage(e,t=!0){t&&(this.impacts.flash(e.visual.group.position,6,10475263,.2),this.particles.burst(e.visual.group.position,{count:14,color:10475263,speed:30,life:.35,size:2,drag:5})),e.alive=!1,e.visual.group.visible=!1}segmentHitsSphere(e,t,s,i){this.seg.subVectors(t,e);const a=this.seg.lengthSq();if(this.toC.subVectors(s,e),a<1e-8)return this.toC.lengthSq()<=i*i;const o=L(this.toC.dot(this.seg)/a,0,1);return this.w.copy(e).addScaledVector(this.seg,o),this.w.distanceToSquared(s)<=i*i}standDown(){for(const e of Object.keys(this.pools))for(const t of this.pools[e])t.alive&&this.disengage(t);for(const e of this.plasma)e.life=0}clear(){for(const e of Object.keys(this.pools))for(const t of this.pools[e])t.alive=!1,t.visual.group.visible=!1;for(let e=0;e<He;e++)this.bolts[e].life=0,this.boltMesh.setMatrixAt(e,this.m.identity().scale(this.hidden));for(let e=0;e<qe;e++)this.plasma[e].life=0,this.plasmaMesh.setMatrixAt(e,this.m.identity().scale(this.hidden));this.boltMesh.instanceMatrix.needsUpdate=!0,this.plasmaMesh.instanceMatrix.needsUpdate=!0,this.waveAge.clear()}dispose(){for(const e of Object.keys(this.pools))for(const t of this.pools[e])t.visual.dispose();this.boltGeo.dispose(),this.plasmaGeo.dispose(),this.boltMat.dispose(),this.plasmaMat.dispose(),this.boltMesh.dispose(),this.plasmaMesh.dispose()}}const Zi=24,ea=7;class ta{constructor(e,t,s){this.particles=e,this.impacts=t,this.onCollect=s,this.geo=new Se(2.1,0),this.coreGeo=new Se(.95,0),this.haloGeo=new ft(3.1,3.7,28);for(let i=0;i<Zi;i++){const a=j(16777215,.95),o=j(5104065,.6),r=new b(this.geo,a),h=new b(this.coreGeo,j(16777215,1));r.add(h);const d=new b(this.haloGeo,o);r.visible=!1,d.visible=!1,this.group.add(r,d),this.pool.push({active:!1,sector:"origin",key:"",age:0,mesh:r,halo:d,haloMat:o,coreMat:a,vel:new g,spin:0})}}group=new F;pool=[];geo;coreGeo;haloGeo;v=new g;get activeCount(){return this.pool.reduce((e,t)=>e+(t.active?1:0),0)}spawn(e,t,s,i,a){const o=this.pool.find(r=>!r.active)??this.pool[0];o.active=!0,o.sector=t,o.key=s,o.age=0,o.spin=Math.random()*Math.PI*2,o.mesh.visible=!0,o.halo.visible=!0,o.mesh.position.copy(e),o.mesh.scale.setScalar(.01),o.coreMat.color.set(i),o.haloMat.color.set(i),o.vel.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(22+Math.random()*14),a&&o.vel.addScaledVector(a,.25),this.impacts.flash(e,5,i,.18)}update(e,t,s,i){for(const a of this.pool){if(!a.active)continue;a.age+=e;const o=Math.min(1,a.age*5),r=1+Math.sin(t*4+a.spin)*.09;a.mesh.scale.setScalar(o*r),this.v.subVectors(s.object.position,a.mesh.position);const h=this.v.length();this.v.normalize();const d=60+a.age*190+Math.max(0,220-h);a.vel.addScaledVector(this.v,d*e),a.vel.multiplyScalar(Math.exp(-2.4*e)),a.mesh.position.addScaledVector(a.vel,e),a.mesh.rotation.y=t*2.4+a.spin,a.mesh.rotation.x=t*1.5,a.halo.position.copy(a.mesh.position),a.halo.quaternion.copy(i.quaternion),a.halo.scale.setScalar(o*(1+Math.sin(t*3.1+a.spin)*.16)),a.haloMat.opacity=.32+Math.sin(t*5+a.spin)*.14,Math.random()<e*26&&this.particles.burst(a.mesh.position,{count:1,color:a.coreMat.color.getHex(),speed:5,life:.5,size:1.5,drag:2}),h<ea&&(a.active=!1,a.mesh.visible=!1,a.halo.visible=!1,this.particles.burst(a.mesh.position,{count:18,color:16777215,color2:a.coreMat.color.getHex(),speed:30,life:.42,size:2.2,drag:4}),this.impacts.flash(a.mesh.position,8,a.coreMat.color.getHex(),.2),this.onCollect(a.sector,a.key,a.mesh.position))}}clear(){for(const e of this.pool)e.active=!1,e.mesh.visible=!1,e.halo.visible=!1}dispose(){this.geo.dispose(),this.coreGeo.dispose(),this.haloGeo.dispose();for(const e of this.pool){e.coreMat.dispose(),e.haloMat.dispose();for(const t of e.mesh.children)t.material.dispose()}}}const sa=82;class ia{constructor(e,t,s,i,a){this.route=e,this.combat=t,this.pickups=s,this.sectorObjs=i,this.state=a,this.mission=Qe[0];for(const o of A)this.dropped.set(o.id,this.state.shardsIn(o.id).length)}phase="idle";targetIndex=0;objectiveTitle="";objectiveDetail="";hostiles=0;mission;waveIndex=0;waveId=-1;dropped=new Map;nodeArmed=!1;dossierOpen=!1;parked=!1;tmp=new g;stall=0;assistFire=!1;assistSkip=!1;lastDamage=0;get sector(){return this.sectorObjs[this.targetIndex]}get def(){return A[this.targetIndex]}barrierFor(e){return e>=this.sectorObjs.length?this.route.length:Math.max(0,this.sectorObjs[e].distance-sa)}owed(e){const t=A.find(s=>s.id===e);return Math.max(0,t.shards-(this.dropped.get(e)??0))}resetStall(){this.stall=0,this.assistSkip=!1,_.emit("assist:skip",{on:!1})}updateAssist(e){if(!(this.phase==="engage"||this.phase==="node")){this.stall!==0&&this.resetStall();return}if(this.combat.damageDealt>this.lastDamage){this.lastDamage=this.combat.damageDealt,this.stall>0&&this.resetStall();return}this.stall+=e,this.stall>6&&this.stall-e<=6&&_.emit("assist:hint",{text:this.combat.shotsFired===0?"Hold click or press Space to fire":"Keep firing — line the target up ahead of you"}),!this.assistFire&&this.stall>14&&this.combat.shotsFired===0&&(this.assistFire=!0,_.emit("assist:autofire",void 0)),!this.assistSkip&&this.stall>26&&(this.assistSkip=!0,_.emit("assist:skip",{on:!0}))}get autoFire(){return this.assistFire}skipToDossier(e){if(this.phase==="dossier"||this.phase==="complete")return;const t=this.sector,s=!t.decrypted;s&&t.forceDecrypt(),this.resetStall(),this.openDossier(e,s)}beginSector(e,t,s){this.targetIndex=e,this.mission=Qe[e],this.waveId=-1,this.nodeArmed=!1,this.dossierOpen=!1,this.parked=!1,this.combat.setNode(null);const i=this.sectorObjs[e].decrypted;this.waveIndex=i?this.mission.waves.length:0,s!==void 0&&t.reset(this.route,s),t.cruise=i?Oi:Le,t.hold=!1,t.barrier=this.barrierFor(e),this.enterTravel()}start(e){for(let s=0;s<this.sectorObjs.length;s++){const i=A[s];this.state.shardsIn(i.id).length>=i.shards?this.sectorObjs[s].markDecrypted():this.sectorObjs[s].disarm()}let t=A.findIndex(s=>this.state.shardsIn(s.id).length<s.shards);t<0&&(t=0),this.beginSector(t,e,t===0?0:Math.max(0,this.sectorObjs[t-1].distance+40))}replay(e){this.combat.clear(),this.pickups.clear(),this.beginSector(0,e,0)}reset(e){for(const t of this.sectorObjs)t.disarm();for(const t of A)this.dropped.set(t.id,0);this.combat.clear(),this.pickups.clear(),this.beginSector(0,e,0)}enterTravel(){this.phase="travel";const e=this.def;this.objectiveTitle=`Reach ${e.name}`,this.objectiveDetail=this.sector.decrypted?"Already decrypted — closing fast for another read":this.mission.brief,this.state.visit(e.id),_.emit("sector:enter",{id:e.id}),_.emit("mission:card",{code:e.code,name:e.name,subtitle:e.subtitle,brief:this.mission.brief,index:this.targetIndex,total:A.length,color:e.color})}spawnNextWave(){const e=this.mission.waves[this.waveIndex];this.waveId=this.combat.spawnWave(e.units),this.phase="engage",this.objectiveTitle=e.label;const t=e.units.reduce((s,i)=>s+i.count,0);this.hostiles=t,this.objectiveDetail=`${t} hostile${t===1?"":"s"} inbound`,_.emit("wave:spawn",{index:this.waveIndex,count:t}),this.waveIndex++}armNode(){const e=this.sector;e.arm(this.mission.nodeHp),this.combat.setNode({position:e.position,radius:e.radius,hit:(t,s)=>e.hit(t,s)}),this.nodeArmed=!0,this.phase="node",this.objectiveTitle=`Break ${this.mission.nodeName}`,this.objectiveDetail="Collapse the shield, then kill the core",_.emit("node:armed",{id:this.def.id,name:this.mission.nodeName})}openDossier(e,t){const s=this.def;this.dossierOpen=!0,this.phase="dossier",e.hold=!0,this.combat.setNode(null),this.combat.standDown();const i=this.owed(s.id),a=this.dropped.get(s.id)??0;for(let o=0;o<i;o++)this.tmp.copy(this.sector.position).add(new g((Math.random()-.5)*30,(Math.random()-.5)*24,(Math.random()-.5)*20)),this.pickups.spawn(this.tmp,s.id,`${s.id}-${a+o}`,s.color);this.dropped.set(s.id,a+i),this.objectiveTitle=t?"Dossier recovered":`${s.name} archive`,this.objectiveDetail=t?"Read it, then continue when you are ready":"Already decrypted — re-read it, then continue",_.emit("sector:decrypted",{id:s.id,broken:t})}advance(e){if(this.phase==="dossier"){if(this.dossierOpen=!1,e.hold=!1,this.targetIndex>=A.length-1){this.finish(e);return}this.beginSector(this.targetIndex+1,e)}}finish(e){this.phase="complete",this.parked=!1,this.objectiveTitle="Transmission complete",this.objectiveDetail="Every sector decrypted — fly it again or get in touch",e.barrier=this.route.length,_.emit("complete",void 0)}jumpTo(e,t){const s=Math.max(0,Math.min(A.length-1,e));this.combat.clear(),this.beginSector(s,t,Math.max(0,this.sectorObjs[s].distance-Qe[s].lead-60))}reportKill(e){const t=this.def;if(this.owed(t.id)<=1)return;const i=this.dropped.get(t.id)??0;this.pickups.spawn(e,t.id,`${t.id}-${i}`,t.color),this.dropped.set(t.id,i+1)}update(e,t){if(this.phase==="idle"||this.phase==="dossier")return;if(this.updateAssist(e),this.phase==="complete"){t.barrier=this.route.length,!this.parked&&t.distance>=this.route.length-2&&(this.parked=!0,_.emit("run:parked",void 0));return}const s=this.sector,i=this.barrierFor(this.targetIndex);t.barrier=i;const a=s.distance-this.mission.lead,o=(t.distance-a)/this.mission.lead;if((this.phase==="travel"||this.phase==="engage")&&this.waveIndex<this.mission.waves.length&&o>=this.mission.waves[this.waveIndex].at&&this.spawnNextWave(),this.phase==="engage")if(this.hostiles=this.waveId>=0?this.combat.aliveInWave(this.waveId):0,this.hostiles===0){this.phase="travel",_.emit("wave:clear",{index:this.waveIndex-1});const r=this.def;this.objectiveTitle=`Reach ${r.name}`,this.objectiveDetail=this.waveIndex<this.mission.waves.length?"More resistance ahead":`${this.mission.nodeName} is dead ahead`}else{const r=this.mission.waves[Math.max(0,this.waveIndex-1)];this.objectiveTitle=r.label,this.objectiveDetail=`${this.hostiles} hostile${this.hostiles===1?"":"s"} remaining`}if(!this.nodeArmed&&!s.decrypted&&t.distance>=i-2.5&&this.armNode(),this.phase==="node")if(s.decrypted)this.openDossier(t,!0);else{this.objectiveTitle=s.shielded?`Collapse the ${this.mission.nodeName} shield`:"Destroy the exposed core";const r=this.combat.aliveCount;this.objectiveDetail=r>0?`${r} hostile${r===1?"":"s"} still shooting`:s.shielded?"Keep firing — the shield is holding":"Core exposed — finish it"}s.decrypted&&!this.dossierOpen&&t.distance>=i-2.5&&this.openDossier(t,!1)}progress(e){return Math.max(0,Math.min(1,e.distance/this.route.length))}get activeNode(){return this.phase==="node"?this.sector:null}get currentSectorId(){return this.def.id}}const aa=5e3,oa=`
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aLife;

  uniform float uPixelRatio;
  uniform float uScale;

  varying vec3 vColor;
  varying float vLife;

  void main() {
    vColor = aColor;
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Shrink as the particle dies, and scale with perspective.
    float s = aSize * uScale * (0.25 + 0.75 * aLife);
    gl_PointSize = s * uPixelRatio * (300.0 / max(-mv.z, 1.0));
    gl_Position = projectionMatrix * mv;
  }
`,na=`
  precision highp float;
  varying vec3 vColor;
  varying float vLife;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    // Hot core plus a wide soft halo: the core is what bloom latches onto.
    float core = smoothstep(0.5, 0.02, r);
    float halo = smoothstep(0.5, 0.2, r);
    float a = vLife * vLife;
    gl_FragColor = vec4(vColor * (core * 1.8 + halo * 0.9), a * core);
  }
`;class ra{constructor(e,t=aa){this.budget=t;const s=this.budget;this.pos=new Float32Array(s*3),this.col=new Float32Array(s*3),this.size=new Float32Array(s),this.lifeAttr=new Float32Array(s),this.vel=new Float32Array(s*3),this.age=new Float32Array(s),this.ttl=new Float32Array(s),this.drag=new Float32Array(s),this.grav=new Float32Array(s),this.geo=new Ae,this.geo.setAttribute("position",new H(this.pos,3)),this.geo.setAttribute("aColor",new H(this.col,3)),this.geo.setAttribute("aSize",new H(this.size,1)),this.geo.setAttribute("aLife",new H(this.lifeAttr,1)),this.geo.setDrawRange(0,0),this.mat=new V({uniforms:{uPixelRatio:{value:e},uScale:{value:1}},vertexShader:oa,fragmentShader:na,transparent:!0,depthWrite:!1,blending:O}),this.object=new Ot(this.geo,this.mat),this.object.frustumCulled=!1}object;geo;mat;pos;col;size;lifeAttr;vel;age;ttl;drag;grav;cursor=0;live=0;cA=new x;cB=new x;tmp=new g;get count(){return this.live}burst(e,t){this.cA.set(t.color),this.cB.set(t.color2??t.color);const s=t.focus??0,i=t.dir,a=Math.min(t.count,this.budget);for(let o=0;o<a;o++){const r=this.cursor;this.cursor=(this.cursor+1)%this.budget;const h=r*3;this.pos[h+0]=e.x,this.pos[h+1]=e.y,this.pos[h+2]=e.z;const d=Math.random()*2-1,c=Math.random()*Math.PI*2,u=Math.sqrt(Math.max(0,1-d*d));this.tmp.set(u*Math.cos(c),u*Math.sin(c),d),i&&s>0&&this.tmp.lerp(i,s).normalize();const f=Math.random(),v=t.speed*(.25+f*f*.75);this.vel[h+0]=this.tmp.x*v+(t.inherit?.x??0),this.vel[h+1]=this.tmp.y*v+(t.inherit?.y??0),this.vel[h+2]=this.tmp.z*v+(t.inherit?.z??0);const p=Math.random();this.col[h+0]=this.cA.r+(this.cB.r-this.cA.r)*p,this.col[h+1]=this.cA.g+(this.cB.g-this.cA.g)*p,this.col[h+2]=this.cA.b+(this.cB.b-this.cA.b)*p,this.size[r]=t.size*(.55+Math.random()*.9),this.ttl[r]=t.life*(.6+Math.random()*.7),this.age[r]=0,this.lifeAttr[r]=1,this.drag[r]=t.drag??1.2,this.grav[r]=t.gravity??0}this.live=Math.min(this.budget,this.live+a)}jet(e,t,s,i=6,a=26){this.burst(e,{count:i,color:s,speed:a,life:.28,size:2.2,dir:t,focus:.86,drag:5})}update(e){if(this.live===0){this.geo.setDrawRange(0,0);return}let t=0,s=0;for(let a=0;a<this.budget;a++){if(this.lifeAttr[a]<=0)continue;this.age[a]+=e;const o=this.age[a]/this.ttl[a];if(o>=1){this.lifeAttr[a]=0;continue}const r=a*3,h=Math.exp(-this.drag[a]*e);this.vel[r+0]*=h,this.vel[r+1]=this.vel[r+1]*h-this.grav[a]*e,this.vel[r+2]*=h,this.pos[r+0]+=this.vel[r+0]*e,this.pos[r+1]+=this.vel[r+1]*e,this.pos[r+2]+=this.vel[r+2]*e,this.lifeAttr[a]=1-o*o,s++,t=a}this.live=s;const i=s>0?t+1:0;this.geo.setDrawRange(0,i),i>0&&(this.geo.getAttribute("position").needsUpdate=!0,this.geo.getAttribute("aColor").needsUpdate=!0,this.geo.getAttribute("aSize").needsUpdate=!0,this.geo.getAttribute("aLife").needsUpdate=!0)}setPixelRatio(e){this.mat.uniforms.uPixelRatio.value=e}setScale(e){this.mat.uniforms.uScale.value=e}clear(){this.lifeAttr.fill(0),this.live=0,this.geo.setDrawRange(0,0)}dispose(){this.geo.dispose(),this.mat.dispose()}}const me=24,fe=24,zt=l=>Array.from({length:l},()=>({active:!1,age:0,ttl:1,radius:1,origin:new g,quat:new ie,color:new x,width:1}));class la{object=new F;ringMesh;flashMesh;ringGeo;flashGeo;ringMat;flashMat;rings=zt(me);flashes=zt(fe);m=new Ce;s=new g;q=new ie;hidden=new g(0,0,0);constructor(){this.ringGeo=new ft(.86,1,64),this.ringMat=new K({transparent:!0,opacity:1,side:st,blending:O,depthWrite:!1,toneMapped:!1,vertexColors:!1}),this.ringMesh=new Q(this.ringGeo,this.ringMat,me),this.ringMesh.instanceMatrix.setUsage(Me),this.ringMesh.frustumCulled=!1,this.ringMesh.count=me,this.flashGeo=new gt(1,1),this.flashMat=new V({uniforms:{},vertexShader:`
        attribute vec3 aTint;
        varying vec2 vUv;
        varying vec3 vTint;
        void main() {
          vUv = uv;
          vTint = aTint;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        precision highp float;
        varying vec2 vUv;
        varying vec3 vTint;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          if (r > 1.0) discard;
          float core = pow(1.0 - r, 2.4);
          gl_FragColor = vec4(vTint * (core * 2.6 + (1.0 - r) * 0.5), core);
        }
      `,transparent:!0,depthWrite:!1,blending:O}),this.flashMesh=new Q(this.flashGeo,this.flashMat,fe),this.flashMesh.instanceMatrix.setUsage(Me),this.flashMesh.frustumCulled=!1,this.flashMesh.count=fe;const e=new Float32Array(me*3);this.ringMesh.instanceColor=new kt(e,3);const t=new Float32Array(fe*3);this.flashGeo.setAttribute("aTint",new kt(t,3));for(let s=0;s<me;s++)this.ringMesh.setMatrixAt(s,this.m.identity().scale(this.hidden));for(let s=0;s<fe;s++)this.flashMesh.setMatrixAt(s,this.m.identity().scale(this.hidden));this.object.add(this.ringMesh,this.flashMesh)}take(e){for(const s of e)if(!s.active)return s;let t=e[0];for(const s of e)s.age/s.ttl>t.age/t.ttl&&(t=s);return t}ring(e,t,s,i=.55,a){const o=this.take(this.rings);o&&(o.active=!0,o.age=0,o.ttl=i,o.radius=t,o.origin.copy(e),o.color.set(s),o.width=1,a?o.quat.setFromUnitVectors(new g(0,0,1),a.clone().normalize()):o.quat.identity())}flash(e,t,s,i=.24){const a=this.take(this.flashes);a&&(a.active=!0,a.age=0,a.ttl=i,a.radius=t,a.origin.copy(e),a.color.set(s))}explosion(e,t,s,i=16777215){this.flash(e,t*3.4,s,.26),this.flash(e,t*1.5,i,.16),this.ring(e,t*5.5,s,.52),this.ring(e,t*3.2,i,.36)}update(e,t){const s=this.ringMesh.instanceColor;for(let a=0;a<me;a++){const o=this.rings[a];if(!o.active)continue;o.age+=e;const r=o.age/o.ttl;if(r>=1){o.active=!1,this.m.identity().scale(this.hidden),this.ringMesh.setMatrixAt(a,this.m);continue}const h=1-Math.pow(1-r,3),d=o.radius*(.12+h*.88),c=Math.pow(1-r,2.2)*2.2;this.s.set(d,d,d),this.m.compose(o.origin,o.quat,this.s),this.ringMesh.setMatrixAt(a,this.m),s.setXYZ(a,o.color.r*c,o.color.g*c,o.color.b*c)}this.ringMesh.instanceMatrix.needsUpdate=!0,s.needsUpdate=!0;const i=this.flashGeo.getAttribute("aTint");t.getWorldQuaternion(this.q);for(let a=0;a<fe;a++){const o=this.flashes[a];if(!o.active)continue;o.age+=e;const r=o.age/o.ttl;if(r>=1){o.active=!1,this.m.identity().scale(this.hidden),this.flashMesh.setMatrixAt(a,this.m);continue}const h=r<.2?r/.2:1,d=o.radius*(.4+h*.6)*(1+r*.5),c=Math.pow(1-r,1.6)*1.8;this.s.set(d,d,d),this.m.compose(o.origin,this.q,this.s),this.flashMesh.setMatrixAt(a,this.m),i.setXYZ(a,o.color.r*c,o.color.g*c,o.color.b*c)}this.flashMesh.instanceMatrix.needsUpdate=!0,i.needsUpdate=!0}clear(){for(const e of this.rings)e.active=!1;for(const e of this.flashes)e.active=!1;for(let e=0;e<me;e++)this.ringMesh.setMatrixAt(e,this.m.identity().scale(this.hidden));for(let e=0;e<fe;e++)this.flashMesh.setMatrixAt(e,this.m.identity().scale(this.hidden));this.ringMesh.instanceMatrix.needsUpdate=!0,this.flashMesh.instanceMatrix.needsUpdate=!0}dispose(){this.ringGeo.dispose(),this.flashGeo.dispose(),this.ringMat.dispose(),this.flashMat.dispose(),this.ringMesh.dispose(),this.flashMesh.dispose()}}const $e=140,ne=260,ha=`
  attribute vec4 aSeed;
  attribute float aEnd;
  uniform float uPhase;
  uniform float uLen;
  uniform float uAmount;
  varying float vFade;
  varying float vEnd;

  void main() {
    float z = -${ne.toFixed(1)} + mod(aSeed.z * ${ne.toFixed(1)} + uPhase, ${ne.toFixed(1)});
    // Tail trails further from the lens than the head; length grows with speed.
    z -= (1.0 - aEnd) * uLen * aSeed.w;
    vec3 p = vec3(cos(aSeed.x) * aSeed.y, sin(aSeed.x) * aSeed.y * 0.7, z);
    // Fade in out of the distance and out before a line can touch the lens.
    float head = -${ne.toFixed(1)} + mod(aSeed.z * ${ne.toFixed(1)} + uPhase, ${ne.toFixed(1)});
    vFade = smoothstep(-${ne.toFixed(1)}, -${(ne*.55).toFixed(1)}, head) * (1.0 - smoothstep(-14.0, -2.0, head)) * uAmount;
    vEnd = aEnd;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`,ca=`
  precision highp float;
  uniform vec3 uColor;
  varying float vFade;
  varying float vEnd;
  void main() {
    // Bright at the head, gone at the tail.
    gl_FragColor = vec4(uColor * vFade * vEnd * vEnd, 1.0);
  }
`;class da{object;mat;geo;phase=0;amount=0;constructor(){const e=new Float32Array($e*2*4),t=new Float32Array($e*2),s=new Float32Array($e*2*3);for(let i=0;i<$e;i++){const a=Math.random()*Math.PI*2,o=14+Math.pow(Math.random(),.7)*34,r=Math.random(),h=.5+Math.random()*.8;for(let d=0;d<2;d++){const c=(i*2+d)*4;e[c]=a,e[c+1]=o,e[c+2]=r,e[c+3]=h,t[i*2+d]=d}}this.geo=new Ae,this.geo.setAttribute("position",new H(s,3)),this.geo.setAttribute("aSeed",new H(e,4)),this.geo.setAttribute("aEnd",new H(t,1)),this.mat=new V({uniforms:{uPhase:{value:0},uLen:{value:20},uAmount:{value:0},uColor:{value:new x(12580607)}},vertexShader:ha,fragmentShader:ca,transparent:!0,depthWrite:!1,depthTest:!1,blending:O}),this.object=new Gt(this.geo,this.mat),this.object.frustumCulled=!1,this.object.renderOrder=5,this.object.visible=!1}update(e,t,s,i,a){const o=Math.min(1.4,s*1.05+Math.max(0,(t-96)/60)*.25+i*1.4);if(this.amount+=(o-this.amount)*Math.min(1,e*6),this.object.visible=this.amount>.01,!this.object.visible)return;this.phase+=e*(t*2.4+i*900);const r=this.mat.uniforms;r.uPhase.value=this.phase%(ne*100),r.uLen.value=10+s*38+i*90,r.uAmount.value=this.amount*.55,r.uColor.value.setRGB(.75,.95,1).lerp(a,.35)}dispose(){this.geo.dispose(),this.mat.dispose()}}function n(l,e={},t=[]){const s=document.createElement(l);for(const[i,a]of Object.entries(e))a===void 0||a===!1||(i==="class"?s.className=String(a):i==="html"?s.innerHTML=String(a):i==="text"?s.textContent=String(a):i.startsWith("on")&&typeof a=="function"?s.addEventListener(i.slice(2).toLowerCase(),a):s.setAttribute(i,a===!0?"":String(a)));for(const i of t)i!=null&&s.append(typeof i=="string"?document.createTextNode(i):i);return s}const Fe=l=>`#${l.toString(16).padStart(6,"0")}`;function ua(l,e){return`rgba(${l>>16&255}, ${l>>8&255}, ${l&255}, ${e})`}function te(l){return Je(l).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\[(.+?)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')}function Je(l){return l.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}const z=(l,e="")=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${e}>${l}</svg>`,P={sound:z('<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),mute:z('<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/>'),doc:z('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>'),game:z('<path d="M6 11h4"/><path d="M8 9v4"/><path d="M15 12h.01"/><path d="M18 10h.01"/><rect x="2" y="6" width="20" height="12" rx="4"/>'),terminal:z('<path d="m4 17 6-5-6-5"/><path d="M12 19h8"/>'),close:z('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),shard:z('<path d="m12 2 8 10-8 10L4 12Z"/>'),trophy:z('<path d="M6 3h12v5a6 6 0 0 1-12 0Z"/><path d="M6 5H3v1a4 4 0 0 0 3 3.9"/><path d="M18 5h3v1a4 4 0 0 1-3 3.9"/><path d="M9 21h6"/><path d="M12 14v7"/>'),lock:z('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),unlock:z('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>'),external:z('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),reset:z('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),help:z('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),mail:z('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),play:z('<path d="M6 4l14 8-14 8Z"/>'),download:z('<path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M4 21h16"/>'),arrow:z('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),copy:z('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>')};class pa{constructor(e,t,s){this.state=t,this.objChip=n("span",{class:"obj__chip",text:"SEC-01"}),this.objTitle=n("div",{class:"obj__title"}),this.objDetail=n("div",{class:"obj__detail"}),this.objective=n("div",{class:"obj",role:"status","aria-live":"polite"},[n("div",{class:"obj__head"},[n("span",{class:"obj__label",text:"Objective"}),this.objChip]),this.objTitle,this.objDetail]),this.bossName=n("span",{class:"boss__name"}),this.bossPhase=n("span",{class:"boss__phase"}),this.bossShield=n("i"),this.bossCore=n("i"),this.boss=n("div",{class:"boss","aria-hidden":"true"},[n("div",{class:"boss__head"},[this.bossName,this.bossPhase]),n("div",{class:"boss__bars"},[n("div",{class:"boss__bar boss__bar--shield"},[this.bossShield]),n("div",{class:"boss__bar boss__bar--core"},[this.bossCore])])]),this.spineFill=n("i");const i=A.map(o=>{const r=n("button",{class:"spine__dot",type:"button","data-sector":o.id,"aria-label":`${o.code} ${o.name}`,title:`${o.code} — ${o.name}`},[n("span",{class:"spine__pip"}),n("span",{class:"spine__name",text:o.name})]);return this.spineDots.push(r),r});this.spine=n("nav",{class:"spine","aria-label":"Route progress"},[n("div",{class:"spine__track"},[this.spineFill]),...i]),this.rankName=n("span",{class:"rank__name",text:t.rank}),this.rankXp=n("span",{class:"rank__xp",text:`${t.xp} XP`}),this.rankBar=n("i"),this.shardCount=n("b",{text:`${t.collected}/${t.totalShards}`}),this.hullBar=n("i"),this.hullWrap=n("div",{class:"hull"},[n("span",{class:"hull__label",text:"Hull"}),n("div",{class:"hull__bar"},[this.hullBar])]),this.speedNum=n("b",{text:"0"}),this.speedUnit=n("span",{text:"m/s"}),this.boostPip=n("span",{class:"flight__boost",text:"BOOST"}),this.reticle=n("div",{class:"reticle","aria-hidden":"true"},[n("span",{class:"reticle__ring"}),n("span",{class:"reticle__dot"}),n("span",{class:"reticle__tick reticle__tick--l"}),n("span",{class:"reticle__tick reticle__tick--r"}),n("span",{class:"reticle__hit"},[n("i"),n("i"),n("i"),n("i")])]),this.chainNum=n("b",{text:"x2"}),this.chainEl=n("div",{class:"chain","aria-hidden":"true"},[this.chainNum,n("span",{text:"chain"})]);const a=n("div",{class:"floaters","aria-hidden":"true"});for(let o=0;o<12;o++){const r=n("span",{class:"floater"});this.floaters.push(r),a.append(r)}this.assist=n("div",{class:"assist",role:"status"},[n("span",{class:"assist__text"})]),this.assistText=this.assist.querySelector(".assist__text"),this.skipBtn=n("button",{class:"btn btn--sm assist__skip",type:"button",text:"Open the dossier anyway"}),this.assist.append(this.skipBtn),this.hint=n("div",{class:"hint"},s?[n("span",{text:"Drag to fly"}),n("span",{text:"Guns are automatic"}),n("span",{text:"BOOST to accelerate"})]:[n("span",{html:"<kbd>Mouse</kbd> or <kbd>WASD</kbd> to fly"}),n("span",{html:"<kbd>Click</kbd> / <kbd>Space</kbd> to fire"}),n("span",{html:"<kbd>Shift</kbd> boost"}),n("span",{html:"<kbd>H</kbd> help"})]),this.root=n("div",{class:"hud"},[a,this.reticle,this.chainEl,n("div",{class:"hud__top"},[this.objective,this.boss,this.assist]),this.spine,n("div",{class:"hud__bottom"},[n("div",{class:"stats"},[n("div",{class:"rank"},[this.rankName,this.rankXp]),n("div",{class:"rank__track"},[this.rankBar]),n("div",{class:"shards"},[n("span",{class:"shards__icon",html:P.shard}),this.shardCount,n("span",{class:"shards__label",text:"data shards"})])]),n("div",{class:"flight"},[this.hullWrap,n("div",{class:"flight__speed"},[this.speedNum,this.speedUnit,this.boostPip])]),this.hint])]),this.skipBtn.hidden=!0,e.append(this.root),_.on("xp:change",()=>this.syncStats()),_.on("shard:collect",()=>{this.syncStats(),this.pop(this.shardCount)}),this.syncStats()}root;objTitle;objDetail;objChip;objective;boss;bossName;bossShield;bossCore;bossPhase;spine;spineFill;spineDots=[];rankName;rankXp;rankBar;shardCount;hullBar;hullWrap;speedNum;speedUnit;boostPip;reticle;hint;chainEl;chainNum;chainTimer=0;floaters=[];floaterCursor=0;assist;assistText;skipBtn;lastTitle="";lastDetail="";lastPhase="";lowHullSince=0;hitMarker(e){this.reticle.classList.remove("hit","kill"),this.reticle.offsetWidth,this.reticle.classList.add(e?"kill":"hit")}setChain(e){if(window.clearTimeout(this.chainTimer),e<2){this.chainEl.classList.remove("on");return}this.chainNum.textContent=`x${e}`,this.chainEl.classList.toggle("hot",e>=5),this.chainEl.classList.add("on"),this.pop(this.chainEl),this.chainTimer=window.setTimeout(()=>this.chainEl.classList.remove("on"),2200)}floater(e,t,s,i="xp"){const a=this.floaters[this.floaterCursor];this.floaterCursor=(this.floaterCursor+1)%this.floaters.length,a.textContent=s,a.className=`floater floater--${i}`,a.style.left=`${(e+1)/2*100}%`,a.style.top=`${(1-t)/2*100}%`,a.offsetWidth,a.classList.add("go")}setAssist(e){this.assistText.textContent=e??"",this.assist.classList.toggle("on",!!e||!this.skipBtn.hidden)}setSkipOffer(e,t){this.skipBtn.hidden=!e,e&&t&&(this.skipBtn.onclick=t),this.assist.classList.toggle("on",e||!!this.assistText.textContent)}onJump(e){this.spineDots.forEach(t=>{const s=t.dataset.sector;t.addEventListener("click",()=>e(s))})}syncStats(){this.rankName.textContent=this.state.rank,this.rankXp.textContent=`${this.state.xp} XP`,this.rankBar.style.width=`${Math.round(this.state.rankPct*100)}%`,this.shardCount.textContent=`${this.state.collected}/${this.state.totalShards}`}pop(e){e.classList.remove("pop"),e.offsetWidth,e.classList.add("pop")}setVisible(e){this.root.classList.toggle("on",e)}fadeHint(){this.hint.classList.add("fade")}setReticle(e,t,s){this.reticle.classList.toggle("on",s),s&&(this.reticle.style.transform=`translate(-50%, -50%) translate(${e*50}vw, ${t*50}vh)`)}update(e,t,s){t.objectiveTitle!==this.lastTitle&&(this.lastTitle=t.objectiveTitle,this.objTitle.textContent=t.objectiveTitle,this.pop(this.objective)),t.objectiveDetail!==this.lastDetail&&(this.lastDetail=t.objectiveDetail,this.objDetail.textContent=t.objectiveDetail);const i=it.get(t.currentSectorId);i&&this.objChip.textContent!==i.code&&(this.objChip.textContent=i.code,this.objective.style.setProperty("--accent",Fe(i.color)));const a=t.activeNode,o=a?a.shielded?"shield":"core":"none";o!==this.lastPhase&&(this.lastPhase=o,this.boss.classList.toggle("on",o!=="none"),a&&(this.bossName.textContent=a.def.name+" NODE",this.boss.style.setProperty("--accent",Fe(a.def.color))),this.bossPhase.textContent=o==="shield"?"Shield integrity":o==="core"?"Core exposed":"",this.boss.classList.toggle("breached",o==="core")),a&&(this.bossShield.style.width=`${a.shieldPct*100}%`,this.bossCore.style.width=`${a.corePct*100}%`);const r=t.progress(e);this.spineFill.style.setProperty("--fill",`${(r*100).toFixed(1)}%`),this.spineDots.forEach((u,f)=>{const v=this.state.isDecrypted(A[f].id);u.classList.toggle("done",v),u.classList.toggle("active",f===t.targetIndex)});const h=Math.round(e.speed),d=e.held?"HOLD":String(h);this.speedNum.textContent!==d&&(this.speedNum.textContent=d),this.speedUnit.hidden=e.held,this.boostPip.classList.toggle("on",e.boosting),this.hullBar.style.width=`${Math.max(0,e.integrity)*100}%`;const c=e.integrity<.35;this.hullWrap.classList.toggle("low",c),c?(this.lowHullSince===0&&(this.lowHullSince=s),this.hullWrap.classList.toggle("critical",s-this.lowHullSince>.4)):(this.lowHullSince=0,this.hullWrap.classList.remove("critical"))}}class ma{constructor(e,t,s){this.state=t,this.onContinue=s,this.eyebrow=n("div",{class:"codex__eyebrow"}),this.title=n("h2",{class:"codex__title"}),this.sub=n("div",{class:"codex__sub"}),this.pips=n("div",{class:"pips"}),this.pipLabel=n("span"),this.body=n("div",{class:"codex__body scroll",role:"region","aria-label":"Dossier content"}),this.continueBtn=n("button",{class:"btn btn--primary codex__continue",type:"button",text:"Continue the run",onclick:()=>{this.gating=!1,this.close(),this.onContinue()}}),this.closeBtn=n("button",{class:"codex__close",type:"button","aria-label":"Close dossier",html:P.close,onclick:()=>this.close()}),this.more=n("button",{class:"codex__more",type:"button","aria-label":"Scroll down through the dossier",onclick:()=>this.body.scrollBy({top:this.body.clientHeight*.85,behavior:"smooth"})},[n("span",{class:"codex__moreText"}),n("span",{class:"codex__moreArrow",text:"↓"})]),this.moreText=this.more.querySelector(".codex__moreText"),this.body.addEventListener("scroll",()=>this.syncScroll(),{passive:!0}),this.foot=n("footer",{class:"codex__foot"},[this.more,this.continueBtn]),this.root=n("aside",{class:"codex",role:"complementary","aria-label":"Sector dossier","aria-hidden":"true"},[n("header",{class:"codex__head"},[n("div",{},[this.eyebrow,this.title,this.sub]),this.closeBtn]),n("div",{class:"codex__progress"},[this.pips,this.pipLabel]),this.body,this.foot]),e.append(this.root),_.on("shard:collect",({sector:i})=>{if(this.current?.id!==i)return;!!this.root.querySelector(".cx-bonus.locked")&&this.state.isDecrypted(i)?this.render(this.current):this.syncProgress()}),_.on("sector:decrypted",({id:i})=>{this.current?.id===i&&this.render(this.current)}),this.root.addEventListener("keydown",i=>this.onKeydown(i))}root;eyebrow;title;sub;pips;pipLabel;body;foot;more;moreText;continueBtn;closeBtn;current=null;lastFocus=null;gating=!1;focusTimer=0;get isOpen(){return this.root.classList.contains("on")}open(e,t=!1){const s=it.get(e);s&&(this.lastFocus=document.activeElement,this.current=s,this.gating=t,this.render(s),this.foot.hidden=!t,this.root.classList.add("on"),this.root.setAttribute("aria-hidden","false"),this.body.scrollTop=0,this.syncScroll(),t?(this.root.setAttribute("role","dialog"),this.root.setAttribute("aria-modal","true")):(this.root.setAttribute("role","complementary"),this.root.removeAttribute("aria-modal")),this.focusWhenReady(t?this.continueBtn:this.body),_.emit("codex:open",{id:e}))}close(){this.isOpen&&(window.clearTimeout(this.focusTimer),this.root.classList.remove("on"),this.root.setAttribute("aria-hidden","true"),this.lastFocus instanceof HTMLElement&&this.lastFocus.focus(),_.emit("codex:close",void 0),this.gating&&(this.gating=!1,this.onContinue()))}get isGating(){return this.gating}onKeydown(e){const t={ArrowDown:120,ArrowUp:-120,PageDown:1,PageUp:-1,Home:-1e9,End:1e9};if(e.key in t&&this.isOpen&&this.root.contains(document.activeElement)){const r=e.key==="PageDown"||e.key==="PageUp"?t[e.key]*this.body.clientHeight*.85:t[e.key];e.preventDefault();const h=e.key==="PageDown"||e.key==="PageUp";this.body.scrollBy({top:r,behavior:h?"smooth":"auto"});return}if(e.key!=="Tab"||!this.gating)return;const s=Array.from(this.root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(r=>r.getClientRects().length>0&&!r.closest("[hidden]"));if(!s.length)return;const i=s[0],a=s[s.length-1],o=document.activeElement;e.shiftKey&&(o===i||!this.root.contains(o))?(e.preventDefault(),a.focus()):!e.shiftKey&&(o===a||!this.root.contains(o))&&(e.preventDefault(),i.focus())}focusWhenReady(e){window.clearTimeout(this.focusTimer);const t=performance.now()+2e3,s=()=>{this.isOpen&&(e.focus(),!(document.activeElement===e||performance.now()>t)&&(this.focusTimer=window.setTimeout(s,90)))};this.root.addEventListener("transitionend",s,{once:!0}),this.focusTimer=window.setTimeout(s,60)}syncScroll(){const e=this.body,t=e.scrollHeight-e.clientHeight-e.scrollTop,s=t>24;if(this.root.classList.toggle("has-more",s),e.scrollHeight-e.clientHeight>4?e.setAttribute("tabindex","0"):e.removeAttribute("tabindex"),s){const a=t/Math.max(1,e.clientHeight);this.moreText.textContent=a>1.4?`${Math.ceil(a)} more screens`:"More below"}}syncProgress(){if(!this.current)return;const e=this.state.shardsIn(this.current.id).length,t=this.current.shards;this.pips.replaceChildren(...Array.from({length:t},(s,i)=>n("i",{class:i<e?"pip on":"pip"}))),this.pipLabel.textContent=e>=t?"decrypted":`${e}/${t} shards recovered`}render(e){this.root.style.setProperty("--accent",Fe(e.color)),this.root.style.setProperty("--accent-soft",ua(e.color,.16)),this.eyebrow.textContent=e.code,this.title.textContent=e.name,this.sub.textContent=e.subtitle;const t=e.blocks.map(i=>this.block(i)),s=this.state.isDecrypted(e.id);t.push(this.bonus(e,s)),this.body.replaceChildren(...t),this.syncProgress(),requestAnimationFrame(()=>this.syncScroll())}bonus(e,t){const s=n("div",{class:"cx-bonus__tag"},[n("span",{html:t?P.unlock:P.lock}),n("span",{text:t?"Classified — unlocked":"Classified — locked"})]),i=t?e.bonus.map(a=>this.block(a)):[n("p",{class:"cx-bonus__locked-copy",text:`Recover all ${e.shards} data shards orbiting this sector to unlock.`})];return n("div",{class:t?"cx-bonus":"cx-bonus locked"},[s,...i])}block(e){switch(e.t){case"lead":return n("p",{class:"cx-lead",html:te(e.text)});case"para":return n("p",{class:"cx-para",html:te(e.text)});case"list":return n("ul",{class:"cx-list"},e.items.map(t=>n("li",{html:te(t)})));case"stats":return n("div",{class:"cx-stats"},e.items.map(t=>n("div",{class:"cx-stat"},[n("b",{text:t.value}),n("span",{text:t.label}),t.note?n("em",{text:t.note}):null])));case"cards":return n("div",{},e.items.map(t=>n("article",{class:"cx-card"},[n("h4",{text:t.title}),t.sub?n("p",{class:"cx-card__sub",text:t.sub}):null,n("p",{html:te(t.text)}),t.meta?.length?n("div",{class:"cx-meta"},t.meta.map(s=>n("span",{text:s}))):null,t.links?.length?n("div",{class:"cx-links"},t.links.map(s=>this.link(s.href,s.label,s.live))):null])));case"timeline":return n("div",{class:"cx-timeline"},e.items.map(t=>n("div",{class:t.current?"cx-entry now":"cx-entry"},[n("h4",{text:t.title}),n("div",{class:"cx-entry__meta"},[n("span",{class:"cx-entry__period",text:t.period}),n("span",{text:t.sub})]),n("ul",{class:"cx-list"},t.points.map(s=>n("li",{html:te(s)})))])));case"chips":return n("div",{class:"cx-chips"},[n("div",{class:"cx-chips__title",text:e.group}),n("div",{class:"cx-chips__set"},e.items.map(t=>n("span",{class:"cx-chip",text:t})))]);case"quote":return n("blockquote",{class:"cx-quote"},[n("p",{html:te(e.text)}),e.by?n("cite",{text:`— ${e.by}`}):null]);case"cta":{const t=n("a",{class:e.kind==="primary"?"btn btn--primary btn--sm":"btn btn--sm",href:e.href,...e.href.startsWith("http")?{target:"_blank",rel:"noopener noreferrer"}:{},text:e.label});if(!e.href.startsWith("mailto:"))return n("div",{class:"cx-cta"},[t]);const s=e.href.slice(7).split("?")[0],i=n("button",{class:"btn btn--sm cx-copy",type:"button",text:"Copy"});return i.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(s),i.textContent="Copied"}catch{i.textContent=s}window.setTimeout(()=>i.textContent="Copy",2200)}),n("div",{class:"cx-cta"},[t,i])}}}link(e,t,s=!1){return n("a",{class:s?"cx-link cx-link--live":"cx-link",href:e,target:"_blank",rel:"noopener noreferrer"},[n("span",{html:s?P.play:P.external}),n("span",{text:t})])}}class fa{root;live;held=[];holding=!1;constructor(e){this.root=n("div",{class:"toasts","aria-hidden":"true"}),this.live=n("div",{class:"sr-only",role:"status","aria-live":"polite"}),e.append(this.root,this.live),_.on("codex:open",()=>{this.holding=!0}),_.on("codex:close",()=>{this.holding=!1,this.held.splice(0).forEach(([s,i,a],o)=>window.setTimeout(()=>this.show(s,i,a),500+o*700))})}push(e,t,s="trophy"){if(this.holding){this.held.push([e,t,s]),this.live.textContent=`${e}. ${t}`;return}this.show(e,t,s)}show(e,t,s){const i=n("div",{class:"toast"},[n("span",{class:"toast__icon",html:P[s]}),n("div",{},[n("div",{class:"toast__name",text:e}),n("div",{class:"toast__note",text:t})])]);for(this.root.append(i),this.live.textContent=`${e}. ${t}`;this.root.children.length>3;)this.root.firstElementChild?.remove();window.setTimeout(()=>{i.classList.add("out"),window.setTimeout(()=>i.remove(),400)},3800)}}class ga{constructor(e,t,s){this.state=t,this.hooks=s,this.log=n("div",{class:"terminal__log scroll"}),this.input=n("input",{class:"terminal__input",type:"text",autocomplete:"off",autocapitalize:"off",spellcheck:"false","aria-label":"Terminal command",placeholder:"type 'help' and press enter"});const i=n("form",{class:"terminal__form",onsubmit:a=>this.submit(a)},[n("span",{class:"terminal__prompt",text:"signal@knot:~$"}),this.input]);this.root=n("div",{class:"terminal",role:"dialog","aria-label":"Terminal","aria-hidden":"true"},[n("div",{class:"terminal__bar"},[n("span",{class:"terminal__dot"}),n("span",{text:"signal terminal — v3.1.0"})]),this.log,i]),e.append(this.root),this.register(),this.input.addEventListener("keydown",a=>this.onKey(a)),this.print("SIGNAL terminal ready.","ok"),this.print("Type 'help' for commands. Press ~ or Esc to close.")}root;log;input;history=[];historyIndex=-1;commands=new Map;register(){const e=t=>this.commands.set(t.name,t);e({name:"help",help:"list every command",run:()=>{this.print("Available commands:","ok");for(const t of this.commands.values())this.print(`  ${(t.name+(t.args?" "+t.args:"")).padEnd(20)} ${t.help}`)}}),e({name:"whoami",help:"who you are talking to",run:()=>{this.print(`${y.name} — ${y.title}`,"ok"),this.print(y.location),this.print(y.tagline)}}),e({name:"sectors",help:"list every sector and its status",run:()=>{for(const t of A){const s=this.state.shardsIn(t.id).length,i=s>=t.shards?"DECRYPTED":this.state.hasVisited(t.id)?"VISITED  ":"UNKNOWN  ";this.print(`  ${t.code}  ${t.name.padEnd(14)} ${i}  ${s}/${t.shards} shards`)}}}),e({name:"warp",args:"<sector>",help:"jump straight to a sector",run:t=>{const s=(t[0]??"").toLowerCase();if(!s){this.print(`usage: warp <${A.map(a=>a.id).join("|")}>`,"err");return}const i=A.find(a=>a.id===s)??A.find(a=>a.name.toLowerCase().replace(/\s+/g,"")===s.replace(/\s+/g,""))??A.find(a=>a.id.startsWith(s));if(!i){this.print(`no sector matching "${s}". try: ${A.map(a=>a.id).join(", ")}`,"err");return}this.print(`warping to ${i.name}…`,"ok"),this.state.unlock("warp"),this.hooks.warp(i.id),this.toggle(!1)}}),e({name:"projects",help:"list featured builds",run:()=>{for(const t of tt)this.print(`  ${t.name}`,"ok"),this.print(`    ${t.headline}`),t.repo&&this.printLink("    ",t.repo)}}),e({name:"stack",help:"the tools I actually use",run:()=>{this.print("AI       LLM apps, RAG, agents, evals, OpenAI / Anthropic / Gemini"),this.print("Web      TypeScript, React, Next.js, Node, Supabase, Prisma, Tailwind"),this.print("3D       Three.js, WebGL, GLSL, Rapier, PixiJS, Phaser"),this.print("Data     PostgreSQL, SQLite/FTS5, vector search, PostHog"),this.print("Ops      Docker, Vercel, Playwright, Vitest, Jest")}}),e({name:"contact",help:"how to reach me",run:()=>{this.print(`email    ${y.email}`,"ok"),this.print(`phone    ${y.phone}`,"ok"),this.printLink("github   ",y.github),this.printLink("linkedin ",y.linkedin),this.printLink("cleaning ",y.siteDazzle)}}),e({name:"hire",help:"the short version of the pitch",run:()=>{this.print("> Most AI consultants have never had to make payroll.","ok"),this.print("  I own two operating businesses and write the software myself."),this.print("  Automation, agents, internal tools, and sites that close."),this.print(`  ${y.email} — say what is slow and I will tell you if it is fixable.`)}}),e({name:"brief",help:"switch to the written brief",run:()=>{this.hooks.brief(!0),this.toggle(!1)}}),e({name:"status",help:"your progress on this run",run:()=>{this.print(`rank     ${this.state.rank}`,"ok"),this.print(`xp       ${this.state.xp}`),this.print(`shards   ${this.state.collected}/${this.state.totalShards}`),this.print(`sectors  ${this.state.data.visited.length}/${A.length} visited`),this.print(`kills    ${this.state.kills}`),this.print(`nodes    ${this.state.nodesBroken}/${A.length} broken`),this.print(`awards   ${this.state.data.achievements.length} unlocked`)}}),e({name:"music",args:"[on|off]",help:"toggle the score, or see what is playing",run:t=>{const s=(t[0]??"").toLowerCase();if(s&&s!=="on"&&s!=="off"){this.print("usage: music [on|off]","err");return}const i=this.hooks.music(s?s==="on":void 0);i.on?(this.print(`music  on — now playing "${i.track}"`,"ok"),this.print("       synthesised live in WebAudio; every sector has its own key and tempo.")):this.print("music  off — effects still play. `music on` to bring it back.","ok")}}),e({name:"dossier",args:"<sector>",help:"open a sector dossier without flying there",run:t=>{const s=(t[0]??"").toLowerCase(),i=A.find(a=>a.id===s||a.name.toLowerCase().startsWith(s));if(!s||!i){this.print("usage: dossier <origin|ventures|forge|arcade|track|uplink>","err");return}this.hooks.dossier(i.id),this.print(`opening ${i.name} dossier`,"ok")}}),e({name:"restart",help:"fly the corridor again, keeping your progress",run:()=>{this.print("re-entering the corridor at ORIGIN…","ok"),this.hooks.restart()}}),e({name:"reset",help:"wipe progress and start over",run:()=>{this.print("progress wiped. fly safe.","ok"),this.hooks.reset()}}),e({name:"clear",help:"clear the log",run:()=>this.log.replaceChildren()}),e({name:"sudo",help:"do not",run:()=>this.print("Nice try. Everything here is already yours to read.","err")})}print(e,t=""){this.log.append(n("p",{class:t,text:e})),this.log.scrollTop=this.log.scrollHeight}printLink(e,t){const s=n("p",{html:`${Je(e)}<a href="${Je(t)}" target="_blank" rel="noopener noreferrer">${Je(t)}</a>`});this.log.append(s),this.log.scrollTop=this.log.scrollHeight}submit(e){e.preventDefault();const t=this.input.value.trim();if(this.input.value="",!t)return;this.log.append(n("p",{class:"echo",text:t})),this.history.unshift(t),this.historyIndex=-1;const[s,...i]=t.split(/\s+/),a=this.commands.get(s.toLowerCase());if(a)a.run(i);else{const o=this.closest(s.toLowerCase());this.print(o?`command not found: ${s} — did you mean "${o}"?`:`command not found: ${s}. try 'help'.`,"err")}this.log.scrollTop=this.log.scrollHeight}closest(e){let t=null,s=1/0;for(const i of this.commands.keys()){const a=va(e,i);a<s&&(s=a,t=i)}return s<=Math.max(2,Math.floor(e.length/2))?t:null}onKey(e){if(e.key==="ArrowUp"){if(e.preventDefault(),this.history.length===0)return;this.historyIndex=Math.min(this.historyIndex+1,this.history.length-1),this.input.value=this.history[this.historyIndex]}else if(e.key==="ArrowDown")e.preventDefault(),this.historyIndex=Math.max(this.historyIndex-1,-1),this.input.value=this.historyIndex===-1?"":this.history[this.historyIndex];else if(e.key==="Tab"){e.preventDefault();const t=this.input.value.trim().toLowerCase(),s=[...this.commands.keys()].find(i=>i.startsWith(t));s&&(this.input.value=s+" ")}}get isOpen(){return this.root.classList.contains("on")}toggle(e){const t=e??!this.isOpen;this.root.classList.toggle("on",t),this.root.setAttribute("aria-hidden",t?"false":"true"),t?(this.state.unlock("terminal"),window.setTimeout(()=>this.input.focus(),60)):this.input.blur()}}function va(l,e){const t=l.length,s=e.length;if(!t)return s;if(!s)return t;let i=Array.from({length:s+1},(a,o)=>o);for(let a=1;a<=t;a++){const o=[a];for(let r=1;r<=s;r++)o[r]=Math.min(i[r]+1,o[r-1]+1,i[r-1]+(l[a-1]===e[r-1]?0:1));i=o}return i[s]}class ba{root;progress;launchBtn;status;constructor(e,t,s){this.progress=n("i"),this.status=n("div",{class:"boot__status",text:"Compiling shaders"}),this.launchBtn=n("button",{class:"btn btn--primary btn--lg",type:"button",text:s?"Resume the run":"Launch",onclick:()=>t.launch()});const i=(a,o,r)=>n("li",{class:"boot__beat"},[n("span",{class:"boot__beatnum",text:a}),n("div",{},[n("b",{text:o}),n("span",{text:r})])]);this.root=n("div",{class:"boot"},[n("div",{class:"boot__grid","aria-hidden":"true"}),n("div",{class:"boot__inner"},[n("p",{class:"boot__eyebrow"},[n("span",{class:"boot__dot"}),n("span",{text:"SIGNAL — interactive portfolio"})]),n("h1",{class:"boot__title",text:y.name}),n("p",{class:"boot__sub",text:`${y.title} · ${y.location}`}),n("div",{class:"boot__line"}),n("p",{class:"boot__pitch",text:y.tagline}),n("ol",{class:"boot__beats"},[i("01","Fly the corridor","Six sectors. Your cursor is the stick."),i("02","Clear the resistance","Shoot what shoots back. You cannot lose."),i("03","Break the node","It drops data shards — the résumé, one chapter at a time.")]),n("div",{class:"boot__actions"},[this.launchBtn,n("button",{class:"btn btn--lg",type:"button",text:"Read the written brief",onclick:()=>t.brief()})]),n("p",{class:"boot__alt",text:"About ten minutes to fly, or three to read. The brief is the whole CV as a normal page — same facts, no flying, nothing held back."}),n("div",{class:"boot__progress"},[this.progress]),this.status,n("p",{class:"boot__hint",text:"Mouse or WASD to fly · click or space to fire · shift to boost · H for help"})])]),e.append(this.root)}setProgress(e,t){this.progress.style.width=`${Math.round(e*100)}%`,t&&(this.status.textContent=t),e>=1&&(this.status.textContent="Ready")}focus(){this.launchBtn.focus(),this.setSiblingsInert(!0)}setSiblingsInert(e){const t=this.root.parentElement;if(!t)return;for(const i of Array.from(t.children))i!==this.root&&(i.inert=e);const s=document.getElementById("stage");s&&(s.inert=e)}hide(){this.setSiblingsInert(!1),this.root.classList.add("out"),window.setTimeout(()=>{this.root.hidden=!0},800)}show(){this.root.hidden=!1,this.setSiblingsInert(!0),requestAnimationFrame(()=>this.root.classList.remove("out"))}}class wa{root;soundBtn;briefBtn;constructor(e,t,s){this.soundBtn=n("button",{class:"icon-btn",type:"button","aria-label":"Toggle sound","aria-pressed":String(!s),html:s?P.mute:P.sound,onclick:()=>this.syncSound(t.toggleSound())}),this.briefBtn=n("button",{class:"icon-btn",type:"button","aria-label":"Toggle written brief","aria-pressed":"false",html:P.doc,onclick:()=>this.syncBrief(t.toggleBrief())});const i=n("button",{class:"icon-btn",type:"button","aria-label":"Controls and pause menu",title:"Controls (H)",html:P.help,onclick:()=>t.toggleHelp()}),a=n("button",{class:"icon-btn",type:"button","aria-label":"Toggle terminal",html:P.terminal,onclick:()=>t.toggleTerminal()});this.root=n("header",{class:"topbar"},[n("div",{class:"brand"},[n("span",{class:"brand__mark",text:y.name}),n("span",{class:"brand__role",text:y.title})]),n("a",{class:"topbar__cta",href:`mailto:${y.email}?subject=AI%20project%20enquiry`,"aria-label":`Email ${y.email}`},[n("span",{html:P.mail}),n("span",{class:"topbar__ctaLabel",text:"Hire me"})]),n("nav",{class:"toolbar","aria-label":"Site controls"},[i,a,this.briefBtn,this.soundBtn])]),e.append(this.root)}syncSound(e){this.soundBtn.innerHTML=e?P.mute:P.sound,this.soundBtn.setAttribute("aria-pressed",String(!e))}syncBrief(e){this.briefBtn.setAttribute("aria-pressed",String(e)),this.briefBtn.innerHTML=e?P.game:P.doc,this.briefBtn.setAttribute("aria-label",e?"Return to the interactive portfolio":"Read the written brief")}}function Ue(l){const e=it.get(l);return e?e.bonus.flatMap(t=>t.t==="para"?[n("p",{class:"brief__para",html:te(t.text)})]:t.t==="quote"?[n("blockquote",{class:"brief__quote"},[n("p",{html:te(t.text)}),t.by?n("cite",{text:`— ${t.by}`}):null])]:t.t==="list"?[n("ul",{class:"brief__list"},t.items.map(s=>n("li",{html:te(s)})))]:[]):[]}function Xt(l){const e=(p="")=>n("div",{class:`brief__contact ${p}`},[n("a",{class:"btn btn--primary",href:`mailto:${y.email}?subject=AI%20project%20enquiry`},[n("span",{html:P.mail}),n("span",{text:y.email})]),n("a",{class:"btn",href:"tel:+13863015775",text:y.phone}),ya(),n("a",{class:"btn",href:y.github,target:"_blank",rel:"noopener noreferrer",text:"GitHub"}),n("a",{class:"btn",href:y.linkedin,target:"_blank",rel:"noopener noreferrer",text:"LinkedIn"})]),t=[["#brief-profile","Profile"],["#brief-ventures","Ventures"],["#brief-work","Work"],["#brief-services","Services"],["#brief-experience","Experience"],["#brief-skills","Skills"],["#brief-contact","Contact"]],s=n("nav",{class:"bnav","aria-label":"Sections"},[n("div",{class:"bnav__wrap"},[n("a",{class:"bnav__brand",href:"#brief"},[n("b",{text:y.name}),n("span",{text:"SIGNAL"})]),ka(n("div",{class:"bnav__links"},t.map(([p,m])=>n("a",{class:"bnav__link",href:p,text:m})))),n("div",{class:"bnav__actions"},[n("a",{class:"bnav__contact",href:"#brief-contact"},[n("span",{html:P.mail}),n("span",{text:"Contact"})]),l?n("button",{class:"btn btn--primary btn--sm",type:"button",onclick:()=>l.launch()},[n("span",{html:P.play}),n("span",{text:"Launch the 3D portfolio"})]):null,n("button",{class:"btn btn--sm btn--ghost bnav__print",type:"button",text:"Print / PDF",onclick:()=>window.print()})])])]),i=n("header",{class:"brief__hero",id:"brief-top"},[n("div",{class:"brief__heroMain"},[n("p",{class:"brief__kicker"},[n("span",{class:"brief__kickerDot"}),...`${y.title} · ${y.location}`.split(" · ").flatMap((p,m)=>[m?n("span",{class:"brief__kickerSep",text:"·"}):null,n("span",{class:"brief__kickerPart",text:p})]).filter(Boolean)]),n("h1",{class:"brief__name",text:y.name}),n("p",{class:"brief__tag",text:y.tagline}),e(),n("p",{class:"brief__heroNote"},[n("span",{text:"Everything below is also flyable. "}),l?n("button",{class:"brief__inlineLink",type:"button",text:"Launch the interactive version",onclick:()=>l.launch()}):n("span",{text:"The interactive version needs WebGL."}),n("span",{text:" — same facts, considerably more explosions."})])]),n("div",{class:"brief__heroStats"},y.stats.map(p=>n("div",{class:"brief__stat"},[n("b",{text:p.value}),n("span",{class:"brief__statLabel",text:p.label}),n("em",{text:p.note})])))]),a=xe("brief-profile","Profile","Who you are dealing with",[...y.pitch.map(p=>n("p",{class:"brief__para",text:p})),n("div",{class:"brief__values"},y.values.map(p=>n("div",{class:"brief__value"},[n("h3",{text:p.k}),n("p",{html:te(p.v)})]))),...Ue("origin")]),o=xe("brief-ventures","Ventures","Businesses I own and run",[n("p",{class:"brief__para brief__lead",text:"Two operating companies and one technology practice. This is the part most AI consultants cannot show you."}),...et.map(p=>n("article",{class:"brief__venture"},[n("div",{class:"brief__ventureHead"},[n("div",{},[n("h3",{text:p.name}),n("p",{class:"brief__meta",text:`${p.role} · ${p.period}`})]),p.url?n("a",{class:"btn btn--sm",href:p.url,target:"_blank",rel:"noopener noreferrer"},[n("span",{text:"Visit"}),n("span",{html:P.external})]):null]),n("p",{class:"brief__para",text:p.summary}),n("div",{class:"brief__metrics"},p.metrics.map(m=>n("div",{class:"brief__metric"},[n("b",{text:m.value}),n("span",{text:m.label})]))),n("ul",{class:"brief__list"},p.points.map(m=>n("li",{text:m})))]))]),r=[...tt].sort((p,m)=>+!!m.live-+!!p.live),h=tt.filter(p=>p.live).length,d=xe("brief-work","Selected work","Thirty-odd public repositories; these are the ones worth your time",[...Ue("arcade"),n("p",{class:"brief__para brief__lead",text:`${xa(h)} of these are running in a browser right now — no install, no account. Press the live link and judge the work directly; that is what it is there for.`}),n("div",{class:"brief__grid"},r.map(p=>n("article",{class:p.live?"brief__card has-live":"brief__card"},[n("div",{class:"brief__cardTop"},[n("h3",{text:p.name}),p.live?n("span",{class:"brief__badge",text:"Live"}):null]),p.scale?n("span",{class:"brief__kind",text:p.scale}):null,n("p",{class:"brief__cardHead",text:p.headline}),n("p",{class:"brief__para",text:p.body}),n("ul",{class:"brief__list brief__list--tight"},p.highlights.map(m=>n("li",{text:m}))),n("div",{class:"brief__chips"},p.stack.map(m=>n("span",{class:"brief__chip",text:m}))),n("div",{class:"brief__cardLinks"},[p.live?n("a",{class:"brief__live",href:p.live,target:"_blank",rel:"noopener noreferrer"},[n("span",{html:P.play}),n("span",{text:p.kind==="game"?"Play it now":"Open it live"})]):null,p.live2?n("a",{class:"brief__live",href:p.live2.href,target:"_blank",rel:"noopener noreferrer"},[n("span",{html:P.external}),n("span",{text:p.live2.label})]):null,p.repo?n("a",{class:"brief__srcLink",href:p.repo,target:"_blank",rel:"noopener noreferrer"},[n("span",{text:"Source"}),n("span",{html:P.external})]):null])])))]),c=xe("brief-services","How I can help","Four ways this usually starts",[...Ue("forge"),n("div",{class:"brief__grid brief__grid--two"},Wt.map(p=>n("article",{class:"brief__card brief__card--service"},[n("h3",{text:p.name}),n("p",{class:"brief__cardHead",text:p.promise}),n("p",{class:"brief__para",text:p.detail}),n("ul",{class:"brief__list brief__list--tight"},p.deliverables.map(m=>n("li",{text:m})))])))]),u=xe("brief-experience","Experience","Fifteen years of operating, most of it before the code",[n("p",{class:"brief__para brief__lead",text:$t}),...Ue("track"),n("div",{class:"brief__timeline"},Ut.map(p=>n("div",{class:p.current?"brief__role now":"brief__role"},[n("div",{class:"brief__rolePeriod"},[n("span",{text:p.period}),p.current?n("span",{class:"brief__now",text:"Current"}):null]),n("div",{class:"brief__roleBody"},[n("h3",{text:p.title}),n("p",{class:"brief__meta",text:`${p.company} · ${p.place}`}),n("ul",{class:"brief__list"},p.points.map(m=>n("li",{text:m})))])])))]),f=xe("brief-skills","Skills","What I actually reach for",[n("div",{class:"brief__skills"},oe.map(p=>n("div",{class:"brief__skillGroup"},[n("h3",{text:p.group}),n("div",{class:"brief__chips"},p.items.map(m=>n("span",{class:"brief__chip",text:m})))]))),n("div",{class:"brief__education"},[n("h3",{text:se.school}),n("p",{class:"brief__meta",text:`${se.degree} · ${se.place}`}),n("ul",{class:"brief__list"},se.notes.map(p=>n("li",{text:p}))),n("h4",{text:"Applied AI training"}),n("div",{class:"brief__chips"},se.training.map(p=>n("span",{class:"brief__chip",text:p})))])]),v=n("section",{class:"brief__cta",id:"brief-contact"},[n("div",{class:"brief__ctaInner"},[n("h2",{text:"Tell me what is slow, manual or expensive."}),n("p",{text:"If AI is the wrong answer for it, I will say so — I have a payroll to make too. If it is the right one, I will show you the shortest path to it and what the honest payback looks like."}),e("brief__contact--lg")])]);return n("main",{class:"brief",id:"brief"},[s,n("div",{class:"brief__wrap"},[i,a,o,d,c,u,f,v,n("footer",{class:"brief__foot"},[n("p",{text:`${y.name} · ${y.location} · ${y.email} · ${y.phone}`}),n("p",{class:"brief__footNote",text:"Built with Three.js, TypeScript and Vite. No framework, no page builder, no template."})])])])}function ya(){const l=n("button",{class:"btn btn--ghost",type:"button"},[n("span",{html:P.copy}),n("span",{text:"Copy address"})]),e=l.lastElementChild;return l.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(y.email),e.textContent="Copied"}catch{e.textContent=y.email}l.classList.add("is-copied"),window.setTimeout(()=>{e.textContent="Copy address",l.classList.remove("is-copied")},2200)}),l}function xa(l){return["Zero","One","Two","Three","Four","Five","Six","Seven","Eight"][l]??String(l)}function xe(l,e,t,s){return n("section",{class:"brief__section",id:l},[n("header",{class:"brief__sectionHead"},[n("h2",{text:e}),n("p",{class:"brief__kicker2",text:t})]),...s])}function ka(l){const e=()=>{const t=l.scrollWidth-l.clientWidth;l.classList.toggle("at-start",l.scrollLeft<=1),l.classList.toggle("at-end",t<=1||l.scrollLeft>=t-1)};return l.addEventListener("scroll",e,{passive:!0}),window.addEventListener("resize",e),document.fonts?.ready&&document.fonts.ready.then(e).catch(()=>{}),requestAnimationFrame(e),e(),l}class Sa{constructor(e,t,s){this.state=t,this.handlers=s,this.stats=n("div",{class:"finale__stats"}),this.closeBtn=n("button",{class:"btn",type:"button",text:"Keep flying",onclick:()=>this.hide()}),this.root=n("div",{class:"finale",role:"dialog","aria-modal":"true","aria-label":"Run complete","aria-hidden":"true"},[n("div",{class:"finale__card"},[n("div",{class:"finale__tag"},[n("span",{html:P.trophy}),n("span",{text:"Transmission complete"})]),n("h2",{class:"finale__title",text:"You read the whole thing."}),n("p",{class:"finale__copy",text:"Every shard recovered. You just read a full résumé — six dossiers, ten projects, fifteen years of operating — by flying through it, and it did not feel like reading a résumé."}),n("p",{class:"finale__copy",text:"That is the whole pitch. Attention is the scarcest thing your business competes for, and the right interface changes what people are willing to give you. Let us talk about what that looks like for your customers."}),this.stats,n("div",{class:"finale__actions"},[n("a",{class:"btn btn--primary",href:`mailto:${y.email}?subject=Let%27s%20talk%20AI`,text:"Start a conversation"}),n("a",{class:"btn",href:"tel:+13863015775",text:y.phone}),n("button",{class:"btn",type:"button",text:"Fly it again",onclick:()=>this.handlers.restart()}),this.closeBtn])])]),e.append(this.root)}root;stats;closeBtn;show(){const e=Math.floor((performance.now()-this.state.startedAt)/6e4),t=Math.floor((performance.now()-this.state.startedAt)%6e4/1e3),s=[["Rank",this.state.rank],["XP",String(this.state.xp)],["Shards",`${this.state.collected}/${this.state.totalShards}`],["Awards",`${this.state.data.achievements.length}/${wt.length}`],["Flight time",`${e}m ${String(t).padStart(2,"0")}s`]];this.stats.replaceChildren(...s.map(([i,a])=>n("div",{class:"finale__stat"},[n("b",{text:a}),n("span",{text:i})]))),this.root.classList.add("on"),this.root.setAttribute("aria-hidden","false"),window.setTimeout(()=>this.closeBtn.focus(),400)}hide(){this.isOpen&&(this.root.classList.remove("on"),this.root.setAttribute("aria-hidden","true"),this.handlers.close())}get isOpen(){return this.root.classList.contains("on")}}class Ma{root;code;name;sub;brief;counter;timer=0;constructor(e){this.code=n("div",{class:"card__code"}),this.name=n("h2",{class:"card__name"}),this.sub=n("div",{class:"card__sub"}),this.brief=n("p",{class:"card__brief"}),this.counter=n("div",{class:"card__counter"}),this.root=n("div",{class:"mcard","aria-hidden":"true"},[n("div",{class:"mcard__inner"},[n("div",{class:"card__rule"}),this.counter,this.code,this.name,this.sub,this.brief,n("div",{class:"card__rule"})])]),e.append(this.root),_.on("mission:card",t=>this.show(t))}show(e){if(document.querySelector(".codex.on")){window.clearTimeout(this.timer),this.timer=window.setTimeout(()=>this.show(e),620);return}this.setAccent(e.color),this.code.textContent=e.code,this.name.textContent=e.name,this.sub.textContent=e.subtitle,this.brief.textContent=e.brief,this.counter.textContent=`Sector ${e.index+1} of ${e.total}`,this.root.classList.remove("on"),this.root.offsetWidth,this.root.classList.add("on"),document.body.classList.add("card-open"),window.clearTimeout(this.timer),this.timer=window.setTimeout(()=>{this.root.classList.remove("on"),document.body.classList.remove("card-open")},3600)}setAccent(e){this.root.style.setProperty("--accent",Fe(e))}hide(){window.clearTimeout(this.timer),this.root.classList.remove("on"),document.body.classList.remove("card-open")}}class _a{constructor(e,t,s){this.state=t,this.handlers=s,this.closeBtn=n("button",{class:"ov__close",type:"button","aria-label":"Resume",html:P.close,onclick:()=>this.close()}),this.panes={controls:this.buildControls(),sectors:this.buildSectors(),record:n("div",{class:"ov__pane"})},this.recordBody=this.panes.record;const i=(a,o)=>n("button",{class:"ov__tab",type:"button",role:"tab",text:o,onclick:()=>this.select(a)});this.tabs={controls:i("controls","Controls"),sectors:i("sectors","Sectors"),record:i("record","Record")},this.root=n("div",{class:"ov",role:"dialog","aria-modal":"true","aria-label":"Paused",hidden:!0},[n("div",{class:"ov__scrim",onclick:()=>this.close()}),n("div",{class:"ov__panel"},[n("header",{class:"ov__head"},[n("div",{},[n("div",{class:"ov__eyebrow",text:"Paused"}),n("h2",{class:"ov__title",text:"SIGNAL"})]),this.closeBtn]),n("div",{class:"ov__tabs",role:"tablist"},[this.tabs.controls,this.tabs.sectors,this.tabs.record]),n("div",{class:"ov__body"},[this.panes.controls,this.panes.sectors,this.panes.record]),n("footer",{class:"ov__foot"},[n("button",{class:"btn btn--primary",type:"button",text:"Resume flight",onclick:()=>this.close()}),n("button",{class:"btn",type:"button",text:"Read the written brief",onclick:()=>{this.close(),this.handlers.brief()}}),n("button",{class:"btn",type:"button",text:"Restart the flight",onclick:()=>{this.close(),this.handlers.restart()}}),this.resetBtn=n("button",{class:"btn btn--ghost",type:"button",text:"Reset progress",onclick:()=>this.onResetClick()})])])]),this.root.addEventListener("keydown",a=>this.onKeydown(a)),e.append(this.root),this.select("controls")}root;tabs;panes;current="controls";closeBtn;lastFocus=null;recordBody;resetBtn;resetArmed=0;focusables(){return Array.from(this.root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(t=>!t.hasAttribute("hidden")&&t.offsetParent!==null)}onKeydown(e){if(e.key!=="Tab")return;const t=this.focusables();if(t.length===0)return;const s=t[0],i=t[t.length-1],a=document.activeElement;e.shiftKey&&(a===s||!this.root.contains(a))?(e.preventDefault(),i.focus()):!e.shiftKey&&(a===i||!this.root.contains(a))&&(e.preventDefault(),s.focus())}onResetClick(){if(!this.resetArmed){this.resetBtn.textContent="Tap again to wipe everything",this.resetBtn.classList.add("armed"),this.resetArmed=window.setTimeout(()=>this.disarmReset(),4e3);return}this.disarmReset(),this.handlers.reset(),this.renderRecord(),this.syncSectors()}disarmReset(){window.clearTimeout(this.resetArmed),this.resetArmed=0,this.resetBtn.textContent="Reset progress",this.resetBtn.classList.remove("armed")}buildControls(){const e=(t,s)=>n("div",{class:"keys__row"},[n("div",{class:"keys__combo"},t.map(i=>n("kbd",{text:i}))),n("span",{text:s})]);return n("div",{class:"ov__pane"},[n("p",{class:"ov__lead",text:"Fly the corridor, clear what gets in the way, break the node at the end of each sector. Every node you break opens a chapter of the résumé."}),n("div",{class:"keys"},[n("h3",{text:"Mouse & keyboard"}),e(["Mouse"],"Steer — the ship flies to your cursor"),e(["W","A","S","D"],"Steer without the mouse"),e(["Click"],"Fire"),e(["Space"],"Fire"),e(["Shift"],"Boost"),e(["C"],"Brake"),n("h3",{text:"Interface"}),e(["H"],"This panel"),e(["Esc"],"Close a panel / pause"),e(["B"],"Written brief"),e(["M"],"Mute"),e(["~"],"Terminal"),n("h3",{text:"Touch"}),n("p",{class:"ov__note",text:"Drag anywhere to fly. The guns fire on their own. Boost is the button in the bottom-right corner."})]),n("p",{class:"ov__note",text:"You cannot lose. Taking fire costs hull integrity, the frame goes red, and it repairs itself. Nothing in here will ever lock you out of the content."})])}buildSectors(){return n("div",{class:"ov__pane"},[n("p",{class:"ov__lead",text:"Jump straight to any sector — including ones you have not flown to yet — or re-open a dossier you closed."}),n("div",{class:"jump"},A.map(e=>n("button",{class:"jump__item",type:"button",style:`--accent:${Fe(e.color)}`,onclick:()=>{this.close(),this.handlers.jump(e.id)}},[n("span",{class:"jump__code",text:e.code}),n("span",{class:"jump__name",text:e.name}),n("span",{class:"jump__sub",text:e.subtitle}),n("span",{class:"jump__state","data-id":e.id})])))])}renderRecord(){const e=new Set(this.state.achievements);this.recordBody.replaceChildren(n("div",{class:"record__stats"},[We(`${this.state.collected}/${this.state.totalShards}`,"Data shards"),We(String(this.state.kills),"Hostiles destroyed"),We(`${this.state.nodesBroken}`,"Nodes broken"),We(this.state.rank,`${this.state.xp} XP`)]),n("ul",{class:"record__list"},wt.map(t=>n("li",{class:e.has(t.id)?"record__item on":"record__item"},[n("span",{class:"record__icon",html:e.has(t.id)?P.trophy:P.lock}),n("div",{},[n("b",{text:t.name}),n("span",{text:t.note})])]))),n("p",{class:"ov__note",text:`Progress is stored in this browser only. ${y.name} never sees it.`}))}select(e){this.current=e;for(const t of Object.keys(this.tabs))this.tabs[t].classList.toggle("on",t===e),this.tabs[t].setAttribute("aria-selected",String(t===e)),this.panes[t].hidden=t!==e;e==="record"&&this.renderRecord(),e==="sectors"&&this.syncSectors()}syncSectors(){for(const e of A){const t=this.panes.sectors.querySelector(`[data-id="${e.id}"]`);if(!t)continue;const s=this.state.isDecrypted(e.id),i=this.state.hasVisited(e.id);t.textContent=s?"Decrypted":i?"Reached":"Fly here",t.className=s?"jump__state done":i?"jump__state seen":"jump__state"}}get isOpen(){return!this.root.hidden}open(e="controls"){this.lastFocus=document.activeElement,this.root.hidden=!1,this.setSiblingsInert(!0),document.body.classList.add("ov-open"),this.select(e),requestAnimationFrame(()=>{this.root.classList.add("on"),this.tabs[this.current].focus()})}close(){this.root.hidden||(this.disarmReset(),this.root.classList.remove("on"),this.root.hidden=!0,this.setSiblingsInert(!1),document.body.classList.remove("ov-open"),this.handlers.resume(),this.lastFocus instanceof HTMLElement&&this.lastFocus.focus())}setSiblingsInert(e){const t=this.root.parentElement;for(const s of Array.from(document.body.children))s!==t&&(s.inert=e);if(t)for(const s of Array.from(t.children))s!==this.root&&(s.inert=e)}toggle(e="controls"){this.isOpen?this.close():this.open(e)}}const We=(l,e)=>n("div",{class:"record__stat"},[n("b",{text:l}),n("span",{text:e})]);class Ta{constructor(e,t){this.input=t;const s=n("button",{class:"tc__btn tc__boost",type:"button","aria-label":"Boost",text:"BOOST"}),i=o=>r=>{r.preventDefault(),this.input.touchBoost=o,s.classList.toggle("held",o)};s.addEventListener("pointerdown",i(!0)),s.addEventListener("pointerup",i(!1)),s.addEventListener("pointercancel",i(!1)),s.addEventListener("pointerleave",i(!1));const a=n("div",{class:"tc__hint",text:"drag anywhere to fly"});this.root=n("div",{class:"tc","aria-hidden":"false"},[a,s]),e.append(this.root)}root;setVisible(e){this.root.classList.toggle("on",e)}retireHint(){this.root.classList.add("learned")}}const ge=1/60,Rt=5;class Aa{engine;state=new si;audio=new Xs;input;world;ship;rig;particles;impacts;speedLines=new da;combat;pickups;director;ui;hud;codex;toasts;terminal;boot;topbar;complete;card;overlay;touch=null;running=!1;paused=!1;hiddenPause=!1;briefMode=!1;accumulator=0;elapsed=0;lastFrame=0;rafId=0;hintTimer=0;hintRetired=!1;hintMoved=!1;accent=new x(5104065);hullAtNode=1;dilation=1;dilationHold=0;chain=0;lastKillAt=-10;heartbeatIn=0;wasBoosting=!1;proj=new g;constructor(){const e=document.getElementById("stage");this.ui=document.getElementById("ui"),this.engine=new Gs(e),this.input=new Ns(e),this.particles=new ra(this.engine.renderer.getPixelRatio(),this.engine.tier.particles),this.impacts=new la,this.engine.scene.add(this.particles.object,this.impacts.object),this.world=new ji(this.engine.scene,this.particles,this.impacts,this.engine.tier.starCount,this.engine.renderer.getPixelRatio(),this.engine.tier.detail),this.engine.scene.add(this.world.group),this.ship=new Ni,this.engine.scene.add(this.ship.object,this.ship.trail.object),this.rig=new qi(this.engine.camera),this.engine.scene.add(this.engine.camera),this.engine.camera.add(this.speedLines.object),this.combat=new Ji(this.world.route,this.particles,this.impacts,{onKill:(i,a,o)=>{this.state.recordKill(o),this.director.reportKill(a),this.chain=this.elapsed-this.lastKillAt<2.4?this.chain+1:1,this.lastKillAt=this.elapsed,this.hud.setChain(this.chain),this.chain>=5&&this.state.unlock("chain-5"),this.popAt(a,`+${o}`,"xp"),this.audio.pop(1,this.chain),this.rig.addShake(.2),this.rig.kick(1.4),this.engine.punch(.1),this.hitStop(.12,.035)},onPlayerHit:()=>{this.audio.hurt(),this.rig.addShake(.55,2.6),this.rig.kick(-2.5),this.engine.punch(.22),this.chain=0,this.hud.setChain(0)},onShoot:()=>{this.audio.shoot(),this.ship.kickback()},onEnemyHit:(i,a)=>{this.hud.hitMarker(a),a||this.audio.ping()}}),this.engine.scene.add(this.combat.group),this.pickups=new ta(this.particles,this.impacts,(i,a)=>{this.state.collectShard(i,a)}),this.engine.scene.add(this.pickups.group),this.director=new ia(this.world.route,this.combat,this.pickups,this.world.sectors,this.state),this.ship.reset(this.world.route,40),this.rig.snap(this.ship),this.toasts=new fa(this.ui),this.hud=new pa(this.ui,this.state,this.input.coarse),this.card=new Ma(this.ui),this.codex=new ma(this.ui,this.state,()=>this.director.advance(this.ship)),this.terminal=new ga(this.ui,this.state,{music:i=>(i!==void 0&&(this.state.setMusic(i),this.audio.setMusic(i),this.audio.unlock()),{on:this.audio.musicOn,track:this.audio.trackName}),warp:i=>this.warpTo(i),brief:i=>this.setBrief(i),reset:()=>this.resetProgress(),restart:()=>this.restartRun(),dossier:i=>{this.terminal.toggle(!1),this.codex.open(i,!1)}}),this.topbar=new wa(this.ui,{toggleSound:()=>this.toggleSound(),toggleBrief:()=>this.setBrief(!this.briefMode),toggleTerminal:()=>this.terminal.toggle(),toggleHelp:()=>this.togglePause()},this.state.data.muted),this.overlay=new _a(this.ui,this.state,{resume:()=>this.resumeFromPause(),jump:i=>this.warpTo(i),brief:()=>this.setBrief(!0),reset:()=>this.resetProgress(),restart:()=>this.restartRun()}),this.complete=new Sa(this.ui,this.state,{close:()=>{this.running=!this.briefMode,this.lastFrame=performance.now()},restart:()=>this.restartRun()}),this.input.coarse&&(this.touch=new Ta(this.ui,this.input)),this.hud.onJump(i=>this.warpTo(i)),document.body.append(Xt({launch:()=>this.setBrief(!1)})),this.boot=new ba(this.ui,{launch:()=>this.start(),brief:()=>this.setBrief(!0)},this.state.data.seenIntro),this.audio.setMusic(this.state.data.music),this.wireEvents(),this.warmUp(),this.lastFrame=performance.now(),this.tick(this.lastFrame);const t=window.matchMedia("(prefers-reduced-motion: reduce)").matches,s=this.input.coarse&&Math.min(window.innerWidth,window.innerHeight)<820;t||s&&!this.state.data.seenIntro?this.setBrief(!0):this.boot.focus()}wireEvents(){_.on("achievement",({id:t,name:s,note:i})=>{this.toasts.push(s,i),this.audio.ui(),t==="rank"&&this.audio.rankUp()}),_.on("shard:collect",({xp:t})=>{this.audio.shard(this.state.streak),this.rig.addShake(.1),this.popAt(this.ship.object.position,`+${t} XP`,"shard")}),_.on("sector:enter",({id:t})=>{this.audio.enterSector(),this.audio.setSector(A.findIndex(i=>i.id===t)),this.running&&(this.engine.warp(1),this.rig.kick(14));const s=it.get(t);s&&document.documentElement.style.setProperty("--accent",`#${s.color.toString(16).padStart(6,"0")}`)}),_.on("assist:hint",({text:t})=>this.hud.setAssist(t)),_.on("assist:autofire",()=>{this.toasts.push("Auto-fire engaged","Your guns will fire on their own from here","shard"),this.hud.setAssist("Auto-fire engaged — steer with the mouse")}),_.on("assist:skip",({on:t})=>{this.hud.setSkipOffer(t,()=>this.director.skipToDossier(this.ship)),t||this.hud.setAssist(null)}),_.on("wave:spawn",()=>{this.audio.alarm()}),_.on("wave:clear",()=>this.audio.waveClear()),_.on("node:armed",()=>{this.hullAtNode=this.ship.integrity,this.rig.addShake(.3)}),_.on("node:breached",({id:t})=>{this.audio.shieldBreak(),this.rig.addShake(.6),this.rig.kick(6),this.hitStop(.2,.09);const s=this.world.sector(t);s&&this.engine.shockwave(s.position,.7,.8)}),_.on("sector:decrypted",({id:t,broken:s})=>{if(s){this.audio.nodeBreak(),this.rig.addShake(1.1,1.2),this.rig.kick(16),this.engine.punch(.55),this.hitStop(.15,.24);const i=this.world.sector(t);i&&(this.engine.shockwave(i.position,1.3,1.15),this.popAt(i.position,"DECRYPTED","big")),this.chain=0,this.hud.setChain(0),this.state.recordNode(this.hullAtNode>=.999)}else this.audio.enterSector();window.setTimeout(()=>{this.briefMode||this.codex.open(t,!0)},s?850:220)}),_.on("codex:open",()=>{document.body.classList.add("codex-open")}),_.on("codex:close",()=>{document.body.classList.remove("codex-open")}),_.on("complete",()=>{this.toasts.push("Signal complete","Every sector decrypted","trophy"),window.setTimeout(()=>{this.briefMode||this.complete.show()},1200)}),_.on("run:parked",()=>{this.briefMode||this.complete.show()}),document.addEventListener("keydown",t=>this.onKey(t)),document.querySelector(".skip")?.addEventListener("click",()=>this.setBrief(!0));const e=()=>{this.audio.unlock(),this.audio.setMuted(this.state.data.muted),window.removeEventListener("pointerdown",e,!0),window.removeEventListener("keydown",e,!0)};window.addEventListener("pointerdown",e,!0),window.addEventListener("keydown",e,!0),document.addEventListener("visibilitychange",()=>{if(this.audio.setHidden(document.hidden),document.hidden){this.running&&(this.hiddenPause=this.paused=!0);return}this.lastFrame=performance.now(),this.hiddenPause&&!this.overlay.isOpen&&(this.hiddenPause=!1,this.paused=!1)})}onKey(e){const t=e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement;if(e.key==="`"||e.key==="~"){e.preventDefault(),this.terminal.toggle();return}if(t){e.key==="Escape"&&this.terminal.toggle(!1);return}if(e.key==="Escape"){this.complete.isOpen?this.complete.hide():this.terminal.isOpen?this.terminal.toggle(!1):this.overlay.isOpen?this.overlay.close():this.codex.isOpen?this.codex.close():this.togglePause();return}const s=e.key.toLowerCase();(s==="h"||s==="?")&&this.togglePause(),s==="b"&&this.setBrief(!this.briefMode),s==="m"&&this.topbar.syncSound(this.toggleSound())}warmUp(){const e=["Building the route","Compiling shaders","Uploading geometry","Seeding the nebula","Arming systems","Ready"];let t=0;const s=()=>{if(this.boot.setProgress(t/(e.length-1),e[t]),t===1){const i=[];this.engine.scene.traverse(a=>{a.visible||(i.push(a),a.visible=!0)}),this.engine.renderer.compile(this.engine.scene,this.engine.camera);for(const a of i)a.visible=!1}t++,t<e.length&&requestAnimationFrame(s)};requestAnimationFrame(s)}start(){this.audio.unlock(),this.audio.setMuted(this.state.data.muted),this.state.markIntroSeen(),this.boot.hide(),this.director.start(this.ship),this.rig.snap(this.ship),this.rig.addShake(.5),this.audio.boost(),this.engine.warp(1),this.rig.kick(14),this.running=!0,this.paused=!1,this.hud.setVisible(!0),this.touch?.setVisible(!0),this.lastFrame=performance.now(),this.hintTimer=window.setTimeout(()=>this.hud.fadeHint(),14e3)}hitStop(e,t){this.dilation=Math.min(this.dilation,e),this.dilationHold=Math.max(this.dilationHold,t)}popAt(e,t,s){if(!this.running)return;const i=this.proj.copy(e).project(this.engine.camera);i.z>1||Math.abs(i.x)>1.1||Math.abs(i.y)>1.1||this.hud.floater(i.x,i.y,t,s)}moodNow(){return this.briefMode?"silent":this.director.phase==="complete"||this.complete.isOpen?"finale":this.running?this.paused||this.overlay.isOpen||this.terminal.isOpen?"paused":this.codex.isOpen?"dossier":this.director.phase==="node"?"boss":this.combat.aliveCount>0?"combat":"travel":"title"}toggleSound(){const e=!this.state.data.muted;return this.state.setMuted(e),this.audio.unlock(),this.audio.setMuted(e),e}togglePause(){this.briefMode||(this.overlay.isOpen?this.overlay.close():(this.pauseForPanel(),this.overlay.open()))}pauseForPanel(){this.paused=!0}resumeFromPause(){this.paused=!1,this.hiddenPause=!1,this.lastFrame=performance.now()}setBrief(e){return this.briefMode=e,document.body.classList.toggle("brief-mode",e),document.documentElement.classList.toggle("brief-mode",e),this.state.setBrief(e),this.topbar.syncBrief(e),e?(document.documentElement.style.setProperty("--accent","#4de1c1"),this.boot.hide(),this.running=!1,this.terminal.toggle(!1),this.overlay.close(),this.card.hide(),this.touch?.setVisible(!1),window.scrollTo(0,0)):(window.scrollTo(0,0),this.lastFrame=performance.now(),this.audio.unlock(),this.audio.setMuted(this.state.data.muted),(!this.state.data.seenIntro||this.director.phase==="idle")&&(this.state.markIntroSeen(),this.boot.hide(),this.director.start(this.ship),this.rig.snap(this.ship)),this.running=!0,this.paused=!1,this.hud.setVisible(!0),this.touch?.setVisible(!0)),e}resumeAt(e){this.briefMode&&this.setBrief(!1),this.state.data.seenIntro||this.state.markIntroSeen(),this.boot.hide(),this.complete.hide(),this.overlay.close(),this.codex.close(),this.terminal.toggle(!1),e(),this.rig.snap(this.ship),this.rig.addShake(.5),this.audio.boost(),this.particles.clear(),this.impacts.clear(),this.pickups.clear(),this.hud.setAssist(null),this.hud.setSkipOffer(!1),this.hud.setVisible(!0),this.running=!0,this.paused=!1,this.lastFrame=performance.now()}warpTo(e){const t=A.findIndex(s=>s.id===e);t<0||this.resumeAt(()=>this.director.jumpTo(t,this.ship))}restartRun(){this.resumeAt(()=>this.director.replay(this.ship))}resetProgress(){this.state.reset(),this.resumeAt(()=>this.director.reset(this.ship))}tick=e=>{this.rafId=requestAnimationFrame(this.tick);const t=(e-this.lastFrame)/1e3;this.lastFrame=e;const s=L(t,0,.25);if(this.briefMode){this.audio.setMood("silent");return}const i=this.running&&!this.paused;this.dilationHold>0?this.dilationHold-=s:this.dilation<1&&(this.dilation=this.dilation>.995?1:D(this.dilation,1,7,s));const a=s*this.dilation;if(i){this.accumulator+=a;let h=0;const d=!this.terminal.isOpen&&!this.codex.isOpen&&!this.complete.isOpen;for(;this.accumulator>=ge&&h<Rt;){const c=this.input.sample(d);this.ship.step(c,ge,this.elapsed,this.world.route);const u=(c.fire||this.director.autoFire)&&!this.ship.hold;this.combat.shoot(this.ship,ge,u),this.combat.update(ge,this.elapsed,this.ship),this.director.update(ge,this.ship),this.accumulator-=ge,this.elapsed+=ge,h++}h===Rt&&(this.accumulator=0),!this.hintRetired&&(this.combat.shotsFired>0||this.director.autoFire)?(this.hintRetired=!0,window.clearTimeout(this.hintTimer),this.hud.fadeHint(),this.touch?.retireHint()):this.input.moved&&!this.hintMoved&&(this.hintMoved=!0,window.clearTimeout(this.hintTimer),this.hintTimer=window.setTimeout(()=>this.hud.fadeHint(),9e3))}else this.elapsed+=s,this.running||(this.ship.distance+=16*s,this.ship.step({steer:Math.sin(this.elapsed*.3)*.35,pitch:0,boost:0,fire:!1,brake:!1},s,this.elapsed,this.world.route));this.world.setLabelled(this.director.targetIndex),this.rig.update(this.ship,s,this.elapsed),this.ship.updateTrail(this.engine.camera),this.pickups.update(a,this.elapsed,this.ship,this.engine.camera),this.particles.update(a),this.impacts.update(a,this.engine.camera);const o=this.combat.aliveCount>0,r=this.world.update(this.elapsed,s,this.ship,this.engine.renderer.getPixelRatio(),o,this.audio.pulse);if(this.accent.copy(r),this.ship.combat=this.world.combat,this.speedLines.update(a,this.ship.speed,this.ship.boostAmount,this.engine.warpLevel,this.accent),i&&(this.ship.boosting&&!this.wasBoosting&&this.audio.boost(),this.wasBoosting=this.ship.boosting,this.ship.integrity<.35&&o?(this.heartbeatIn-=s,this.heartbeatIn<=0&&(this.audio.heartbeat(),this.heartbeatIn=.55+this.ship.integrity*2)):this.heartbeatIn=0),this.running){this.hud.update(this.ship,this.director,this.elapsed);const h=this.input.reticle;this.hud.setReticle(h.x,h.y,h.active&&!this.ship.hold&&!this.paused)}this.audio.setMood(this.moodNow()),this.engine.setPost(this.ship.boostAmount,this.ship.damageFlash*(1-this.ship.integrity*.5),this.accent),this.engine.render(s,this.elapsed)};debug(){return{distance:+this.ship.distance.toFixed(1),routeLength:+this.world.route.length.toFixed(1),offset:[+this.ship.offset.x.toFixed(1),+this.ship.offset.y.toFixed(1)],speed:+this.ship.speed.toFixed(1),barrier:this.ship.barrier===1/0?"none":+this.ship.barrier.toFixed(1),integrity:+this.ship.integrity.toFixed(2),phase:this.director.phase,sector:this.director.currentSectorId,objective:this.director.objectiveTitle,hostiles:this.combat.aliveCount,shardsInFlight:this.pickups.activeCount,particles:this.particles.count,tier:this.engine.tier.name,music:this.audio.musicState,dilation:+this.dilation.toFixed(2),chain:this.chain,collected:this.state.collected,achievements:this.state.achievements.slice(),nodes:this.world.sectors.map(e=>({id:e.def.id,state:e.state,hp:+e.hp.toFixed(1)}))}}goto(e){this.warpTo(e)}restart(){this.restartRun()}forceDossier(){this.director.skipToDossier(this.ship)}dispose(){cancelAnimationFrame(this.rafId),this.input.dispose(),this.world.dispose(),this.ship.dispose(),this.combat.dispose(),this.pickups.dispose(),this.particles.dispose(),this.impacts.dispose(),this.speedLines.dispose(),this.audio.dispose(),this.engine.dispose()}}function Bt(l){document.body.classList.add("brief-mode"),document.documentElement.classList.add("brief-mode");const e=Xt(),t=document.createElement("p");t.className="brief__notice",t.textContent=l,e.querySelector(".brief__wrap")?.prepend(t),document.body.append(e)}function Ca(){try{const l=document.createElement("canvas");return!!(l.getContext("webgl2")||l.getContext("webgl"))}catch{return!1}}if(Ca())try{window.SIGNAL=new Aa}catch(l){console.error("SIGNAL failed to start",l),Bt("The interactive experience could not start on this device — here is the written brief.")}else Bt("This browser does not support WebGL — here is the written brief.");export{vt as F,De as P};
