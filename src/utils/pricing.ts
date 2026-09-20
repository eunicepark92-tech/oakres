import { Component, Partner, PartnerComponentRule, SpecialDay, DiyRoomRate } from '../types';

export interface CalculatedComponentPrice {
  price: number;
  ruleApplied: string;
  code: number;
  isVisible: boolean;
}

/**
 * Gets the base price of a Component for a specific date, factoring in special days and day of week.
 */
export function getComponentBasePriceForDate(
  comp: Component,
  targetDate: string,
  specialDays: SpecialDay[]
): number {
  if (!comp.startDate || !comp.endDate) {
    return comp.basePrice;
  }

  // Check if targetDate falls within range
  if (targetDate >= comp.startDate && targetDate <= comp.endDate) {
    const dateObj = new Date(targetDate);
    const dayOfWeek = dateObj.getDay(); // 0: Sunday, 5: Friday, 6: Saturday
    const isSpecial = specialDays.some((sd) => sd.date === targetDate);

    if (isSpecial && comp.specialPrice !== undefined && comp.specialPrice !== null) {
      return comp.specialPrice;
    }
    if (dayOfWeek === 6 && comp.saturdayPrice !== undefined && comp.saturdayPrice !== null) {
      return comp.saturdayPrice;
    }
    if (dayOfWeek === 5 && comp.fridayPrice !== undefined && comp.fridayPrice !== null) {
      return comp.fridayPrice;
    }
    if (comp.weekdayPrice !== undefined && comp.weekdayPrice !== null) {
      return comp.weekdayPrice;
    }
  }

  return comp.basePrice;
}

/**
 * Calculates the final price of a DIY component for a given partner based on priority rules:
 * 1. partner_component_rules.customPrice (1st Priority)
 * 2. partner_component_rules.customDiscountRate (2nd Priority, applied to date-dependent base price)
 * 3. partner.discountRate (3rd Priority, applied to date-dependent base price, only if component is discountable)
 * 4. Date-dependent base price (4th Priority / Fallback)
 */
export function calculateComponentPrice(
  comp: Component,
  partner: Partner,
  partnerComponentRules: PartnerComponentRule[],
  specialDays: SpecialDay[] = [],
  targetDate?: string
): CalculatedComponentPrice {
  const rule = partnerComponentRules.find(
    (r) => r.partnerId === partner.id && r.componentId === comp.id
  );

  // If there is a rule and the component is set to not visible
  if (rule && !rule.isVisible) {
    return {
      price: 0,
      ruleApplied: '미노출 (Hole)',
      code: 0,
      isVisible: false,
    };
  }

  // 1st Priority: Custom Price (전용가)
  if (rule && rule.customPrice !== undefined && rule.customPrice !== null) {
    return {
      price: rule.customPrice,
      ruleApplied: '제휴사 전용가 적용',
      code: 1,
      isVisible: true,
    };
  }

  // Determine base price according to date/day-of-week rules
  const basePrice = targetDate
    ? getComponentBasePriceForDate(comp, targetDate, specialDays)
    : comp.basePrice;

  // 2nd Priority: Custom Discount Rate (개별 할인율)
  if (rule && rule.customDiscountRate !== undefined && rule.customDiscountRate !== null) {
    const finalPrice = Math.max(0, basePrice * (1 - rule.customDiscountRate / 100));
    return {
      price: Math.round(finalPrice),
      ruleApplied: `개별 할인율 (${rule.customDiscountRate}%) 적용`,
      code: 2,
      isVisible: true,
    };
  }

  // 3rd Priority: Partner Base Discount Rate is disabled for DIY components as per policy.
  // 4th Priority: Base Price
  return {
    price: basePrice,
    ruleApplied: comp.isDiscountable
      ? '기본 판매가 적용 (할인 미적용 제휴사)'
      : '기본 판매가 적용 (할인 불가 상품)',
    code: 4,
    isVisible: true,
  };
}

/**
 * Calculates the DIY room price for a single target date.
 */
export function getDiyRoomPriceForDate(
  roomTypeId: string,
  targetDate: string,
  diyRoomRates: DiyRoomRate[],
  specialDays: SpecialDay[]
): number {
  const rule = diyRoomRates.find(
    (r) =>
      r.roomTypeId === roomTypeId &&
      r.isActive &&
      targetDate >= r.startDate &&
      targetDate <= r.endDate
  );

  if (!rule) {
    // Fallbacks
    if (roomTypeId === 'room-golf-31') return 150000;
    if (roomTypeId === 'room-golf-48') return 220000;
    if (roomTypeId === 'room-caravan') return 120000;
    if (roomTypeId === 'room-museum-penthouse') return 350000;
    return 150000;
  }

  const dateObj = new Date(targetDate);
  const dayOfWeek = dateObj.getDay(); // 0: Sunday, 5: Friday, 6: Saturday
  const isSpecial = specialDays.some((sd) => sd.date === targetDate);

  if (isSpecial) {
    return rule.specialPrice;
  }
  if (dayOfWeek === 6) {
    return rule.saturdayPrice;
  }
  if (dayOfWeek === 5) {
    return rule.fridayPrice;
  }
  return rule.weekdayPrice;
}

/**
 * Calculates the total DIY room price for a multiple nights stay.
 */
export function calculateDiyRoomStayPrice(
  roomTypeId: string,
  checkIn: string,
  nights: number,
  diyRoomRates: DiyRoomRate[],
  specialDays: SpecialDay[]
): number {
  let total = 0;
  const checkInDate = new Date(checkIn);

  for (let i = 0; i < nights; i++) {
    const d = new Date(checkInDate);
    d.setDate(checkInDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    total += getDiyRoomPriceForDate(roomTypeId, dateStr, diyRoomRates, specialDays);
  }

  return total;
}
