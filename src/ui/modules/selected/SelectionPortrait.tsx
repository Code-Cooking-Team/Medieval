import { isBuildingActor } from '+game/actors/helpers'
import type { Actor } from '+game/core/Actor'
import type { Renderer } from '+game/Renderer'
import { selectionPortraitLayout } from '+game/renderer/selectionPortraitLayout'

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
        <canvas
            className="pointer-events-none absolute z-0"
            ref={canvas}
            aria-hidden="true"
            style={{
                width: selectionPortraitLayout.width,
                height: selectionPortraitLayout.height,
                left: selectionPortraitLayout.centerX - selectionPortraitLayout.width / 2,
                bottom: isBuildingActor(actor) ? -28 : 0,
            }}
        />
    )
}
