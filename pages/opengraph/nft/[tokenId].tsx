import { useRouter } from 'next/router';
import { OpenGraphPreview } from 'components/opengraph/OpenGraphPreview';
import { graphql, useLazyLoadQuery } from 'react-relay';
import { TokenIdOpengraphQuery } from '__generated__/TokenIdOpengraphQuery.graphql';
import getVideoOrImageUrlForNftPreview from 'utils/graphql/getVideoOrImageUrlForNftPreview';

export default function OpenGraphCollectionPage() {
  const { query } = useRouter();
  const queryResponse = useLazyLoadQuery<TokenIdOpengraphQuery>(
    graphql`
      query TokenIdOpengraphQuery($tokenId: DBID!) {
        token: tokenById(id: $tokenId) {
          ... on ErrTokenNotFound {
            __typename
          }
          ... on Token {
            __typename

            name
            collectorsNote
            description
            ...getVideoOrImageUrlForNftPreviewFragment
          }
        }
      }
    `,
    { tokenId: query.tokenId as string }
  );

  if (queryResponse.token?.__typename !== 'Token') {
    return null;
  }

  const { token } = queryResponse;

  const media = getVideoOrImageUrlForNftPreview(token);

  const width = parseInt(query.width as string) || 600;
  const height = parseInt(query.height as string) || 300;

  return (
    <>
      <div className="page">
        <div id="opengraph-image" style={{ width, height }}>
          {token && (
            <OpenGraphPreview
              title={token.name ?? ''}
              description={(token.collectorsNote || token.description) ?? ''}
              imageUrls={media?.urls.large ? [media.urls.large] : []}
            />
          )}
        </div>
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e7e5e4;
        }
        #opengraph-image {
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        }
      `}</style>
    </>
  );
}
