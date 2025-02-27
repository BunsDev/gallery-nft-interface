import { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import unescape from 'utils/unescape';
import { BaseM, TitleL, TitleM } from 'components/core/Text/Text';
import Spacer from 'components/core/Spacer/Spacer';
import colors from 'components/core/colors';
import Markdown from 'components/core/Markdown/Markdown';
import NavElement from 'contexts/globalLayout/GlobalNavbar/NavElement';
import TextButton from 'components/core/Button/TextButton';
import breakpoints from 'components/core/breakpoints';
import CopyToClipboard from 'components/CopyToClipboard/CopyToClipboard';
import { useRouter } from 'next/router';
import { useModalActions } from 'contexts/modal/ModalContext';
import CollectionCreateOrEditForm from 'flows/shared/steps/OrganizeCollection/CollectionCreateOrEditForm';
import noop from 'utils/noop';
import MobileLayoutToggle from 'scenes/UserGalleryPage/MobileLayoutToggle';
import { useIsMobileWindowWidth } from 'hooks/useWindowSize';
import { DisplayLayout } from 'components/core/enums';
import useBackButton from 'hooks/useBackButton';
import SettingsDropdown from 'components/core/Dropdown/SettingsDropdown';
import { useTrack } from 'contexts/analytics/AnalyticsContext';
import { graphql, useFragment } from 'react-relay';
import LinkButton from 'scenes/UserGalleryPage/LinkButton';

import { CollectionGalleryHeaderFragment$key } from '__generated__/CollectionGalleryHeaderFragment.graphql';
import { CollectionGalleryHeaderQueryFragment$key } from '__generated__/CollectionGalleryHeaderQueryFragment.graphql';

type Props = {
  queryRef: CollectionGalleryHeaderQueryFragment$key;
  collectionRef: CollectionGalleryHeaderFragment$key;
  mobileLayout: DisplayLayout;
  setMobileLayout: (mobileLayout: DisplayLayout) => void;
};

function CollectionGalleryHeader({
  queryRef,
  collectionRef,
  mobileLayout,
  setMobileLayout,
}: Props) {
  const username = useMemo(() => window.location.pathname.split('/')[1], []);

  const { push } = useRouter();
  const { showModal } = useModalActions();
  const handleBackClick = useBackButton({ username });

  const query = useFragment(
    graphql`
      fragment CollectionGalleryHeaderQueryFragment on Query {
        viewer {
          ... on Viewer {
            user {
              username
            }
          }
        }
      }
    `,
    queryRef
  );

  const collection = useFragment(
    graphql`
      fragment CollectionGalleryHeaderFragment on Collection {
        dbid
        name
        collectorsNote
        gallery @required(action: THROW) {
          dbid @required(action: THROW)
        }

        tokens {
          __typename
        }
      }
    `,
    collectionRef
  );

  const unescapedCollectionName = useMemo(
    () => (collection.name ? unescape(collection.name) : null),
    [collection.name]
  );
  const unescapedCollectorsNote = useMemo(
    () => (collection.collectorsNote ? unescape(collection.collectorsNote || '') : null),
    [collection.collectorsNote]
  );

  const track = useTrack();

  const handleShareClick = useCallback(() => {
    track('Share Collection', { path: `/${username}/${collection.dbid}` });
  }, [collection.dbid, username, track]);

  const showEditActions = username.toLowerCase() === query.viewer?.user?.username?.toLowerCase();

  const collectionUrl = window.location.href;

  const isMobile = useIsMobileWindowWidth();
  const shouldDisplayMobileLayoutToggle = isMobile && collection?.tokens?.length;

  const handleEditCollectionClick = useCallback(() => {
    track('Update existing collection');
    void push(`/edit?collectionId=${collection.dbid}`);
  }, [collection.dbid, push, track]);

  const handleEditNameClick = useCallback(() => {
    showModal({
      content: (
        <CollectionCreateOrEditForm
          // No need for onNext because this isn't part of a wizard
          onNext={noop}
          galleryId={collection.gallery.dbid}
          collectionId={collection.dbid}
          collectionName={collection.name ?? undefined}
          collectionCollectorsNote={collection.collectorsNote ?? undefined}
        />
      ),
      headerText: 'Name and describe your collection',
    });
  }, [
    collection.collectorsNote,
    collection.dbid,
    collection.gallery.dbid,
    collection.name,
    showModal,
  ]);

  return (
    <StyledCollectionGalleryHeaderWrapper>
      <StyledHeaderWrapper>
        {isMobile ? (
          <StyledBreadcrumbsWrapper>
            <StyledUsernameWrapper>
              <StyledUsernameAndSeparatorWrapper>
                <StyledUsernameMobile onClick={handleBackClick}>{username}</StyledUsernameMobile>
                {collection.name && <StyledSeparatorMobile>/</StyledSeparatorMobile>}
              </StyledUsernameAndSeparatorWrapper>
            </StyledUsernameWrapper>
            <StyledCollectionNameMobile>{unescapedCollectionName}</StyledCollectionNameMobile>
          </StyledBreadcrumbsWrapper>
        ) : (
          <StyledBreadcrumbsWrapper>
            <StyledUsernameWrapper>
              <StyledUsernameAndSeparatorWrapper>
                <StyledUsername onClick={handleBackClick}>{username}</StyledUsername>
                {collection.name && <StyledSeparator>/</StyledSeparator>}
              </StyledUsernameAndSeparatorWrapper>
            </StyledUsernameWrapper>
            <StyledCollectionName>{unescapedCollectionName}</StyledCollectionName>
          </StyledBreadcrumbsWrapper>
        )}

        <StyledCollectionActions>
          {showEditActions ? (
            <>
              {isMobile ? (
                <LinkButton textToCopy={`https://gallery.so/${username}/${collectionUrl}`} />
              ) : (
                <CopyToClipboard textToCopy={collectionUrl}>
                  <TextButton text="Share" onClick={handleShareClick} />
                </CopyToClipboard>
              )}
              {/* On mobile, we show these options in the navbar, not in header */}
              {!isMobile && (
                <SettingsDropdown>
                  <TextButton onClick={handleEditNameClick} text="EDIT NAME & DESCRIPTION" />
                  {!shouldDisplayMobileLayoutToggle && (
                    <>
                      <Spacer height={8} />
                      <NavElement>
                        <TextButton onClick={handleEditCollectionClick} text="Edit Collection" />
                      </NavElement>
                    </>
                  )}
                </SettingsDropdown>
              )}
            </>
          ) : (
            <>
              {isMobile ? (
                <LinkButton textToCopy={`https://gallery.so/${username}/${collectionUrl}`} />
              ) : (
                <CopyToClipboard textToCopy={collectionUrl}>
                  <TextButton text="Share" onClick={handleShareClick} />
                </CopyToClipboard>
              )}
            </>
          )}
          {shouldDisplayMobileLayoutToggle && (
            <>
              <Spacer width={8} />
              <MobileLayoutToggle mobileLayout={mobileLayout} setMobileLayout={setMobileLayout} />
            </>
          )}
        </StyledCollectionActions>
      </StyledHeaderWrapper>

      {unescapedCollectorsNote && (
        <>
          <Spacer height={isMobile ? 4 : 16} />
          <StyledCollectionNote>
            <Markdown text={unescapedCollectorsNote} />
          </StyledCollectionNote>
        </>
      )}

      <Spacer height={isMobile ? 48 : 80} />
    </StyledCollectionGalleryHeaderWrapper>
  );
}

const StyledCollectionGalleryHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;

  width: 100%;
`;

const StyledHeaderWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
`;

const BreadcrumbsWrapperWidth = 80;

const StyledBreadcrumbsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: calc(100% - ${BreadcrumbsWrapperWidth}px);
  @media only screen and ${breakpoints.mobileLarge} {
    flex-direction: row;
  }
`;

const StyledUsernameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const StyledUsernameAndSeparatorWrapper = styled.div`
  display: flex;
`;

const StyledCollectionName = styled(TitleL)`
  word-break: break-word;
`;

const StyledCollectionNameMobile = styled(TitleM)`
  font-style: normal;
  word-break: break-word;
`;

const StyledSeparator = styled(TitleL)`
  margin: 0 10px;
  display: block;
  color: ${colors.offBlack};
`;

const StyledSeparatorMobile = styled(TitleM)`
  font-style: normal;
  margin: 0 4px;
  display: block;
  color: ${colors.offBlack};
`;

const StyledUsername = styled(TitleL)`
  cursor: pointer;
  color: ${colors.metal};
  display: flex;
  &:hover {
    color: ${colors.shadow};
  }
`;

const StyledUsernameMobile = styled(TitleM)`
  font-style: normal;
  cursor: pointer;
  color: ${colors.metal};
  display: flex;
  &:hover {
    color: ${colors.shadow};
  }
`;

const StyledCollectionNote = styled(BaseM)`
  width: 100%;
  word-break: break-word;

  @media only screen and ${breakpoints.tablet} {
    width: 70%;
  }
`;

const StyledCollectionActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  width: ${BreadcrumbsWrapperWidth}px;
`;

export default CollectionGalleryHeader;
