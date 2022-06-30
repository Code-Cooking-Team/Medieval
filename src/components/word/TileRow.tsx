import { config } from '+config/config'
import { Tile } from '+game/Tile'
import { Position } from '+game/types'

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
                        width: config.core.devTilesSize,
                        height: config.core.devTilesSize,
                    }}
                    onClick={() => onClick([x, y])}
                >{`${x},${y}`}</div>
            ))}
        </div>
    )
}
