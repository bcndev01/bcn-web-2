import React from 'react';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';

// =============================================
// Post Processing Effects - Cinematic Sci-Fi
// Clean bloom + lens effects for pro look
// =============================================

interface PostProcessingProps {
  enableBloom?: boolean;
  bloomIntensity?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  enableVignette?: boolean;
  vignetteIntensity?: number;
  enableChroma?: boolean;
  chromaOffset?: number;
  enableNoise?: boolean;
  noiseOpacity?: number;
}

export const CryptoPostProcessing: React.FC<PostProcessingProps> = ({
  enableBloom = true,
  bloomIntensity = 0.8,
  bloomThreshold = 1.0,
  bloomRadius = 0.6,
  enableVignette = true,
  vignetteIntensity = 0.4,
  enableChroma = false,
  chromaOffset = 0.001,
  enableNoise = false,
  noiseOpacity = 0.03,
}) => {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      {/* Clean Bloom - only bright emissive objects glow */}
      {enableBloom && (
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={bloomRadius}
        />
      )}

      {/* Chromatic Aberration - subtle RGB shift for lens effect */}
      {enableChroma && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(chromaOffset, chromaOffset)}
        />
      )}

      {/* Noise - subtle film grain for cinematic feel */}
      {enableNoise && (
        <Noise
          opacity={noiseOpacity}
          blendFunction={BlendFunction.OVERLAY}
        />
      )}

      {/* Vignette - darkens edges for cinematic feel */}
      {enableVignette && (
        <Vignette
          offset={0.3}
          darkness={vignetteIntensity}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  );
};

// =============================================
// Preset Configurations - Cinematic Sci-Fi
// Threshold 1.0+ = only emissive objects glow
// =============================================

// Whale Nexus - Pro cinematic look with lens effects
// ChromaOffset düşürüldü: 0.0015 → 0.0003 (netlik için)
export const NexusEffects: React.FC = () => (
  <CryptoPostProcessing
    bloomIntensity={1.2}
    bloomThreshold={0.9}
    bloomRadius={0.75}
    vignetteIntensity={0.55}
    enableChroma={true}
    chromaOffset={0.0003}
    enableNoise={true}
    noiseOpacity={0.03}
  />
);

// Matrix-style for Live Sniper Tunnel
export const TunnelEffects: React.FC = () => (
  <CryptoPostProcessing
    bloomIntensity={1.2}
    bloomThreshold={1.0}
    bloomRadius={0.8}
    vignetteIntensity={0.5}
  />
);

// Subtle for Galaxy view
export const GalaxyEffects: React.FC = () => (
  <CryptoPostProcessing
    bloomIntensity={0.8}
    bloomThreshold={1.2}
    bloomRadius={0.6}
    vignetteIntensity={0.35}
  />
);

// Performance mode - minimal effects
export const LiteEffects: React.FC = () => (
  <CryptoPostProcessing
    bloomIntensity={0.5}
    bloomThreshold={1.5}
    bloomRadius={0.4}
    enableVignette={false}
  />
);

// Professional Intelligence Dashboard - subtle, clean
export const ProNexusEffects: React.FC = () => (
  <CryptoPostProcessing
    bloomIntensity={0.6}
    bloomThreshold={1.2}
    bloomRadius={0.5}
    vignetteIntensity={0.35}
    enableChroma={false}
    enableNoise={false}
  />
);

export default CryptoPostProcessing;
