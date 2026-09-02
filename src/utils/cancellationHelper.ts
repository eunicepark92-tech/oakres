import { Reservation, SeasonPeriod, SeasonalCancellationRule } from '../types';

export interface CancellationPenaltyInfo {
  daysBeforeCheckIn: number;
  isInPenaltyPeriod: boolean;
  penaltyRate: number;
  penaltyAmount: number;
  refundAmount: number;
  seasonLabel: string;
  ruleLabel: string;
}

export function getReservationCancellationFeeInfo(
  reservation: Reservation,
  seasonPeriods: SeasonPeriod[],
  seasonalCancellationRules: SeasonalCancellationRule[]
): CancellationPenaltyInfo {
  const checkInStr = reservation.checkIn;
  const totalPrice = reservation.totalPrice;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkInDt = new Date(checkInStr);
  checkInDt.setHours(0, 0, 0, 0);

  const diffMs = checkInDt.getTime() - today.getTime();
  const daysBeforeCheckIn = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Determine season type
  let isPeak = false;
  let isWeekend = false;
  let seasonLabel = '비수기 주중';

  const matchedPeak = seasonPeriods.find(
    (p) => checkInStr >= p.startDate && checkInStr <= p.endDate
  );
  if (matchedPeak) {
    isPeak = true;
    seasonLabel = `성수기 (${matchedPeak.name})`;
  } else {
    const day = checkInDt.getDay();
    isWeekend = day === 5 || day === 6; // Friday or Saturday
    seasonLabel = isWeekend ? '비수기 주말' : '비수기 주중';
  }

  // Find matched rule
  const sortedRules = [...seasonalCancellationRules].sort((a, b) => b.minDays - a.minDays);
  
  let penaltyRate = 0;
  let ruleLabel = '무료 취소 가능 (위약금 0%)';

  if (daysBeforeCheckIn <= 0) {
    // Check-in date is today or past
    penaltyRate = 100;
    ruleLabel = '입실 당일/경과';
  } else {
    const matchedRule = sortedRules.find((r) => daysBeforeCheckIn >= r.minDays);
    if (matchedRule) {
      if (isPeak) {
        penaltyRate = matchedRule.peakSeasonRate;
      } else if (isWeekend) {
        penaltyRate = matchedRule.offPeakWeekendRate;
      } else {
        penaltyRate = matchedRule.offPeakWeekdayRate;
      }
      ruleLabel = matchedRule.label;
    } else {
      penaltyRate = 100;
      ruleLabel = '입실 1일 전 / 당일';
    }
  }

  const isInPenaltyPeriod = penaltyRate > 0 && reservation.status !== 'cancelled';
  const penaltyAmount = Math.round((totalPrice * penaltyRate) / 100);
  const refundAmount = Math.max(0, totalPrice - penaltyAmount);

  return {
    daysBeforeCheckIn,
    isInPenaltyPeriod,
    penaltyRate,
    penaltyAmount,
    refundAmount,
    seasonLabel,
    ruleLabel,
  };
}
