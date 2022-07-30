import { flexGap, FlexGapProps } from '+ui/styles/system'
import { ThemedColorProps } from '+ui/styles/theme'

import styled from '@emotion/styled'
import {
    border,
    BorderProps,
    color,
    compose,
    flexbox,
    FlexboxProps,
    grid,
    GridProps,
    layout,
    LayoutProps,
    position,
    PositionProps,
    space,
    SpaceProps,
    typography,
    TypographyProps,
} from 'styled-system'

export interface BoxProps
    extends LayoutProps,
        GridProps,
        FlexboxProps,
        FlexGapProps,
        PositionProps,
        SpaceProps,
        BorderProps,
        TypographyProps,
        ThemedColorProps {}

export const boxStyledSystem = compose(
    layout,
    grid,
    flexbox,
    flexGap,
    position,
    space,
    border,
    typography,
    color,
)

export const Box = styled.div<BoxProps>(boxStyledSystem)
