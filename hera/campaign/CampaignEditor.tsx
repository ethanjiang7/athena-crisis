import getCampaignRoute from '@deities/apollo/routes/getCampaignRoute.tsx';
import getMapRoute from '@deities/apollo/routes/getMapRoute.tsx';
import {
  AttributeRangeWithZero,
  validateAttributeRange,
} from '@deities/athena/lib/getAttributeRange.tsx';
import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import getCampaignLevelDepths from '@deities/hermes/getCampaignLevelDepths.tsx';
import { PlayStyle } from '@deities/hermes/PlayStyle.tsx';
import toCampaign from '@deities/hermes/toCampaign.tsx';
import toLevelMap from '@deities/hermes/toLevelMap.tsx';
import toPlainCampaign from '@deities/hermes/toPlainCampaign.tsx';
import { Campaign, ClientLevelID, PlainLevel } from '@deities/hermes/Types.tsx';
import unrollCampaign from '@deities/hermes/unrollCampaign.tsx';
import validateCampaign from '@deities/hermes/validateCampaign.tsx';
import { App } from '@deities/ui/App.tsx';
import Breakpoints, { sm } from '@deities/ui/Breakpoints.tsx';
import { isAndroid, isIOS } from '@deities/ui/Browser.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar, insetStyle } from '@deities/ui/cssVar.tsx';
import Dialog, { DialogScrollContainer } from '@deities/ui/Dialog.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import ErrorText from '@deities/ui/ErrorText.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import useMedia from '@deities/ui/hooks/useMedia.tsx';
import useNavigate from '@deities/ui/hooks/useNavigate.tsx';
import { usePrompt } from '@deities/ui/hooks/usePrompt.tsx';
import Icon from '@deities/ui/Icon.tsx';
import CreateMap from '@deities/ui/icons/CreateMap.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Portal from '@deities/ui/Portal.tsx';
import PrimaryExpandableMenuButton from '@deities/ui/PrimaryExpandableMenuButton.tsx';
import ScrollContainer from '@deities/ui/ScrollContainer.tsx';
import {
  TypeaheadDataSource,
  TypeaheadDataSourceEntry,
} from '@deities/ui/Typeahead.tsx';
import { css } from '@emotion/css';
import Check from '@iconify-icons/pixelarticons/check.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Copy from '@iconify-icons/pixelarticons/copy.js';
import DialogueIcon from '@iconify-icons/pixelarticons/message-text.js';
import Stack, { VStack } from '@nkzw/stack';
import { fbt } from 'fbtee';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import useMusic, { usePlayMusic } from '../audio/Music.tsx';
import useSetTags from '../editor/hooks/useSetTags.tsx';
import ZoomButton from '../editor/lib/ZoomButton.tsx';
import useHide from '../hooks/useHide.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import Notification from '../ui/Notification.tsx';
import Level from './Level.tsx';
import LevelDialogue from './LevelDialogue.tsx';
import CampaignEditorPanel from './panels/CampaignEditorControlPanel.tsx';
import { UserNode } from './panels/CampaignEditorSettingsPanel.tsx';
import {
  CampaignEditorSaveState,
  CampaignEditorSetMapFunction,
  CampaignEditorState,
  CampaignObject,
  MapEditorContainerProps,
  MapNode,
  UpdateCampaignFunction,
} from './Types.tsx';

