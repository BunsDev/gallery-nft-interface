import { useCallback, useEffect } from 'react';
import { WizardContext } from 'react-albus';

import { useWizardCallback } from 'contexts/wizard/WizardCallbackContext';
import CollectionEditorProvider, {
  useCollectionMetadataState,
  useStagedItemsState,
} from 'contexts/collectionEditor/CollectionEditorContext';
import { useModalActions } from 'contexts/modal/ModalContext';
import useUpdateCollectionTokens from 'hooks/api/collections/useUpdateCollectionTokens';
import {
  useCollectionWizardActions,
  useCollectionWizardState,
} from 'contexts/wizard/CollectionWizardContext';
import { useWizardId, useWizardState } from 'contexts/wizard/WizardDataProvider';
import CollectionEditor from './Editor/CollectionEditor';
import CollectionCreateOrEditForm from './CollectionCreateOrEditForm';
import { useTrack } from 'contexts/analytics/AnalyticsContext';
import { graphql, useLazyLoadQuery, usePreloadedQuery } from 'react-relay';
import { OrganizeCollectionQuery } from '__generated__/OrganizeCollectionQuery.graphql';

type ConfigProps = {
  push: WizardContext['push'];
  galleryId: string;
};

function useWizardConfig({ push, galleryId }: ConfigProps) {
  const { setOnNext, setOnPrevious } = useWizardCallback();
  const { showModal } = useModalActions();
  const wizardId = useWizardId();

  const stagedItems = useStagedItemsState();

  const updateCollection = useUpdateCollectionTokens();
  const { collectionIdBeingEdited } = useCollectionWizardState();
  const { setCollectionIdBeingEdited } = useCollectionWizardActions();

  const collectionMetadata = useCollectionMetadataState();

  const goToOrganizeGalleryStep = useCallback(() => {
    // Clear selected collection when moving to next step
    setCollectionIdBeingEdited('');
    push('organizeGallery');
  }, [push, setCollectionIdBeingEdited]);

  const track = useTrack();

  useEffect(() => {
    // If collection is being edited, trigger update
    if (collectionIdBeingEdited) {
      setOnNext(async () => {
        // Errors will be handled in the catch block within `WizardFooter.tsx`
        try {
          await updateCollection(collectionIdBeingEdited, stagedItems, collectionMetadata.layout);
        } catch {
          // TODO: display error toast here
        }

        goToOrganizeGalleryStep();
      });

      setOnPrevious(goToOrganizeGalleryStep);
      return;
    }

    // If collection is being created, trigger creation
    setOnNext(async () => {
      track('Save new collection button clicked');
      showModal({
        content: (
          <CollectionCreateOrEditForm
            onNext={goToOrganizeGalleryStep}
            galleryId={galleryId}
            stagedItems={stagedItems}
            layout={collectionMetadata.layout}
          />
        ),
        headerText: 'Name and describe your collection',
      });
    });

    // If user is editing their gallery, clicking "back" should bring them
    // back to the organize gallery view
    if (wizardId === 'edit-gallery') {
      setOnPrevious(goToOrganizeGalleryStep);
    }
  }, [
    collectionIdBeingEdited,
    goToOrganizeGalleryStep,
    setOnNext,
    setOnPrevious,
    showModal,
    updateCollection,
    wizardId,
    collectionMetadata,
    stagedItems,
    track,
    galleryId,
  ]);
}

type DecoratedCollectionEditorProps = {
  push: WizardContext['push'];
};

export const organizeCollectionQuery = graphql`
  query OrganizeCollectionQuery {
    viewer @required(action: THROW) {
      ... on Viewer {
        __typename
        user @required(action: THROW) {
          username
          galleries @required(action: THROW) {
            dbid @required(action: THROW)
          }
        }

        ...CollectionEditorFragment
      }
    }
  }
`;

function DecoratedPreloadedCollectionEditor({ push }: DecoratedCollectionEditorProps) {
  const { queryRef } = useWizardState();

  if (!queryRef) {
    throw new Error('DecoratedCollectionEditor could not access queryRef');
  }

  const query = usePreloadedQuery(organizeCollectionQuery, queryRef);

  if (query.viewer.__typename !== 'Viewer') {
    throw new Error(
      `OrganizeCollection expected Viewer to be type 'Viewer' but got: ${query.viewer.__typename}`
    );
  }

  const galleryId = query.viewer.user.galleries[0]?.dbid;

  if (!galleryId) {
    throw new Error(`OrganizeCollection expected galleryId`);
  }

  useWizardConfig({ push, galleryId });

  return <CollectionEditor viewerRef={query.viewer} />;
}

function DecoratedLazyloadedCollectionEditor({ push }: DecoratedCollectionEditorProps) {
  const query = useLazyLoadQuery<OrganizeCollectionQuery>(organizeCollectionQuery, {});

  if (query.viewer.__typename !== 'Viewer') {
    throw new Error(
      `OrganizeCollection expected Viewer to be type 'Viewer' but got: ${query.viewer.__typename}`
    );
  }

  const galleryId = query.viewer.user.galleries[0]?.dbid;

  if (!galleryId) {
    throw new Error(`OrganizeCollection expected galleryId`);
  }

  useWizardConfig({ push, galleryId });

  return <CollectionEditor viewerRef={query.viewer} />;
}

function OrganizeCollectionWithProvider({ push }: WizardContext) {
  const id = useWizardId();
  return (
    <CollectionEditorProvider>
      {
        // TODO: doing this because i have no idea how to conditionally use preloading
        id === 'onboarding' ? (
          <DecoratedPreloadedCollectionEditor push={push} />
        ) : (
          <DecoratedLazyloadedCollectionEditor push={push} />
        )
      }
    </CollectionEditorProvider>
  );
}

export default OrganizeCollectionWithProvider;
