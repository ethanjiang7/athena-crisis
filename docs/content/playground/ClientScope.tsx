import { HideContext } from '@deities/hera/hooks/useHide.tsx';
import LocaleContext from '@deities/hera/i18n/LocaleContext.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import setupGamePad from '@deities/ui/controls/setupGamePad.tsx';
import setupHidePointer from '@deities/ui/controls/setupHidePointer.tsx';
import setupKeyboard from '@deities/ui/controls/setupKeyboard.tsx';
import { getScopedCSSDefinitions } from '@deities/ui/CSS.tsx';
import { applyVar, initializeCSSVariables } from '@deities/ui/cssVar.tsx';
import { AlertContext } from '@deities/ui/hooks/useAlert.tsx';
import { ScaleContext } from '@deities/ui/hooks/useScale.tsx';
import { setDefaultPortalContainer } from '@deities/ui/Portal.tsx';
import { css } from '@emotion/css';
import { VisibilityStateContext } from '@nkzw/use-visibility-state';
import { ReactElement } from 'react';

initializeCSSVariables();

const clientScopeStyle = css`
  all: initial;

  color: ${applyVar('text-color')};
  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  font-size: 20px;
  font-weight: normal;
  line-height: 1em;
  outline: none;
  touch-action: pan-x pan-y;

  img {
    max-width: initial;
  }

  svg {
    display: initial;
  }

  ${getScopedCSSDefinitions()}
`;

if (!document.querySelector('body > div.portal')) {
  const portal = document.createElement('div');
  portal.classList.add('portal', clientScopeStyle);
  document.body.append(portal, document.body.childNodes[0]);
  setDefaultPortalContainer(portal);
}

if (!document.querySelector('body > div.background')) {
  const background = document.createElement('div');
  background.classList.add('background');
  document.body.insertBefore(background, document.body.childNodes[0]);
}

AudioPlayer.pause();
setupGamePad();
setupHidePointer();
setupKeyboard();

if (import.meta.env.DEV) {
  import('@deities/hera/ui/fps/Fps.tsx');
}

export default function ClientScope({ children }: { children: ReactElement }) {
  return (
    <LocaleContext>
      <ScaleContext>
        <VisibilityStateContext>
          <HideContext>
            <AlertContext>
              <div className={clientScopeStyle}>{children}</div>
            </AlertContext>
          </HideContext>
        </VisibilityStateContext>
      </ScaleContext>
    </LocaleContext>
  );
}
