import { expect, it } from 'bun:test'
import { Box3, BoxGeometry, Group, Mesh, OrthographicCamera, Vector3 } from 'three'

import { SelectionPortraitRenderer } from './SelectionPortraitRenderer'

// Exercise framing without creating a WebGL context.
function portrait() {
    const view = Object.create(SelectionPortraitRenderer.prototype) as {
        root: Group
        camera: OrthographicCamera
        frameModel(): void
    }
    Object.assign(view, {
        root: new Group(),
        camera: new OrthographicCamera(-1, 1, 1, -1, 0.01, 1000),
        human: true,
        aspect: 280 / 240,
        framed: false,
        bounds: new Box3(),
        bodyBounds: new Box3(),
        size: new Vector3(),
    })
    const body = new Mesh(new BoxGeometry(0.5, 2, 0.4))
    body.position.y = 1
    view.root.add(body)
    return view
}

it('keeps the human portrait camera fixed as equipment and animation bounds change', () => {
    const view = portrait()
    view.frameModel()
    const projection = view.camera.projectionMatrix.clone()
    const position = view.camera.position.clone()
    const tool = new Mesh(new BoxGeometry(0.1, 3, 0.1))
    tool.position.set(2, 3, 0)
    view.root.add(tool)
    view.frameModel()
    expect(view.camera.projectionMatrix.equals(projection)).toBe(true)
    tool.position.set(-3, 4, 0)
    view.frameModel()
    expect(view.camera.projectionMatrix.equals(projection)).toBe(true)
    expect(view.camera.position.equals(position)).toBe(true)
})
