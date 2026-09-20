import { RoomType, Component, PackageItem, ComponentCategory } from '../types';

/**
 * Adapter to convert RoomType to PackageItem
 * Ensures RoomType is the Single Source of Truth for ROOM components
 */
export function roomToPackageItem(room: RoomType): PackageItem {
  return {
    id: room.id,
    type: 'ROOM',
    name: room.name,
    description: room.description || `${room.capacity} / ${room.bedType} / ${room.size}`,
    basePrice: room.standardPrice || 0,
    isDiscountable: true, // Rooms are default discountable by partner rates
    isAvailable: true,
    sourceId: room.id,
  };
}

/**
 * Adapter to convert Component to PackageItem
 */
export function componentToPackageItem(comp: Component): PackageItem {
  return {
    id: comp.id,
    type: comp.category,
    name: comp.name,
    description: comp.description || '',
    basePrice: comp.basePrice,
    isDiscountable: comp.isDiscountable,
    isAvailable: comp.isActive,
    sourceId: comp.id,
  };
}
