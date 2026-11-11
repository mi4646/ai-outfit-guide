import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ColorEntry } from '../../data/colors'
import type { Season } from '../../data/regions'
import type { Gender } from '../../lib/recommend'
import { REGIONS, type MannequinRegion } from '../mannequin/figures'
import { sceneFor, type OutfitSpec } from './scene'

type Vec3 = readonly [number, number, number?]

const PLACEHOLDER = '#b9b0a3'
const ACTIVE_COLOR = '#b5432f'

export interface FigureProps {
  gender: Gender
  season: Season
  colors: Partial<Record<MannequinRegion, ColorEntry>>
  activeRegion?: MannequinRegion | null
  onRegionChange?: (region: MannequinRegion | null) => void
}

interface Materials {
  body: THREE.MeshPhysicalMaterial
  inner: THREE.MeshPhysicalMaterial
  top: THREE.MeshPhysicalMaterial
  pants: THREE.MeshPhysicalMaterial
  shoes: THREE.MeshPhysicalMaterial
  accent: THREE.MeshPhysicalMaterial
  seam: THREE.MeshStandardMaterial
  sole: THREE.MeshStandardMaterial
}

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z)

function taperedBetween(
  a: Vec3,
  b: Vec3,
  r1: number,
  r2: number,
  material: THREE.Material,
  segments = 16,
) {
  const start = V(...a)
  const end = V(...b)
  const dir = end.clone().sub(start)
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(r2, r1, dir.length(), segments, 1, false),
    material,
  )
  mesh.position.copy(start).add(end).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize())
  return mesh
}

function ball(
  position: Vec3,
  radius: number,
  material: THREE.Material,
  scale: Vec3 = [1, 1, 1],
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 20), material)
  mesh.position.copy(V(...position))
  mesh.scale.set(...scale)
  return mesh
}

function tubeY(
  position: Vec3,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  material: THREE.Material,
  scaleZ = 1,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 30, 1, false),
    material,
  )
  mesh.position.copy(V(...position))
  mesh.scale.z = scaleZ
  return mesh
}

function lathe(
  profile: ReadonlyArray<readonly [number, number]>,
  material: THREE.Material,
  scaleZ = 1,
) {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y))
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 40), material)
  mesh.scale.z = scaleZ
  return mesh
}

function legTube(
  points: readonly Vec3[],
  radius: number,
  material: THREE.Material,
) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => V(...point)))
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, radius, 14, false),
    material,
  )
}

function markGroup<T extends THREE.Object3D>(
  object: T,
  region: MannequinRegion,
): T {
  object.userData.region = region
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) child.userData.region = region
  })
  return object
}

function makeNoiseTexture() {
  if (typeof document === 'undefined') return null
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const image = ctx.createImageData(size, size)
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 110 + Math.random() * 80
    image.data[i] = value
    image.data[i + 1] = value
    image.data[i + 2] = value
    image.data[i + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

let noiseTexture: THREE.Texture | null = null
let noiseReady = false

function getNoiseTexture() {
  if (!noiseReady) {
    noiseTexture = makeNoiseTexture()
    noiseReady = true
  }
  return noiseTexture
}

function createMaterials(): Materials {
  const noise = getNoiseTexture()
  const garment = (hex: string) =>
    new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: 0.68,
      metalness: 0,
      sheen: 0.08,
      sheenColor: new THREE.Color(0xffffff),
      sheenRoughness: 0.8,
      bumpMap: noise,
      bumpScale: noise ? 0.004 : 0,
    })

  return {
    body: new THREE.MeshPhysicalMaterial({
      color: 0xd8b49c,
      roughness: 0.54,
      metalness: 0,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xffffff),
      clearcoat: 0.06,
      clearcoatRoughness: 0.6,
      bumpMap: noise,
      bumpScale: noise ? 0.0018 : 0,
    }),
    inner: garment(PLACEHOLDER),
    top: garment(PLACEHOLDER),
    pants: garment(PLACEHOLDER),
    shoes: garment(PLACEHOLDER),
    accent: garment(PLACEHOLDER),
    seam: new THREE.MeshStandardMaterial({ color: 0x2a2522, roughness: 0.9 }),
    sole: new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.9 }),
  }
}

