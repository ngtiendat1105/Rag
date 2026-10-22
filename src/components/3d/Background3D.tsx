'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#0a0a1a']} />
        
        {/* Ambient and point lights for futuristic effect */}
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#9d00ff" />
        
        {/* Simple rotating cube */}
        <Suspense fallback={null}>
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial 
              color="#0084e6" 
              emissive="#0084e6"
              emissiveIntensity={0.2}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </Suspense>
      </Canvas>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg/80 to-dark-bg" />
    </div>
  )
}