export default function CampaignEditor({
  addMap,
  campaign: data,
  editorComponent: MapEditor,
  exportMap,
  initialMapId,
  isAdmin,
  isValidName,
  mapDataSource,
  maps,
  updateCampaign,
  userDataSource,
  users: initialUsers,
  viewer,
}: {
  addMap: (map: MapNode) => void;
  campaign: CampaignObject & { slug: string | null };
  editorComponent: ComponentType<
    MapEditorContainerProps & {
      slug?: string;
    }
  >;
  exportMap: (mapId: string) => void;
  initialMapId?: string | null;
  isAdmin?: boolean;
  isValidName: (name: string, extraCharacters: string) => boolean;
  mapDataSource: TypeaheadDataSource<MapNode>;
  maps: ReadonlyMap<ClientLevelID, MapNode>;
  updateCampaign: UpdateCampaignFunction;
  userDataSource: TypeaheadDataSource<UserNode>;
  users: ReadonlyArray<UserNode>;
  viewer: { id: string };
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [, startTransition] = useTransition();
  const { slug } = data;
  const [renderKey, setRenderKey] = useState(0);
  const [hasChanges, setHasChanges] = useState(!data.id);
  const [mapHasChanges, setMapHasChanges] = useState(false);
  const [origin, setOrigin] = useState('');
  const [difficulty, setDifficulty] = useState<AttributeRangeWithZero>(
    validateAttributeRange(data.difficulty) ? data.difficulty : 0,
  );
  const [description, setDescription] = useState<string>(
    data?.description || '',
  );
  const [tags, _setTags] = useState<ReadonlyArray<string>>(data?.tags || []);
  const setTags = useSetTags(_setTags);
  const [users, _setUsers] = useState<ReadonlyArray<UserNode>>(
    initialUsers || [],
  );
  const [saveState, _setSaveState] = useState<CampaignEditorSaveState | null>(
    null,
  );

  const setSaveState = useCallback((state: CampaignEditorSaveState | null) => {
    if (state && 'id' in state && state?.id === 'saved') {
      setHasChanges(false);
    }
    _setSaveState(state);
  }, []);

  const setUsers = useCallback(
    (users: ReadonlyArray<UserNode>) => {
      if (!users.some(({ id }) => id === viewer.id) && !isAdmin) {
        return setSaveState({ id: 'cannot-remove-self' });
      }
      _setUsers(users);
    },
    [isAdmin, setSaveState, viewer.id],
  );

  const [showAllDialogue, setShowAllDialogue] = useState(false);
  const onClose = useCallback(() => setShowAllDialogue(false), []);

  const [zoom, setZoom] = useState(1);

  const [campaign, setCampaign] = useState<Campaign<ClientLevelID>>(() =>
    toCampaign<ClientLevelID>({
      ...data,
      levels: toLevelMap<ClientLevelID>(JSON.parse(data.levels)),
    }),
  );

  const depthMap = useMemo(() => getCampaignLevelDepths(campaign), [campaign]);

  const [campaignName, _setCampaignName] = useState<string>(
    campaign?.name || '',
  );
  const setCampaignName = useCallback(
    (name: string) => {
      _setCampaignName(name);
      setHasChanges(true);
    },
    [setHasChanges, _setCampaignName],
  );

  const [campaignEditorState, _setCampaignEditorState] =
    useState<CampaignEditorState>(() => ({
      map: initialMapId ? maps.get(initialMapId) : undefined,
      mode: 'settings',
    }));

  const showMapEditor = !!(
    campaignEditorState.map || campaignEditorState.createMap
  );

  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(
    data?.playStyle || null,
  );

  const saveCampaign = useCallback(
    (type?: 'Export') => {
      updateCampaign(
        {
          description,
          difficulty,
          id: data.id,
          levels: JSON.stringify([
            ...toPlainCampaign<ClientLevelID>(campaign).levels,
          ]),
          name: campaignName,
          next: campaign.next.mapId,
          owners: users.map(({ id }) => id),
          playStyle,
          tags,
        },
        setSaveState,
        type,
      );
    },
    [
      campaign,
      campaignName,
      data.id,
      description,
      difficulty,
      playStyle,
      setSaveState,
      tags,
      updateCampaign,
      users,
    ],
  );

  const updateLevel = useCallback(
    (
      level:
        | PlainLevel<ClientLevelID>
        | ReadonlyArray<PlainLevel<ClientLevelID>>,
      newMap?: MapNode,
    ) => {
      const plainCampaign = toPlainCampaign(campaign);
      const levels = new Map(plainCampaign.levels);
      if (newMap && !levels.has(newMap.id)) {
        addMap(newMap);
        levels.set(newMap.id, {
          mapId: newMap.id,
        });
      }

      const levelList: ReadonlyArray<PlainLevel<ClientLevelID>> = Array.isArray(
        level,
      )
        ? level
        : [level];
      for (const levelData of levelList) {
        levels.set(levelData.mapId, levelData);
      }

      const newCampaign = toCampaign({
        ...plainCampaign,
        levels,
      });
      if (validateCampaign(newCampaign)) {
        setHasChanges(true);
        setCampaign(newCampaign);
      } else {
        setSaveState({ id: 'cycle' });
      }
    },
    [addMap, campaign, setSaveState],
  );

  const replaceFirstLevel = useCallback(
    (mapId: ClientLevelID) => {
      setHasChanges(true);
      setCampaign(toCampaign({ ...toPlainCampaign(campaign), next: mapId }));
    },
    [campaign],
  );

  const setCampaignEditorState = useCallback(
    (campaignEditorState: Partial<CampaignEditorState>) => {
      startTransition(() =>
        _setCampaignEditorState((state) => ({
          ...state,
          ...campaignEditorState,
        })),
      );
    },
    [startTransition],
  );

  const setMap: CampaignEditorSetMapFunction = useCallback(
    (mapId, mode, options) => {
      const node = maps.get(mapId);
      if (node) {
        if (isIOS || isAndroid) {
          navigate(`${getMapRoute(node.slug, 'edit')}?back=${pathname}`);
          return;
        }
        setOrigin(transformRef.current);
        setShowAllDialogue(false);
        setCampaignEditorState({
          map: node,
          mapEditorEffects: options?.effects,
          mapEditorMode: mode,
          mapEditorScenario: options?.scenario,
        });
      }
    },
    [maps, navigate, pathname, setCampaignEditorState],
  );

  useMusic('hestias-serenade');
  usePlayMusic(campaignEditorState.map?.id);

  const onSaveMap = useCallback(
    (map: MapNode) => {
      setCampaignEditorState({
        map,
      });
      setRenderKey((renderKey) => renderKey + 1);
      addMap(map);
      mapDataSource.updateEntry(
        new TypeaheadDataSourceEntry(map.name, map.id, map),
      );
    },
    [addMap, mapDataSource, setCampaignEditorState],
  );

  const { alert } = useAlert();
  const closeMap = useCallback(() => {
    const close = () => {
      setMapHasChanges(false);
      setCampaignEditorState({
        createMap: undefined,
        map: undefined,
      });
    };
    if (mapHasChanges) {
      alert({
        onAccept: close,
        text: fbt(
          `Your map has unsaved changes. Are you sure you want to close the map editor?`,
          'Prompt to confirm closing the map editor.',
        ),
      });
    } else {
      close();
    }
  }, [alert, mapHasChanges, setCampaignEditorState]);

  const exportMaps = useCallback(() => {
    for (const [mapId] of unrollCampaign(campaign)) {
      exportMap(mapId);
    }
  }, [campaign, exportMap]);

  const transformRef = useRef('');
  useEffect(() => {
    const listener = (event: PointerEvent) => {
      transformRef.current = toTransformOrigin(event);
    };
    document.addEventListener('pointermove', listener);
    return () => document.removeEventListener('pointermove', listener);
  }, []);

  useInput(
    'cancel',
    useCallback(
      (event) => {
        if (showMapEditor) {
          event.preventDefault();
          closeMap();
        }
      },
      [closeMap, showMapEditor],
    ),
    'dialog',
  );

  useInput(
    'save',
    useCallback(() => {
      saveCampaign();
    }, [saveCampaign]),
  );

  usePrompt({
    message: fbt(
      `Your campaign has unsaved changes. Are you sure you want to close the campaign editor?`,
      'Prompt to confirm navigating away for unsaved changes.',
    ),
    when: hasChanges,
  });

  useEffect(() => {
    if (saveState) {
      const timer = setTimeout(() => setSaveState(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveState, setSaveState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.sort();
    const search = params.toString();

    const newParams = new URLSearchParams();
    if (campaignEditorState?.map?.id) {
      newParams.set('map', campaignEditorState?.map?.id);
    }
    newParams.sort();
    const newSearch = newParams.toString();
    if (newSearch !== search) {
      window.history.pushState(
        {},
        '',
        window.location.pathname + `${newSearch ? `?${newSearch}` : ``}`,
      );
    }
  }, [campaignEditorState?.map?.id]);

  const [hasCopied, setHasCopied] = useState(false);
  const onCopy = useCallback(() => {
    if (slug) {
      App.writeToClipboard(
        `${window.location.origin}${getCampaignRoute(slug)}`,
      );
      setHasCopied(true);
    }
  }, [slug]);

  useEffect(() => {
    if (hasCopied) {
      const timeout = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [hasCopied]);

  const isLarge = useMedia(`(min-width: ${sm}px)`);
  const inset = isLarge ? TileSize * 3 : TileSize;
  const hasSaved = saveState && 'id' in saveState && saveState.id === 'saved';
  const hidden = useHide();

  return (
    <>
      <div className={containerStyle}>
        <Level
          dataSource={mapDataSource}
          depthMap={depthMap}
          key={`${renderKey}-${campaign.next.mapId}`}
          level={campaign.next}
          maps={maps}
          renderEntities={!showMapEditor}
          replaceFirstLevel={replaceFirstLevel}
          setMap={setMap}
          setSaveState={setSaveState}
          updateLevel={updateLevel}
          zoom={zoom / 2}
        />
      </div>
      <Portal>
        <PrimaryExpandableMenuButton
          hide={hidden}
          inset={0}
          isExpanded={false}
          size="wide"
          toggleExpanded={() => void 0}
        >
          <Stack
            alignCenter
            between
            className={primaryButtonStyle}
            gap
            onClick={onCopy}
          >
            <div className={ellipsis}>
              {campaignName || (
                <span className={lightColorStyle}>
                  <fbt desc="Fallback name for untitled campaign">
                    Untitled Campaign
                  </fbt>
                </span>
              )}
            </div>
            {slug && (
              <div>
                <InlineLink selectedText={hasCopied}>
                  {hasCopied ? (
                    <Stack
                      alignCenter
                      between
                      className={smallTextStyle}
                      gap={2}
                    >
                      <Icon height={18} icon={Check} width={18} />
                      <fbt desc="Text for copying a link">Copied</fbt>
                    </Stack>
                  ) : (
                    <Icon className={iconStyle} icon={Copy} />
                  )}
                </InlineLink>
              </div>
            )}
          </Stack>
        </PrimaryExpandableMenuButton>
        <ZoomButton
          hide={hidden}
          max={2}
          position="top"
          setZoom={setZoom}
          zoom={zoom}
        />
        <MenuButton
          className={mapCreateButtonStyle}
          hide={hidden}
          onClick={() => setCampaignEditorState({ createMap: true })}
        >
          <Icon button icon={CreateMap} />
        </MenuButton>
        <MenuButton
          className={dialogueButtonStyle}
          hide={hidden}
          onClick={() => setShowAllDialogue(true)}
        >
          <Icon button icon={DialogueIcon} />
        </MenuButton>
        <CampaignEditorPanel
          campaignEditorState={campaignEditorState}
          campaignExists={!!data.id}
          campaignName={campaignName}
          description={description}
          difficulty={difficulty}
          exportMaps={exportMaps}
          isAdmin={isAdmin}
          playStyle={playStyle}
          saveCampaign={saveCampaign}
          setCampaignName={setCampaignName}
          setDescription={setDescription}
          setDifficulty={setDifficulty}
          setPlayStyle={setPlayStyle}
          setTags={setTags}
          setUsers={setUsers}
          tags={tags}
          userDataSource={userDataSource}
          users={users}
        />
        <div className={showMapEditor ? mapEditorBackgroundStyle : undefined}>
          {showMapEditor && (
            <motion.div
              animate={{
                opacity: 1,
                transform: 'scale(1)',
              }}
              className={mapEditorContainerStyle}
              exit={{
                opacity: 0,
                transform: 'scale(0)',
              }}
              initial={{
                opacity: 0,
                transform: 'scale(0)',
              }}
              style={{
                transformOrigin: origin?.length ? origin : 'center center',
              }}
              transition={{
                duration: 0.25,
                ease: [0.34, 1.26, 0.64, 1],
              }}
            >
              <div className="background-absolute" />
              <ScrollContainer className={scrollStyle}>
                <MapEditor
                  campaignLock={data}
                  effects={campaignEditorState.mapEditorEffects}
                  inset={inset}
                  isValidName={isValidName}
                  mode={campaignEditorState.mapEditorMode}
                  onCreate={onSaveMap}
                  onUpdate={onSaveMap}
                  scenario={campaignEditorState.mapEditorScenario}
                  setHasChanges={setMapHasChanges}
                  slug={campaignEditorState.map?.slug}
                >
                  {({ delay, isPlayTesting }) =>
                    isPlayTesting ? null : (
                      <Portal>
                        <MenuButton
                          className={closeButtonStyle}
                          delay={hidden ? false : delay}
                          hide={hidden}
                          onClick={closeMap}
                          style={insetStyle(inset)}
                        >
                          <Icon button icon={Close} />
                        </MenuButton>
                      </Portal>
                    )
                  }
                </MapEditor>
              </ScrollContainer>
            </motion.div>
          )}
        </div>
        <AnimatePresence mode="sync">
          {saveState && (
            <Notification
              center={hasSaved || undefined}
              key={'id' in saveState ? saveState.id : saveState.message}
            >
              {hasSaved ? (
                <fbt desc="Text after saving a campaign">
                  Campaign
                  &quot;<fbt:param name="campaignName">
                    {campaignName}
                  </fbt:param>&quot;
                  was saved.
                </fbt>
              ) : (
                <ErrorText>
                  {'id' in saveState ? (
                    saveState.id === 'cycle' ? (
                      <fbt desc="Error message for campaign change causing a cycle">
                        Campaign cycle detected. Please select a map that
                        hasn&apos;t come up on the path yet.
                      </fbt>
                    ) : saveState.id === 'duplicate' ? (
                      <fbt desc="Error message for when a map already exists in this location">
                        The selected map is already part of this campaign&apos;s
                        path.
                      </fbt>
                    ) : saveState.id === 'name-exists' ? (
                      <fbt desc="A campaign with the same name already exists">
                        A campaign with this name already exists.
                      </fbt>
                    ) : saveState.id === 'invalid-name' ? (
                      <fbt desc="Campaign save error with invalid campaign name">
                        Invalid campaign name. Please choose a different
                        campaign name.
                      </fbt>
                    ) : saveState.id === 'cannot-remove-self' ? (
                      <fbt desc="Campaign label error when removing yourself">
                        You cannot remove yourself as owner of a campaign.
                      </fbt>
                    ) : (
                      <fbt desc="Generic error message">
                        Oops, something went wrong. Please try again.
                      </fbt>
                    )
                  ) : (
                    saveState.message
                  )}
                </ErrorText>
              )}
            </Notification>
          )}
        </AnimatePresence>
        {showAllDialogue && (
          <Dialog onClose={onClose} size="large" transformOrigin="90% top">
            <DialogScrollContainer key="dialogue" navigate>
              <VStack between gap={24} wrap>
                <h1>
                  <fbt desc="Headline for all campaign dialogue">
                    All Dialogue
                  </fbt>
                </h1>
                <LevelDialogue
                  depthMap={depthMap}
                  key={campaign.next.mapId}
                  level={campaign.next}
                  maps={maps}
                  setMap={setMap}
                />
              </VStack>
            </DialogScrollContainer>
          </Dialog>
        )}
      </Portal>
    </>
  );
}

const size = DoubleSize;
const containerStyle = css`
  margin: ${size}px 0 0 ${size}px;
  padding-bottom: 440px;
`;

const mapEditorBackgroundStyle = css`
  background-color: ${applyVar('background-color-light')};
  inset: 0;
  position: fixed;
`;

const mapEditorContainerStyle = css`
  ${pixelBorder(applyVar('background-color-light'))}
  background: ${applyVar('background-color')};
  overflow: hidden;
  position: fixed;

  inset: ${TileSize}px;
  ${Breakpoints.sm} {
    inset: ${TileSize * 3}px;
  }
`;

const scrollStyle = css`
  inset: 0;
  overflow: auto;
  overscroll-behavior: contain;
  position: absolute;
`;

const lightColorStyle = css`
  color: ${applyVar('text-color-light')};
`;

const mapCreateButtonStyle = css`
  right: ${TileSize * 3}px;
  top: ${applyVar('safe-area-top')};
`;

const dialogueButtonStyle = css`
  align-items: center;
  display: inline-flex;
  justify-content: center;
  right: ${TileSize * 6}px;
  top: ${applyVar('safe-area-top')};

  > svg {
    height: 40px;
    width: 40px;
  }
`;

const closeButtonStyle = css`
  position: fixed;
  right: ${applyVar('inset')};
  top: ${applyVar('inset')};
  // On initial load with a map, the button will be inserted into the DOM before the map editor.
  // This makes the button visible.
  z-index: 1;
`;

const primaryButtonStyle = css`
  height: ${TileSize * 1.5}px;
`;

const smallTextStyle = css`
  font-size: 0.75em;
`;

const iconStyle = css`
  height: 24px;
  margin-top: 4px;
  width: 24px;
`;
