import {
  AnimationConfig,
  DoubleSize,
  LeaderStatusEffect,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { css, cx } from '@emotion/css';
import Stack, { VStack } from '@nkzw/stack';
import { memo, useEffect, useState } from 'react';
import Portrait from '../character/Portrait.tsx';
import Medal from '../Medal.tsx';
import CardTitle, { CardInfoHeading } from './CardTitle.tsx';
import LeaderTitle from './LeaderTitle.tsx';

export default memo(function LeaderCard({
  unit,
  viewer,
}: {
  unit: Unit;
  viewer: PlayerID | null;
}) {
  const [variant, setVariant] = useState(0);
  const { info, player } = unit;

  useEffect(() => {
    const interval = setInterval(() => {
      setVariant((variant + 1) % info.sprite.portrait.variants);
    }, AnimationConfig.AnimationDuration * 10);
    return () => clearInterval(interval);
  }, [info.sprite.portrait.variants, variant]);

  const viewerIsPlayer = viewer != null && viewer === player;
  return (
    <Stack between gap>
      <div className={fullWidthStyle}>
        <VStack between gap={16} wrap>
          <VStack between gap wrap>
            <CardTitle player={player}>{unit.getName(viewer)}</CardTitle>
            <Stack gap wrap>
              <Medal player={unit.player} />
              <LeaderTitle gender={info.gender} />
            </Stack>
          </VStack>
          <VStack between gap wrap>
            {viewerIsPlayer && (
              <CardInfoHeading player={player}>
                <fbt desc="About unit leader headline">About</fbt>
              </CardInfoHeading>
            )}
            <div
              className={cx(
                descriptionStyle,
                player !== viewer && portraitOffsetStyle,
              )}
            >
              <div className={portraitContainerStyle}>
                <Portrait
                  animate
                  player={player}
                  unit={info}
                  variant={variant}
                />
              </div>
              {viewerIsPlayer ? <p>{info.characterDescription}</p> : null}
              <VStack between gap wrap>
                <CardInfoHeading className={marginTopStyle} player={player}>
                  <fbt desc="About leader unit buffs">Bonus</fbt>
                </CardInfoHeading>
                <div className={descriptionStyle}>
                  <fbt desc="Explanation for leader buffs">
                    Leader units receive a{' '}
                    <fbt:param name="buff">
                      {LeaderStatusEffect * 100}
                    </fbt:param>%
                    attack and defense bonus.
                  </fbt>
                </div>
              </VStack>
            </div>
          </VStack>
        </VStack>
      </div>
    </Stack>
  );
});

const fullWidthStyle = css`
  width: 100%;
`;

const portraitContainerStyle = css`
  width: fit-content;
  margin: -${DoubleSize * 2.15}px 0 ${TileSize}px ${TileSize}px;
  float: right;

  ${Breakpoints.sm} {
    float: right;
    margin: -${DoubleSize * 2.5}px 0 ${TileSize}px ${TileSize}px;
    padding-right: 4px;
  }

  ${Breakpoints.xl} {
    padding-right: 4px;
  }
`;

const marginTopStyle = css`
  margin-top: 16px;
`;

const descriptionStyle = css`
  line-height: 1.4em;
`;

const portraitOffsetStyle = css`
  margin-top: ${TileSize * 1.5}px;
`;
