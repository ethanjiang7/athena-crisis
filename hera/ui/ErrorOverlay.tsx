import { Route } from '@deities/apollo/Routes.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import captureException from '@deities/ui/lib/captureException.tsx';
import { css } from '@emotion/css';
import Stack from '@nkzw/stack';
import { fbt } from 'fbtee';
import { useEffect } from 'react';

export class SpriteLoadError extends Error {}

export class FetchError extends Error {
  constructor(
    public override readonly message: string,
    public readonly info: Record<string, string>,
    cause?: unknown,
    public readonly skipInDev?: true,
  ) {
    super(message, { cause });
  }
}

export class MaintenanceError extends Error {
  constructor() {
    super('MaintenanceError');
  }
}

const reload = () => location.reload();

const getAlert = (error: Error) => {
  const acceptText = fbt('Try again', 'Try again button');

  if (error instanceof SpriteLoadError) {
    const route: Route = '/download';
    const onAccept = () => {
      window.location.href = route;
    };
    return {
      acceptText: fbt('Ugh, fine', 'Lighthearted error accept button'),
      onAccept,
      preventCancel: true,
      text: (
        <span>
          <fbt desc="Error message description">
            There was an error preparing the assets for Athena Crisis on your
            platform. For now, please <a href={route}>download the app</a>
            or use Chrome or Safari to play Athena Crisis.
          </fbt>
        </span>
      ),
      title: fbt('Failed to load Athena Crisis', 'Error message headline'),
    } as const;
  }

  if (error instanceof MaintenanceError) {
    return {
      acceptText,
      onAccept: reload,
      preventCancel: true,
      text: (
        <Stack alignCenter between gap={16} wrap>
          <Stack between flex1 wrap>
            <fbt desc="Error message description">
              Athena Crisis is currently undergoing maintenance. Please try
              again later.
            </fbt>
          </Stack>
          <img alt="Maxima" className={pixelatedStyle} src="/Maxima.gif" />
        </Stack>
      ),
      title: fbt('Maintenance', 'Error message headline'),
    } as const;
  }

  if (error instanceof FetchError) {
    return {
      acceptText,
      onAccept: reload,
      preventCancel: true,
      text: (
        <span>
          <fbt desc="Error message description">
            An unexpected server error occurred. Please try again later.
          </fbt>
        </span>
      ),
      title: fbt('Connection Error', 'Error message headline'),
    } as const;
  }

  return {
    acceptText,
    onAccept: reload,
    preventCancel: true,
    text: fbt('Oops, something went wrong.', 'Generic error message'),
  } as const;
};

export default function ErrorOverlay({ error }: { error: Error }) {
  const { alert } = useAlert();

  useEffect(() => {
    if (!(error instanceof FetchError) || !error.skipInDev) {
      captureException(error);
      alert(getAlert(error));
    }
  }, [alert, error]);

  return null;
}

const pixelatedStyle = css`
  display: block;
  image-rendering: pixelated;
  transform: scaleX(-1);
  width: 148px;
`;
