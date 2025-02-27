import styled from 'styled-components';
import colors from 'components/core/colors';
import Button from 'components/core/Button/Button';
import { useCallback, useState } from 'react';
import Spacer from 'components/core/Spacer/Spacer';
import { useModalActions } from 'contexts/modal/ModalContext';
import { useDeleteCollection } from 'hooks/api/collections/useDeleteCollection';
import { useTrack } from 'contexts/analytics/AnalyticsContext';
import { graphql, useFragment } from 'react-relay';
import { DeleteCollectionConfirmationFragment$key } from '__generated__/DeleteCollectionConfirmationFragment.graphql';

type Props = {
  collectionRef: DeleteCollectionConfirmationFragment$key;
};

function DeleteCollectionConfirmation({ collectionRef }: Props) {
  const { dbid: collectionId } = useFragment(
    graphql`
      fragment DeleteCollectionConfirmationFragment on Collection {
        dbid
      }
    `,
    collectionRef
  );

  const { hideModal } = useModalActions();
  const deleteCollection = useDeleteCollection();

  const [isLoading, setIsLoading] = useState(false);

  const track = useTrack();

  const handleConfirmClick = useCallback(async () => {
    setIsLoading(true);
    track('Delete collection', { id: collectionId });
    await deleteCollection(collectionId);
    setIsLoading(false);
    hideModal();
  }, [collectionId, deleteCollection, hideModal, track]);

  return (
    <StyledConfirmation>
      <Spacer height={16} />
      <ButtonContainer>
        <StyledCancelButton mini text="Cancel" type="secondary" onClick={hideModal} />
        <StyledButton
          mini
          text="Delete"
          onClick={handleConfirmClick}
          disabled={isLoading}
          loading={isLoading}
        />
      </ButtonContainer>
    </StyledConfirmation>
  );
}

const StyledConfirmation = styled.div`
  width: 400px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledCancelButton = styled(Button)`
  border: none;
  width: 80px;
  margin-right: 8px;
  color: ${colors.metal};
`;

const StyledButton = styled(Button)`
  width: 80px;
`;

export default DeleteCollectionConfirmation;
