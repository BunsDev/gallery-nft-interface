import ImageWithLoading from 'components/LoadingAsset/ImageWithLoading';
import { useFragment } from 'react-relay';
import { graphqlGetResizedNftImageUrlWithFallback } from 'utils/nft';
import { graphql } from 'relay-runtime';
import { size } from 'components/core/breakpoints';
import { useBreakpoint } from 'hooks/useWindowSize';
import { NftDetailImageFragment$key } from '__generated__/NftDetailImageFragment.graphql';
import { useMemo } from 'react';
import { StyledVideo } from './NftDetailVideo';
import { useSetContentIsLoaded } from 'contexts/shimmer/ShimmerContext';

type Props = {
  nftRef: NftDetailImageFragment$key;
  maxHeight: number;
};

function NftDetailImage({ nftRef, maxHeight }: Props) {
  const nft = useFragment(
    graphql`
      fragment NftDetailImageFragment on Token {
        name
        media @required(action: THROW) {
          ... on ImageMedia {
            __typename
            contentRenderURLs @required(action: THROW) {
              raw @required(action: THROW)
              large
            }
          }
        }
      }
    `,
    nftRef
  );
  const breakpoint = useBreakpoint();

  const contentRenderURL = useMemo(() => {
    if (nft.media.__typename === 'ImageMedia') {
      return nft.media.contentRenderURLs.large || nft.media.contentRenderURLs.raw;
    }

    return '';
  }, [nft.media]);

  const src = graphqlGetResizedNftImageUrlWithFallback(contentRenderURL, 1200);

  // TODO: this is a hack to handle videos that are returned by OS as images.
  // i.e., assets that do not have animation_urls, and whose image_urls all contain
  // links to videos. we should be able to remove this hack once we're off of OS.
  const setContentIsLoaded = useSetContentIsLoaded();
  if (src.endsWith('.mp4') || src.endsWith('.webm')) {
    return (
      <StyledVideo
        src={src}
        muted
        autoPlay
        loop
        playsInline
        controls
        onLoadedData={setContentIsLoaded}
        maxHeight={maxHeight}
      />
    );
  }

  return (
    <ImageWithLoading
      src={graphqlGetResizedNftImageUrlWithFallback(contentRenderURL, 1200)}
      alt={nft.name ?? ''}
      heightType={breakpoint === size.desktop ? 'maxHeightScreen' : undefined}
    />
  );
}

export default NftDetailImage;
