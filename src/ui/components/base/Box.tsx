import { cn } from '+helpers/string'
import { type HTMLAttributes, type ReactNode } from 'react'

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode
    // Layout props
    display?: 'flex' | 'grid' | 'block' | 'inline-block' | 'inline-flex' | 'none'
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
    columnGap?: 0 | 1 | 2 | 3 | 4 | 5
    rowGap?: 0 | 1 | 2 | 3 | 4 | 5
    gap?: 0 | 1 | 2 | 3 | 4 | 5
    // Position props
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
    top?: string | number
    right?: string | number
    bottom?: string | number
    left?: string | number
    zIndex?: number
    // Spacing props
    p?: 0 | 1 | 2 | 3 | 4 | 5
    padding?: 0 | 1 | 2 | 3 | 4 | 5
    paddingX?: 0 | 1 | 2 | 3 | 4 | 5
    paddingY?: 0 | 1 | 2 | 3 | 4 | 5
    m?: 0 | 1 | 2 | 3 | 4 | 5
    margin?: 0 | 1 | 2 | 3 | 4 | 5
    marginX?: 0 | 1 | 2 | 3 | 4 | 5
    marginY?: 0 | 1 | 2 | 3 | 4 | 5
    // Size props
    width?: string | number
    height?: string | number
    minWidth?: string | number
    minHeight?: string | number
    maxWidth?: string | number
    maxHeight?: string | number
    // Color props
    color?: 'primary' | 'text' | 'text-muted' | 'border' | 'white' | 'light-gray' | 'black' | 'danger'
    bg?: 'primary' | 'text' | 'text-muted' | 'border' | 'white' | 'light-gray' | 'black' | 'black-70' | 'black-10' | 'danger' | 'transparent'
    // Typography props
    fontSize?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    // Border props
    border?: boolean
    borderWidth?: number
    borderColor?: 'primary' | 'text' | 'border' | 'white' | 'black' | 'danger'
    borderRadius?: 'small' | 'normal' | 'full' | number
}

const spacingMap = {
    0: 'p-0',
    1: 'p-1',
    2: 'p-2',
    3: 'p-3',
    4: 'p-4',
    5: 'p-5',
}

const marginMap = {
    0: 'm-0',
    1: 'm-1',
    2: 'm-2',
    3: 'm-3',
    4: 'm-4',
    5: 'm-5',
}

const gapMap = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
}

const columnGapMap = {
    0: 'gap-x-0',
    1: 'gap-x-1',
    2: 'gap-x-2',
    3: 'gap-x-3',
    4: 'gap-x-4',
    5: 'gap-x-5',
}

const rowGapMap = {
    0: 'gap-y-0',
    1: 'gap-y-1',
    2: 'gap-y-2',
    3: 'gap-y-3',
    4: 'gap-y-4',
    5: 'gap-y-5',
}

const fontSizeMap = {
    0: 'text-xs',
    1: 'text-sm',
    2: 'text-base',
    3: 'text-lg',
    4: 'text-xl',
    5: 'text-2xl',
    6: 'text-3xl',
}

