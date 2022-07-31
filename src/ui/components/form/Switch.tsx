import styled from '@emotion/styled'
import * as SwitchPrimitive from '@radix-ui/react-switch'

interface SwitchProps {
    checked: boolean
    onChange(checked: boolean): void
}

export const Switch = ({ checked, onChange }: SwitchProps) => {
    return (
        <Root defaultChecked={checked} onCheckedChange={onChange}>
            <Thumb />
        </Root>
    )
}

const Root = styled(SwitchPrimitive.Root)(({ theme }) => ({
    all: 'unset',
    width: 42,
    height: 25,
    backgroundColor: theme.colors.black70,
    borderRadius: '9999px',
    position: 'relative',
    boxShadow: `0 2px 10px ${theme.colors.black10}`,
    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
    '&:focus': { boxShadow: `0 0 0 2px ${theme.colors.black70}` },
    '&[data-state="checked"]': { backgroundColor: theme.colors.primary },
}))

const Thumb = styled(SwitchPrimitive.Thumb)(({ theme }) => ({
    display: 'block',
    width: 21,
    height: 21,
    backgroundColor: theme.colors.white,
    borderRadius: '9999px',
    transition: 'transform 100ms',
    transform: 'translateX(2px)',
    willChange: 'transform',
    '&[data-state="checked"]': { transform: 'translateX(19px)' },
}))
