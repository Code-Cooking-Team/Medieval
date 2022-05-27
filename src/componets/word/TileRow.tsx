import { DEV_TILES_SIZE } from '+config'
import { Position } from '+game/types'
import { Tile } from '+game/Word'
import React from 'react'

interface TileRowProps {
    tiles: Tile[]
    y: number
    onClick(position: Position): void
}

export const TileRow = ({ tiles, y, onClick }: TileRowProps) => {
    return (
        <div key={y} className="row">
            {tiles.map(({ id, name }, x) => (
                <div
                    key={id}
                    className={`tile ${name}`}
                    style={{
                        width: DEV_TILES_SIZE,
                        height: DEV_TILES_SIZE,
                    }}
                    onClick={() => onClick([x, y])}
                >{`${x},${y}`}</div>
            ))}
        </div>
    )
}
