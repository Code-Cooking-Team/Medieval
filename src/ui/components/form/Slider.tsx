import styled from '@emotion/styled'
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
        <StyledSlider
            defaultValue={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={(values) => onChange(values[0]!)}
        >
            <StyledTrack>
                <StyledRange />
            </StyledTrack>
            <StyledThumb />
        </StyledSlider>
    )
}

const StyledSlider = styled(SliderPrimitive.Root)({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'none',
    width: 200,

    '&[data-orientation="horizontal"]': {
        height: 20,
    },

    '&[data-orientation="vertical"]': {
        flexDirection: 'column',
        width: 20,
        height: 100,
    },
})

const StyledTrack = styled(SliderPrimitive.Track)(({ theme }) => ({
    backgroundColor: theme.colors.black10,
    position: 'relative',
    flexGrow: 1,
    borderRadius: '9999px',

    '&[data-orientation="horizontal"]': { height: 3 },
    '&[data-orientation="vertical"]': { width: 3 },
}))

const StyledRange = styled(SliderPrimitive.Range)({
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: '9999px',
    height: '100%',
})

const StyledThumb = styled(SliderPrimitive.Thumb)(({ theme }) => ({
    all: 'unset',
    display: 'block',
    width: 20,
    height: 20,
    backgroundColor: 'white',
    boxShadow: `0 2px 10px ${theme.colors.white}`,
    borderRadius: 10,
    '&:hover': { backgroundColor: theme.colors.lightGray },
    '&:focus': { boxShadow: `0 0 0 5px ${theme.colors.black70}` },
}))
