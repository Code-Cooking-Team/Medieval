import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const chrome = process.env.CHROME ?? 'google-chrome'
const output = process.argv[2] ?? 'building-benchmark-results'
const samples = Number(process.argv[3] ?? 24)
if (!Number.isSafeInteger(samples) || samples < 0) {
    throw new Error('Sample count must be a non-negative integer')
}
const profile = await mkdtemp(join(tmpdir(), 'medieval-chrome-'))
const browser = spawn(
    chrome,
    [
        '--headless',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--remote-debugging-port=0',
        '--force-device-scale-factor=1',
        '--window-size=800,600',
        '--no-first-run',
        '--disable-background-timer-throttling',
        `--user-data-dir=${profile}`,
        'about:blank',
    ],
    { stdio: 'ignore' },
)
let spawnError
browser.on('error', (error) => {
    spawnError = error
})
let socket

try {
    let port
    for (let attempt = 0; attempt < 100 && !port; attempt++) {
        if (spawnError) throw spawnError
        if (browser.exitCode !== null)
            throw new Error(`Chrome exited with code ${browser.exitCode}`)
        await delay(100)
        const endpoint = await readFile(
            join(profile, 'DevToolsActivePort'),
            'utf8',
        ).catch(() => '')
        port = endpoint.split('\n')[0]
    }
    if (!port) throw new Error('Chrome did not open a debugging port')
    const version = await fetch(`http://127.0.0.1:${port}/json/version`).then((result) =>
        result.json(),
    )
    const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then((result) =>
        result.json(),
    )
    const tab = tabs.find(({ type }) => type === 'page')
    if (!tab) throw new Error('Chrome did not open a page')
    socket = new WebSocket(tab.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true })
        socket.addEventListener('error', reject, { once: true })
    })

    let sequence = 0
    const pending = new Map()
    socket.addEventListener('message', (message) => {
        const { id, result, error, method, params } = JSON.parse(message.data)
        if (method === 'Log.entryAdded' && params.entry.level === 'error')
            console.error(params.entry.text, params.entry.url)
        if (method === 'Runtime.exceptionThrown') {
            console.error(
                params.exceptionDetails.exception?.description ??
                    params.exceptionDetails.text,
            )
        }
        const request = pending.get(id)
        if (!request) return
        pending.delete(id)
        if (error) request.reject(new Error(error.message))
        else request.resolve(result)
    })
    socket.addEventListener('close', () => {
        for (const { reject } of pending.values())
            reject(new Error('Chrome disconnected'))
        pending.clear()
    })
    const send = (method, params = {}) =>
        new Promise((resolve, reject) => {
            const id = ++sequence
            pending.set(id, { resolve, reject })
            socket.send(JSON.stringify({ id, method, params }))
        })
    async function evaluate(expression) {
        const { result, exceptionDetails } = await send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true,
        })
        if (exceptionDetails)
            throw new Error(
                exceptionDetails.exception?.description ?? exceptionDetails.text,
            )
        return result.value
    }

    await send('Emulation.setDeviceMetricsOverride', {
        width: 800,
        height: 600,
        deviceScaleFactor: 1,
        mobile: false,
    })
    const url =
        process.env.BENCHMARK_URL ??
        'http://localhost:3333/Medieval/benchmarks/buildings.html'
    const response = await fetch(url)
    if (!response.ok)
        throw new Error(`Run pnpm dev first. Fixture returned HTTP ${response.status}`)
    await send('Runtime.enable')
    await send('Log.enable')
    await send('Page.navigate', { url })
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate('Boolean(window.buildingBenchmark)')) break
        if (attempt === 99)
            throw new Error(await evaluate("location.href + ' ' + document.title"))
        await delay(100)
    }

    console.log(await evaluate('buildingBenchmark.check()'))
    if (samples > 0) await runBenchmark()

    async function runBenchmark() {
        await mkdir(output, { recursive: true })
        for (const [layout, view, selected] of [
            ['house', 'near', false],
            ['house', 'far', false],
            ['stakewall', 'near', false],
            ['stakewall', 'far', false],
            ['mixed', 'mixed', true],
        ]) {
            await evaluate(
                `buildingBenchmark.screenshot(${JSON.stringify(layout)}, ${JSON.stringify(view)}, ${selected})`,
            )
            const { data } = await send('Page.captureScreenshot', { format: 'png' })
            await writeFile(
                join(output, `${layout}-${view}.png`),
                Buffer.from(data, 'base64'),
            )
        }
        console.log(`Measuring ${samples} samples per case`)
        const results = await evaluate(`buildingBenchmark.run(${samples})`)
        await writeFile(
            join(output, 'results.json'),
            JSON.stringify({ browser: version.Browser, samples, ...results }, null, 2) +
                '\n',
        )
        console.log(`Saved results in ${output}`)
    }
} finally {
    socket?.close()
    if (browser.pid && browser.exitCode === null) {
        const closed = new Promise((resolve) => browser.once('close', resolve))
        browser.kill()
        await closed
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 3 })
}
