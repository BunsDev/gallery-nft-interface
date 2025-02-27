import { MAX_COLUMNS, MIN_COLUMNS } from 'constants/layout';
import styled from 'styled-components';
import unescape from 'utils/unescape';
import { BaseM, TitleS } from 'components/core/Text/Text';
import Spacer from 'components/core/Spacer/Spacer';
import breakpoints from 'components/core/breakpoints';
import { useCallback, useMemo } from 'react';
import Markdown from 'components/core/Markdown/Markdown';
import { DisplayLayout } from 'components/core/enums';
import NftGallery from 'components/NftGallery/NftGallery';
import { useNavigateToUrl } from 'utils/navigate';
import TextButton from 'components/core/Button/TextButton';
import CopyToClipboard from 'components/CopyToClipboard/CopyToClipboard';
import Dropdown, { StyledDropdownButton } from 'components/core/Dropdown/Dropdown';
import { useTrack } from 'contexts/analytics/AnalyticsContext';
import { useRouter } from 'next/router';
import { baseUrl } from 'utils/baseUrl';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { useLoggedInUserId } from 'hooks/useLoggedInUserId';
import { UserGalleryCollectionFragment$key } from '__generated__/UserGalleryCollectionFragment.graphql';
import { UserGalleryCollectionQueryFragment$key } from '__generated__/UserGalleryCollectionQueryFragment.graphql';
import CollectionCreateOrEditForm from 'flows/shared/steps/OrganizeCollection/CollectionCreateOrEditForm';
import noop from 'utils/noop';
import { useModalActions } from 'contexts/modal/ModalContext';

type Props = {
  queryRef: UserGalleryCollectionQueryFragment$key;
  collectionRef: UserGalleryCollectionFragment$key;
  mobileLayout: DisplayLayout;
};

export function isValidColumns(columns: number) {
  return columns >= MIN_COLUMNS && columns <= MAX_COLUMNS;
}

function UserGalleryCollection({ queryRef, collectionRef, mobileLayout }: Props) {
  const query = useFragment(
    graphql`
      fragment UserGalleryCollectionQueryFragment on Query {
        ...useLoggedInUserIdFragment
      }
    `,
    queryRef
  );

  const collection = useFragment(
    graphql`
      fragment UserGalleryCollectionFragment on Collection {
        dbid
        name @required(action: THROW)
        collectorsNote

        gallery @required(action: THROW) {
          dbid @required(action: THROW)
          owner @required(action: THROW) {
            id @required(action: THROW)
          }
        }

        ...NftGalleryFragment
      }
    `,
    collectionRef
  );

  const loggedInUserId = useLoggedInUserId(query);
  const showEditActions = loggedInUserId === collection.gallery.owner.id;
  const galleryId = collection.gallery.dbid;

  const { showModal } = useModalActions();
  const { push, asPath } = useRouter();
  const navigateToUrl = useNavigateToUrl();
  const unescapedCollectionName = useMemo(() => unescape(collection.name), [collection.name]);
  const unescapedCollectorsNote = useMemo(
    () => unescape(collection.collectorsNote ?? ''),
    [collection.collectorsNote]
  );

  const username = asPath.split('/')[1];
  const collectionUrl = `${baseUrl}/${username}/${collection.dbid}`;

  const handleViewCollectionClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      navigateToUrl(`/${username}/${collection.dbid}`, event);
    },
    [collection.dbid, navigateToUrl, username]
  );

  const track = useTrack();

  const handleEditCollectionClick = useCallback(() => {
    track('Update existing collection button clicked');
    void push(`/edit?collectionId=${collection.dbid}`);
  }, [collection.dbid, track, push]);

  const handleShareClick = useCallback(() => {
    track('Share Collection', { path: `/${username}/${collection.dbid}` });
  }, [collection.dbid, username, track]);

  const handleEditNameClick = useCallback(() => {
    showModal({
      content: (
        <CollectionCreateOrEditForm
          // No need for onNext because this isn't part of a wizard
          onNext={noop}
          galleryId={galleryId}
          collectionId={collection.dbid}
          collectionName={collection.name}
          collectionCollectorsNote={collection.collectorsNote ?? ''}
        />
      ),
      headerText: 'Name and describe your collection',
    });
  }, [collection.collectorsNote, collection.dbid, collection.name, galleryId, showModal]);

  return (
    <StyledCollectionWrapper>
      <StyledCollectionHeader>
        <StyledCollectionTitleWrapper>
          <StyledCollectorsTitle onClick={handleViewCollectionClick}>
            {unescapedCollectionName}
          </StyledCollectorsTitle>
          <StyledOptionsContainer>
            <StyledCopyToClipboard textToCopy={collectionUrl}>
              <StyledShareButton text="Share" onClick={handleShareClick} />
            </StyledCopyToClipboard>
            <Spacer width={16} />
            <StyledSettingsDropdown>
              <Dropdown>
                {showEditActions && (
                  <>
                    <TextButton
                      onClick={handleEditNameClick}
                      text="EDIT NAME & DESCRIPTION"
                      underlineOnHover
                    />
                    <Spacer height={8} />
                    <TextButton
                      text="Edit Collection"
                      onClick={handleEditCollectionClick}
                      underlineOnHover
                    />
                    <Spacer height={8} />
                  </>
                )}
                <TextButton
                  text="View Collection"
                  onClick={handleViewCollectionClick}
                  underlineOnHover
                />
              </Dropdown>
            </StyledSettingsDropdown>
          </StyledOptionsContainer>
        </StyledCollectionTitleWrapper>
        {unescapedCollectorsNote && (
          <>
            <StyledCollectorsNote>
              <Markdown text={unescapedCollectorsNote} />
            </StyledCollectorsNote>
          </>
        )}
      </StyledCollectionHeader>
      <NftGallery collectionRef={collection} mobileLayout={mobileLayout} />
    </StyledCollectionWrapper>
  );
}

const StyledSettingsDropdown = styled.div`
  opacity: 0;
  transition: opacity 200ms ease-in-out;

  background: url(/icons/ellipses.svg) no-repeat scroll 10px 9px;
  background-position: center;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${StyledDropdownButton} {
    width: 16px;
    height: 16px;
  }
`;

const StyledShareButton = styled(TextButton)`
  opacity: 0;
  transition: opacity 200ms ease-in-out;
`;

const StyledCopyToClipboard = styled(CopyToClipboard)`
  height: 24px !important;
`;

const StyledCollectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;

  &:hover ${StyledSettingsDropdown}, &:hover ${StyledShareButton} {
    opacity: 1;
  }
`;

const StyledCollectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  // to appear above content underneath
  z-index: 1;
  margin-bottom: 16px;

  @media only screen and ${breakpoints.tablet} {
    margin-bottom: 24px;
  }
`;

const StyledCollectionTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  word-break: break-word;
`;

const StyledCollectorsTitle = styled(TitleS)`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const StyledCollectorsNote = styled(BaseM)`
  width: 100%;

  @media only screen and ${breakpoints.mobileLarge} {
    width: 70%;
  }

  @media only screen and ${breakpoints.tablet} {
    width: 70%;
  }
`;

const StyledOptionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 24px;
`;

export default UserGalleryCollection;
