import styled from '@emotion/styled'
import { margin, MarginProps } from 'styled-system'

interface ButtonProps extends MarginProps {
    label: string
    onClick: () => void
    submit?: boolean
}

export const Button = ({ label, onClick, submit, ...props }: ButtonProps) => {
    return (
        <Container onClick={onClick} type={submit ? 'submit' : 'button'} {...props}>
            {label}
        </Container>
    )
}

const Container = styled.button<MarginProps>(margin, ({ theme }) => ({
    backgroundColor: theme.colors.black70,
    color: theme.colors.text,
    border: '2px solid',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.small,
    padding: theme.space[2],
    paddingLeft: theme.space[3],
    paddingRight: theme.space[3],
}))
