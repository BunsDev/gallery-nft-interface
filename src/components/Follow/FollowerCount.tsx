import TextButton from 'components/core/Button/TextButton';
import Tooltip, { StyledTooltipParent } from 'components/Tooltip/Tooltip';
import { useCallback, useMemo } from 'react';
import { graphql, useFragment } from 'react-relay';
import styled from 'styled-components';
import { FollowerCountFragment$key } from '__generated__/FollowerCountFragment.graphql';
import FollowList from './FollowList';
import { useModalActions } from 'contexts/modal/ModalContext';
import { useIsMobileOrMobileLargeWindowWidth } from 'hooks/useWindowSize';

type Props = {
  userRef: FollowerCountFragment$key;
};

export function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`;
}

export default function FollowerCount({ userRef }: Props) {
  const user = useFragment(
    graphql`
      fragment FollowerCountFragment on GalleryUser {
        followers {
          dbid
        }
        following {
          dbid
        }
        ...FollowListFragment
      }
    `,
    userRef
  );

  const { showModal } = useModalActions();

  const isMobile = useIsMobileOrMobileLargeWindowWidth();
  const handleClick = useCallback(() => {
    showModal({ content: <FollowList userRef={user} />, isFullPage: isMobile });
  }, [isMobile, showModal, user]);

  const followerCount = useMemo(() => user.followers?.length ?? 0, [user.followers]);
  const followingCount = useMemo(() => user.following?.length ?? 0, [user.following]);

  return (
    <StyledFollowerCount>
      <StyledTooltipParent>
        <TextButton text={`${user.followers?.length}`} onClick={handleClick}></TextButton>
        <Tooltip
          text={`See ${followerCount} ${pluralize(
            followerCount,
            'follower'
          )} and ${followingCount} following`}
        />
      </StyledTooltipParent>
    </StyledFollowerCount>
  );
}

const StyledFollowerCount = styled.div``;
