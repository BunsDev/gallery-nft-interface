import colors from 'components/core/colors';
import Loader from 'components/core/Loader/Loader';
import { TitleM } from 'components/core/Text/Text';
import transitions from 'components/core/transitions';
import { useCallback, useMemo, useState } from 'react';
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  WindowScroller,
} from 'react-virtualized';
import { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer';
import styled from 'styled-components';

import { FeedEventQueryFragment$key } from '__generated__/FeedEventQueryFragment.graphql';
import { FeedMode } from './Feed';
import FeedEvent from './FeedEvent';

type Props = {
  feedData: any;
  loadNextPage: () => void;
  hasNext: boolean;
  queryRef: FeedEventQueryFragment$key;
  feedMode: FeedMode;
};

export default function FeedList({ feedData, loadNextPage, hasNext, queryRef, feedMode }: Props) {
  const measurerCache = useMemo(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      minHeight: 0,
    });
  }, []);

  // Function responsible for tracking the loaded state of each row.
  const isRowLoaded = ({ index }: { index: number }) => !hasNext || !!feedData.edges[index];

  //Render a list item or a loading indicator.
  const rowRenderer = ({
    index,
    key,
    parent,
    style,
  }: {
    index: number;
    key: string;
    style: React.CSSProperties;
    parent: MeasuredCellParent;
  }) => {
    if (!isRowLoaded({ index })) {
      return <div />;
    }
    // graphql returns the oldest event at the top of the list, so display in opposite order
    const content = feedData.edges[feedData.edges.length - index - 1];

    return (
      <CellMeasurer
        cache={measurerCache}
        columnIndex={0}
        rowIndex={index}
        key={key}
        parent={parent}
      >
        {({ registerChild }) => (
          // @ts-expect-error: this is the suggested usage of registerChild
          <div ref={registerChild} style={style}>
            <FeedEvent
              eventRef={content.node.eventData}
              key={content.node.dbid}
              queryRef={queryRef}
              feedMode={feedMode}
            />
          </div>
        )}
      </CellMeasurer>
    );
  };

  // If there are more items to be loaded then add extra rows
  const rowCount = hasNext ? feedData.edges.length + 1 : feedData.edges.length;

  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMoreClick = useCallback(async () => {
    setIsLoading(true);
    await loadNextPage();
    setIsLoading(false);
  }, [loadNextPage]);

  return (
    <WindowScroller>
      {({ height, scrollTop, registerChild }) => (
        <AutoSizer disableHeight>
          {({ width }) => (
            <div ref={registerChild}>
              <List
                autoHeight
                width={width}
                height={height}
                rowRenderer={rowRenderer}
                rowCount={rowCount}
                rowHeight={measurerCache.rowHeight}
                scrollTop={scrollTop}
              />
              {hasNext && (
                <StyledLoadMoreRow width={width} onClick={handleLoadMoreClick}>
                  {isLoading ? <Loader inverted size="small" /> : <TitleM>More</TitleM>}
                </StyledLoadMoreRow>
              )}
            </div>
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );
}

const StyledLoadMoreRow = styled.div<{ width: number }>`
  width: ${({ width }) => width}px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 156px;
  transition: background ${transitions.cubic};
  ${TitleM} {
    font-style: normal;
    color: ${colors.shadow};
    transition: color ${transitions.cubic};
  }
  &:hover {
    background: ${colors.faint};
    ${TitleM} {
      color: ${colors.offBlack};
    }
  }
  cursor: pointer;
`;
