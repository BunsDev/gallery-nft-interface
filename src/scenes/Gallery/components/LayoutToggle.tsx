import styled from 'styled-components';
import { Link as RouterLink, useLocation } from '@reach/router';

import Link from 'components/core/Link/Link';

type Props = {
  isCollectionsView: boolean;
};

function LayoutToggle({ isCollectionsView }: Props) {
  const { pathname } = useLocation();

  return (
    <StyledToggleOptions>
      <StyledRouterLink to={`${pathname}?view=all`}>
        <StyledToggleOption
          underlined={!isCollectionsView}
          focused={!isCollectionsView}
        >
          All
        </StyledToggleOption>
      </StyledRouterLink>
      <StyledRouterLink to={`${pathname}?view=collections`}>
        <StyledToggleOption
          underlined={isCollectionsView}
          focused={isCollectionsView}
        >
          Collections
        </StyledToggleOption>
      </StyledRouterLink>
    </StyledToggleOptions>
  );
}

const StyledRouterLink = styled(RouterLink)`
  text-decoration: none;
`;

const StyledToggleOptions = styled.div`
  display: flex;
`;

const StyledToggleOption = styled(Link)`
  margin-right: 10px;
  margin-left: 10px;
`;

export default LayoutToggle;
