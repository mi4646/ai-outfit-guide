import { ContactShadows } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import {
  NeutralToneMapping,
  PMREMGenerator,
  SRGBColorSpace,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Figure, type FigureProps } from './Figure'

function Studio() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const texture = pmrem.fromScene(room, 0.04).texture
    scene.environment = texture
    scene.environmentIntensity = 0.28
    return () => {
      scene.environment = null
      texture.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return (
    <>
      <hemisphereLight args={[0xfff5e6, 0x8a7a68, 0.65]} />
      <directionalLight
        position={[2.4, 4.6, 3.0]}
        intensity={2.35}
        color={0xfff0dc}
      />
      <directionalLight
        position={[-3.2, 2.2, 2.4]}
        intensity={0.6}
        color={0xdfe8f5}
      />
      <directionalLight
        position={[0.4, 3.4, -3.2]}
        intensity={1.0}
        color={0xffd8bd}
      />
    </>
  )
}

export default function Mannequin3D(props: FigureProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0.38, 1.1, 4.15], fov: 30 }}
      frameloop="demand"
      style={{ touchAction: 'pan-y' }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = NeutralToneMapping
        gl.toneMappingExposure = 1
        gl.outputColorSpace = SRGBColorSpace
        camera.lookAt(0, 1.0, 0)
      }}
    >
      <Studio />
      <Figure {...props} />
      <ContactShadows
        key={props.season}
        position={[0, 0.002, 0.08]}
        opacity={0.5}
        scale={1.4}
        blur={2.6}
        far={1.4}
        frames={1}
        color="#000000"
      />
    </Canvas>
  )
}
