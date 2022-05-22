import styled from '@emotion/styled'
import React from 'react'

interface HpProps {
    hp: number
    maxHp: number
}

export const Hp = ({ hp, maxHp }: HpProps) => {
    return (
        <Container>
            <Bar
                style={{
                    width: `${(hp / maxHp) * 100}%`,
                    backgroundColor: `rgb(
                        ${Math.round(255 * (1 - hp / maxHp))}, 
                        ${255 - Math.round(255 * (1 - hp / maxHp))}, 0)`,
                }}
            />
        </Container>
    )
}

const Container = styled.div({
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    backgroundColor: '#000',
    borderRadius: '2px',
    overflow: 'hidden',
})

const Bar = styled.div({
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: '2px',
})
