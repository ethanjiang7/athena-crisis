import { ClientLevelID, Level as LevelT } from '@deities/hermes/Types.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import getTagColor from '@deities/ui/lib/getTagColor.tsx';
import { css, cx } from '@emotion/css';
import Edit from '@iconify-icons/pixelarticons/edit.js';
import sortBy from '@nkzw/core/sortBy.js';
import Stack, { VStack } from '@nkzw/stack';
import { memo, useMemo } from 'react';
import ActionCard from '../editor/lib/ActionCard.tsx';
import EffectTitle from '../editor/lib/EffectTitle.tsx';
import useEffects from '../hooks/useEffects.tsx';
import useMapData from '../hooks/useMapData.tsx';
import getMapName from '../i18n/getMapName.tsx';
import sortByDepth from './lib/sortByDepth.tsx';
import { CampaignEditorSetMapFunction, MapNode } from './Types.tsx';

export default memo(function LevelDialogue({
  depth = 0,
  depthMap,
  level,
  maps,
  setMap,
}: {
  depth?: number;
  depthMap: ReadonlyMap<string, number>;
  level: LevelT<ClientLevelID>;
  maps: ReadonlyMap<ClientLevelID, MapNode>;
  setMap: CampaignEditorSetMapFunction;
}) {
  const node = maps.get(level.mapId);
  const map = useMapData(node?.state);
  const effects = useEffects(node?.effects);
  const sortedEffects = useMemo(() => {
    return sortBy([...effects], ([trigger]) =>
      trigger === 'Start'
        ? 0
        : trigger === 'GameEnd'
          ? Number.POSITIVE_INFINITY
          : 1,
    );
  }, [effects]);

  if (!node || !map) {
    return null;
  }

  const next = level.next;
  return (
    <>
      {effects && (
        <VStack between className={selectStyle} gap={16}>
          <h2 style={{ color: getColor(getTagColor(node.name)) }}>
            {getMapName(node.name)}
          </h2>
          {sortedEffects.map(([trigger, effectList]) =>
            [...effectList].map((effect, index) => (
              <VStack between gap={16} key={`${trigger}-${index}`} wrap>
                <Stack alignCenter between gap>
                  <EffectTitle
                    effect={effect}
                    effects={effects}
                    objectives={map.config.objectives}
                    trigger={trigger}
                  />
                  <Icon
                    className={cx(iconActiveStyle, SquareButtonStyle)}
                    icon={Edit}
                    onClick={() =>
                      setMap(node.id, 'effects', {
                        effects,
                        scenario: { effect, trigger },
                      })
                    }
                  />
                </Stack>
                {effect.actions.map((action, index) => {
                  return (
                    <ActionCard
                      action={action}
                      biome={map.config.biome}
                      hasContentRestrictions={false}
                      key={index}
                      scrollRef={null}
                      user={null}
                    />
                  );
                })}
              </VStack>
            )),
          )}
        </VStack>
      )}
      {next?.length ? (
        <VStack between gap={24} wrap>
          {sortByDepth(next, depthMap).map((entry) => (
            <LevelDialogue
              depth={depth + 1}
              depthMap={depthMap}
              key={(Array.isArray(entry) ? entry[1] : entry).mapId}
              level={Array.isArray(entry) ? entry[1] : entry}
              maps={maps}
              setMap={setMap}
            />
          ))}
        </VStack>
      ) : null}
    </>
  );
});

const selectStyle = css`
  user-select: text !important;
`;

const iconActiveStyle = css`
  color: ${applyVar('text-color-active')};
`;
