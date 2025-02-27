import { Web3Provider } from '@ethersproject/providers';
import breakpoints, { pageGutter } from 'components/core/breakpoints';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { BaseM, BaseXL, TitleM, TitleXS } from 'components/core/Text/Text';
import Spacer from 'components/core/Spacer/Spacer';
import Markdown from 'components/core/Markdown/Markdown';
import Button from 'components/core/Button/Button';
import GalleryLink from 'components/core/GalleryLink/GalleryLink';

import ShimmerProvider, { useSetContentIsLoaded } from 'contexts/shimmer/ShimmerContext';
import ErrorText from 'components/core/Text/ErrorText';
import { useWeb3React } from '@web3-react/core';
import useWalletModal from 'hooks/useWalletModal';
import { useModalActions } from 'contexts/modal/ModalContext';
import {
  useMembershipMintPageActions,
  useMembershipMintPageState,
} from 'contexts/membershipMintPage/MembershipMintPageContext';
import { Contract } from '@ethersproject/contracts';
import { MembershipNft } from './cardProperties';
import HorizontalBreak from 'components/core/HorizontalBreak/HorizontalBreak';
import InteractiveLink from 'components/core/InteractiveLink/InteractiveLink';
import { GALLERY_FAQ } from 'constants/urls';
import colors from 'components/core/colors';
import { TransactionStatus } from 'constants/transaction';

type Props = {
  membershipNft: MembershipNft;
  canMintToken: boolean;
  contract: Contract | null;
  mintToken: (contract: Contract, tokenId: number) => Promise<any>;
  children?: ReactNode;
  onMintSuccess?: () => void;
};

export function CustomizedGeneralMembershipMintPage({
  membershipNft,
  canMintToken,
  contract,
  mintToken,
  children,
  onMintSuccess,
}: Props) {
  const { active, account } = useWeb3React<Web3Provider>();

  const showWalletModal = useWalletModal();
  const { hideModal } = useModalActions();
  const [error, setError] = useState('');

  const { totalSupply, remainingSupply, price } = useMembershipMintPageState();

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const { getSupply } = useMembershipMintPageActions();

  const buttonText = useMemo(() => {
    if (!active) {
      return 'Connect Wallet';
    }

    if (transactionStatus === TransactionStatus.PENDING) {
      return 'Minting...';
    }

    if (transactionStatus === TransactionStatus.SUCCESS) {
      return 'Mint Successful';
    }

    return canMintToken ? 'Mint Card' : 'Buy on Secondary';
  }, [active, canMintToken, transactionStatus]);

  const isMintButtonEnabled = useMemo(
    () => (Number(price) > 0 || canMintToken) && transactionStatus !== TransactionStatus.PENDING,
    [canMintToken, price, transactionStatus]
  );

  const handleConnectWalletButtonClick = useCallback(() => {
    if (!active) {
      showWalletModal();
    }
  }, [active, showWalletModal]);

  const handleMintButtonClick = useCallback(async () => {
    // clear any previous errors
    if (error) {
      setError('');
    }

    if (active && contract) {
      // Submit mint transaction
      setTransactionStatus(TransactionStatus.PENDING);
      const mintResult = await mintToken(contract, membershipNft.tokenId).catch((error: any) => {
        setError(`Error while calling contract - "${error?.error?.message ?? error?.message}"`);
        setTransactionStatus(TransactionStatus.FAILED);
      });

      if (!mintResult) {
        return;
      }

      if (mintResult.hash) {
        setTransactionHash(mintResult.hash);
      }

      if (typeof mintResult.wait === 'function') {
        // Wait for the transaction to be mined
        const waitResult = await mintResult.wait().catch(() => {
          setTransactionStatus(TransactionStatus.FAILED);
          setError('Transaction failed');
        });
        if (waitResult) {
          setTransactionStatus(TransactionStatus.SUCCESS);
          getSupply(contract, membershipNft.tokenId);

          if (onMintSuccess) {
            onMintSuccess();
          }
        }
      }
    }
  }, [active, contract, error, getSupply, membershipNft.tokenId, mintToken, onMintSuccess]);

  const PrimaryButton = useMemo(() => {
    const MINT_INELIGIBLE = active && !canMintToken && transactionStatus === null;
    const SOLD_OUT = remainingSupply === 0;
    if (MINT_INELIGIBLE) {
      return (
        <>
          <StyledIneligibleMessageWrapper>
            <BaseXL>You are ineligible for this mint.</BaseXL>

            <Spacer width={4} />
            <InteractiveLink href={`${GALLERY_FAQ}#6fa1bc2983614500a206fc14fcfd61bf`}>
              <InfoCircleIcon />
            </InteractiveLink>
          </StyledIneligibleMessageWrapper>
          <Spacer height={24} />
          <StyledSecondaryLink href={membershipNft.secondaryUrl} target="_blank">
            <TitleXS color={colors.white}>View on Secondary</TitleXS>
          </StyledSecondaryLink>
        </>
      );
    }

    if (SOLD_OUT) {
      return (
        <>
          <StyledIneligibleMessageWrapper>
            <BaseM>
              While General Cards have completed minting, community members on the{' '}
              <b>Early Access Allowlist</b> can still create a Gallery account.
            </BaseM>

            <Spacer width={4} />
            <InteractiveLink href={`${GALLERY_FAQ}#6fa1bc2983614500a206fc14fcfd61bf`}>
              <InfoCircleIcon />
            </InteractiveLink>
          </StyledIneligibleMessageWrapper>
          <Spacer height={24} />
          <StyledSecondaryLink href="/auth">
            <Button text="Create Account" />
          </StyledSecondaryLink>
        </>
      );
    }

    return active ? (
      <Button text={buttonText} disabled={!isMintButtonEnabled} onClick={handleMintButtonClick} />
    ) : (
      <Button text={buttonText} onClick={handleConnectWalletButtonClick} />
    );
  }, [
    active,
    canMintToken,
    transactionStatus,
    remainingSupply,
    buttonText,
    isMintButtonEnabled,
    handleMintButtonClick,
    handleConnectWalletButtonClick,
    membershipNft.secondaryUrl,
  ]);

  // auto close the wallet modal once user connects
  useEffect(() => {
    if (active) {
      hideModal();
    }
  }, [active, hideModal]);

  return (
    <StyledMintPage>
      <StyledContent>
        <MembershipNftVisual src={membershipNft.videoUrl} />
        <StyledDetailText>
          <TitleM>{membershipNft.title}</TitleM>
          <Spacer height={16} />
          <StyledNftDescription>
            <Markdown text={membershipNft.description} />
          </StyledNftDescription>
          {Number(price) > 0 && (
            <>
              <TitleXS>Price</TitleXS>
              <BaseM>{Number(price / 1000000000000000000)} ETH</BaseM>
            </>
          )}
          {Boolean(totalSupply) && remainingSupply !== null && (
            <>
              <Spacer height={16} />
              <TitleXS>Available</TitleXS>
              <BaseM>
                {membershipNft.tokenId === 6 ? 0 : remainingSupply}/{totalSupply}
              </BaseM>
            </>
          )}
          {children}
          {account && (
            <>
              <Spacer height={16} />
              <TitleXS>Connected wallet</TitleXS>
              <BaseM>{account}</BaseM>
            </>
          )}
          <Spacer height={24} />
          <HorizontalBreak />
          <Spacer height={24} />

          {PrimaryButton}
          {transactionHash && (
            <>
              <Spacer height={16} />
              <div>
                <BaseM>
                  {transactionStatus === TransactionStatus.SUCCESS
                    ? 'Transaction successful!'
                    : 'Transaction submitted. This may take several minutes.'}
                </BaseM>
                <GalleryLink href={`https://etherscan.io/tx/${transactionHash}`}>
                  <BaseM>View on Etherscan</BaseM>
                </GalleryLink>
              </div>
            </>
          )}
          {transactionStatus === TransactionStatus.SUCCESS && (
            <>
              <Spacer height={16} />
              <BaseM>You can now sign up for Gallery.</BaseM>
              <GalleryLink href="/auth">
                <BaseM>Proceed to Onboarding</BaseM>
              </GalleryLink>
            </>
          )}
          {error && (
            <>
              <Spacer height={16} />
              <ErrorText message={error} />
            </>
          )}
        </StyledDetailText>
      </StyledContent>
    </StyledMintPage>
  );
}

