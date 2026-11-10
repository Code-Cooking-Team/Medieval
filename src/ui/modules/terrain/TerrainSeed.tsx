import { Button } from '+ui/components/base/Button'

import { Copy } from 'lucide-react'
import { useState } from 'react'

export function TerrainSeed({ seed }: { seed?: number }) {
    const [status, setStatus] = useState('')

    if (seed === undefined) return <div className="p-4">Terrain seed unavailable</div>

    const copySeed = async () => {
        try {
            await navigator.clipboard.writeText(String(seed))
            setStatus('Copied')
        } catch {
            setStatus('Could not copy. Select the seed to copy it manually.')
        }
    }

    return (
        <div className="p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span>Terrain seed</span>
                <code>{seed}</code>
                <Button
                    label="Copy seed"
                    icon={<Copy size={14} aria-hidden="true" />}
                    onClick={copySeed}
                />
            </div>
            <span role="status">{status}</span>
        </div>
    )
}
