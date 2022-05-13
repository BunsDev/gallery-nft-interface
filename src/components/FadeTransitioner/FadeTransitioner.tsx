import { CSSProperties, memo, Suspense } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { FullPageLoaderWithLayoutTransitionSupport } from 'components/core/Loader/FullPageLoader';

type Props = {
  locationKey?: string;
  children: React.ReactNode;
};

// NOTE: if you change these values, make sure to update `transition.css`
export const FADE_TRANSITION_TIME_MS = 300;
export const NAVIGATION_TRANSITION_TIME_MS = 700;

const timeoutConfig = {
  enter: FADE_TRANSITION_TIME_MS + NAVIGATION_TRANSITION_TIME_MS,
  exit: FADE_TRANSITION_TIME_MS,
};

const childNodeStyles = {
  width: '100%',
  height: '100%',
};

/**
 * Fades child elements in and out as they mount/unmount.
 *
 * This file is tightly coupled with `transition.css`, specifically
 * around timing + classNames. More info: https://reactjs.org/docs/animation.html
 */
function FadeTransitioner({ locationKey, children }: Props) {
  return (
    <TransitionGroup>
      <CSSTransition key={locationKey} timeout={timeoutConfig} classNames="fade">
        {/* Placing the Suspense boundary here (within the TransitionGroup) allows the scroll position
            to remain uninterrupted upon navigation */}
        <div style={childNodeStyles as CSSProperties}>
          <Suspense fallback={<FullPageLoaderWithLayoutTransitionSupport />}>{children}</Suspense>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}

export default memo(FadeTransitioner);
