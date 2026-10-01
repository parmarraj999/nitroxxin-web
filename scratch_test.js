
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAG-FLs94I1LRNQ0Gwnyey-Dwjia8NVdn0',
  projectId: 'nitroxxin-web',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function firstImage(item) {
  if (!item) return '';
  if (item.media?.primaryImage) return item.media.primaryImage;
  if (Array.isArray(item.media?.galleryImages) && item.media.galleryImages.length) return item.media.galleryImages[0];
  if (Array.isArray(item.images) && item.images.length) return item.images[0];
  return item.image || '';
}

function normalizeProduct(doc) {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  const mrp = Number(data.price ?? data.pricing?.mrp ?? data.mrp ?? data.regularPrice ?? 0);
  const selling = Number(data.pricing?.sellingPrice ?? data.salePrice ?? data.discountPrice ?? 0);
  const rawOffer = Number(data.offerPrice ?? data.pricing?.offerPrice ?? 0);

  const offerPrice = rawOffer > 0 ? rawOffer : (selling > 0 ? selling : (mrp > 0 ? mrp : 0));
  const price = mrp > 0 ? mrp : offerPrice;

  const category = data.categoryName || data.category || data.categoryId || '';
  const subcategory = data.subcategory || data.subCategory || data.subCategoryName || data.subcategoryId || '';
  const brand = data.brandName || data.brand || data.brandId || '';
  const vendorName = data.vendorName || data.vendor?.name || data.shopName || data.businessName || '';
  const manufacturer = data.manufacturer || data.maker || '';

  const keywords = [
    ...(Array.isArray(data.seo?.keywords) ? data.seo.keywords : []),
    ...(Array.isArray(data.keywords) ? data.keywords : []),
  ];
  const tags = [
    ...(Array.isArray(data.seo?.tags) ? data.seo.tags : []),
    ...(Array.isArray(data.tags) ? data.tags : []),
  ];

  return {
    ...data,
    id,
    name: data.title || data.name || 'Product',
    title: data.title || data.name || 'Product',
    category,
    categoryName: category,
    subcategory,
    subCategory: subcategory,
    brand,
    brandName: brand,
    vendorId: data.vendorId || data.vendor?.id || '',
    vendorName,
    manufacturer,
    keywords,
    tags,
    image: firstImage(data),
    price,
    offerPrice,
    status: String(data.status || 'published').toLowerCase(),
  };
}

async function verify() {
  const snap = await getDoc(doc(db, 'product-collection', 'vSwDPQR2UX4wWywEBLYE'));
  const p = normalizeProduct(snap);

  console.log('=== Normalized Product ===');
  console.log('Name:', p.name);
  console.log('Category:', p.category);
  console.log('Subcategory:', p.subcategory);
  console.log('Brand:', p.brand);
  console.log('Price:', p.price, '| OfferPrice:', p.offerPrice);
  console.log('VendorId:', p.vendorId);
  console.log('Keywords:', p.keywords);

  console.log('\n=== Search Tests ===');
  const testTerms = ['RJ', 'jacket', 'lether', 'rynox', 'riding', 'raj', 'riding jacket'];
  testTerms.forEach(term => {
    const searchWords = term.toLowerCase().split(/\s+/).filter(Boolean);
    const fullText = [
      p.name, p.title, p.category, p.categoryName, p.subcategory, p.subCategory,
      p.brand, p.brandName, p.vendorName, p.manufacturer, p.subtitle,
      p.shortDescription, p.description, ...p.keywords, ...p.tags
    ].filter(Boolean).join(' ').toLowerCase();

    const matched = searchWords.every(w => fullText.includes(w));
    console.log('  Search [' + term + ']:', matched ? 'PASSED ✓' : 'FAILED ✗');
  });

  console.log('\n=== Category Filter Tests ===');
  const testCategories = ['Rider Wear', 'rider-wear', 'RIDER WEAR'];
  testCategories.forEach(cat => {
    const catNorm = cat.toLowerCase().replace(/[-_]/g, ' ').trim();
    const pCat = String(p.category).toLowerCase().replace(/[-_]/g, ' ').trim();
    const matched = pCat === catNorm || pCat.includes(catNorm) || catNorm.includes(pCat);
    console.log('  Category [' + cat + ']:', matched ? 'PASSED ✓' : 'FAILED ✗');
  });

  console.log('\n=== Subcategory Filter Tests ===');
  const testSubcategories = ['Riding Jackets', 'riding-jackets', 'jackets'];
  testSubcategories.forEach(sub => {
    const subNorm = sub.toLowerCase().replace(/[-_]/g, ' ').trim();
    const pSub = String(p.subcategory).toLowerCase().replace(/[-_]/g, ' ').trim();
    const matched = pSub === subNorm || pSub.includes(subNorm) || subNorm.includes(pSub);
    console.log('  Subcategory [' + sub + ']:', matched ? 'PASSED ✓' : 'FAILED ✗');
  });

  console.log('\n=== Brand Filter Tests ===');
  const testBrands = ['Rynox', 'rynox'];
  testBrands.forEach(b => {
    const bNorm = b.toLowerCase().replace(/[-_]/g, ' ').trim();
    const pBrand = String(p.brand).toLowerCase().replace(/[-_]/g, ' ').trim();
    const matched = pBrand === bNorm;
    console.log('  Brand [' + b + ']:', matched ? 'PASSED ✓' : 'FAILED ✗');
  });
}

verify().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
