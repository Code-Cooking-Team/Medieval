import { isBuildingActor } from '+game/actors/helpers'
import type { Actor } from '+game/core/Actor'
import type { Renderer } from '+game/Renderer'

import styled from '@emotion/styled'
import { useLayoutEffect, useRef } from 'react'

export function SelectionPortrait({
    actor,
    renderer,
}: {
    actor: Actor
    renderer: Renderer
}) {
    const canvas = useRef<HTMLCanvasElement>(null)
    useLayoutEffect(() => {
        if (canvas.current) return renderer.attachPortrait(canvas.current, actor)
    }, [actor, renderer])
    return (
        <PortraitCanvas
            ref={canvas}
            aria-hidden="true"
            style={{ bottom: isBuildingActor(actor) ? -28 : 0 }}
        />
    )
}

const PortraitCanvas = styled.canvas({
    position: 'absolute',
    width: 160,
    height: 180,
    left: -4,
    bottom: 0,
    pointerEvents: 'none',
})
