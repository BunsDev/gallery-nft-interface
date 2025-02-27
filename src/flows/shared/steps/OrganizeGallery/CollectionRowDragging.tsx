import colors from 'components/core/colors';
import useMouseUp from 'hooks/useMouseUp';
import { graphql, useFragment } from 'react-relay';
import styled from 'styled-components';
import { CollectionRowDraggingFragment$key } from '__generated__/CollectionRowDraggingFragment.graphql';
import CollectionRow from './CollectionRow';

type Props = {
  collectionRef: CollectionRowDraggingFragment$key;
};

function CollectionRowDragging({ collectionRef }: Props) {
  const collection = useFragment(
    graphql`
      fragment CollectionRowDraggingFragment on Collection {
        ...CollectionRowFragment
      }
    `,
    collectionRef
  );

  const isMouseUp = useMouseUp();
  return (
    <StyledCollectionRowDragging>
      <StyledCollectionRow collectionRef={collection} isMouseUp={isMouseUp} />
    </StyledCollectionRowDragging>
  );
}

const StyledCollectionRowDragging = styled.div`
  display: flex;
  background-color: ${colors.white};
`;

const StyledCollectionRow = styled(CollectionRow)<{ isMouseUp: boolean }>`
  border-color: ${colors.activeBlue};
  transform: scale(1.025);
  box-shadow: 0px 0px 16px 8px rgb(0 0 0 / 14%);

  cursor: ${({ isMouseUp }) => (isMouseUp ? 'grab' : 'grabbing')};
`;

export default CollectionRowDragging;