function buildFigure(spec: OutfitSpec, mats: Materials, gender: Gender) {
  const group = new THREE.Group()
  group.scale.set(gender === 'male' ? 1.035 : 0.985, 1, 1)
  group.rotation.y = -0.08

  // body
  group.add(lathe([
    [0.145, 0.96], [0.14, 1.04], [0.115, 1.16], [0.125, 1.26],
    [0.155, 1.38], [0.175, 1.48], [0.16, 1.54], [0.07, 1.58], [0.05, 1.64],
  ], mats.body, 0.62))
  group.add(ball([0, 0.98, 0], 0.142, mats.body, [1, 0.55, 0.7]))
  const head = ball([0, 1.82, 0], 0.1, mats.body, [0.92, 1.15, 0.88])
  head.rotation.z = -0.045
  group.add(head)
  group.add(tubeY([0, 1.7, 0], 0.045, 0.05, 0.14, mats.body, 0.9))

  // legs
  group.add(taperedBetween([0.08, 0.96], [0.09, 0.56, 0.02], 0.07, 0.06, mats.body))
  group.add(taperedBetween([0.09, 0.56, 0.02], [0.1, 0.1, 0.03], 0.06, 0.05, mats.body))
  group.add(taperedBetween([-0.08, 0.96], [-0.1, 0.56, 0.07], 0.07, 0.06, mats.body))
  group.add(taperedBetween([-0.1, 0.56, 0.07], [-0.13, 0.1, 0.04], 0.06, 0.05, mats.body))
  group.add(ball([0.09, 0.56, 0.02], 0.06, mats.body))
  group.add(ball([-0.1, 0.56, 0.07], 0.06, mats.body))

  // arms
  group.add(taperedBetween([0.19, 1.53], [0.26, 1.2, 0.02], 0.05, 0.042, mats.body))
  group.add(taperedBetween([0.26, 1.2, 0.02], [0.23, 0.92, 0.06], 0.042, 0.036, mats.body))
  group.add(taperedBetween([-0.19, 1.53], [-0.32, 1.19, 0.03], 0.05, 0.042, mats.body))
  group.add(taperedBetween([-0.32, 1.19, 0.03], [-0.18, 1.03, 0.17], 0.042, 0.036, mats.body))
  group.add(ball([0.19, 1.53], 0.046, mats.body))
  group.add(ball([-0.19, 1.53], 0.046, mats.body))
  group.add(ball([0.26, 1.2, 0.02], 0.044, mats.body))
  group.add(ball([-0.32, 1.19, 0.03], 0.044, mats.body))
  const rightHand = new THREE.Group()
  rightHand.add(taperedBetween([0.23, 0.94, 0.06], [0.235, 0.87, 0.055], 0.03, 0.024, mats.body, 10))
  rightHand.add(ball([0.235, 0.865, 0.055], 0.028, mats.body, [1.15, 0.9, 0.65]))
  rightHand.add(ball([0.212, 0.885, 0.06], 0.012, mats.body, [1, 1.2, 0.8]))
  group.add(rightHand)

  const leftHand = new THREE.Group()
  leftHand.add(taperedBetween([-0.18, 1.04, 0.17], [-0.16, 0.98, 0.145], 0.03, 0.024, mats.body, 10))
  leftHand.add(ball([-0.158, 0.975, 0.142], 0.028, mats.body, [1.15, 0.9, 0.65]))
  leftHand.add(ball([-0.178, 0.99, 0.135], 0.012, mats.body, [1, 1.2, 0.8]))
  group.add(leftHand)

  // inner
  const inner = new THREE.Group()
  const vShape = new THREE.Shape()
  vShape.moveTo(-0.052, 0)
  vShape.lineTo(0.052, 0)
  vShape.lineTo(0, -0.25)
  vShape.closePath()
  const vPanel = new THREE.Mesh(
    new THREE.ExtrudeGeometry(vShape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      bevelSegments: 2,
    }),
    mats.inner,
  )
  vPanel.position.set(0, 1.56, 0.104)
  inner.add(vPanel)

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.014, 10, 28), mats.inner)
  collar.position.set(0, 1.582, 0)
  collar.rotation.x = Math.PI / 2
  collar.scale.z = 0.82
  inner.add(collar)
  group.add(markGroup(inner, 'inner'))

  // top
  const top = new THREE.Group()
  top.add(lathe([
    [0.158, 0.95], [0.153, 1.03], [0.128, 1.16], [0.138, 1.26],
    [0.17, 1.38], [0.185, 1.48], [0.165, 1.55], [0.12, 1.57], [0.085, 1.58],
  ], mats.top, 0.62))

  for (const [a, b] of [
    [[-0.052, 1.56, 0.118], [0, 1.31, 0.118]],
    [[0.052, 1.56, 0.118], [0, 1.31, 0.118]],
  ] as const) {
    top.add(taperedBetween(a, b, 0.004, 0.004, mats.seam, 8))
  }

  const rightElbow: Vec3 = [0.26, 1.2, 0.02]
  const rightWrist: Vec3 = [0.23, 0.94, 0.06]
  const leftElbow: Vec3 = [-0.32, 1.19, 0.03]
  const leftWrist: Vec3 = [-0.18, 1.04, 0.17]

  top.add(taperedBetween([0.19, 1.53], rightElbow, 0.064, 0.056, mats.top))
  top.add(taperedBetween([-0.19, 1.53], leftElbow, 0.064, 0.056, mats.top))
  if (spec.sleeve === 'long') {
    top.add(taperedBetween(rightElbow, rightWrist, 0.056, 0.047, mats.top))
    top.add(taperedBetween(leftElbow, leftWrist, 0.056, 0.047, mats.top))
  }
  top.add(ball([0.19, 1.525], 0.06, mats.top, [1, 0.9, 1]))
  top.add(ball([-0.19, 1.525], 0.06, mats.top, [1, 0.9, 1]))
  top.add(ball(rightElbow, 0.058, mats.top))
  top.add(ball(leftElbow, 0.058, mats.top))
  group.add(markGroup(top, 'top'))

  // inner cuff on the relaxed arm
  const cuff = new THREE.Group()
  if (spec.sleeve === 'long') {
    cuff.add(taperedBetween([0.235, 0.955, 0.058], [0.23, 0.93, 0.06], 0.05, 0.048, mats.inner, 12))
  }
  group.add(markGroup(cuff, 'inner'))

  // pants
  const pants = new THREE.Group()
  pants.add(ball([0, 0.98, 0], 0.162, mats.pants, [1, 0.52, 0.78]))
  const legEnd = spec.pant === 'long' ? 0.16 : 0.68
  pants.add(legTube([[0.08, 0.98, 0], [0.09, 0.56, 0.02], [0.1, legEnd, 0.03]], 0.076, mats.pants))
  pants.add(legTube([[-0.08, 0.98, 0], [-0.1, 0.56, 0.07], [-0.13, legEnd, 0.04]], 0.076, mats.pants))
  group.add(markGroup(pants, 'pants'))

  // shoes
  const shoes = new THREE.Group()
  function addShoe(x: number, z: number, rotY = 0) {
    const shoe = new THREE.Group()
    shoe.position.set(x, 0, z)
    shoe.rotation.y = rotY
    if (spec.shoe === 'boot') {
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.066, 0.2, 20),
        mats.shoes,
      )
      shaft.position.set(0, 0.16, 0)
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.062, 22, 16), mats.shoes)
      foot.position.set(0, 0.055, 0.085)
      foot.scale.set(1, 0.55, 1.9)
      const heel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.06), mats.shoes)
      heel.position.set(0, 0.035, -0.06)
      shoe.add(shaft, foot, heel)
    } else {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 22, 16), mats.shoes)
      foot.position.set(0, 0.045, 0.07)
      foot.scale.set(1, 0.5, 1.85)
      shoe.add(foot)
      if (spec.shoe === 'sandal') {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.035), mats.shoes)
        strap.position.set(0, 0.085, 0.05)
        shoe.add(strap)
      }
    }
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.024, 0.28), mats.sole)
    sole.position.set(0, 0.012, 0.06)
    shoe.add(sole)
    return shoe
  }
  shoes.add(addShoe(0.1, 0.03, 0))
  shoes.add(addShoe(-0.13, 0.04, 0.32))
  group.add(markGroup(shoes, 'shoes'))

  // accent
  const accent = new THREE.Group()
  if (spec.accent === 'belt') {
    accent.add(tubeY([0, 1.015, 0], 0.16, 0.16, 0.045, mats.accent, 0.72))
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.018), mats.seam)
    buckle.position.set(0, 1.015, 0.118)
    accent.add(buckle)
  } else {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 12, 30), mats.accent)
    scarf.position.set(0, 1.565, 0.01)
    scarf.rotation.x = Math.PI / 2
    scarf.scale.z = 0.85
    accent.add(scarf)
    accent.add(taperedBetween([-0.075, 1.55, 0.1], [-0.1, 1.22, 0.16], 0.032, 0.026, mats.accent, 12))
    accent.add(taperedBetween([0.075, 1.55, 0.1], [0.1, 1.28, 0.14], 0.03, 0.024, mats.accent, 12))
  }
  group.add(markGroup(accent, 'accent'))

  return group
}

