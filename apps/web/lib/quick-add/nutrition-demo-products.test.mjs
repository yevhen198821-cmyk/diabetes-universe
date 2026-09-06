import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildNutritionDemoItemWriteSnapshot,
  findNutritionDemoProductById,
  NUTRITION_DEMO_PRODUCT_IDS,
  nutritionDemoProducts,
} from './nutrition-demo-products.ts';

test('every demo product has a locale-independent snapshot that is not its id', () => {
  assert.equal(nutritionDemoProducts.length, NUTRITION_DEMO_PRODUCT_IDS.length);

  for (const product of nutritionDemoProducts) {
    assert.equal(typeof product.canonicalSnapshotName, 'string');
    assert.ok(product.canonicalSnapshotName.trim().length > 0);
    assert.notEqual(product.canonicalSnapshotName, product.id);
  }
});

test('demo write snapshots use canonicalSnapshotName and never persist catalogue ids', () => {
  const product = findNutritionDemoProductById('apple');

  assert.ok(product);
  if (!product) {
    return;
  }

  const snapshot = buildNutritionDemoItemWriteSnapshot({
    itemId: 'nutrition-item-fixed',
    product,
    weightGrams: 100,
  });

  assert.equal(snapshot.name, product.canonicalSnapshotName);
  assert.notEqual(snapshot.name, product.id);
  assert.equal(snapshot.itemId, 'nutrition-item-fixed');
  assert.notEqual(snapshot.itemId, product.id);
  assert.equal(snapshot.weightGrams, 100);
  assert.equal(snapshot.carbsPer100Grams, 14);
  assert.equal(snapshot.carbohydratesGrams, 14);
  assert.equal(Object.hasOwn(snapshot, 'productId'), false);
  assert.equal(Object.hasOwn(snapshot, 'demoProductId'), false);
});
