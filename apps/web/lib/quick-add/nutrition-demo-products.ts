export interface NutritionDemoProduct {
  readonly id: string;
  readonly name: string;
  readonly carbsPer100Grams: number;
}

export const nutritionDemoProducts: readonly NutritionDemoProduct[] = [
  {
    carbsPer100Grams: 14,
    id: 'apple',
    name: 'Яблоко',
  },
  {
    carbsPer100Grams: 23,
    id: 'banana',
    name: 'Банан',
  },
  {
    carbsPer100Grams: 12,
    id: 'oatmeal-cooked',
    name: 'Овсянка готовая',
  },
  {
    carbsPer100Grams: 28,
    id: 'rice-boiled',
    name: 'Рис варёный',
  },
  {
    carbsPer100Grams: 17,
    id: 'potato-boiled',
    name: 'Картофель варёный',
  },
  {
    carbsPer100Grams: 43,
    id: 'wholegrain-bread',
    name: 'Хлеб цельнозерновой',
  },
  {
    carbsPer100Grams: 5,
    id: 'milk',
    name: 'Молоко',
  },
  {
    carbsPer100Grams: 4,
    id: 'plain-yogurt',
    name: 'Йогурт без сахара',
  },
];

export const nutritionDemoProductOptions: readonly string[] =
  nutritionDemoProducts.map((product) => product.name);

export function findNutritionDemoProductByName(
  productName: string,
): NutritionDemoProduct | undefined {
  return nutritionDemoProducts.find((product) => product.name === productName);
}
