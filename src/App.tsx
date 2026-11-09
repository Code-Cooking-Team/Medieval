import { FloraSpawner } from '+game/actors/flora/FloraSpawner'
import { hasWoodStorage, isGuildhallActor, isHunterHutActor } from '+game/actors/helpers'
import { Game, GameJSON } from '+game/Game'
import { HumanPlayer } from '+game/player/HumanPlayer'
import { InteractionsManager } from '+game/player/interaction/InteractionsManager'
import { NaturePlayer } from '+game/player/NaturePlayer'
import { PlayerType } from '+game/player/types'
import '+game/professions/machines/woodcutterMachine'
import { Renderer } from '+game/Renderer'
import { ActorType } from '+game/types'
import { generateWorld } from '+game/world/generateWorld'
import { random } from '+helpers/random'
import { Box } from '+ui/components/base/Box'
import { Button } from '+ui/components/base/Button'
import { WoodIcon } from '+ui/components/icons/WoodIcon'
import { Tab } from '+ui/components/tabs/Tab'
import { Tabs } from '+ui/components/tabs/Tabs'
import { useLocalStorage } from '+ui/hooks/useLocalStorage'
import { ConfigForm } from '+ui/modules/config/ConfigForm'
import { SelectedList } from '+ui/modules/selected/SelectedList'
import { SpawnList } from '+ui/modules/spawn/SpawnList'
import { TerrainSeed } from '+ui/modules/terrain/TerrainSeed'

