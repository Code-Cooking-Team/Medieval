import styled from '@emotion/styled'
import type { ReactNode } from 'react'
import { margin, MarginProps } from 'styled-system'

interface ButtonProps extends MarginProps {
    label: string
    icon?: ReactNode
    onClick: () => void
    submit?: boolean
}

export const Button = ({ label, icon, onClick, submit, ...props }: ButtonProps) => {
    return (
        <Container onClick={onClick} type={submit ? 'submit' : 'button'} {...props}>
            {icon}
            {label}
        </Container>
    )
}

const Container = styled.button<MarginProps>(margin, ({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
    backgroundColor: theme.colors.black70,
    color: theme.colors.text,
    border: '2px solid',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.normal,
    padding: theme.space[2],
    paddingLeft: theme.space[3],
    paddingRight: theme.space[3],
    userSelect: 'none',
    ':hover, :focus-visible': {
        backgroundColor: theme.colors.primary,
        color: theme.colors.black,
    },
}))
