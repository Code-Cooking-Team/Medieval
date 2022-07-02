import { Vector2, WebGLRenderer } from 'three'

export class SelectionDiv {
    private startPoint = new Vector2()
    private pointTopLeft = new Vector2()
    private pointBottomRight = new Vector2()
    private element = document.createElement('div')

    constructor(private renderer: WebGLRenderer) {
        this.element.classList.add('selectBox')
        this.element.style.pointerEvents = 'none'
    }

    public onDown(event: PointerEvent) {
        this.renderer.domElement.parentElement?.appendChild(this.element)

        this.element.style.left = event.clientX + 'px'
        this.element.style.top = event.clientY + 'px'
        this.element.style.width = '0px'
        this.element.style.height = '0px'

        this.startPoint.x = event.clientX
        this.startPoint.y = event.clientY
    }

    public onMove(event: PointerEvent) {
        this.pointTopLeft.x = Math.min(this.startPoint.x, event.clientX)
        this.pointTopLeft.y = Math.min(this.startPoint.y, event.clientY)
        this.pointBottomRight.x = Math.max(this.startPoint.x, event.clientX)
        this.pointBottomRight.y = Math.max(this.startPoint.y, event.clientY)

        this.element.style.left = this.pointTopLeft.x + 'px'
        this.element.style.top = this.pointTopLeft.y + 'px'
        this.element.style.width = this.pointBottomRight.x - this.pointTopLeft.x + 'px'
        this.element.style.height = this.pointBottomRight.y - this.pointTopLeft.y + 'px'
    }

    public onUp() {
        this.element.parentElement?.removeChild(this.element)
    }
}
