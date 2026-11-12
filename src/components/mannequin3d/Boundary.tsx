import { Component, type ReactNode } from 'react'

let webgl: boolean | null = null

export function hasWebGL(): boolean {
  if (webgl !== null) return webgl
  try {
    const canvas = document.createElement('canvas')
    webgl = Boolean(
      canvas.getContext('webgl2') || canvas.getContext('webgl'),
    )
  } catch {
    webgl = false
  }
  return webgl
}

interface BoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface BoundaryState {
  failed: boolean
}

export class Mannequin3DBoundary extends Component<
  BoundaryProps,
  BoundaryState
> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