export const Box = ({
    children,
    display,
    flexDirection,
    alignItems,
    justifyContent,
    columnGap,
    rowGap,
    gap,
    position,
    top,
    right,
    bottom,
    left,
    zIndex,
    p,
    padding,
    paddingX,
    paddingY,
    m,
    margin,
    marginX,
    marginY,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    color,
    bg,
    fontSize,
    fontWeight,
    textAlign,
    border,
    borderWidth,
    borderColor,
    borderRadius,
    className,
    style,
    ...props
}: BoxProps) => {
    const classes = cn(
        // Display
        display === 'flex' && 'flex',
        display === 'grid' && 'grid',
        display === 'block' && 'block',
        display === 'inline-block' && 'inline-block',
        display === 'inline-flex' && 'inline-flex',
        display === 'none' && 'hidden',
        // Flex direction
        flexDirection === 'row' && 'flex-row',
        flexDirection === 'column' && 'flex-col',
        flexDirection === 'row-reverse' && 'flex-row-reverse',
        flexDirection === 'column-reverse' && 'flex-col-reverse',
        // Align items
        alignItems === 'flex-start' && 'items-start',
        alignItems === 'flex-end' && 'items-end',
        alignItems === 'center' && 'items-center',
        alignItems === 'stretch' && 'items-stretch',
        alignItems === 'baseline' && 'items-baseline',
        // Justify content
        justifyContent === 'flex-start' && 'justify-start',
        justifyContent === 'flex-end' && 'justify-end',
        justifyContent === 'center' && 'justify-center',
        justifyContent === 'space-between' && 'justify-between',
        justifyContent === 'space-around' && 'justify-around',
        justifyContent === 'space-evenly' && 'justify-evenly',
        // Gaps
        gap !== undefined && gapMap[gap],
        columnGap !== undefined && columnGapMap[columnGap],
        rowGap !== undefined && rowGapMap[rowGap],
        // Position
        position === 'relative' && 'relative',
        position === 'absolute' && 'absolute',
        position === 'fixed' && 'fixed',
        position === 'sticky' && 'sticky',
        position === 'static' && 'static',
        // Spacing
        (p !== undefined || padding !== undefined) && spacingMap[p ?? padding ?? 0],
        paddingX !== undefined && (paddingX === 0 ? 'px-0' : paddingX === 1 ? 'px-1' : paddingX === 2 ? 'px-2' : paddingX === 3 ? 'px-3' : paddingX === 4 ? 'px-4' : 'px-5'),
        paddingY !== undefined && (paddingY === 0 ? 'py-0' : paddingY === 1 ? 'py-1' : paddingY === 2 ? 'py-2' : paddingY === 3 ? 'py-3' : paddingY === 4 ? 'py-4' : 'py-5'),
        (m !== undefined || margin !== undefined) && marginMap[m ?? margin ?? 0],
        marginX !== undefined && (marginX === 0 ? 'mx-0' : marginX === 1 ? 'mx-1' : marginX === 2 ? 'mx-2' : marginX === 3 ? 'mx-3' : marginX === 4 ? 'mx-4' : 'mx-5'),
        marginY !== undefined && (marginY === 0 ? 'my-0' : marginY === 1 ? 'my-1' : marginY === 2 ? 'my-2' : marginY === 3 ? 'my-3' : marginY === 4 ? 'my-4' : 'my-5'),
        // Colors
        color === 'primary' && 'text-[var(--color-primary)]',
        color === 'text' && 'text-[var(--color-text)]',
        color === 'text-muted' && 'text-[var(--color-text-muted)]',
        color === 'border' && 'text-[var(--color-border)]',
        color === 'white' && 'text-white',
        color === 'light-gray' && 'text-[var(--color-light-gray)]',
        color === 'black' && 'text-[var(--color-black)]',
        color === 'danger' && 'text-[var(--color-danger)]',
        bg === 'primary' && 'bg-[var(--color-primary)]',
        bg === 'text' && 'bg-[var(--color-text)]',
        bg === 'text-muted' && 'bg-[var(--color-text-muted)]',
        bg === 'border' && 'bg-[var(--color-border)]',
        bg === 'white' && 'bg-white',
        bg === 'light-gray' && 'bg-[var(--color-light-gray)]',
        bg === 'black' && 'bg-[var(--color-black)]',
        bg === 'black-70' && 'bg-[var(--color-black-70)]',
        bg === 'black-10' && 'bg-[var(--color-black-10)]',
        bg === 'danger' && 'bg-[var(--color-danger)]',
        bg === 'transparent' && 'bg-transparent',
        // Typography
        fontSize !== undefined && fontSizeMap[fontSize],
        fontWeight === 'bold' && 'font-bold',
        fontWeight === 'normal' && 'font-normal',
        fontWeight === 'lighter' && 'font-light',
        fontWeight === 'bolder' && 'font-extrabold',
        textAlign === 'left' && 'text-left',
        textAlign === 'center' && 'text-center',
        textAlign === 'right' && 'text-right',
        textAlign === 'justify' && 'text-justify',
        // Border
        border && 'border',
        borderRadius === 'small' && 'rounded-[var(--radius-small)]',
        borderRadius === 'normal' && 'rounded-[var(--radius-normal)]',
        borderRadius === 'full' && 'rounded-full',
        borderColor === 'primary' && 'border-[var(--color-primary)]',
        borderColor === 'text' && 'border-[var(--color-text)]',
        borderColor === 'border' && 'border-[var(--color-border)]',
        borderColor === 'white' && 'border-white',
        borderColor === 'black' && 'border-[var(--color-black)]',
        borderColor === 'danger' && 'border-[var(--color-danger)]',
        className,
    )

    const inlineStyles: React.CSSProperties = {
        ...(top !== undefined && { top: typeof top === 'number' ? `${top}px` : top }),
        ...(right !== undefined && { right: typeof right === 'number' ? `${right}px` : right }),
        ...(bottom !== undefined && { bottom: typeof bottom === 'number' ? `${bottom}px` : bottom }),
        ...(left !== undefined && { left: typeof left === 'number' ? `${left}px` : left }),
        ...(zIndex !== undefined && { zIndex }),
        ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
        ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
        ...(minWidth !== undefined && { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }),
        ...(minHeight !== undefined && { minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight }),
        ...(maxWidth !== undefined && { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }),
        ...(maxHeight !== undefined && { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }),
        ...(borderWidth !== undefined && { borderWidth: `${borderWidth}px` }),
        ...(typeof borderRadius === 'number' && { borderRadius: `${borderRadius}px` }),
        ...(typeof fontWeight === 'number' && { fontWeight }),
        ...style,
    }

    return (
        <div className={classes} style={inlineStyles} {...props}>
            {children}
        </div>
    )
}

