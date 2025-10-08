import { Action } from '@deities/apollo/Action.tsx';
import { EffectTrigger } from '@deities/apollo/Effects.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import { Crystals } from '@deities/athena/invasions/Crystal.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  MaxCharges,
  MaxMessageLength,
} from '@deities/athena/map/Configuration.tsx';
import {
  DynamicPlayerIDs,
  encodeDynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import NumberInput from '@deities/ui/form/NumberInput.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InfoBox from '@deities/ui/InfoBox.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';
import ChevronDown from '@iconify-icons/pixelarticons/chevron-down.js';
import ChevronUp from '@iconify-icons/pixelarticons/chevron-up.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import parseInteger from '@nkzw/core/parseInteger.js';
import sortBy from '@nkzw/core/sortBy.js';
import ImmutableMap from '@nkzw/immutable-map';
import Stack, { VStack } from '@nkzw/stack';
import { fbt } from 'fbtee';
import { useInView } from 'framer-motion';
import { memo, ReactNode, RefObject, useMemo, useRef, useState } from 'react';
import InlineTileList from '../../card/InlineTileList.tsx';
import Portrait from '../../character/Portrait.tsx';
import { DrawerPosition } from '../../drawer/Drawer.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import translateMessage from '../../i18n/translateMessage.tsx';
import CrystalSprite from '../../invasions/CrystalSprite.tsx';
import Tick from '../../Tick.tsx';
import { PlayerDetails } from '../../Types.tsx';
import formatCharacterText from '../../ui/lib/formatCharacterText.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { ActionChangeFn } from '../panels/EffectsPanel.tsx';
import BiomeSelector from '../selectors/BiomeSelector.tsx';
import { SetMapFunction } from '../Types.tsx';
import UnitSelector from './UnitSelector.tsx';

type TopBarProps = Readonly<{
  first: boolean | undefined;
  index: number | undefined;
  last: boolean | undefined;
  onChange: ActionChangeFn | undefined;
}>;

const playerIDs = sortBy([...DynamicPlayerIDs], (id) => {
  if (id === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const number = encodeDynamicPlayerID(id);
  return number < 0 ? 1 / number : number;
});

const playerIDsWithoutNeutral = playerIDs.filter((id) => id !== 0);

const biomes = Biomes.filter((biome) => biome !== Biome.Spaceship);

const TopBarIcons = ({ first, index, last, onChange }: TopBarProps) =>
  onChange && index != null ? (
    <Stack alignCenter between gap={4}>
      {!first && (
        <Icon
          button
          className={iconStyle}
          icon={ChevronUp}
          onClick={() => onChange(index, 'up')}
        />
      )}
      {!last && (
        <Icon
          button
          className={iconStyle}
          icon={ChevronDown}
          onClick={() => onChange(index, 'down')}
        />
      )}
      <Icon
        button
        className={iconStyle}
        icon={Close}
        onClick={() => onChange(index, 'delete')}
      />
    </Stack>
  ) : null;

const ActionHeadline = ({
  children,
  focused,
  ...props
}: {
  children: ReactNode;
  focused?: boolean;
} & TopBarProps) => (
  <Stack between className={headlineStyle}>
    <h2>{children}</h2>
    {!focused && <TopBarIcons {...props} />}
  </Stack>
);

export default memo(function ActionCard({
  action,
  biome,
  currentPlayer,
  first,
  focused,
  formatText,
  hasContentRestrictions,
  index,
  last,
  map,
  onChange,
  playerDetails,
  position = 'bottom',
  scrollRef,
  setMap,
  trigger,
  user,
  userDisplayName,
}: {
  action: Action;
  biome: Biome;
  currentPlayer?: PlayerID;
  first?: boolean;
  focused?: true;
  formatText?: true;
  hasContentRestrictions: boolean;
  index?: number;
  last?: boolean;
  map?: MapData;
  onChange?: ActionChangeFn;
  playerDetails?: PlayerDetails;
  position?: DrawerPosition;
  scrollRef: RefObject<HTMLElement | null> | null;
  setMap?: SetMapFunction;
  trigger?: EffectTrigger;
  user: UserWithUnlocks | null;
  userDisplayName?: string;
}) {
  const ref = useRef(null);
  const isVisible = useInView(ref, {
    margin: '-100px 0px 100px 0px',
    root: scrollRef || undefined,
  });
  const canChange = onChange && index != null;
  const shouldRenderControls = (!scrollRef || isVisible) && canChange;
  const [animate, setAnimate] = useState(false);
  const hasCurrentPlayer = map && currentPlayer != null;

  const gameEndNotice = useMemo(
    () =>
      trigger === 'GameEnd' ? (
        <InfoBox>
          <p className={lightStyle}>
            <fbt desc="Game end spawn effect conflict note">
              Note: This Action is associated with a Game End Effect and will be
              removed upon saving. If you want to keep this action, please
              change the effect type, for example by changing the objective to
              be optional.
            </fbt>
          </p>
        </InfoBox>
      ) : null,
    [trigger],
  );

  if (action.type === 'CharacterMessageEffect') {
    const unit = getUnitInfoOrThrow(action.unitId);
    const portrait = unit?.sprite.portrait;
    const player = hasCurrentPlayer
      ? resolveDynamicPlayerID(map, action.player, currentPlayer)
      : action.player;
    const shouldFormatText =
      formatText && playerDetails && map && userDisplayName;
    const message = shouldFormatText
      ? formatCharacterText(
          translateMessage(action),
          unit,
          hasCurrentPlayer && currentPlayer === player
            ? 'characterName'
            : 'name',
          map,
          (typeof player === 'number' ? player : currentPlayer) || 0,
          playerDetails,
        )
      : action.message;
    const MessageComponent = shouldFormatText ? Stack : Box;

    return (
      <Stack
        className={messageStyle}
        ref={ref}
        style={{
          [vars.set('portraits')]: portrait.variants,
        }}
      >
        <Dropdown
          className={portraitStyle}
          dropdownClassName={cx(
            portraitSelectorStyle,
            position === 'bottom' &&
              cx(
                bottomPortraitSelectorStyle,
                portrait.variants > 3 && portraitWithManyVariantsStyle,
              ),
          )}
          shouldRenderControls={!!(canChange && shouldRenderControls)}
          title={
            <Portrait
              animate={isVisible && animate}
              player={player}
              scale="adaptive"
              silhouette={action.silhouette}
              unit={unit}
              variant={action.variant}
            />
          }
        >
          <Stack between gap>
            {Array.from({ length: portrait.variants }, (_, index) => index).map(
              (variant) => (
                <div
                  className={cx(
                    selectPortraitStyle,
                    (action.variant || 0) === variant && selectedPortraitStyle,
                  )}
                  key={variant}
                  onClick={
                    canChange
                      ? () => onChange(index, 'update', { ...action, variant })
                      : undefined
                  }
                >
                  <Portrait
                    animate={isVisible}
                    player={player}
                    silhouette={action.silhouette}
                    unit={unit}
                    variant={variant}
                  />
                </div>
              ),
            )}
          </Stack>
        </Dropdown>
        <MessageComponent
          className={cx(messageBoxStyle, !shouldFormatText && marginStyle)}
          gap
          vertical
        >
          <Stack alignCenter between className={headlineStyle} gap>
            <Stack alignCenter between gap stretch>
              <Stack alignCenter gap>
                {!hasCurrentPlayer && (
                  <Dropdown
                    dropdownClassName={playerSelectorStyle}
                    shouldRenderControls={!!(canChange && shouldRenderControls)}
                    title={<PlayerIcon id={player} inline />}
                  >
                    <VStack between className={playerSelectorListStyle}>
                      {playerIDs.map((id) => (
                        <PlayerIcon
                          id={id}
                          key={id}
                          onClick={
                            canChange
                              ? () =>
                                  onChange(index, 'update', {
                                    ...action,
                                    player: id,
                                  })
                              : undefined
                          }
                          selected={player === id}
                        />
                      ))}
                    </VStack>
                  </Dropdown>
                )}
                <UnitSelector
                  currentPlayer={currentPlayer}
                  hasContentRestrictions={hasContentRestrictions}
                  isVisible={isVisible}
                  map={map}
                  onSelect={
                    canChange
                      ? ({ id }) =>
                          onChange(index, 'update', {
                            ...action,
                            unitId: id,
                            variant: undefined,
                          })
                      : undefined
                  }
                  selectedPlayer={action.player}
                  selectedUnit={unit}
                  silhouette={action.silhouette}
                  user={user}
                />
              </Stack>
              {canChange && (
                <label>
                  <Stack alignCenter gap>
                    <input
                      checked={!!action.silhouette}
                      onChange={
                        canChange
                          ? ({ target }) =>
                              onChange(index, 'update', {
                                ...action,
                                silhouette: target.checked,
                              })
                          : undefined
                      }
                      type="checkbox"
                    />
                    <span>
                      <fbt desc="Label for silhouette checkbox">Silhouette</fbt>
                    </span>
                  </Stack>
                </label>
              )}
            </Stack>
            <TopBarIcons
              first={first}
              index={index}
              last={last}
              onChange={onChange}
            />
          </Stack>
          {canChange ? (
            <textarea
              className={cx(textareaStyle, heightStyle)}
              maxLength={MaxMessageLength}
              onBlur={() => setAnimate(false)}
              onChange={(event) =>
                onChange(index, 'update', {
                  ...action,
                  message: event.target.value,
                })
              }
              onFocus={() => setAnimate(true)}
              placeholder={fbt(
                'Type a message…',
                'Placeholder for action message text',
              )}
              value={action.message}
            />
          ) : (
            <div className={cx(textareaStyle, selectableTextStyle)}>
              {message}
            </div>
          )}
        </MessageComponent>
      </Stack>
    );
  } else if (action.type === 'SpawnEffect') {
    const { player } = action;
    const vectors = [...action.units.keys()];
    return (
      <Box between className={boxStyle} gap={16} vertical wrap>
        <ActionHeadline
          first={first}
          focused={focused}
          index={index}
          last={last}
          onChange={onChange}
        >
          <fbt desc="Label for Spawn Effect">Spawn</fbt>
        </ActionHeadline>
        <VStack between gap wrap>
          <Stack alignStart between wrap>
            <Tick animationConfig={AnimationConfig}>
              <InlineTileList
                biome={biome}
                buildings={vectors.map((vector) => map?.buildings.get(vector))}
                onSelect={
                  canChange && setMap && map
                    ? (_, { index: unitIndex }) => {
                        const units = [...action.units];
                        const [vector, unit] = units[unitIndex];

                        if (
                          canDeploy(
                            map.copy({ units: map.units.delete(vector) }),
                            unit.info,
                            vector,
                            true,
                          )
                        ) {
                          setMap(
                            'units',
                            map.copy({
                              units: map.units.set(vector, unit),
                            }),
                          );
                        }

                        onChange(index, 'update', {
                          ...action,
                          units: ImmutableMap(
                            units.filter((_, index) => index !== unitIndex),
                          ),
                        });
                      }
                    : undefined
                }
                tiles={vectors.map(
                  (vector) => map?.getTileInfo(vector) || Plain,
                )}
                units={[...action.units.values()]}
              />
            </Tick>
          </Stack>
        </VStack>
        <Stack alignCenter between gap={16} wrap>
          <fbt desc="Label to pick which player to spawn units as">
            Spawn units as player:
          </fbt>
          <Stack between gap={16}>
            {canChange ? (
              <>
                <InlineLink
                  className={spawnLinkStyle}
                  onClick={() =>
                    onChange(index, 'update', {
                      ...action,
                      player: undefined,
                    })
                  }
                  selected={player == null}
                >
                  <fbt desc="Label for spawning players as is">default</fbt>
                </InlineLink>
                {playerIDs.map((id) => (
                  <PlayerIcon
                    id={id}
                    key={id}
                    onClick={() =>
                      onChange(index, 'update', {
                        ...action,
                        player: id,
                      })
                    }
                    selected={player === id}
                  />
                ))}
              </>
            ) : player == null ? (
              <fbt desc="Label for spawning players as is">default</fbt>
            ) : (
              <PlayerIcon id={player} />
            )}
          </Stack>
        </Stack>
        {canChange ? (
          <Stack wrap>
            <InlineLink onClick={() => onChange(index, 'toggle-select-units')}>
              {focused ? (
                <fbt desc="Label to stop selecting units">
                  Stop selecting units
                </fbt>
              ) : (
                <fbt desc="Button to select spawn effect units">
                  Select units
                </fbt>
              )}
            </InlineLink>
          </Stack>
        ) : null}
        {gameEndNotice}
      </Box>
    );
  } else if (action.type === 'ActivateCrystal') {
    const { biome, crystal } = action;
    return (
      <Box between className={boxStyle} gap={16} vertical wrap>
        <ActionHeadline
          first={first}
          focused={focused}
          index={index}
          last={last}
          onChange={onChange}
        >
          <fbt desc="Label for Spawn Effect">Activate Crystal</fbt>
        </ActionHeadline>
        <VStack between gap={16} wrap>
          {canChange ? (
            <>
              <Stack alignCenter center gap={16} wrap>
                {Crystals.map((crystal) => (
                  <InlineLink
                    className={crystalStyle}
                    key={crystal}
                    onClick={() =>
                      onChange(index, 'update', {
                        ...action,
                        crystal,
                      })
                    }
                    selected={crystal === action.crystal}
                  >
                    <CrystalSprite animate crystal={crystal} />
                  </InlineLink>
                ))}
              </Stack>
              {map && (
                <Stack center gap wrap>
                  <BiomeSelector
                    biomes={biomes}
                    hasContentRestrictions={false}
                    map={
                      biome != null
                        ? map.copy({
                            config: map.config.copy({
                              biome,
                            }),
                          })
                        : map
                    }
                    onBiomeChange={(map) =>
                      onChange(index, 'update', {
                        ...action,
                        biome: map.config.biome,
                      })
                    }
                    user={null}
                  />
                </Stack>
              )}
            </>
          ) : (
            <Stack alignCenter center gap={24} wrap>
              <CrystalSprite animate crystal={crystal} />
              {biome != null && (
                <InlineTileList
                  biome={biome}
                  scrollIntoView={false}
                  tiles={[Plain]}
                />
              )}
            </Stack>
          )}
        </VStack>
      </Box>
    );
  } else if (
    action.type === 'IncreaseChargeEffect' ||
    action.type === 'IncreaseFundsEffect'
  ) {
    const isCharge = action.type === 'IncreaseChargeEffect';
    const max = isCharge ? MaxCharges : Number.MAX_SAFE_INTEGER;
    const value = isCharge ? action.charges : action.funds;
    const { player } = action;
    return (
      <Box between className={boxStyle} gap={16} vertical wrap>
        <ActionHeadline
          first={first}
          focused={focused}
          index={index}
          last={last}
          onChange={onChange}
        >
          {isCharge ? (
            <fbt desc="Label for Increase Charge Effect">Increase Charge</fbt>
          ) : (
            <fbt desc="Label for Increase Funds Effect">Increase Funds</fbt>
          )}
        </ActionHeadline>
        <Stack alignCenter between gap wrap>
          <span>
            {isCharge ? (
              <fbt desc="Label for Increase Charge Effect">Charges:</fbt>
            ) : (
              <fbt desc="Label for Increase Funds Effect">Funds:</fbt>
            )}
          </span>
          {canChange ? (
            <NumberInput
              max={max}
              min={1}
              onChange={({ target: { value } }) => {
                const amount = parseInteger(value) || 0;
                if (amount != null) {
                  onChange(index, 'update', {
                    ...action,
                    [isCharge ? 'charges' : 'funds']: Math.min(amount, max),
                  });
                }
              }}
              required
              style={{ width: 100 }}
              value={value}
            />
          ) : (
            value
          )}
        </Stack>
        <Stack alignCenter between gap={16} wrap>
          <fbt desc="Label to pick a player">Player:</fbt>
          <Stack between gap={16}>
            {canChange ? (
              <>
                {playerIDsWithoutNeutral.map((id) => (
                  <PlayerIcon
                    id={id}
                    key={id}
                    onClick={() =>
                      onChange(index, 'update', {
                        ...action,
                        player: id,
                      })
                    }
                    selected={player === id}
                  />
                ))}
              </>
            ) : (
              <PlayerIcon id={player} />
            )}
          </Stack>
        </Stack>
        {gameEndNotice}
      </Box>
    );
  }

  return (
    <Box between className={boxStyle} wrap>
      <Stack between className={headlineStyle}>
        <h2>{action.type}</h2>
        <TopBarIcons
          first={first}
          index={index}
          last={last}
          onChange={onChange}
        />
      </Stack>
    </Box>
  );
});

const vars = new CSSVariables<'portraits'>('ad');

const boxStyle = css`
  margin: 4px 2px 4px 0px;
  flex-shrink: 0;
`;

const portraitStyle = css`
  height: fit-content;
`;

const portraitSelectorStyle = css`
  bottom: -2px;
  left: -4px;
  padding: 2px 4px;
  top: -2px;
  transform-origin: left center;
`;

const bottomPortraitSelectorStyle = css`
  ${Breakpoints.lg} {
    transform-origin: center center;
    left: calc(
      (${vars.apply('portraits')} - 1) * -50% -
        (${vars.apply('portraits')} * 4px)
    );
    right: calc(
      (${vars.apply('portraits')} - 1) * -50% -
        (${vars.apply('portraits')} * 4px)
    );
  }
`;

const portraitWithManyVariantsStyle = css`
  ${Breakpoints.lg} {
    left: calc(
      (${vars.apply('portraits')} - 4) * -50% -
        ((${vars.apply('portraits')} - 3) * 4px)
    );
    right: calc(
      (${vars.apply('portraits')} - 2) * -100% -
        ((${vars.apply('portraits')} + 3) * 4px)
    );
  }
`;

const selectPortraitStyle = css`
  cursor: pointer;

  transition:
    transform 150ms ease,
    filter 150ms ease;
  transform: scale(1);
  filter: grayscale(1);

  &:hover {
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const selectedPortraitStyle = css`
  filter: grayscale(0);
`;

const playerSelectorStyle = css`
  left: -12px;
  overflow-y: auto;
  top: -12px;
`;

const playerSelectorListStyle = css`
  gap: 12px;
  padding: 2px;
  padding: 8px;
`;

const messageStyle = css`
  margin: 0 2px 0 -4px;
`;

const messageBoxStyle = css`
  align-content: start;
  align-items: start;
  flex-grow: 1;
  margin: 0 0 0 16px;
`;

const marginStyle = css`
  margin: 4px 0 4px 16px;
`;

const headlineStyle = css`
  height: 1em;
  width: 100%;
`;

const textareaStyle = css`
  html body & {
    background: none;
    box-shadow: none;
    line-height: 1.4em;
    margin: 0;
    padding: 0;

    &:focus {
      box-shadow: none;
    }
  }
`;

const heightStyle = css`
  height: 90px;
  overflow: auto;
`;

const selectableTextStyle = css`
  user-select: text;
`;

const iconStyle = css`
  cursor: pointer;
`;

const spawnLinkStyle = css`
  ${pixelBorder(applyVar('background-color'), 2)}

  background: ${applyVar('background-color')};
  align-items: center;
  padding: 0 4px;
`;

const lightStyle = css`
  opacity: 0.7;
`;

const crystalStyle = css`
  padding: 8px;
`;