export function Figure({
  gender,
  season,
  colors,
  activeRegion = null,
  onRegionChange,
}: FigureProps) {
  const invalidate = useThree((state) => state.invalidate)
  const gl = useThree((state) => state.gl)
  const spec = useMemo(() => sceneFor(gender, season), [gender, season])
  const materials = useMemo(() => createMaterials(), [])
  const group = useMemo(
    () => buildFigure(spec, materials, gender),
    [spec, materials, gender],
  )

  useEffect(() => {
    for (const region of REGIONS) {
      const material = materials[region]
      const color = colors[region]
      material.color.set(color?.hex ?? PLACEHOLDER)
      material.transparent = !color
      material.opacity = color ? 1 : 0.52
      material.depthWrite = Boolean(color)
      material.needsUpdate = true
    }
    invalidate()
  }, [colors, materials, invalidate])

  useEffect(() => {
    for (const region of REGIONS) {
      const material = materials[region]
      const active = region === activeRegion
      material.emissive.set(active ? ACTIVE_COLOR : '#000000')
      material.emissiveIntensity = active ? 0.35 : 0
    }
    invalidate()
  }, [activeRegion, materials, invalidate])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let visible = true
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
          })
    observer?.observe(gl.domElement)
    const id = window.setInterval(() => {
      if (!visible || document.hidden) return
      const t = performance.now() / 1000
      group.scale.y = 1 + Math.sin(t * 0.9) * 0.0025
      invalidate()
    }, 40)
    return () => {
      observer?.disconnect()
      window.clearInterval(id)
      group.scale.y = 1
    }
  }, [gl, group, invalidate])

  useEffect(
    () => () => {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
    },
    [group],
  )

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose())
    },
    [materials],
  )

  return (
    <primitive
      object={group}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        const region = event.object.userData.region as
          | MannequinRegion
          | undefined
        onRegionChange?.(region ?? null)
      }}
      onPointerLeave={() => onRegionChange?.(null)}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        const region = event.object.userData.region as
          | MannequinRegion
          | undefined
        if (region) onRegionChange?.(region)
      }}
    />
  )
}
