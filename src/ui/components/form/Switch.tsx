import { cn } from '+helpers/string'
import * as SwitchPrimitive from '@radix-ui/react-switch'

interface SwitchProps {
    checked: boolean
    onChange(checked: boolean): void
}

export const Switch = ({ checked, onChange }: SwitchProps) => {
    return (
        <SwitchPrimitive.Root
            defaultChecked={checked}
            onCheckedChange={onChange}
            className={cn(
                'unset-all w-[42px] h-[25px] bg-[var(--color-black-70)] rounded-full relative shadow-[0_2px_10px_var(--color-black-10)] [WebkitTapHighlightColor:rgba(0,0,0,0)]',
                'focus:shadow-[0_0_0_2px_var(--color-black-70)]',
                'data-[state=checked]:bg-[var(--color-primary)]',
            )}
        >
            <SwitchPrimitive.Thumb
                className={cn(
                    'block w-[21px] h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform',
                    'data-[state=checked]:translate-x-[19px]',
                )}
            />
        </SwitchPrimitive.Root>
    )
}
