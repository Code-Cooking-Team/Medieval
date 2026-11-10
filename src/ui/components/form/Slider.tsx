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
            className="relative flex w-[200px] touch-none select-none items-center data-[orientation=horizontal]:h-5 data-[orientation=vertical]:h-[100px] data-[orientation=vertical]:w-5 data-[orientation=vertical]:flex-col"
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(values) => onChange(values[0]!)}
        >
            <SliderPrimitive.Track className="relative grow rounded-full bg-black/10 data-[orientation=horizontal]:h-[3px] data-[orientation=vertical]:w-[3px]">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-white" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-[0_2px_10px_white] hover:bg-[#ccc] focus:shadow-[0_0_0_5px_rgba(0,0,0,0.7)]" />
        </SliderPrimitive.Root>
    )
}
