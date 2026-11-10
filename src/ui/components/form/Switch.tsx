import * as SwitchPrimitive from '@radix-ui/react-switch'

interface SwitchProps {
    checked: boolean
    onChange(checked: boolean): void
}

export const Switch = ({ checked, onChange }: SwitchProps) => {
    return (
        <SwitchPrimitive.Root
            className="relative h-[25px] w-[42px] rounded-full border-0 bg-black/70 p-0 shadow-[0_2px_10px_rgba(0,0,0,0.1)] [-webkit-tap-highlight-color:transparent] focus:shadow-[0_0_0_2px_rgba(0,0,0,0.7)] data-[state=checked]:bg-game-gold"
            defaultChecked={checked}
            onCheckedChange={onChange}
        >
            <SwitchPrimitive.Thumb className="block size-[21px] translate-x-0.5 rounded-full bg-white transition-transform duration-100 data-[state=checked]:translate-x-[19px]" />
        </SwitchPrimitive.Root>
    )
}