const StyledDetailText = styled.div`
  display: flex;
  flex-direction: column;
  word-wrap: break-word;
  margin-top: 32px;

  @media only screen and ${breakpoints.tablet} {
    margin-left: 72px;
    margin-top: 0px;
    max-width: 296px;
  }
`;

const StyledNftDescription = styled(BaseM)`
  white-space: pre-line;
`;

type VideoProps = {
  src: string;
};

function MembershipVideo({ src }: VideoProps) {
  const setContentIsLoaded = useSetContentIsLoaded();
  return (
    <StyledVideo src={src} autoPlay loop playsInline muted onLoadedData={setContentIsLoaded} />
  );
}

function MembershipNftVisual({ src }: VideoProps) {
  return (
    <ShimmerProvider>
      <MembershipVideo src={src} />
    </ShimmerProvider>
  );
}

export const StyledMintPage = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  @media only screen and ${breakpoints.mobile} {
    margin-left: ${pageGutter.mobile}px;
    margin-right: ${pageGutter.mobile}px;
    margin-bottom: 64px;
  }

  @media only screen and ${breakpoints.tablet} {
    margin-left: ${pageGutter.tablet}px;
    margin-right: ${pageGutter.tablet}px;
    margin-bottom: 0px;
  }

  @media only screen and ${breakpoints.desktop} {
    margin: 0px;
  }
`;

const StyledContent = styled.div`
  display: flex;
  flex-direction: column;

  @media only screen and ${breakpoints.tablet} {
    flex-direction: row;
  }
`;

const StyledVideo = styled.video`
  width: 100%;
  @media only screen and ${breakpoints.desktop} {
    height: 600px;
    width: 600px;
  }
`;

const StyledIneligibleMessageWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const InfoCircleIcon = styled.div`
  height: 16px;
  width: 16px;
  background: url(/icons/info_circle.svg) no-repeat scroll;
`;

const StyledSecondaryLink = styled.a`
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${colors.offBlack};
  cursor: pointer;
  height: 40px;
  text-decoration: none;
  &:hover {
    opacity: 0.8;
  }
`;
