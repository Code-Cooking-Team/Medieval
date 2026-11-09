import { theme } from '+ui/styles/theme'

import { ThemeProvider } from '@emotion/react'
import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { NumberInput } from './InputNumber'

it('keeps decimal input editable while publishing only finite numbers', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const changed = vi.fn()
    const Field = () => {
        const [value, setValue] = useState(1)
        return (
            <ThemeProvider theme={theme}>
                <NumberInput
                    value={value}
                    onChange={(next) => {
                        changed(next)
                        setValue(next)
                    }}
                />
            </ThemeProvider>
        )
    }

    try {
        await act(async () => root.render(<Field />))
        const input = host.querySelector('input')!
        const setValue = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            'value',
        )!.set!
        const edit = async (text: string) => {
            await act(async () => {
                setValue.call(input, text)
                input.dispatchEvent(new Event('input', { bubbles: true }))
            })
        }

        await edit('1.')
        expect(input.value).toBe('1.')
        await edit('1.25')
        expect(changed).toHaveBeenLastCalledWith(1.25)

        await edit('0,')
        expect(input.value).toBe('0.')
        await edit('0.0005')
        expect(changed).toHaveBeenLastCalledWith(0.0005)
        await edit('-2,5')
        expect(input.value).toBe('-2.5')
        expect(changed).toHaveBeenLastCalledWith(-2.5)

        changed.mockClear()
        await edit('')
        expect(input.value).toBe('')
        expect(changed).not.toHaveBeenCalled()
        await act(async () =>
            input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })),
        )
        expect(input.value).toBe('-2.5')
    } finally {
        await act(async () => root.unmount())
        host.remove()
        vi.unstubAllGlobals()
    }
})
