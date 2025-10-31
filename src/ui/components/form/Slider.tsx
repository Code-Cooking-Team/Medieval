import { cn } from '+helpers/string'
import * as SliderPrimitive from '@radix-ui/react-slider'

interface SliderProps {
    value: number
    min: number
    max: number
    onChange(value: number): void
    step?: number
}

export const Slider = ({ value, min, max, onChange, step = 1 }: SliderProps) => {
    return (
        <SliderPrimitive.Root
            defaultValue={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(values) => onChange(values[0]!)}
            className={cn(
                'relative flex items-center select-none touch-none w-[200px] [&[data-orientation=horizontal]]:h-5 [&[data-orientation=vertical]]:flex-col [&[data-orientation=vertical]]:w-5 [&[data-orientation=vertical]]:h-[100px]',
            )}
        >
            <SliderPrimitive.Track
                className={cn(
                    'bg-[var(--color-black-10)] relative flex-grow rounded-full [&[data-orientation=horizontal]]:h-[3px] [&[data-orientation=vertical]]:w-[3px]',
                )}
            >
                <SliderPrimitive.Range
                    className={cn(
                        'absolute bg-white rounded-full h-full',
                    )}
                />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb
                className={cn(
                    'unset-all block w-5 h-5 bg-white shadow-[0_2px_10px_white] rounded-[10px]',
                    'hover:bg-[var(--color-light-gray)]',
                    'focus:shadow-[0_0_0_5px_var(--color-black-70)]',
                )}
            />
        </SliderPrimitive.Root>
    )
}
