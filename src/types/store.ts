export type CategoryType = 'clothing' | 'watch' | 'home';
export type FilterCategoryType = 'all' | CategoryType;

export interface ShopItem {
  id: string;
  nameEn: string;
  nameAm: string;
  category: CategoryType;
  price: number;
  statusBoost: number;
  icon: string;
}