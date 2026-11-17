import type { ControlHints } from '+game/player/interaction/ControlHints'

function MouseButton({ button }: { button: 'left' | 'right' }) {
    return (
        <span
            className="game-control-mouse"
            data-button={button}
            role="img"
            aria-label={button === 'left' ? 'Left-click' : 'Right-click'}
        />
    )
}

export function ControlHintBar({ hints }: { hints: ControlHints }) {
    const isBuilding = hints.mode === 'build'
    const hasMouseHint = Boolean(hints.left || hints.right)
    if (hints.mode === 'selection' && !hasMouseHint) return null
    return (
        <div className="game-control-hints" role="group" aria-label="Game controls">
            {hints.left && (
                <span className="inline-flex items-center gap-1.5">
                    <MouseButton button="left" />
                    {hints.left}
                </span>
            )}
            {hints.right && (
                <span className="inline-flex items-center gap-1.5">
                    <MouseButton button="right" />
                    {isBuilding && (
                        <>
                            <span className="text-xs">/</span>
                            <kbd className="game-control-key">Esc</kbd>
                        </>
                    )}
                    {hints.right}
                </span>
            )}
            {isBuilding && (
                <span className="inline-flex items-center gap-1.5">
                    <kbd className="game-control-key">R</kbd>
                    Rotate building
                </span>
            )}
            {hints.mode === 'idle' && !hasMouseHint && (
                <>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="game-control-key">WASD</kbd>
                        <span className="text-xs">/</span>
                        <kbd className="game-control-key" aria-label="Arrow keys">
                            ↑↓←→
                        </kbd>
                        Pan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="game-control-key">Q</kbd>
                        <kbd className="game-control-key">E</kbd>
                        Rotate view
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="game-control-key">Z</kbd>
                        <kbd className="game-control-key">X</kbd>
                        Tilt view
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <kbd className="game-control-key">Shift</kbd>
                        Pan faster
                    </span>
                </>
            )}
        </div>
    )
}