import styled from '@emotion/styled'
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
                <GameMenuOverlay showcase={isShowcase}>
                    <GameMenuPanel>
                        <GameMenuTitle>MEDIEVAL</GameMenuTitle>
                        <GameMenuActions>
                            {!isShowcase && (
                                <GameActionButton
                                    label="Continue"
                                    onClick={() => setGameMenuOpen(false)}
                                />
                            )}
                            <GameActionButton
                                label="New Game"
                                icon={<FilePlus size={16} aria-hidden="true" />}
                                onClick={newGame}
                            />
                            {!isShowcase && (
                                <GameActionButton
                                    label="Save"
                                    icon={<Save size={16} aria-hidden="true" />}
                                    onClick={() => {
                                        setSavedJson(game.toJSON())
                                        setGameMenuOpen(false)
                                    }}
                                />
                            )}
                            {savedJson && (
                                <GameActionButton
                                    label="Load"
                                    icon={<FolderOpen size={16} aria-hidden="true" />}
                                    onClick={() => loadGame(savedJson)}
                                />
                            )}
                        </GameMenuActions>
                    </GameMenuPanel>
                </GameMenuOverlay>
            )}
            {!isShowcase && (
                <RightFrame isOpen={rightMenuOpen}>
                    <Right isOpen={rightMenuOpen}>
                        {rightMenuOpen && (
                            <RightContent>
                                <Tabs>
                                    <Tab label="Game" icon={Gamepad2}>
                                        <Box
                                            p={3}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            flexWrap="wrap"
                                            columnGap={2}
                                            rowGap={2}
                                        >
                                            <GameActionButton
                                                label="Save"
                                                icon={
                                                    <Save size={14} aria-hidden="true" />
                                                }
                                                onClick={() =>
                                                    setSavedJson(game.toJSON())
                                                }
                                            />
                                            {savedJson && (
                                                <GameActionButton
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
                                            <GameActionButton
                                                label="New"
                                                icon={
                                                    <FilePlus
                                                        size={14}
                                                        aria-hidden="true"
                                                    />
                                                }
                                                onClick={newGame}
                                            />
                                        </Box>
                                    </Tab>

                                    <Tab label="Spawn" icon={Users}>
                                        <SpawnList humanPlayer={humanPlayer} />
                                    </Tab>

                                    <Tab label="Config" icon={Settings}>
                                        <ConfigForm />
                                    </Tab>
                                    <Tab label="Terrain" icon={Mountain}>
                                        <TerrainSeed
                                            key={game.world.seed}
                                            seed={game.world.seed}
                                        />
                                    </Tab>
                                </Tabs>
                                <GameControls>
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
                                </GameControls>
                            </RightContent>
                        )}
                    </Right>
                    <CollapseButton
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
                </RightFrame>
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
        <SettlementStatusBox p={2} px={3} display="flex" columnGap={3}>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <StatusIcon>
                    <Users size={16} aria-hidden="true" />
                </StatusIcon>
                Population: <StatusValue>{population}</StatusValue>
            </Box>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <StatusIcon>
                    <WoodIcon />
                </StatusIcon>
                Wood: <StatusValue>{wood}</StatusValue>
            </Box>
            <Box as="span" display="inline-flex" alignItems="center" columnGap={2}>
                <StatusIcon>
                    <Beef size={16} aria-hidden="true" />
                </StatusIcon>
                Meat: <StatusValue>{meat}</StatusValue>
            </Box>
            <SettingsButton
                label=""
                icon={<Cog size={16} aria-hidden="true" />}
                onClick={onOpenMenu}
            />
        </SettlementStatusBox>
    )
}

const SettlementStatusBox = styled(Box)({
    position: 'fixed',
    zIndex: 10,
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
    whiteSpace: 'nowrap',
    pointerEvents: 'auto',
})

const StatusIcon = styled.span(({ theme }) => ({
    display: 'inline-flex',
    color: theme.colors.primary,
}))
const StatusValue = styled.strong(({ theme }) => ({
    color: theme.colors.primary,
    fontWeight: 600,
}))

const SettingsButton = styled(Button)({
    padding: 6,
    marginLeft: 4,
    borderRadius: '50%',
    pointerEvents: 'auto',
    cursor: 'pointer',
})
const GameMenuOverlay = styled('div', {
    shouldForwardProp: (prop) => prop !== 'showcase',
})<{ showcase: boolean }>(({ showcase }) => ({
    position: 'fixed',
    zIndex: 20,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: showcase ? 'flex-start' : 'center',
    padding: showcase ? 'clamp(16px, 5vw, 80px)' : 24,
    background: showcase
        ? 'linear-gradient(90deg, rgba(5, 7, 5, 0.46), transparent 65%)'
        : 'rgba(5, 7, 5, 0.62)',
    backdropFilter: showcase ? undefined : 'blur(5px)',
    '@media (max-width: 700px)': {
        alignItems: showcase ? 'flex-end' : 'center',
        justifyContent: 'center',
    },
}))
const GameMenuPanel = styled.div(({ theme }) => ({
    width: 'min(440px, 100%)',
    padding: '40px 36px',
    borderRadius: 16,
    border: `1px solid ${theme.colors.primary}99`,
    background: 'rgba(24, 23, 18, 0.94)',
    boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
    textAlign: 'center',
}))
const GameMenuTitle = styled.h1(({ theme }) => ({
    margin: '0 0 32px',
    color: theme.colors.primary,
    fontSize: 32,
    letterSpacing: '0.16em',
}))
const GameMenuActions = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    '& button': { justifyContent: 'center', minHeight: 44, fontSize: 16 },
})

const GameActionButton = styled(Button)({
    paddingInline: 10,
})

const RightFrame = styled(Box, { shouldForwardProp: (prop) => prop !== 'isOpen' })<{
    isOpen: boolean
}>(({ isOpen }) => ({
    position: 'absolute',
    zIndex: 10,
    top: 12,
    right: 12,
    bottom: 12,
    width: isOpen ? 'min(90vw, 280px)' : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    transition: 'width 180ms ease',
    '@media (max-width: 800px)': { top: 84, bottom: 12 },
}))

const Right = styled(Box, { shouldForwardProp: (prop) => prop !== 'isOpen' })<{
    isOpen: boolean
}>({
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(15px)',
    borderRadius: 8,
})

const RightContent = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
})
const GameControls = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space[2],
    marginTop: 'auto',
    padding: theme.space[3],
    background: 'rgba(0,0,0,0.45)',
    borderTop: `1px solid ${theme.colors.primary}99`,
    backdropFilter: 'blur(15px)',
}))
const CollapseButton = styled(Button)({
    position: 'absolute',
    zIndex: 1,
    top: '50%',
    left: -28,
    transform: 'translateY(-50%)',
    width: 32,
    height: 48,
    minWidth: 32,
    padding: 0,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    pointerEvents: 'auto',
})

export default App
