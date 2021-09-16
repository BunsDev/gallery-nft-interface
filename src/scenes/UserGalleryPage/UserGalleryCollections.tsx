import styled from 'styled-components';
import Spacer from 'components/core/Spacer/Spacer';

import { Collection } from 'types/Collection';
import { Fragment, useMemo } from 'react';
import EmptyGallery from './EmptyGallery';
import UserGalleryCollection from './UserGalleryCollection';

type Props = {
  collections: Collection[];
  isAuthenticatedUsersPage: boolean;
};

function UserGalleryCollections({
  collections,
  isAuthenticatedUsersPage,
}: Props) {
  const filteredCollections = useMemo(() => collections.filter(collection => !collection.hidden), [collections]);

  if (collections.length === 0) {
    const noCollectionsMessage = isAuthenticatedUsersPage
      ? 'Your gallery is empty. Display your NFTs by creating a collection.'
      : 'This user has not added any collections to their gallery yet.';

    return <EmptyGallery message={noCollectionsMessage} />;
  }

  // TODO: Consider extracting 48 and 108 into unit consts
  return (
    <StyledUserGalleryCollections>
      {filteredCollections.map((collection, index) => (
        <Fragment key={collection.id}>
          <Spacer height={index === 0 ? 48 : 108} />
          <UserGalleryCollection collection={collection} />
          <Spacer height={index === collections.length - 1 ? 108 : 0} />
        </Fragment>
      ))}
    </StyledUserGalleryCollections>
  );
}

const StyledUserGalleryCollections = styled.div`
  width: 100%;
`;

export default UserGalleryCollections;
