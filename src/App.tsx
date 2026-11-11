import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { hasWoodStorage, isGuildhallActor, isHunterHutActor } from '+game/actors/helpers'
import { Game, type GameJSON } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { PlayerType } from '+game/player/types'
import '+game/professions/machines/woodcutterMachine'
import { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { generateWorld } from '+game/world/generateWorld'
import { random } from '+helpers/random'
import { Button } from '+ui/components/base/Button'
import { WoodIcon } from '+ui/components/icons/WoodIcon'
import { Tab } from '+ui/components/tabs/Tab'
import { Tabs } from '+ui/components/tabs/Tabs'
import { useLocalStorage } from '+ui/hooks/useLocalStorage'
import { ConfigForm } from '+ui/modules/config/ConfigForm'
import { GameClock } from '+ui/modules/config/GameClock'
import { SelectedList } from '+ui/modules/selected/SelectedList'
import { SpawnList } from '+ui/modules/spawn/SpawnList'
import { TerrainSeed } from '+ui/modules/terrain/TerrainSeed'

import {
    Beef,
    ChevronRight,
    Cog,
    FilePlus,
    FolderOpen,
    Gamepad2,
    Mountain,
    Save,
    Settings,
    Users,
} from 'lucide-react'
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react'

const gameRootEl = document.getElementById('game-root') as HTMLElement

function App() {
    const [selectedBuilding, setSelectedBuilding] = useState<ActorType>()
    const [renderer, setRenderer] = useState<Renderer>()
    const [started, setStarted] = useState(false)
    const [rightMenuOpen, setRightMenuOpen] = useState(false)
    const [mode, setMode] = useState<'showcase' | 'play'>('showcase')
    const isShowcase = mode === 'showcase'
    const [gameMenuOpen, setGameMenuOpen] = useState(true)
    const interactionsRef = useRef<InteractionsManager | undefined>(undefined)

    const [forceReloadCount, setForceReloadCount] = useState(0)
    const forceReload = () => setForceReloadCount((v) => v + 1)

    const [savedJson, setSavedJson] = useLocalStorage<GameJSON>(
        'saved-game2',
        undefined,
        true,
    )
    const [toLoadJSON, setToLoadJSON] = useState<GameJSON | undefined>()

    const newGame = () => {
        setToLoadJSON(undefined)
        setMode('play')
        setGameMenuOpen(false)
        setRightMenuOpen(false)
        forceReload()
    }

    const loadGame = (save: GameJSON) => {
        setToLoadJSON(save)
        setMode('play')
        setGameMenuOpen(false)
        setRightMenuOpen(false)
        forceReload()
    }

    const { game, humanPlayer } = useMemo(() => {
        if (toLoadJSON) {
            const game = Game.fromJSON(toLoadJSON)

            const humanPlayer = game.players.find(
                (player) => player.type === PlayerType.Human,
            ) as HumanPlayer

            return { game, humanPlayer }
        }

        const seedParam = new URLSearchParams(window.location.search).get('seed')?.trim()
        const requestedSeed = seedParam ? Number(seedParam) : NaN
        const seed = Number.isSafeInteger(requestedSeed)
            ? requestedSeed
            : Math.floor(random(0, 2 ** 32))
        const world = generateWorld(seed)
        const humanPlayer = new HumanPlayer()
        const naturePlayer = new NaturePlayer()
        const game = new Game(world, [humanPlayer, naturePlayer])

        const floraSpawner = new FloraSpawner(game, naturePlayer, seed)
        floraSpawner.bulkSpawnPlants()

        if (!isShowcase) humanPlayer.selectBuilding(ActorType.Guildhall, undefined, true)

        return { game, humanPlayer }
    }, [toLoadJSON, forceReloadCount, isShowcase])

    useEffect(() => {
        const renderer = new Renderer(game, humanPlayer, gameRootEl)
        const interactions = new InteractionsManager(game, renderer, humanPlayer)
        interactionsRef.current = interactions

        renderer.init(isShowcase)
        setRenderer(renderer)
        interactions.setMenuOpen(true)
        if (!isShowcase) interactions.init()

        const started = () => setStarted(true)
        const stopped = () => setStarted(false)

        game.emitter.on('started', started)
        game.emitter.on('stopped', stopped)

        const selectBuilding = ({ data }: { data: ActorType }) =>
            setSelectedBuilding(data)
        const unselectBuilding = () => setSelectedBuilding(undefined)

        humanPlayer.emitter.on('selectBuilding', selectBuilding)
        humanPlayer.emitter.on('unselectBuilding', unselectBuilding)

        game.start()

        const anyWindow = window as any
        anyWindow.game = game

        return () => {
            interactionsRef.current = undefined
            game.stop()

            interactions.destroy()
            renderer.destroy()

            game.emitter.off('started', started)
            game.emitter.off('stopped', stopped)

            humanPlayer.emitter.off('selectBuilding', selectBuilding)
            humanPlayer.emitter.off('unselectBuilding', unselectBuilding)
        }
    }, [game, humanPlayer, isShowcase])

    useEffect(() => {
        interactionsRef.current?.setMenuOpen(isShowcase || gameMenuOpen)
    }, [gameMenuOpen, game, isShowcase])

    useEffect(() => {
        if (isShowcase) return
        const toggleMenu = () => setGameMenuOpen((open) => !open)
        window.addEventListener('game-menu-toggle', toggleMenu)
        return () => window.removeEventListener('game-menu-toggle', toggleMenu)
    }, [isShowcase])

    return (
        <>
            {!isShowcase && (
                <SettlementStatus
                    game={game}
                    humanPlayer={humanPlayer}
                    onOpenMenu={() => setGameMenuOpen(true)}
                />
            )}
            {!isShowcase && !gameMenuOpen && (
                <SelectedList humanPlayer={humanPlayer} renderer={renderer} />
            )}
            {(isShowcase || gameMenuOpen) && (
                <div
                    className={`fixed inset-0 z-20 flex items-center ${
                        isShowcase
                            ? 'justify-start bg-[linear-gradient(90deg,rgba(5,7,5,0.46),transparent_65%)] p-[clamp(16px,5vw,80px)] max-[700px]:items-end max-[700px]:justify-center'
                            : 'justify-center bg-[rgba(5,7,5,0.62)] p-6 backdrop-blur-[5px]'
                    }`}
                >
                    <div className="w-[min(440px,100%)] rounded-2xl border border-solid border-game-gold/60 bg-[rgba(24,23,18,0.94)] px-9 py-10 text-center shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
                        <h1 className="m-0 mb-8 text-[32px] tracking-[0.16em] text-game-gold">
                            MEDIEVAL
                        </h1>
                        <div className="flex flex-col items-stretch gap-3 [&_button]:min-h-11 [&_button]:text-base">
                            {!isShowcase && (
                                <Button
                                    className="px-2.5"
                                    label="Continue"
                                    onClick={() => setGameMenuOpen(false)}
                                />
                            )}
                            <Button
                                className="px-2.5"
                                label="New Game"
                                icon={<FilePlus size={16} aria-hidden="true" />}
                                onClick={newGame}
                            />
                            {!isShowcase && (
                                <Button
                                    className="px-2.5"
                                    label="Save"
                                    icon={<Save size={16} aria-hidden="true" />}
                                    onClick={() => {
                                        setSavedJson(game.toJSON())
                                        setGameMenuOpen(false)
                                    }}
                                />
                            )}
                            {savedJson && (
                                <Button
                                    className="px-2.5"
                                    label="Load"
                                    icon={<FolderOpen size={16} aria-hidden="true" />}
                                    onClick={() => loadGame(savedJson)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            {!isShowcase && (
                <div
                    className={`absolute inset-y-3 right-3 z-10 transition-[width] duration-[180ms] ease-[ease] max-[800px]:top-[84px] ${rightMenuOpen ? 'pointer-events-auto w-[min(90vw,280px)]' : 'pointer-events-none w-0'}`}
                >
                    <div className="absolute inset-0 overflow-hidden rounded-lg bg-black/50 backdrop-blur-[15px]">
                        {rightMenuOpen && (
                            <div className="flex h-full flex-col overflow-auto">
                                <Tabs>
                                    <Tab label="Game" icon={Gamepad2}>
                                        <div className="flex flex-wrap items-center justify-center gap-2 p-4">
                                            <Button
                                                className="px-2.5"
                                                label="Save"
                                                icon={
                                                    <Save size={14} aria-hidden="true" />
                                                }
                                                onClick={() =>
                                                    setSavedJson(game.toJSON())
                                                }
                                            />
                                            {savedJson && (
                                                <Button
                                                    className="px-2.5"
                                                    label="Load"
                                                    icon={
                                                        <FolderOpen
                                                            size={14}
                                                            aria-hidden="true"
                                                        />
                                                    }
                                                    onClick={() => loadGame(savedJson)}
                                                />
                                            )}
                                            <Button
                                                className="px-2.5"
                                                label="New"
                                                icon={
                                                    <FilePlus
                                                        size={14}
                                                        aria-hidden="true"
                                                    />
                                                }
                                                onClick={newGame}
                                            />
                                        </div>
                                    </Tab>

                                    <Tab label="Spawn" icon={Users}>
                                        <SpawnList humanPlayer={humanPlayer} />
                                    </Tab>

                                    <Tab label="Config" icon={Settings}>
                                        <ConfigForm game={game} />
                                    </Tab>
                                    <Tab label="Terrain" icon={Mountain}>
                                        <TerrainSeed
                                            key={game.world.seed}
                                            seed={game.world.seed}
                                        />
                                    </Tab>
                                </Tabs>
                                <div className="mt-auto flex items-center justify-center gap-2 border-0 border-t border-solid border-game-gold/60 bg-black/45 p-4 backdrop-blur-[15px]">
                                    <Button
                                        label={started ? 'Stop' : 'Start'}
                                        onClick={() =>
                                            started ? game.stop() : game.start()
                                        }
                                    />
                                    {!started && (
                                        <Button
                                            label="Tick"
                                            onClick={() => game.tick()}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <Button
                        className="pointer-events-auto absolute top-1/2 -left-7 z-1 h-12 w-8 min-w-8 -translate-y-1/2 rounded-lg p-0 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                        label=""
                        icon={
                            <ChevronRight
                                size={18}
                                style={{
                                    transform: rightMenuOpen
                                        ? 'rotate(0deg)'
                                        : 'rotate(180deg)',
                                    transition: 'transform 180ms ease',
                                }}
                            />
                        }
                        onClick={() => setRightMenuOpen((open) => !open)}
                    />
                </div>
            )}
        </>
    )
}

const SettlementStatus = ({
    game,
    humanPlayer,
    onOpenMenu,
}: {
    game: Game
    humanPlayer: HumanPlayer
    onOpenMenu: () => void
}) => {
    const subscribe = useCallback(
        (refresh: () => void) =>
            game.emitter.on(
                [
                    'actorAdded',
                    'actorRemoved',
                    'started',
                    'woodStockChanged',
                    'meatStockChanged',
                ],
                refresh,
            ),
        [game],
    )
    const population = useSyncExternalStore(
        subscribe,
        () =>
            game
                .findActorsByType(ActorType.Human)
                .filter((actor) => actor.player === humanPlayer).length,
    )

    const wood = useSyncExternalStore(subscribe, () =>
        game.actors.reduce((total, actor) => {
            if (hasWoodStorage(actor) && actor.player === humanPlayer) {
                return total + actor.woodStock
            }
            return total
        }, 0),
    )

    const meat = useSyncExternalStore(subscribe, () =>
        game.actors.reduce(
            (total, actor) =>
                total +
                ((isHunterHutActor(actor) || isGuildhallActor(actor)) &&
                actor.player === humanPlayer
                    ? actor.meatStock
                    : 0),
            0,
        ),
    )

    return (
        <div className="pointer-events-auto fixed top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-black/50 px-4 py-2 whitespace-nowrap backdrop-blur-[15px] max-[540px]:gap-2 max-[540px]:px-2">
            <GameClock game={game} />
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-game-gold/60" />
            <span className="inline-flex items-center gap-2">
                <span className="inline-flex text-game-gold">
                    <Users size={16} aria-hidden="true" />
                </span>
                <span className="max-[540px]:sr-only">Population:</span>
                <strong className="font-semibold text-game-gold">{population}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
                <span className="inline-flex text-game-gold">
                    <WoodIcon />
                </span>
                <span className="max-[540px]:sr-only">Wood:</span>
                <strong className="font-semibold text-game-gold">{wood}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
                <span className="inline-flex text-game-gold">
                    <Beef size={16} aria-hidden="true" />
                </span>
                <span className="max-[540px]:sr-only">Meat:</span>
                <strong className="font-semibold text-game-gold">{meat}</strong>
            </span>
            <Button
                className="pointer-events-auto ml-1 rounded-full p-1.5"
                label=""
                icon={<Cog size={16} aria-hidden="true" />}
                onClick={onOpenMenu}
            />
        </div>
    )
}

export default App
