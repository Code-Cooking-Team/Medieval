import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'

import { Copy } from 'lucide-react'
import { useState } from 'react'

export function TerrainSeed({ seed }: { seed?: number }) {
    const [status, setStatus] = useState('')

    if (seed === undefined) return <Box p={3}>Terrain seed unavailable</Box>

    const copySeed = async () => {
        try {
            await navigator.clipboard.writeText(String(seed))
            setStatus('Copied')
        } catch {
            setStatus('Could not copy. Select the seed to copy it manually.')
        }
    }

    return (
        <Box p={3}>
            <Box
                display="flex"
                alignItems="center"
                flexWrap="wrap"
                columnGap={2}
                rowGap={2}
            >
                <span>Terrain seed</span>
                <code>{seed}</code>
                <Button
                    label="Copy seed"
                    icon={<Copy size={14} aria-hidden="true" />}
                    onClick={copySeed}
                />
            </Box>
            <span role="status">{status}</span>
        </Box>
    )
}
