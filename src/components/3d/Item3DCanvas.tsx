'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface Item3DCanvasProps {
  category: 'clothing' | 'watch' | 'home' | string;
}

function ItemMesh({ category }: { category: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  if (category === 'watch') {
    return (
      <group>
        <mesh ref={meshRef}>
          <torusGeometry args={[0.9, 0.25, 16, 32]} />
          <meshStandardMaterial color="#EAB308" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
          <meshStandardMaterial color="#0F172A" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (category === 'home') {
    return (
      <group ref={meshRef}>
        <RoundedBox args={[1.2, 1, 1.2]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#0284C7" metalness={0.3} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[1.1, 0.8, 4]} />
          <meshStandardMaterial color="#EAB308" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#A855F7"
          speed={3}
          distort={0.25}
          metalness={0.8}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export default function Item3DCanvas({ category }: Item3DCanvasProps) {
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-white rounded-xl overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{
          alpha: false,
          antialias: true,
          powerPreference: 'low-power',
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
          });
        }}
      >
        {/* Set Three.js Scene Background explicitly to Pure White */}
        <color attach="background" args={['#ffffff']} />

        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} />
        <pointLight position={[-3, -3, -3]} color="#EAB308" intensity={1} />
        <ItemMesh category={category} />
      </Canvas>
    </div>
  );
}