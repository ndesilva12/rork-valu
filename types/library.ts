// Library types for list management

export type ListEntryType = 'brand' | 'business' | 'value' | 'link' | 'text';

export type ValueListMode = 'maxPain' | 'maxBenefit';

export interface BaseListEntry {
  id: string;
  type: ListEntryType;
  createdAt: Date;
}

export interface BrandListEntry extends BaseListEntry {
  type: 'brand';
  brandId: string;
  brandName: string;
  brandCategory?: string;
}

export interface BusinessListEntry extends BaseListEntry {
  type: 'business';
  businessId: string;
  businessName: string;
  businessCategory?: string;
}

export interface ValueListEntry extends BaseListEntry {
  type: 'value';
  valueId: string;
  valueName: string;
  mode: ValueListMode; // 'maxPain' or 'maxBenefit'
}

export interface LinkListEntry extends BaseListEntry {
  type: 'link';
  url: string;
  title: string;
  description?: string;
}

export interface TextListEntry extends BaseListEntry {
  type: 'text';
  content: string;
}

export type ListEntry = BrandListEntry | BusinessListEntry | ValueListEntry | LinkListEntry | TextListEntry;

export interface UserList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  entries: ListEntry[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}
