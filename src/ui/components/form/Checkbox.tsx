interface CheckboxProps {
    checked: boolean
    onChange(checked: boolean): void
}

export const Checkbox = ({ checked, onChange }: CheckboxProps) => {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
                onChange(e.target.checked)
            }}
        />
    )
}
