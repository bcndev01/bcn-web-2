import{r as m,u as Ae,j as e,L as Me,T as de,a as ue,R as Be,X as Ce}from"./index-C46S9q_9.js";import{v as be,I as Oe,F as fe,a as te,b as G,W as ke,B as oe,S as Se,V as O,c as Ue,U as pe,d as me,e as we,M as Re,f as H,L as Te,g as ze,h as Ie,u as K,_ as ne,Q as Pe,i as De,C as Ve,j as We,A as Fe,P as Ge,O as He,k as $e,w as Ke,l as qe,q as Xe,m as Je,H as se}from"./index-B4nko4W_.js";const je=be>=125?"uv1":"uv2",he=new oe,X=new O;class ie extends Oe{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";const n=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],t=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],a=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(a),this.setAttribute("position",new fe(n,3)),this.setAttribute("uv",new fe(t,2))}applyMatrix4(n){const t=this.attributes.instanceStart,a=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(n),a.applyMatrix4(n),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(n){let t;n instanceof Float32Array?t=n:Array.isArray(n)&&(t=new Float32Array(n));const a=new te(t,6,1);return this.setAttribute("instanceStart",new G(a,3,0)),this.setAttribute("instanceEnd",new G(a,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(n,t=3){let a;n instanceof Float32Array?a=n:Array.isArray(n)&&(a=new Float32Array(n));const i=new te(a,t*2,1);return this.setAttribute("instanceColorStart",new G(i,t,0)),this.setAttribute("instanceColorEnd",new G(i,t,t)),this}fromWireframeGeometry(n){return this.setPositions(n.attributes.position.array),this}fromEdgesGeometry(n){return this.setPositions(n.attributes.position.array),this}fromMesh(n){return this.fromWireframeGeometry(new ke(n.geometry)),this}fromLineSegments(n){const t=n.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new oe);const n=this.attributes.instanceStart,t=this.attributes.instanceEnd;n!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(n),he.setFromBufferAttribute(t),this.boundingBox.union(he))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Se),this.boundingBox===null&&this.computeBoundingBox();const n=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(n!==void 0&&t!==void 0){const a=this.boundingSphere.center;this.boundingBox.getCenter(a);let i=0;for(let r=0,f=n.count;r<f;r++)X.fromBufferAttribute(n,r),i=Math.max(i,a.distanceToSquared(X)),X.fromBufferAttribute(t,r),i=Math.max(i,a.distanceToSquared(X));this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(n){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(n)}}class Ee extends ie{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(n){const t=n.length-3,a=new Float32Array(2*t);for(let i=0;i<t;i+=3)a[2*i]=n[i],a[2*i+1]=n[i+1],a[2*i+2]=n[i+2],a[2*i+3]=n[i+3],a[2*i+4]=n[i+4],a[2*i+5]=n[i+5];return super.setPositions(a),this}setColors(n,t=3){const a=n.length-t,i=new Float32Array(2*a);if(t===3)for(let r=0;r<a;r+=t)i[2*r]=n[r],i[2*r+1]=n[r+1],i[2*r+2]=n[r+2],i[2*r+3]=n[r+3],i[2*r+4]=n[r+4],i[2*r+5]=n[r+5];else for(let r=0;r<a;r+=t)i[2*r]=n[r],i[2*r+1]=n[r+1],i[2*r+2]=n[r+2],i[2*r+3]=n[r+3],i[2*r+4]=n[r+4],i[2*r+5]=n[r+5],i[2*r+6]=n[r+6],i[2*r+7]=n[r+7];return super.setColors(i,t),this}fromLine(n){const t=n.geometry;return this.setPositions(t.attributes.position.array),this}}class re extends Ue{constructor(n){super({type:"LineMaterial",uniforms:pe.clone(pe.merge([me.common,me.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new we(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${be>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(t){this.uniforms.diffuse.value=t}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(t){this.uniforms.linewidth.value=t}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(t){!!t!="USE_DASH"in this.defines&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(t){this.uniforms.dashScale.value=t}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(t){this.uniforms.dashSize.value=t}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(t){this.uniforms.dashOffset.value=t}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(t){this.uniforms.gapSize.value=t}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(t){this.uniforms.opacity.value=t}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(t){this.uniforms.resolution.value.copy(t)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(t){!!t!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),t===!0?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(n)}}const Y=new H,xe=new O,ye=new O,_=new H,A=new H,T=new H,Z=new O,ee=new ze,M=new Te,ge=new O,J=new oe,Q=new Se,z=new H;let I,F;function ve(l,n,t){return z.set(0,0,-n,1).applyMatrix4(l.projectionMatrix),z.multiplyScalar(1/z.w),z.x=F/t.width,z.y=F/t.height,z.applyMatrix4(l.projectionMatrixInverse),z.multiplyScalar(1/z.w),Math.abs(Math.max(z.x,z.y))}function Qe(l,n){const t=l.matrixWorld,a=l.geometry,i=a.attributes.instanceStart,r=a.attributes.instanceEnd,f=Math.min(a.instanceCount,i.count);for(let c=0,u=f;c<u;c++){M.start.fromBufferAttribute(i,c),M.end.fromBufferAttribute(r,c),M.applyMatrix4(t);const p=new O,b=new O;I.distanceSqToSegment(M.start,M.end,b,p),b.distanceTo(p)<F*.5&&n.push({point:b,pointOnLine:p,distance:I.origin.distanceTo(b),object:l,face:null,faceIndex:c,uv:null,[je]:null})}}function Ye(l,n,t){const a=n.projectionMatrix,r=l.material.resolution,f=l.matrixWorld,c=l.geometry,u=c.attributes.instanceStart,p=c.attributes.instanceEnd,b=Math.min(c.instanceCount,u.count),w=-n.near;I.at(1,T),T.w=1,T.applyMatrix4(n.matrixWorldInverse),T.applyMatrix4(a),T.multiplyScalar(1/T.w),T.x*=r.x/2,T.y*=r.y/2,T.z=0,Z.copy(T),ee.multiplyMatrices(n.matrixWorldInverse,f);for(let d=0,N=b;d<N;d++){if(_.fromBufferAttribute(u,d),A.fromBufferAttribute(p,d),_.w=1,A.w=1,_.applyMatrix4(ee),A.applyMatrix4(ee),_.z>w&&A.z>w)continue;if(_.z>w){const o=_.z-A.z,h=(_.z-w)/o;_.lerp(A,h)}else if(A.z>w){const o=A.z-_.z,h=(A.z-w)/o;A.lerp(_,h)}_.applyMatrix4(a),A.applyMatrix4(a),_.multiplyScalar(1/_.w),A.multiplyScalar(1/A.w),_.x*=r.x/2,_.y*=r.y/2,A.x*=r.x/2,A.y*=r.y/2,M.start.copy(_),M.start.z=0,M.end.copy(A),M.end.z=0;const g=M.closestPointToPointParameter(Z,!0);M.at(g,ge);const E=Ie.lerp(_.z,A.z,g),S=E>=-1&&E<=1,k=Z.distanceTo(ge)<F*.5;if(S&&k){M.start.fromBufferAttribute(u,d),M.end.fromBufferAttribute(p,d),M.start.applyMatrix4(f),M.end.applyMatrix4(f);const o=new O,h=new O;I.distanceSqToSegment(M.start,M.end,h,o),t.push({point:h,pointOnLine:o,distance:I.origin.distanceTo(h),object:l,face:null,faceIndex:d,uv:null,[je]:null})}}}class Ne extends Re{constructor(n=new ie,t=new re({color:Math.random()*16777215})){super(n,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){const n=this.geometry,t=n.attributes.instanceStart,a=n.attributes.instanceEnd,i=new Float32Array(2*t.count);for(let f=0,c=0,u=t.count;f<u;f++,c+=2)xe.fromBufferAttribute(t,f),ye.fromBufferAttribute(a,f),i[c]=c===0?0:i[c-1],i[c+1]=i[c]+xe.distanceTo(ye);const r=new te(i,2,1);return n.setAttribute("instanceDistanceStart",new G(r,1,0)),n.setAttribute("instanceDistanceEnd",new G(r,1,1)),this}raycast(n,t){const a=this.material.worldUnits,i=n.camera;i===null&&!a&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');const r=n.params.Line2!==void 0&&n.params.Line2.threshold||0;I=n.ray;const f=this.matrixWorld,c=this.geometry,u=this.material;F=u.linewidth+r,c.boundingSphere===null&&c.computeBoundingSphere(),Q.copy(c.boundingSphere).applyMatrix4(f);let p;if(a)p=F*.5;else{const w=Math.max(i.near,Q.distanceToPoint(I.origin));p=ve(i,w,u.resolution)}if(Q.radius+=p,I.intersectsSphere(Q)===!1)return;c.boundingBox===null&&c.computeBoundingBox(),J.copy(c.boundingBox).applyMatrix4(f);let b;if(a)b=F*.5;else{const w=Math.max(i.near,J.distanceToPoint(I.origin));b=ve(i,w,u.resolution)}J.expandByScalar(b),I.intersectsBox(J)!==!1&&(a?Qe(this,t):Ye(this,i,t))}onBeforeRender(n){const t=this.material.uniforms;t&&t.resolution&&(n.getViewport(Y),this.material.uniforms.resolution.value.set(Y.z,Y.w))}}class Ze extends Ne{constructor(n=new Ee,t=new re({color:Math.random()*16777215})){super(n,t),this.isLine2=!0,this.type="Line2"}}const et=m.forwardRef(function({children:n,follow:t=!0,lockX:a=!1,lockY:i=!1,lockZ:r=!1,...f},c){const u=m.useRef(null),p=m.useRef(null),b=new Pe;return K(({camera:w})=>{if(!t||!p.current)return;const d=u.current.rotation.clone();p.current.updateMatrix(),p.current.updateWorldMatrix(!1,!1),p.current.getWorldQuaternion(b),w.getWorldQuaternion(u.current.quaternion).premultiply(b.invert()),a&&(u.current.rotation.x=d.x),i&&(u.current.rotation.y=d.y),r&&(u.current.rotation.z=d.z)}),m.useImperativeHandle(c,()=>p.current,[]),m.createElement("group",ne({ref:p},f),m.createElement("group",{ref:u},n))}),Le=m.forwardRef(function({points:n,color:t=16777215,vertexColors:a,linewidth:i,lineWidth:r,segments:f,dashed:c,...u},p){var b,w;const d=De(S=>S.size),N=m.useMemo(()=>f?new Ne:new Ze,[f]),[j]=m.useState(()=>new re),g=(a==null||(b=a[0])==null?void 0:b.length)===4?4:3,E=m.useMemo(()=>{const S=f?new ie:new Ee,k=n.map(o=>{const h=Array.isArray(o);return o instanceof O||o instanceof H?[o.x,o.y,o.z]:o instanceof we?[o.x,o.y,0]:h&&o.length===3?[o[0],o[1],o[2]]:h&&o.length===2?[o[0],o[1],0]:o});if(S.setPositions(k.flat()),a){t=16777215;const o=a.map(h=>h instanceof Ve?h.toArray():h);S.setColors(o.flat(),g)}return S},[n,f,a,g]);return m.useLayoutEffect(()=>{N.computeLineDistances()},[n,N]),m.useLayoutEffect(()=>{c?j.defines.USE_DASH="":delete j.defines.USE_DASH,j.needsUpdate=!0},[c,j]),m.useEffect(()=>()=>{E.dispose(),j.dispose()},[E]),m.createElement("primitive",ne({object:N,ref:p},u),m.createElement("primitive",{object:E,attach:"geometry"}),m.createElement("primitive",ne({object:j,attach:"material",color:t,vertexColors:!!a,resolution:[d.width,d.height],linewidth:(w=i??r)!==null&&w!==void 0?w:1,dashed:c,transparent:g===4},u)))}),V={MIN_TOKEN_RADIUS:.6,MAX_TOKEN_RADIUS:1.3,TOKEN_RING_RADIUS:18,MAX_TOKENS:25,BUY_COLOR:"#10b981",SELL_COLOR:"#f43f5e",NEUTRAL_COLOR:"#4dabf7",WHALE_COLOR:"#4dabf7"};function tt(){const{allTrendingTokens:l,loading:n,error:t,lastUpdated:a,refresh:i}=Ae(),[r,f]=m.useState(null),[c,u]=m.useState(null),p=m.useMemo(()=>{const g=[],E=[],S=[...l].sort((x,C)=>C.activityScore-x.activityScore).slice(0,V.MAX_TOKENS);if(S.length===0)return{nodes:g,edges:E,lastUpdated:a||Date.now()};const k=S.filter(x=>x.trend==="accumulating"),o=S.filter(x=>x.trend==="distributing"),h=S.filter(x=>x.trend==="neutral"),y=Math.max(...S.map(x=>x.totalVolume),1),P=Math.max(...S.map(x=>x.activityScore),1),U=[];k.length>0&&U.push({id:"hub-accumulating",label:"Accumulation",color:V.BUY_COLOR,tokens:k,angle:-Math.PI/2,type:"buy"}),o.length>0&&U.push({id:"hub-distributing",label:"Distribution",color:V.SELL_COLOR,tokens:o,angle:Math.PI/2,type:"sell"}),h.length>0&&U.push({id:"hub-neutral",label:"Neutral Flow",color:V.NEUTRAL_COLOR,tokens:h,angle:Math.PI,type:"buy"});const q=8;if(U.forEach(x=>{const C=x.tokens.reduce((R,v)=>R+v.totalVolume,0),B=C/(y*x.tokens.length||1);g.push({id:x.id,type:"whale",position:[Math.cos(x.angle)*q,0,Math.sin(x.angle)*q],velocity:[0,0,0],radius:.6+B*.4,color:x.color,emissiveIntensity:.8,data:{address:x.id,symbol:x.label.slice(0,4).toUpperCase(),name:x.label,totalVolume:C}})}),U.forEach(x=>{const C=x.tokens.length,B=x.angle,R=Math.PI*.8;x.tokens.forEach((v,L)=>{const D=v.totalVolume/y,W=v.activityScore/P,$=V.MIN_TOKEN_RADIUS+W*(V.MAX_TOKEN_RADIUS-V.MIN_TOKEN_RADIUS),ae=B+(L/Math.max(C-1,1)-.5)*R,le=V.TOKEN_RING_RADIUS,_e=(L%3-1)*2,ce=`token-${v.tokenAddress}`;g.push({id:ce,type:"token",position:[Math.cos(ae)*le,_e,Math.sin(ae)*le],velocity:[0,0,0],radius:$,color:x.color,emissiveIntensity:.5+W*.5,data:{address:v.tokenAddress,symbol:v.tokenSymbol,name:v.tokenName,logo:v.tokenLogo,totalVolume:v.totalVolume,buyVolume:v.buyVolume,sellVolume:v.sellVolume,netFlow:v.netFlow,price:v.price,marketCap:v.marketCap,liquidity:v.liquidity,priceChangeH1:v.priceChangeH1,priceChangeH24:v.priceChangeH24,activityScore:v.activityScore,trend:v.trend,buyCount:v.buyCount,sellCount:v.sellCount,buyRatio:v.buyRatio}}),E.push({id:`edge-${x.id}-${v.tokenAddress}`,source:x.id,target:ce,weight:.3+D*.7,color:x.color,flowSpeed:.3+W*.5,type:x.type,amountUSD:v.totalVolume,timestamp:v.fetchedAt})})}),U.length>1)for(let x=0;x<U.length;x++)for(let C=x+1;C<U.length;C++){const B=U[x],R=U[C],v=B.tokens.reduce((W,$)=>W+$.sellVolume,0),L=R.tokens.reduce((W,$)=>W+$.sellVolume,0),D=v+L;D>0&&E.push({id:`edge-${B.id}-${R.id}`,source:B.id,target:R.id,weight:.2+D/y*.3,color:V.WHALE_COLOR,flowSpeed:.2,type:v>L?"sell":"buy",amountUSD:D,timestamp:Date.now()})}return{nodes:g,edges:E,lastUpdated:a||Date.now()}},[l,a]),b=m.useCallback(g=>{f(g)},[]),w=m.useCallback(g=>{u(g)},[]),d=m.useMemo(()=>r&&p.nodes.find(g=>g.id===r)||null,[r,p.nodes]),N=m.useMemo(()=>r?p.edges.filter(g=>g.source===r||g.target===r):[],[r,p.edges]),j=m.useMemo(()=>{const g=p.nodes.filter(o=>o.type==="whale"),E=p.nodes.filter(o=>o.type==="token");let S=0,k=0;for(const o of l)S+=o.buyVolume,k+=o.sellVolume;return{whaleCount:g.length,tokenCount:E.length,edgeCount:p.edges.length,totalBuyVolume:S,totalSellVolume:k,netFlow:S-k}},[p,l]);return{nodes:p.nodes,edges:p.edges,selectedNodeId:r,selectedNode:d,selectedNodeEdges:N,hoveredNodeId:c,selectNode:b,hoverNode:w,refresh:i,stats:j,loading:n,error:t,lastUpdated:p.lastUpdated}}const nt={buyPrimary:"#10B981"},s={bgDark:"#0b1016",whaleCore:"#4dabf7",whaleGlow:"#74c0fc",tokenBuy:"#10b981",tokenSell:"#f43f5e",lineBuy:"#10b981",lineSell:"#f43f5e",labelBg:"rgba(15, 23, 42, 0.75)",labelBorder:"rgba(100, 116, 139, 0.3)",textPrimary:"#f1f5f9",textSecondary:"#94a3b8"},ft=()=>{const{nodes:l,edges:n,selectedNodeId:t,selectedNodeEdges:a,hoveredNodeId:i,selectNode:r,hoverNode:f,refresh:c,stats:u,loading:p,lastUpdated:b}=tt(),[w]=m.useState([0,15,35]),d=t||i,N=m.useCallback(o=>{r(t===o?null:o)},[t,r]),j=m.useMemo(()=>{if(!d)return new Set;const o=new Set([d]);return n.forEach(h=>{h.source===d?o.add(h.target):h.target===d&&o.add(h.source)}),o},[d,n]),g=m.useCallback(o=>d?!j.has(o):!1,[d,j]),E=m.useCallback(o=>d?o.source!==d&&o.target!==d:!1,[d]),S=o=>o>=1e6?`$${(o/1e6).toFixed(2)}M`:o>=1e3?`$${(o/1e3).toFixed(1)}K`:`$${o.toFixed(0)}`,k=o=>{if(!o)return"Never";const h=Math.floor((Date.now()-o)/1e3);return h<60?`${h}s ago`:h<3600?`${Math.floor(h/60)}m ago`:`${Math.floor(h/3600)}h ago`};return p&&l.length===0?e.jsx("div",{className:"w-full h-full flex items-center justify-center",style:{background:s.bgDark},children:e.jsxs("div",{className:"text-center",children:[e.jsx(Me,{className:"w-8 h-8 animate-spin mx-auto mb-3",style:{color:s.whaleCore}}),e.jsx("p",{className:"text-slate-500 text-xs font-mono",children:"INITIALIZING NEXUS..."})]})}):e.jsxs("div",{className:"w-full h-full relative overflow-hidden",children:[e.jsx(We,{flat:!0,dpr:[1,2],gl:{antialias:!0,alpha:!1,powerPreference:"high-performance",toneMapping:Fe,toneMappingExposure:1.2},children:e.jsxs(m.Suspense,{fallback:null,children:[e.jsx("color",{attach:"background",args:[s.bgDark]}),e.jsx("fog",{attach:"fog",args:[s.bgDark,50,120]}),e.jsx(Ge,{makeDefault:!0,position:w,fov:45,near:.1,far:200}),e.jsx(He,{enablePan:!0,enableZoom:!0,enableRotate:!0,minDistance:15,maxDistance:80,autoRotate:!t,autoRotateSpeed:.08,maxPolarAngle:Math.PI*.75,minPolarAngle:Math.PI*.25}),e.jsx("ambientLight",{intensity:.15}),e.jsx("directionalLight",{position:[10,20,10],intensity:.4,color:"#ffffff"}),e.jsx("pointLight",{position:[-15,10,-15],intensity:.2,color:s.whaleCore,distance:50}),e.jsx(st,{}),e.jsx(ot,{}),n.map(o=>{const h=l.find(P=>P.id===o.source),y=l.find(P=>P.id===o.target);return!h||!y?null:e.jsx(at,{edge:o,sourceNode:h,targetNode:y,isDimmed:E(o),isHighlighted:d?!E(o):!1},o.id)}),l.filter(o=>o.type==="whale").map(o=>e.jsx(it,{node:o,isSelected:t===o.id,isHovered:i===o.id,isDimmed:g(o.id),onClick:()=>N(o.id),onHover:h=>f(h?o.id:null)},o.id)),l.filter(o=>o.type==="token").map(o=>e.jsx(rt,{node:o,isSelected:t===o.id,isHovered:i===o.id,isDimmed:g(o.id),onClick:()=>N(o.id),onHover:h=>f(h?o.id:null)},o.id)),e.jsxs($e,{children:[e.jsx(Ke,{luminanceThreshold:1.2,luminanceSmoothing:.9,intensity:.6,mipmapBlur:!0}),e.jsx(qe,{opacity:.02}),e.jsx(Xe,{eskil:!1,offset:.1,darkness:.5})]})]})}),e.jsxs("div",{className:"absolute top-4 left-4 rounded-lg p-4 min-w-[200px]",style:{background:s.labelBg,backdropFilter:"blur(12px)",border:`1px solid ${s.labelBorder}`},children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsxs("h3",{className:"text-xs font-mono font-semibold tracking-wider flex items-center gap-2",style:{color:s.textPrimary},children:["WHALE NEXUS",e.jsx("span",{className:"text-[8px] px-1.5 py-0.5 rounded",style:{backgroundColor:"rgba(251, 191, 36, 0.2)",color:"#fbbf24"},children:"BETA"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("div",{className:"w-1.5 h-1.5 rounded-full animate-pulse",style:{backgroundColor:s.tokenBuy}}),e.jsx("span",{className:"text-[9px] font-mono",style:{color:s.tokenBuy},children:"LIVE"})]})]}),e.jsxs("div",{className:"space-y-2 text-[10px] font-mono",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{style:{color:s.textSecondary},children:"WALLETS"}),e.jsx("span",{style:{color:s.whaleCore},children:u.whaleCount})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{style:{color:s.textSecondary},children:"TOKENS"}),e.jsx("span",{style:{color:s.textPrimary},children:u.tokenCount})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{style:{color:s.textSecondary},children:"FLOWS"}),e.jsx("span",{style:{color:s.textSecondary},children:u.edgeCount})]}),e.jsx("div",{className:"border-t my-2",style:{borderColor:s.labelBorder}}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(de,{size:10,style:{color:s.tokenBuy}}),e.jsx("span",{style:{color:s.textSecondary},children:"IN"})]}),e.jsx("span",{style:{color:s.tokenBuy},children:S(u.totalBuyVolume)})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(ue,{size:10,style:{color:s.tokenSell}}),e.jsx("span",{style:{color:s.textSecondary},children:"OUT"})]}),e.jsx("span",{style:{color:s.tokenSell},children:S(u.totalSellVolume)})]}),e.jsxs("div",{className:"flex justify-between items-center p-1.5 rounded mt-1",style:{background:u.netFlow>=0?`${s.tokenBuy}15`:`${s.tokenSell}15`},children:[e.jsx("span",{style:{color:s.textSecondary},children:"NET"}),e.jsxs("span",{style:{color:u.netFlow>=0?s.tokenBuy:s.tokenSell},children:[u.netFlow>=0?"+":"",S(u.netFlow)]})]})]}),e.jsx("div",{className:"text-[8px] mt-2 font-mono",style:{color:s.textSecondary},children:k(b)})]}),e.jsx("button",{onClick:()=>c(),className:"absolute top-4 right-4 p-2 rounded-lg transition-all",style:{background:s.labelBg,backdropFilter:"blur(12px)",border:`1px solid ${s.labelBorder}`},children:e.jsx(Be,{size:14,className:p?"animate-spin":"",style:{color:s.textSecondary}})}),t&&(()=>{var v;const o=l.find(L=>L.id===t);if(!o)return null;const h=o.type==="whale",y=o.data,P=a||[],U=P.filter(L=>L.type==="buy"),q=P.filter(L=>L.type==="sell"),x=U.reduce((L,D)=>L+D.amountUSD,0),C=q.reduce((L,D)=>L+D.amountUSD,0),B=x-C,R=new Set;return P.forEach(L=>{L.source!==t&&R.add(L.source),L.target!==t&&R.add(L.target)}),e.jsxs("div",{className:"absolute bottom-4 right-4 rounded-lg p-4 min-w-[280px] max-w-[320px] z-50",style:{background:s.labelBg,backdropFilter:"blur(16px)",border:`1px solid ${s.labelBorder}`,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"},children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[!h&&y.logo?e.jsx("img",{src:y.logo,alt:y.symbol,className:"w-10 h-10 rounded-full",style:{border:`2px solid ${o.color}`}}):e.jsx("div",{className:"w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",style:{background:`${o.color}20`,border:`2px solid ${o.color}`,color:o.color},children:h?"🐋":(v=y.symbol)==null?void 0:v.slice(0,2)}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-mono font-semibold",style:{color:s.textPrimary},children:h?y.label||"Unknown Wallet":y.symbol||"Token"}),e.jsx("span",{className:"text-[9px] font-mono px-2 py-0.5 rounded inline-block mt-1",style:{backgroundColor:`${o.color}20`,color:o.color},children:h?y.category||"Whale":"TOKEN"})]})]}),e.jsx("button",{onClick:()=>r(null),className:"p-1.5 rounded hover:bg-white/10 transition-all",style:{color:s.textSecondary,border:`1px solid ${s.labelBorder}`},children:e.jsx(Ce,{size:14})})]}),!h&&e.jsxs("div",{className:"space-y-3",children:[y.name&&e.jsx("div",{className:"text-[11px] font-mono",style:{color:s.textSecondary},children:y.name}),e.jsxs("div",{className:"p-3 rounded-lg space-y-2",style:{background:"rgba(0,0,0,0.3)"},children:[e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"TOTAL VOLUME"}),e.jsx("span",{className:"font-semibold",style:{color:s.textPrimary},children:S(y.totalVolume||0)})]}),e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(de,{size:10,style:{color:s.tokenBuy}}),e.jsx("span",{style:{color:s.textSecondary},children:"BUY VOL"})]}),e.jsx("span",{style:{color:s.tokenBuy},children:S(x)})]}),e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(ue,{size:10,style:{color:s.tokenSell}}),e.jsx("span",{style:{color:s.textSecondary},children:"SELL VOL"})]}),e.jsx("span",{style:{color:s.tokenSell},children:S(C)})]}),e.jsx("div",{className:"border-t pt-2 mt-2",style:{borderColor:s.labelBorder},children:e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"NET FLOW"}),e.jsxs("span",{className:"font-bold",style:{color:B>=0?s.tokenBuy:s.tokenSell},children:[B>=0?"+":"",S(B)]})]})})]}),e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"WHALE TRADERS"}),e.jsx("span",{style:{color:s.whaleCore},children:R.size})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[10px] font-mono",children:[e.jsx("div",{className:"w-2 h-2 rounded-full animate-pulse",style:{backgroundColor:B>=0?s.tokenBuy:s.tokenSell}}),e.jsx("span",{style:{color:s.textSecondary},children:B>=0?"Accumulation detected":"Distribution detected"})]})]}),h&&e.jsxs("div",{className:"space-y-3",children:[e.jsx("div",{className:"px-2 py-2 rounded text-[9px] font-mono",style:{color:s.textSecondary,backgroundColor:"rgba(0,0,0,0.3)",wordBreak:"break-all"},children:y.address}),e.jsxs("div",{className:"p-3 rounded-lg space-y-2",style:{background:"rgba(0,0,0,0.3)"},children:[y.winRate!==void 0&&e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"WIN RATE"}),e.jsxs("span",{style:{color:y.winRate>=60?s.tokenBuy:y.winRate>=40?s.textPrimary:s.tokenSell},children:[y.winRate.toFixed(1),"%"]})]}),y.avgROI!==void 0&&e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"AVG ROI"}),e.jsxs("span",{style:{color:y.avgROI>=0?s.tokenBuy:s.tokenSell},children:[y.avgROI>=0?"+":"",y.avgROI.toFixed(1),"%"]})]}),y.totalTrades!==void 0&&e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"TOTAL TRADES"}),e.jsx("span",{style:{color:s.textPrimary},children:y.totalTrades})]}),e.jsx("div",{className:"border-t pt-2 mt-2",style:{borderColor:s.labelBorder},children:e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"NET FLOW"}),e.jsxs("span",{className:"font-bold",style:{color:B>=0?s.tokenBuy:s.tokenSell},children:[B>=0?"+":"",S(B)]})]})})]}),e.jsxs("div",{className:"flex justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"TOKENS TRADED"}),e.jsx("span",{style:{color:s.whaleCore},children:R.size})]}),y.riskLevel&&e.jsxs("div",{className:"flex items-center justify-between text-[10px] font-mono",children:[e.jsx("span",{style:{color:s.textSecondary},children:"RISK LEVEL"}),e.jsx("span",{className:"px-2 py-0.5 rounded",style:{backgroundColor:y.riskLevel==="low"?`${s.tokenBuy}20`:y.riskLevel==="medium"?"rgba(251, 191, 36, 0.2)":`${s.tokenSell}20`,color:y.riskLevel==="low"?s.tokenBuy:y.riskLevel==="medium"?"#fbbf24":s.tokenSell},children:y.riskLevel.toUpperCase()})]}),e.jsxs("div",{className:"flex items-center gap-2 text-[10px] font-mono",children:[e.jsx("div",{className:"w-2 h-2 rounded-full",style:{backgroundColor:y.isActive?s.tokenBuy:s.textSecondary,animation:y.isActive?"pulse 2s infinite":"none"}}),e.jsx("span",{style:{color:s.textSecondary},children:y.isActive?"Active trader":"Inactive"})]})]})]})})(),l.length>0&&!t&&e.jsx("div",{className:"absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none",children:e.jsx("p",{className:"text-[10px] font-mono px-3 py-1.5 rounded",style:{background:s.labelBg,color:s.textSecondary,border:`1px solid ${s.labelBorder}`},children:"HOVER TO FOCUS • CLICK TO SELECT • SCROLL TO ZOOM"})})]})},st=()=>{const l=m.useRef(null),n=m.useMemo(()=>{const t=[];for(let f=-40/2;f<=40/2;f++){const c=f*2;t.push([[-80/2,0,c],[80/2,0,c]]),t.push([[c,0,-80/2],[c,0,80/2]])}return t},[]);return e.jsx("group",{ref:l,position:[0,-8,0],children:n.map((t,a)=>{const i=Math.abs(t[0][0])||Math.abs(t[0][2]),r=Math.max(.02,.08-i/500);return e.jsx(Le,{points:t,color:"#1e3a5f",lineWidth:.5,transparent:!0,opacity:r},a)})})},ot=()=>{const l=m.useRef(null),n=200,t=m.useMemo(()=>{const a=new Float32Array(n*3);for(let i=0;i<n;i++)a[i*3]=(Math.random()-.5)*100,a[i*3+1]=(Math.random()-.5)*50,a[i*3+2]=(Math.random()-.5)*100;return a},[]);return K(a=>{l.current&&(l.current.rotation.y=a.clock.elapsedTime*.01)}),e.jsxs("points",{ref:l,children:[e.jsx("bufferGeometry",{children:e.jsx("bufferAttribute",{attach:"attributes-position",count:n,array:t,itemSize:3})}),e.jsx("pointsMaterial",{color:"#4dabf7",size:.08,transparent:!0,opacity:.3,sizeAttenuation:!0,depthWrite:!1})]})},it=({node:l,isSelected:n,isHovered:t,isDimmed:a,onClick:i,onHover:r})=>{const f=m.useRef(null),c=m.useRef(null),u=m.useRef(null),p=l.data,b=p.label||"Unknown",w=p.category||"Whale",d=a?.1:1,N=n?1.15:t?1.08:1;return K(j=>{c.current&&(c.current.rotation.y+=.003,c.current.rotation.x=Math.sin(j.clock.elapsedTime*.2)*.1),u.current&&(u.current.rotation.z+=.008),f.current&&(f.current.position.y=l.position[1]+Math.sin(j.clock.elapsedTime*.4+l.position[0])*.08)}),e.jsxs("group",{ref:f,position:l.position,scale:N,children:[e.jsxs("mesh",{onClick:j=>{j.stopPropagation(),i()},onPointerOver:j=>{j.stopPropagation(),document.body.style.cursor="pointer",r(!0)},onPointerOut:()=>{document.body.style.cursor="default",r(!1)},children:[e.jsx("sphereGeometry",{args:[l.radius*1.8,16,16]}),e.jsx("meshBasicMaterial",{transparent:!0,opacity:0,depthWrite:!1})]}),e.jsxs("mesh",{ref:c,children:[e.jsx("icosahedronGeometry",{args:[l.radius*.9,0]}),e.jsx("meshPhysicalMaterial",{color:s.whaleCore,transmission:.6,roughness:.2,metalness:.8,thickness:.5,transparent:!0,opacity:d*.9,envMapIntensity:1})]}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[l.radius*.3,16,16]}),e.jsx("meshBasicMaterial",{color:s.whaleGlow,transparent:!0,opacity:d*.8})]}),e.jsxs("mesh",{ref:u,rotation:[Math.PI/2,0,0],children:[e.jsx("torusGeometry",{args:[l.radius*1.3,.015,8,64]}),e.jsx("meshBasicMaterial",{color:s.whaleCore,transparent:!0,opacity:d*.5})]}),e.jsxs("mesh",{rotation:[Math.PI/3,Math.PI/4,0],children:[e.jsx("torusGeometry",{args:[l.radius*1.2,.01,8,64]}),e.jsx("meshBasicMaterial",{color:s.whaleGlow,transparent:!0,opacity:d*.3})]}),!a&&e.jsx(se,{position:[0,l.radius+.6,0],center:!0,distanceFactor:15,style:{pointerEvents:"none"},children:e.jsxs("div",{style:{background:s.labelBg,backdropFilter:"blur(8px)",border:`1px solid ${s.labelBorder}`,borderRadius:"4px",padding:"4px 8px",whiteSpace:"nowrap",opacity:t||n?1:.8},children:[e.jsx("div",{style:{color:s.textPrimary,fontSize:"10px",fontFamily:"JetBrains Mono, monospace",fontWeight:600},children:lt(w)}),(t||n)&&e.jsx("div",{style:{color:s.textSecondary,fontSize:"9px",fontFamily:"JetBrains Mono, monospace",marginTop:"2px",maxWidth:"100px",overflow:"hidden",textOverflow:"ellipsis"},children:b.toUpperCase()})]})})]})},rt=({node:l,isSelected:n,isHovered:t,isDimmed:a,onClick:i,onHover:r})=>{const f=m.useRef(null),c=m.useRef(null),u=l.data,p=u.symbol||"?",b=u.logo,d=l.color===nt.buyPrimary?s.tokenBuy:s.tokenSell,N=a?.1:1,j=n?1.2:t?1.1:1,g=l.radius*1.2;return K(E=>{f.current&&(f.current.position.y=l.position[1]+Math.sin(E.clock.elapsedTime*.6+l.position[0]*2)*.06),c.current&&(c.current.rotation.z+=.01)}),e.jsxs("group",{ref:f,position:l.position,scale:j,children:[e.jsxs("mesh",{onClick:E=>{E.stopPropagation(),i()},onPointerOver:E=>{E.stopPropagation(),document.body.style.cursor="pointer",r(!0)},onPointerOut:()=>{document.body.style.cursor="default",r(!1)},children:[e.jsx("sphereGeometry",{args:[g*1.5,16,16]}),e.jsx("meshBasicMaterial",{transparent:!0,opacity:0,depthWrite:!1})]}),e.jsxs("mesh",{ref:c,rotation:[Math.PI/2,0,0],children:[e.jsx("torusGeometry",{args:[g*.9,.02,8,48]}),e.jsx("meshBasicMaterial",{color:d,transparent:!0,opacity:N*.9})]}),e.jsxs("mesh",{rotation:[Math.PI/2,0,0],children:[e.jsx("torusGeometry",{args:[g*.9,.05,8,48]}),e.jsx("meshBasicMaterial",{color:d,transparent:!0,opacity:N*.3})]}),e.jsxs(et,{follow:!0,children:[e.jsxs("mesh",{position:[0,0,-.01],children:[e.jsx("circleGeometry",{args:[g*.7,32]}),e.jsx("meshBasicMaterial",{color:"#0f172a",transparent:!0,opacity:N*.95})]}),e.jsx(se,{center:!0,distanceFactor:10,style:{pointerEvents:"none"},children:e.jsx("div",{style:{width:`${g*40}px`,height:`${g*40}px`,borderRadius:"50%",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#0f172a",border:`1px solid ${d}50`,opacity:N},children:b?e.jsx("img",{src:b,alt:p,style:{width:"70%",height:"70%",objectFit:"contain"},onError:E=>{E.target.style.display="none"}}):e.jsx("span",{style:{color:d,fontSize:`${g*12}px`,fontWeight:"bold",fontFamily:"JetBrains Mono, monospace"},children:p.slice(0,3).toUpperCase()})})})]}),e.jsxs("mesh",{children:[e.jsx("sphereGeometry",{args:[g*.15,8,8]}),e.jsx("meshBasicMaterial",{color:d,transparent:!0,opacity:N*.9})]}),!a&&e.jsx(se,{position:[0,g+.4,0],center:!0,distanceFactor:15,style:{pointerEvents:"none"},children:e.jsxs("div",{style:{background:s.labelBg,backdropFilter:"blur(8px)",border:`1px solid ${s.labelBorder}`,borderRadius:"4px",padding:"3px 8px",whiteSpace:"nowrap",opacity:t||n?1:.85},children:[e.jsx("div",{style:{color:s.textPrimary,fontSize:"10px",fontFamily:"JetBrains Mono, monospace",fontWeight:600},children:p.toUpperCase()}),(t||n)&&u.totalVolume&&e.jsx("div",{style:{color:d,fontSize:"9px",fontFamily:"JetBrains Mono, monospace",marginTop:"2px"},children:ct(u.totalVolume)})]})})]})},at=({edge:l,sourceNode:n,targetNode:t,isDimmed:a,isHighlighted:i})=>{const r=m.useRef(null),f=m.useRef(Math.random()),u=l.type==="buy"?s.lineBuy:s.lineSell,p=a?.05:i?.6:.25,b=m.useMemo(()=>{const d=new O(...n.position),N=new O(...t.position),j=new O().addVectors(d,N).multiplyScalar(.5);return j.y+=d.distanceTo(N)*.15,new Je(d,j,N)},[n.position,t.position]),w=m.useMemo(()=>b.getPoints(50),[b]);return K(()=>{if(!r.current||a)return;f.current=(f.current+l.flowSpeed*.003)%1;const d=b.getPoint(f.current);r.current.position.copy(d)}),e.jsxs("group",{children:[e.jsx(Le,{points:w,color:u,lineWidth:a?.5:i?1.5:1,transparent:!0,opacity:p}),!a&&e.jsxs("mesh",{ref:r,children:[e.jsx("sphereGeometry",{args:[i?.08:.05,8,8]}),e.jsx("meshBasicMaterial",{color:"#ffffff",transparent:!0,opacity:i?1:.8})]})]})};function lt(l){return{VC:"VC",Whale:"WHL","Early Adopter":"EA",Influencer:"INF","DEX Trader":"DEX","Sniper Bot":"BOT",Insider:"INS"}[l]||"WHL"}function ct(l){return l>=1e6?`$${(l/1e6).toFixed(1)}M`:l>=1e3?`$${(l/1e3).toFixed(1)}K`:`$${l.toFixed(0)}`}export{ft as default};
