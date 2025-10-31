import { cn } from '+helpers/string'
import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ClickableProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    onClick(): void
    submit?: true
    children?: ReactNode
    title?: string
    hover?: true
    // Box-like props
    display?: 'flex' | 'grid' | 'block' | 'inline-block' | 'inline-flex' | 'none'
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
    columnGap?: 0 | 1 | 2 | 3 | 4 | 5
    rowGap?: 0 | 1 | 2 | 3 | 4 | 5
    gap?: 0 | 1 | 2 | 3 | 4 | 5
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
    p?: 0 | 1 | 2 | 3 | 4 | 5
    padding?: 0 | 1 | 2 | 3 | 4 | 5
    paddingX?: 0 | 1 | 2 | 3 | 4 | 5
    paddingY?: 0 | 1 | 2 | 3 | 4 | 5
    m?: 0 | 1 | 2 | 3 | 4 | 5
    margin?: 0 | 1 | 2 | 3 | 4 | 5
    marginX?: 0 | 1 | 2 | 3 | 4 | 5
    marginY?: 0 | 1 | 2 | 3 | 4 | 5
    width?: string | number
    height?: string | number
    color?: 'primary' | 'text' | 'text-muted' | 'border' | 'white' | 'light-gray' | 'black' | 'danger'
    bg?: 'primary' | 'text' | 'text-muted' | 'border' | 'white' | 'light-gray' | 'black' | 'black-70' | 'black-10' | 'danger' | 'transparent'
    fontSize?: 0 | 1 | 2 | 3 | 4 | 5 | 6
    fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number
    textAlign?: 'left' | 'center' | 'right' | 'justify'
}

export const Clickable = ({ submit, hover, className, onClick, ...props }: ClickableProps) => {
    return (
        <button
            type={submit ? 'submit' : 'button'}
            onClick={onClick}
            className={cn(
                'font-inherit text-inherit bg-none cursor-inherit outline-none border-none m-0 p-0 w-auto overflow-visible leading-inherit text-left',
                hover && 'cursor-pointer rounded-[var(--radius-normal)] transition-[var(--transition-default)]',
                hover && 'hover:bg-[var(--color-border)]',
                hover && 'focus-visible:bg-[var(--color-border)]',
                hover && 'active:bg-[var(--color-border)]',
                className,
            )}
            {...props}
        />
    )
}
