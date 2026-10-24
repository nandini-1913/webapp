import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { useSession } from '../../../session/SessionContext';
import { mockRewardService } from '../../../services/rewards/mockRewardService';
import { isEarned } from '../../../services/rewards/rewardModels';
import type { RewardLedgerEntry } from '../../../services/rewards/rewardModels';
import { StorefrontHeader } from '../../../shared/StorefrontHeader';
import { withAlpha } from '../../../theme';
import mock from './MyRewards.mock.json';
import {
  Screen,
  MobileAppBar,
  MobileTitle,
  IconButton,
  Page,
  WebHead,
  BackLink,
  WebTitle,
  WebSubtitle,
  RefreshButton,
  Layout,
  Summary,
  PointsCard,
  Glow,
  Medal,
  CardBody,
  PointsBadge,
  BalanceLabel,
  BalanceRow,
  BalanceValue,
  BalanceUnit,
  StatsBox,
  StatDivider,
  Stat,
  StatIcon,
  StatText,
  HistoryTitle,
  HistoryList,
  HistoryTile,
  TileIcon,
  TileBody,
  TileTop,
  TileTitle,
  TilePoints,
  TileDetails,
  TileDate,
  Empty,
  EmptyIcon,
  EmptyTitle,
  EmptySubtitle,
} from './MyRewards.styles';

const { _pointsCard, _empty } = mock;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Flutter `_formatPoints` — thousands separators every 3 digits. */
const formatPoints = (points: number) => points.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Flutter `_formatInr`. */
const formatInr = (value: number) => `₹${formatPoints(Math.round(value))}`;

/** Flutter `_formatDate` — `d MMM yyyy`. */
const formatDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const fetchRewards = (userId: string) =>
  Promise.all([
    mockRewardService.getBalanceForUser(userId),
    mockRewardService.getLedgerEntriesForUser(userId),
  ]);

/**
 * Flutter `MyRewardsScreen` (`/my-rewards`). Mobile keeps the Flutter app bar
 * and single column; web (≥ md) uses the storefront header with a sticky
 * points card beside the reward history.
 */
export function MyRewards() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useSession();
  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<RewardLedgerEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchRewards(user.id).then(([nextBalance, nextEntries]) => {
      if (!active) return;
      setBalance(nextBalance);
      setEntries(nextEntries);
    });
    return () => {
      active = false;
    };
  }, [user.id]);

  // RewardController.refreshForUser
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextBalance, nextEntries] = await fetchRewards(user.id);
      setBalance(nextBalance);
      setEntries(nextEntries);
    } finally {
      setRefreshing(false);
    }
  }, [user.id]);

  const totalEarned = entries.filter(isEarned).reduce((sum, e) => sum + e.points, 0);
  const totalRedeemed = entries.filter((e) => !isEarned(e)).reduce((sum, e) => sum + e.points, 0);

  const goBack = () => navigate(-1);

  return (
    <Screen>
      <StorefrontHeader webOnly />

      <MobileAppBar>
        <IconButton type="button" aria-label={mock._backLabel} onClick={goBack}>
          <i className="pi pi-arrow-left" aria-hidden />
        </IconButton>
        <MobileTitle>{mock._title}</MobileTitle>
        <IconButton
          type="button"
          title={mock._refreshTooltip}
          aria-label={mock._refreshTooltip}
          $spinning={refreshing}
          onClick={() => void refresh()}
        >
          <i className="pi pi-refresh" aria-hidden />
        </IconButton>
      </MobileAppBar>

      <Page>
        <WebHead>
          <div>
            <BackLink type="button" onClick={goBack}>
              <i className="pi pi-arrow-left" aria-hidden />
              {mock._backLabel}
            </BackLink>
            <WebTitle>{mock._title}</WebTitle>
            <WebSubtitle>{mock._webSubtitle}</WebSubtitle>
          </div>
          <RefreshButton type="button" $spinning={refreshing} onClick={() => void refresh()}>
            <i className="pi pi-refresh" aria-hidden />
            {mock._refreshTooltip}
          </RefreshButton>
        </WebHead>

        <Layout>
          <Summary>
            <PointsCard aria-label={_pointsCard.badge}>
              <Glow
                $size={180}
                $color={withAlpha(theme.rewards.gold, 0.22)}
                style={{ top: -60, right: -40 }}
              />
              <Glow
                $size={170}
                $color={withAlpha(theme.colors.white, 0.08)}
                style={{ bottom: -70, left: -50 }}
              />
              <Medal className="pi pi-crown" aria-hidden />
              <CardBody>
                <PointsBadge>
                  <i className="pi pi-star-fill" aria-hidden />
                  {_pointsCard.badge}
                </PointsBadge>
                <BalanceLabel>{_pointsCard.balanceLabel}</BalanceLabel>
                <BalanceRow>
                  <BalanceValue>{formatPoints(balance)}</BalanceValue>
                  <BalanceUnit>{_pointsCard.unit}</BalanceUnit>
                </BalanceRow>
                <StatsBox>
                  <Stat>
                    <StatIcon $color={theme.rewards.earnedGreen}>
                      <i className="pi pi-chart-line" aria-hidden />
                    </StatIcon>
                    <StatText>
                      <span>{_pointsCard.totalEarnedLabel}</span>
                      <strong>
                        {formatPoints(totalEarned)} {_pointsCard.unit}
                      </strong>
                    </StatText>
                  </Stat>
                  <StatDivider />
                  <Stat>
                    <StatIcon $color={theme.rewards.gold}>
                      <i className="pi pi-gift" aria-hidden />
                    </StatIcon>
                    <StatText>
                      <span>{_pointsCard.redeemedLabel}</span>
                      <strong>
                        {formatPoints(totalRedeemed)} {_pointsCard.unit}
                      </strong>
                    </StatText>
                  </Stat>
                </StatsBox>
              </CardBody>
            </PointsCard>
          </Summary>

          <section>
            <HistoryTitle>
              <i className="pi pi-history" aria-hidden />
              {mock._historyTitle}
            </HistoryTitle>

            {entries.length === 0 ? (
              <Empty>
                <EmptyIcon>
                  <i className="pi pi-star-fill" aria-hidden />
                </EmptyIcon>
                <EmptyTitle>{_empty.title}</EmptyTitle>
                <EmptySubtitle>{_empty.subtitle}</EmptySubtitle>
              </Empty>
            ) : (
              <HistoryList>
                {entries.map((entry) => {
                  const positive = isEarned(entry);
                  return (
                    <HistoryTile key={entry.id}>
                      <TileIcon $positive={positive}>
                        <i
                          className={`pi ${positive ? 'pi-arrow-up' : 'pi-arrow-down'}`}
                          aria-hidden
                        />
                      </TileIcon>
                      <TileBody>
                        <TileTop>
                          <TileTitle>
                            {mock._quotationPrefix}
                            {entry.quotationDisplayId || entry.quotationId}
                          </TileTitle>
                          <TilePoints $positive={positive}>
                            {positive ? '+' : '-'}
                            {formatPoints(entry.points)}
                          </TilePoints>
                        </TileTop>
                        <TileDetails>
                          <span>{entry.description || mock._defaultDescription}</span>
                          {entry.quotationGrandTotal > 0 && (
                            <span>
                              {formatInr(entry.quotationGrandTotal)} {mock._quotationSuffix}
                            </span>
                          )}
                        </TileDetails>
                        <TileDate>{formatDate(entry.createdAt)}</TileDate>
                      </TileBody>
                    </HistoryTile>
                  );
                })}
              </HistoryList>
            )}
          </section>
        </Layout>
      </Page>
    </Screen>
  );
}
