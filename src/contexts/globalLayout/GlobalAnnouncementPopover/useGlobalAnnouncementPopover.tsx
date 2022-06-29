import { FeatureFlag } from 'components/core/enums';
import { useModalActions } from 'contexts/modal/ModalContext';
import { useEffect } from 'react';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import isFeatureEnabled from 'utils/graphql/isFeatureEnabled';
import GlobalAnnouncementPopover from './GlobalAnnouncementPopover';

const AUTH_REQUIRED = true;
const GLOBAL_ANNOUNCEMENT_POPOVER_DELAY_MS = 1000;

export default function useGlobalAnnouncementPopover(queryRef: any) {
  const query = useFragment(
    graphql`
      fragment useGlobalAnnouncementPopoverFragment on Query {
        viewer {
          ... on Viewer {
            user {
              id
            }
          }
        }
        ...GlobalAnnouncementPopover
        ...isFeatureEnabledFragment
      }
    `,
    queryRef
  );

  const isAuthenticated = Boolean(query.viewer?.user?.id);

  const { showModal } = useModalActions();

  useEffect(() => {
    if (AUTH_REQUIRED && !isAuthenticated) return;
    if (!isFeatureEnabled(FeatureFlag.FEED_ANNOUNCEMENT, query)) return;

    setTimeout(() => {
      showModal({
        content: <GlobalAnnouncementPopover queryRef={query} />,
        isFullPage: true,
        headerVariant: 'thicc',
      });
    }, GLOBAL_ANNOUNCEMENT_POPOVER_DELAY_MS);
  }, [isAuthenticated, showModal, query]);
}
