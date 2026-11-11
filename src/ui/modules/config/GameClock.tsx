import type { Game } from '+game/Game'

import { useCallback, useSyncExternalStore } from 'react'

export const GameClock = ({
    game,
    editable = false,
}: {
    game: Game
    editable?: boolean
}) => {
    const subscribe = useCallback(
        (refresh: () => void) => game.emitter.on('timeChanged', refresh),
        [game],
    )
    const minutes = useSyncExternalStore(subscribe, () => Math.floor(game.timeOfDay))
    const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0')
    const remainder = (minutes % 60).toString().padStart(2, '0')
    const time = `${hours}:${remainder}`

    if (!editable) {
        return (
            <time className="text-game-gold tabular-nums" dateTime={time}>
                {time}
            </time>
        )
    }

    return (
        <label className="flex flex-col gap-2 p-2">
            Time <span className="tabular-nums">{time}</span>
            <input
                type="range"
                min={0}
                max={1439}
                value={minutes}
                aria-valuetext={time}
                onChange={(event) => game.setTimeOfDay(event.currentTarget.valueAsNumber)}
            />
        </label>
    )
}
