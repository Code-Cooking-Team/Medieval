interface SelectProps<T> {
    value: T
    items: T[]
    onChange(value: T): void
    getLabel(item: T): string
}

export const Select = <T extends string>({
    value,
    items,
    onChange,
    getLabel = (item) => item,
}: SelectProps<T>) => (
    <select
        className="game-input"
        value={value}
        onChange={(event) => {
            const item = items[event.target.selectedIndex]
            if (item !== undefined) onChange(item)
        }}
    >
        {items.map((item) => (
            <option key={item} value={item}>
                {getLabel(item)}
            </option>
        ))}
    </select>
)
