'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import '../../lib/suppressThreeWarnings';

export default function PedestalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });

    renderer.setSize(260, 260);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.set(3, 3, 5);
    camera.lookAt(0, 0, 0);

    // Metallic Gold Pedestal Base
    const pedestalGeo = new THREE.CylinderGeometry(1.4, 1.7, 0.4, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.25,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    scene.add(pedestal);

    // Floating Crystal Item Symbolizing Store Level
    const itemGeo = new THREE.OctahedronGeometry(0.85, 0);
    const itemMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
    });
    const crystal = new THREE.Mesh(itemGeo, itemMat);
    crystal.position.y = 1.2;
    scene.add(crystal);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // GSAP Floating Animation Loop
    const floatAnimation = gsap.to(crystal.position, {
      y: 1.4,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    let animationFrameId: number;
    const renderLoop = () => {
      crystal.rotation.y += 0.012;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    // Clean up resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      floatAnimation.kill();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      itemGeo.dispose();
      itemMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="rounded-3xl shadow-2xl mx-auto" />;
}