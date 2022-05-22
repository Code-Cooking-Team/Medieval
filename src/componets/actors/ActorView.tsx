import { DEV_TILES_SIZE } from '+config'
import { ActorStatic } from '+game/core/ActorStatic'
import { actorTypeColors } from '+game/types'
import styled from '@emotion/styled'
import React from 'react'
import { Hp } from './Hp'

interface ActorViewProps {
    actor: ActorStatic
}

export const ActorView = ({ actor }: ActorViewProps) => {
    const {
        id,
        type,
        hp,
        maxHp,
        position: [x, y],
        ...rest
    } = actor

    return (
        <Container
            key={id}
            style={{
                left: `${x * DEV_TILES_SIZE}px`,
                top: `${y * DEV_TILES_SIZE}px`,
                backgroundColor: actorTypeColors[type],
            }}
            isDead={actor.isDead()}
        >
            {(rest as any).state && <Status>{(rest as any).state}</Status>}
            <Name>{type}</Name>
            <Hp hp={hp} maxHp={maxHp} />
        </Container>
    )
}

const d = 0.75

const Container = styled.div<{ isDead: boolean }>(({ isDead }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: DEV_TILES_SIZE * d,
    height: DEV_TILES_SIZE * d,
    backgroundColor: 'rgb(221, 0, 255)',
    transformStyle: 'preserve-3d',
    transition: 'all 200ms linear',
    transform: `translate3d(${DEV_TILES_SIZE * ((1 - d) / 2)}px, ${
        DEV_TILES_SIZE * ((1 - d) / 2)
    }px, ${isDead ? 2 : (DEV_TILES_SIZE * d) / 2}px) rotateX(${
        isDead ? 0 : -90
    }deg) rotateY(0deg) rotateZ(0deg)`,
}))

const Name = styled.div({
    position: 'absolute',
    color: 'white',
    textAlign: 'center',
    top: -20,
    left: -50,
    right: -50,
    fontSize: 13,
})

const Status = styled.div({
    position: 'absolute',
    textAlign: 'center',
    bottom: 0,
    left: -50,
    right: -50,
    fontSize: '0.8em',
})
