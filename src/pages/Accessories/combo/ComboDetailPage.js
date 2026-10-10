import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './ComboDetailPage.css';
import { useCollection, useDocument } from '../../../hooks/useFirestore';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { addToCart } from '../../../services/commerceService';
import { db } from '../../../services/firebase';

// Fallback high-value demo combos with distinct bundled packs
const DEFAULT_COMBOS = [
  {
    id: 'combo-starter-touring',
    title: 'Street & Touring Pro Bundle',
    subtitle: 'Complete high-speed protection with aerodynamic full-face helmet, armored gloves, knee guards & balaclava.',
    badge: '🔥 Bestseller Combo',
    discountText: 'Save 25% OFF',
    discountPercent: 25,
    color: '#1e7a3a',
    mixedImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    bundles: [
      {
        id: 'bundle-touring-starter',
        title: 'Basic Creator Combo',
        subtitle: 'The essential starter bundle crafted for daily rides, urban commutes, and open highway protection with certified comfort.',
        badge: '25% OFF',
        discountPercent: 25,
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        productList: [
          {
            id: 'prod-t-1',
            title: 'LockGrip Pro Handlebar Phone Mount — 360° Rotation, Vibration Damped, Universal Fit',
            brand: 'Nitroxx Precision Gear',
            price: 1199,
            offerPrice: 849,
            imageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-2',
            title: 'MagnaMap Tank Bag — Magnetic Base, Transparent Map Pocket, 8L Capacity',
            brand: 'NGK',
            price: 2399,
            offerPrice: 1849,
            imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-3',
            title: 'TrekMoto Trail Boot — Ankle Protection, Anti-Slip Sole, Waterproof',
            brand: 'Steelbird',
            price: 4999,
            offerPrice: 3999,
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-4',
            title: 'CityRide Open Face Helmet — IS 4151 Certified, Retro Style, Wide Vision Shield',
            brand: 'NGK',
            price: 2299,
            offerPrice: 1799,
            imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
      {
        id: 'bundle-touring-pro',
        title: 'Pro Touring Armor Pack',
        subtitle: 'CE-Level 2 armored jacket, dual knee guards, gloves & magnetic tank bag for highway long hauls.',
        badge: '30% OFF',
        discountPercent: 30,
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
        productList: [
          {
            id: 'prod-t-5',
            title: 'Airframe CE-Level 2 Riding Jacket — Impact Abrasion Resistance',
            brand: 'Alpinestars',
            price: 7999,
            offerPrice: 6799,
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-6',
            title: 'Dual Bionic Armored Knee Guards — Ergonomic Hinge System',
            brand: 'Scoyco',
            price: 2899,
            offerPrice: 2299,
            imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-2',
            title: 'MagnaMap Tank Bag — Magnetic Base, 8L Capacity',
            brand: 'NGK',
            price: 2399,
            offerPrice: 1849,
            imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
      {
        id: 'bundle-touring-ultimate',
        title: 'Ultimate Cross-Country Expedition',
        subtitle: 'Full coverage protective suit, DOT helmet, tail bag & thermal balaclava for true adventure riders.',
        badge: '35% OFF',
        discountPercent: 35,
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
        productList: [
          {
            id: 'prod-t-1',
            title: 'Axor Apex Venom Aerodynamic Helmet — Dual Visor',
            brand: 'Axor',
            price: 4999,
            offerPrice: 4299,
            imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-5',
            title: 'Airframe CE-Level 2 Riding Jacket',
            brand: 'Alpinestars',
            price: 7999,
            offerPrice: 6799,
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-3',
            title: 'TrekMoto Trail Boot — Waterproof',
            brand: 'Steelbird',
            price: 4999,
            offerPrice: 3999,
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
      {
        id: 'bundle-track-master',
        title: 'Track Master Racing Kit',
        subtitle: 'Racing gauntlets, carbon helmet & knee sliders designed for maximum track performance.',
        badge: '20% OFF',
        discountPercent: 20,
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
        productList: [
          {
            id: 'prod-t-1',
            title: 'Axor Apex Venom Aerodynamic Helmet',
            brand: 'Axor',
            price: 4999,
            offerPrice: 4299,
            imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'prod-t-6',
            title: 'Dual Bionic Armored Knee Guards',
            brand: 'Scoyco',
            price: 2899,
            offerPrice: 2299,
            imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
          },
        ],
      },
    ],
  },
];

// Helper to normalize single product/item in a bundle
function normalizeBundleItem(item, idx, catalogProducts = []) {
  if (!item) return null;
  const itemId = typeof item === 'string' ? item : item.productId || item.product_id || item.id;
  const matched = catalogProducts.find(
    (p) =>
      String(p.id) === String(itemId) ||
      (item.name && String(p.name || '').toLowerCase() === String(item.name).toLowerCase()) ||
      (item.title && String(p.title || '').toLowerCase() === String(item.title).toLowerCase())
  );

  const title =
    matched?.title ||
    matched?.name ||
    (typeof item === 'object' ? item.title || item.name || item.productName || item.bundleName : `Product ${idx + 1}`);

  const brand =
    matched?.brand ||
    (typeof item === 'object' ? item.brand || item.brandName : 'Nitroxx') ||
    'Nitroxx';

  const image =
    matched?.image ||
    matched?.imageUrl ||
    matched?.banner ||
    matched?.thumbnail ||
    (typeof item === 'object' ? item.image || item.imageUrl || item.bundleImage || item.banner || item.mergedImageUrl : '') ||
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80';

  const offerPrice = Number(
    matched?.offerPrice ?? (typeof item === 'object' ? item.offerPrice ?? item.bundlePrice ?? item.dealPrice ?? item.price : 0)
  );

  const regularPrice = Number(
    matched?.price ?? (typeof item === 'object' ? item.price ?? item.regularPrice ?? item.mrp : 0)
  );

  const finalOffer = offerPrice > 0 ? offerPrice : (regularPrice > 0 ? regularPrice : 1999);
  const finalRegular = regularPrice > finalOffer ? regularPrice : Math.round(finalOffer * 1.25);

  return {
    id: typeof item === 'object' && item.id ? item.id : (itemId || `combo-prod-${idx}`),
    productId: matched?.id || itemId || `prod-${idx}`,
    title,
    brand,
    image,
    offerPrice: finalOffer,
    regularPrice: finalRegular,
    rawProduct: matched || (typeof item === 'object' ? item : { id: itemId, title, price: finalRegular, offerPrice: finalOffer, image }),
  };
}

export default function ComboDetailPage() {
  const { comboId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const accessoriesCtx = useAccessoriesContext();
  const catalogProducts = useMemo(() => accessoriesCtx?.products || [], [accessoriesCtx]);

  // Selected bundle for full popup modal view
  const [selectedPopupBundle, setSelectedPopupBundle] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPopupBundle(null);
      }
    };
    if (selectedPopupBundle) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPopupBundle]);

  // Cart counting
  const { data: userCartItems = [] } = useCollection(
    user?.uid ? `user/${user.uid}/cart` : null,
    { limit: 50 }
  );
  const { data: usersPluralCartItems = [] } = useCollection(
    user?.uid ? `users/${user.uid}/cart` : null,
    { limit: 50 }
  );
  const cartCount = (userCartItems.length + usersPluralCartItems.length) || 0;

  // 1. Fetch live Combo Category Document from Firestore `combo/comboId`
  const { data: comboDoc, loading: comboDocLoading } = useDocument('combo', comboId);
  const { data: pluralComboDoc } = useDocument('combos', comboId);

  // 2. Fetch live Combo Bundles from Subcollection `combo/comboId/combo-bundle` (with naming variations)
  const { data: subBundleDocs = [], loading: subBundleLoading } = useCollection(
    comboId ? `combo/${comboId}/combo-bundle` : null
  );
  const { data: subBundlesPlural = [] } = useCollection(
    comboId ? `combo/${comboId}/combo-bundles` : null
  );
  const { data: subBundleUnderscore = [] } = useCollection(
    comboId ? `combo/${comboId}/combo_bundle` : null
  );
  const { data: subBundleCombobundle = [] } = useCollection(
    comboId ? `combo/${comboId}/combobundle` : null
  );
  const { data: subBundleBundles = [] } = useCollection(
    comboId ? `combo/${comboId}/bundles` : null
  );
  const { data: pluralPathBundles = [] } = useCollection(
    comboId ? `combos/${comboId}/combo-bundle` : null
  );

  // Direct manual fetch fallback state
  const [directBundles, setDirectBundles] = useState([]);
  const [directCategory, setDirectCategory] = useState(null);

  useEffect(() => {
    if (!comboId) return;

    let isMounted = true;
    const fetchDirectData = async () => {
      try {
        const firestore = db();
        
        // Fetch Category doc directly if not loaded
        if (!comboDoc && !pluralComboDoc) {
          const catSnap = await firestore.collection('combo').doc(comboId).get();
          if (catSnap.exists && isMounted) {
            setDirectCategory({ id: catSnap.id, ...catSnap.data() });
          } else {
            const catPluralSnap = await firestore.collection('combos').doc(comboId).get();
            if (catPluralSnap.exists && isMounted) {
              setDirectCategory({ id: catPluralSnap.id, ...catPluralSnap.data() });
            }
          }
        }

        // Fetch subcollection directly: combo/comboId/combo-bundle
        const subcollNames = ['combo-bundle', 'combo_bundle', 'combo-bundles', 'combobundle', 'bundles'];
        let foundDocs = [];

        for (const subName of subcollNames) {
          const subSnap = await firestore.collection('combo').doc(comboId).collection(subName).get();
          if (!subSnap.empty) {
            foundDocs = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            break;
          }
        }

        if (foundDocs.length === 0) {
          for (const subName of subcollNames) {
            const subSnap = await firestore.collection('combos').doc(comboId).collection(subName).get();
            if (!subSnap.empty) {
              foundDocs = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              break;
            }
          }
        }

        if (foundDocs.length > 0 && isMounted) {
          setDirectBundles(foundDocs);
        }
      } catch (err) {
        console.error('Direct bundle fetch error:', err);
      }
    };

    fetchDirectData();
    return () => {
      isMounted = false;
    };
  }, [comboId, comboDoc, pluralComboDoc]);

  // 3. Fallback layout documents
  const { data: primaryLayout } = useDocument('page_layouts', 'accessories_layout');
  const { data: fallbackLayout } = useDocument('page_layouts', 'accessories');
  const { data: singularLayout } = useDocument('page_layout', 'accessories_layout');

  const layoutCombos = useMemo(() => {
    const raw =
      primaryLayout?.combos ||
      fallbackLayout?.combos ||
      singularLayout?.combos ||
      [];
    if (Array.isArray(raw) && raw.length > 0) {
      const valid = raw.filter((c) => c && (c.title || c.name || c.categoryName));
      if (valid.length > 0) return valid;
    }
    return DEFAULT_COMBOS;
  }, [primaryLayout, fallbackLayout, singularLayout]);

  // Resolve Active Combo Category Data
  const combo = useMemo(() => {
    const activeDoc = comboDoc || pluralComboDoc || directCategory;
    if (activeDoc) {
      const title =
        activeDoc.title ||
        'Combo Bundles';
      const subtitle =
        activeDoc.description ||
        'Explore curated rider bundles and gear packages designed with exclusive savings. Choose your setup.';
      const badge =
        activeDoc.badge ||
        activeDoc.tag ||
        (activeDoc.discount ? `${activeDoc.discount}% OFF` : '🔥 Special Deals');
      const discountText =
        activeDoc.discountText ||
        (activeDoc.discount ? `Save ${activeDoc.discount}% OFF` : '') ||
        (activeDoc.discountPercent ? `Save ${activeDoc.discountPercent}% OFF` : '');
      const color =
        activeDoc.color ||
        activeDoc.bgColor ||
        '#2563eb';
      const thumbnail =
        activeDoc.thumbnailUrl ||
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80';

      return {
        id: comboId,
        ...activeDoc,
        title,
        subtitle,
        badge,
        discountText,
        color,
        thumbnail,
        mergedImageUrl: thumbnail,
        bannerUrl: activeDoc.bannerUrl || thumbnail,
      };
    }

    const matchedLayout = layoutCombos.find(
      (c) => String(c.id).toLowerCase() === String(comboId).toLowerCase()
    );
    if (matchedLayout) {
      return {
        ...matchedLayout,
        thumbnail: matchedLayout.mergedImageUrl || matchedLayout.image || matchedLayout.bannerUrl,
      };
    }

    const defaultMatched =
      DEFAULT_COMBOS.find(
        (c) => String(c.id).toLowerCase() === String(comboId).toLowerCase()
      ) || DEFAULT_COMBOS[0];

    return {
      ...defaultMatched,
      thumbnail: defaultMatched.mixedImage || defaultMatched.bannerUrl,
    };
  }, [comboDoc, pluralComboDoc, directCategory, comboId, layoutCombos]);

  // Resolve List of Bundles to render in Grid (from combo/comboId/combo-bundle subcollection)
  const bundles = useMemo(() => {
    const activeSubDocs =
      subBundleDocs.length > 0
        ? subBundleDocs
        : subBundlesPlural.length > 0
        ? subBundlesPlural
        : subBundleUnderscore.length > 0
        ? subBundleUnderscore
        : subBundleCombobundle.length > 0
        ? subBundleCombobundle
        : subBundleBundles.length > 0
        ? subBundleBundles
        : pluralPathBundles.length > 0
        ? pluralPathBundles
        : directBundles;

    if (activeSubDocs && activeSubDocs.length > 0) {
      return activeSubDocs.map((doc, idx) => {
        const title =
          doc.bundleName ||
          doc.bundleTitle ||
          doc.title ||
          doc.name ||
          doc.packName ||
          doc.categoryName ||
          `Bundle Pack ${idx + 1}`;

        const subtitle =
          doc.subtitle ||
          doc.description ||
          doc.details ||
          doc.desc ||
          `The curated gear combo contains essential rider accessories crafted for maximum protection and comfort.`;

        const rawProductsList =
          doc.productList ||
          doc.products ||
          doc.items ||
          doc.bundleItems ||
          doc.selectedProducts ||
          doc.productsList ||
          doc.bundleProducts ||
          [];

        let resolvedItems = [];
        if (Array.isArray(rawProductsList) && rawProductsList.length > 0) {
          resolvedItems = rawProductsList
            .map((item, pIdx) => normalizeBundleItem(item, `${idx}-${pIdx}`, catalogProducts))
            .filter(Boolean);
        } else {
          // Document itself is a bundle item/product
          const singleItem = normalizeBundleItem(doc, idx, catalogProducts);
          if (singleItem) {
            resolvedItems = [singleItem];
          }
        }

        const itemsOfferSum = resolvedItems.reduce((acc, p) => acc + Number(p.offerPrice || 0), 0);
        const itemsRegularSum = resolvedItems.reduce((acc, p) => acc + Number(p.regularPrice || 0), 0);

        const docOfferPrice = Number(
          doc.bundlePrice ?? doc.offerPrice ?? doc.dealPrice ?? doc.price ?? doc.salePrice ?? itemsOfferSum
        );
        const docRegularPrice = Number(
          doc.regularPrice ?? doc.mrp ?? doc.originalPrice ?? doc.actualPrice ?? itemsRegularSum
        );

        const offerPrice = docOfferPrice > 0 ? docOfferPrice : (itemsOfferSum > 0 ? itemsOfferSum : 3999);
        const regularPrice = docRegularPrice > offerPrice ? docRegularPrice : (itemsRegularSum > offerPrice ? itemsRegularSum : Math.round(offerPrice * 1.25));

        const bundleThumbnail =
          doc.thumbnailUrl ||
          doc.thumbnail ||
          doc.bundleThumbnail ||
          doc.mergedImageUrl ||
          doc.image ||
          doc.imageUrl ||
          doc.bundleImage ||
          doc.bannerUrl ||
          doc.banner ||
          combo.thumbnailUrl ||
          combo.thumbnail;

        const discountText =
          doc.discountText ||
          (doc.discount ? `${doc.discount}% OFF` : '') ||
          (doc.discountPercent ? `${doc.discountPercent}% OFF` : '');

        const badge =
          doc.badge ||
          doc.tag ||
          discountText ||
          (resolvedItems.length > 1 ? `${resolvedItems.length} Items Included` : 'Special Deal');

        return {
          id: doc.id || `bundle-${idx}`,
          title,
          subtitle,
          image: bundleThumbnail,
          thumbnail: bundleThumbnail,
          thumbnailUrl: bundleThumbnail,
          badge,
          discountText,
          offerPrice,
          regularPrice,
          products: resolvedItems,
          themeIndex: idx,
        };
      });
    }

    // Fallback: Check if bundles exist embedded on combo document
    const activeDoc = comboDoc || pluralComboDoc || directCategory;
    if (Array.isArray(activeDoc?.bundles) && activeDoc.bundles.length > 0) {
      return activeDoc.bundles.map((b, bIdx) => {
        const rawItems = b.productList || b.products || b.items || [];
        const products = rawItems
          .map((item, pIdx) => normalizeBundleItem(item, `${bIdx}-${pIdx}`, catalogProducts))
          .filter(Boolean);

        const totalOffer = products.reduce((acc, p) => acc + Number(p.offerPrice || 0), 0);
        const totalRegular = products.reduce((acc, p) => acc + Number(p.regularPrice || 0), 0);

        const bundleThumbnail =
          b.thumbnailUrl ||
          b.thumbnail ||
          b.bundleThumbnail ||
          b.mergedImageUrl ||
          b.image ||
          b.imageUrl ||
          combo.thumbnailUrl ||
          combo.thumbnail;

        return {
          id: b.id || `doc-bundle-${bIdx}`,
          title: b.title || b.name || `Bundle Pack ${bIdx + 1}`,
          subtitle: b.subtitle || b.description || 'Exclusive bundle offer.',
          badge: b.badge || `${products.length} Items`,
          discountText: b.discountText,
          image: bundleThumbnail,
          thumbnail: bundleThumbnail,
          thumbnailUrl: bundleThumbnail,
          offerPrice: Number(b.offerPrice || b.bundlePrice || totalOffer),
          regularPrice: Number(b.regularPrice || b.mrp || totalRegular),
          products,
          themeIndex: bIdx,
        };
      });
    }

    // Default Fallback Bundles
    const matchedComboDefault =
      DEFAULT_COMBOS.find((c) => String(c.id).toLowerCase() === String(comboId).toLowerCase()) ||
      DEFAULT_COMBOS[0];

    return (matchedComboDefault.bundles || []).map((b, bIdx) => {
      const products = (b.productList || []).map((item, pIdx) =>
        normalizeBundleItem(item, `${bIdx}-${pIdx}`, catalogProducts)
      );
      const totalOffer = products.reduce((acc, p) => acc + Number(p.offerPrice || 0), 0);
      const totalRegular = products.reduce((acc, p) => acc + Number(p.regularPrice || 0), 0);

      const bundleThumbnail =
        b.thumbnailUrl ||
        b.thumbnail ||
        b.image ||
        combo.thumbnailUrl ||
        combo.thumbnail;

      return {
        id: b.id || `default-bundle-${bIdx}`,
        title: b.title,
        subtitle: b.subtitle,
        badge: b.badge,
        discountText: b.discountText || `${b.discountPercent}% OFF`,
        image: bundleThumbnail,
        thumbnail: bundleThumbnail,
        thumbnailUrl: bundleThumbnail,
        offerPrice: totalOffer,
        regularPrice: totalRegular,
        products,
        themeIndex: bIdx,
      };
    });
  }, [
    subBundleDocs,
    subBundlesPlural,
    subBundleUnderscore,
    subBundleCombobundle,
    subBundleBundles,
    pluralPathBundles,
    directBundles,
    comboDoc,
    pluralComboDoc,
    directCategory,
    combo,
    catalogProducts,
    comboId,
  ]);

  const [addingBundleId, setAddingBundleId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Add all items in a bundle to cart
  const handleAddBundleToCart = async (bundle) => {
    if (!user) {
      openLogin();
      return;
    }
    if (!bundle?.products?.length) return;

    setAddingBundleId(bundle.id);
    try {
      for (const item of bundle.products) {
        await addToCart({
          userId: user.uid,
          product: item.rawProduct || item,
          quantity: 1,
          options: {
            comboId: combo.id || comboId,
            comboTitle: combo.title,
            bundleId: bundle.id,
            bundleTitle: bundle.title,
          },
        });
      }
      showToast(`🎉 Added "${bundle.title}" (${bundle.products.length} items) to cart!`);
    } catch (err) {
      console.error('Error adding bundle to cart:', err);
      showToast('Could not add bundle to cart. Please try again.');
    } finally {
      setAddingBundleId(null);
    }
  };

  const isLoading = comboDocLoading && subBundleLoading && bundles.length === 0;
  const avatarPalette = ['#dcfce7', '#dbeafe', '#fce7f3', '#e0f2fe', '#fef3c7', '#f3e8ff'];

  return (
    <div className="bundle-page-root">
      {/* ── Top Navigation Bar ── */}
      <header className="bundle-navbar">
        <div className="bundle-navbar-inner">
          {/* Back Button on Left */}
          <button
            type="button"
            className="bundle-nav-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back to categories"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          {/* Center Brand / Breadcrumb */}
          <div className="bundle-nav-center">
            <Link to="/accessories" className="bundle-nav-home-link">
              Accessories
            </Link>
            <span className="bundle-nav-slash">/</span>
            <span className="bundle-nav-current-title">{combo.title}</span>
          </div>

          {/* Right: Cart Button with live counter */}
          <div className="bundle-nav-right">
            <Link to="/cart" className="bundle-nav-cart-btn" aria-label="View Shopping Cart">
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && <span className="bundle-nav-cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="bundle-page-main">
        {/* ── Center Header ── */}
        <section className="bundle-hero-header">
          {/* Category Thumbnail Emblem */}
          <div className="bundle-category-thumbnail-wrapper">
            <div className="bundle-category-thumbnail-emblem">
              <img
                src={combo.thumbnail}
                alt={combo.title}
                className="bundle-category-thumbnail-img"
                loading="eager"
              />
            </div>
          </div>

          {/* Title right after thumbnail */}
          <h1 className="bundle-hero-title">
            Let's explore {combo.title} bundles!
          </h1>

          {/* Description right after title */}
          <p className="bundle-hero-description">
            {combo.subtitle ||
              "Curated rider gear packages bundled together with exclusive savings. Choose your favorite setup and ride protected."}
          </p>
        </section>

        {/* ── 4-Column Grid of Compact Bundle Cards (Image 1) ── */}
        {isLoading ? (
          <div className="bundle-loading-state">
            <div className="bundle-spinner" />
            <p>Loading bundles for {combo.title}...</p>
          </div>
        ) : (
          <section className="bundle-grid-4col">
            {bundles.map((bundle, idx) => {
              return (
                <div key={bundle.id || idx} className="bundle-compact-card">
                  {/* Card Image */}
                  <div
                    className="bundle-compact-img-wrap"
                    onClick={() => setSelectedPopupBundle(bundle)}
                    role="button"
                    tabIndex="0"
                    title={`View ${bundle.title} details`}
                  >
                    <img
                      src={bundle.thumbnailUrl || bundle.thumbnail || bundle.image || combo.thumbnailUrl || combo.thumbnail}
                      alt={bundle.title}
                      className="bundle-compact-img"
                      loading="lazy"
                    />
                  </div>

                  {/* Bottom Info: Title, Price, and Red (+) Button */}
                  <div className="bundle-compact-bottom-row">
                    <div
                      className="bundle-compact-info"
                      onClick={() => setSelectedPopupBundle(bundle)}
                      role="button"
                      tabIndex="0"
                    >
                      <h3 className="bundle-compact-title">{bundle.title}</h3>
                      <div className="bundle-compact-price">
                        Rs. {Number(bundle.offerPrice).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bundle-round-toggle-btn"
                      onClick={() => setSelectedPopupBundle(bundle)}
                      aria-label={`View ${bundle.title}`}
                      title="Open bundle details"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* ── Popup Modal with Blur Overlay (Image 2) ── */}
      {selectedPopupBundle && (
        <div
          className="bundle-popup-backdrop"
          onClick={() => setSelectedPopupBundle(null)}
        >
          <div
            className="bundle-popup-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Top Row: Image on Left + Info & Order Now on Right */}
            <div className="bundle-popup-top-grid">
              {/* Left: Bundle Image */}
              <div className="bundle-popup-img-box">
                <img
                  src={selectedPopupBundle.thumbnailUrl || selectedPopupBundle.thumbnail || selectedPopupBundle.image || combo.thumbnailUrl || combo.thumbnail}
                  alt={selectedPopupBundle.title}
                  className="bundle-popup-img"
                />
              </div>

              {/* Right: Meta, Title, Price, Description, Order Now */}
              <div className="bundle-popup-right-col">
                <div className="bundle-popup-header-row">
                  <h2 className="bundle-popup-title">{selectedPopupBundle.title}</h2>
                  <button
                    type="button"
                    className="bundle-round-toggle-btn bundle-round-toggle-btn--minus"
                    onClick={() => setSelectedPopupBundle(null)}
                    aria-label="Close popup"
                    title="Close popup"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    >
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>

                {/* Included Products Pill Bar */}
                <div className="bundle-included-summary-pill">
                  <span className="bundle-included-label">
                    Included Products ({selectedPopupBundle.products.length}):
                  </span>
                  <div className="bundle-avatar-stack">
                    {selectedPopupBundle.products.slice(0, 5).map((p, pIdx) => (
                      <div key={p.id || pIdx} className="bundle-stack-avatar" title={p.title}>
                        <img src={p.image} alt={p.title} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Bundle Value */}
                <div className="bundle-popup-value-block">
                  <span className="bundle-popup-value-label">Total Bundle Value</span>
                  <div className="bundle-popup-final-price">
                    Rs. {Number(selectedPopupBundle.offerPrice).toLocaleString('en-IN')}
                    {selectedPopupBundle.regularPrice > selectedPopupBundle.offerPrice && (
                      <span className="bundle-popup-mrp-price">
                        MRP Rs. {Number(selectedPopupBundle.regularPrice).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Short Description */}
                <p className="bundle-popup-description">
                  {selectedPopupBundle.subtitle ||
                    "The short description comes here which was added in bundle. It provides complete details of all included items crafted for maximum rider protection and comfort."}
                </p>

                {/* Order Now Button */}
                <button
                  type="button"
                  className="bundle-order-now-btn"
                  onClick={() => handleAddBundleToCart(selectedPopupBundle)}
                  disabled={addingBundleId === selectedPopupBundle.id}
                >
                  {addingBundleId === selectedPopupBundle.id ? 'Adding to Cart...' : 'Order Now'}
                </button>
              </div>
            </div>

            {/* Section Divider & Heading */}
            <div className="bundle-products-section-divider">
              <span className="bundle-products-section-heading">Product Includes</span>
              <div className="bundle-products-divider-line" />
            </div>

            {/* List of Included Products (Reference Image Style) */}
            <div className="bundle-products-clean-list">
              {selectedPopupBundle.products.map((prod, pIdx) => {
                const avatarBg = avatarPalette[pIdx % avatarPalette.length];
                return (
                  <div
                    key={prod.id || pIdx}
                    className="bundle-product-row-item"
                    onClick={() => {
                      setSelectedPopupBundle(null);
                      navigate(`/accessories/products/${prod.productId || prod.id}`);
                    }}
                    role="button"
                    tabIndex="0"
                    title={`View ${prod.title}`}
                  >
                    {/* Left: Circular Avatar */}
                    <div className="bundle-product-avatar-circle" style={{ backgroundColor: avatarBg }}>
                      {prod.image ? (
                        <img src={prod.image} alt={prod.title} className="bundle-product-avatar-img" loading="lazy" />
                      ) : (
                        <span className="bundle-product-avatar-placeholder">🏍️</span>
                      )}
                    </div>

                    {/* Middle: Title & Subtitle */}
                    <div className="bundle-product-details-col">
                      <span className="bundle-product-title-text" title={prod.title}>
                        {prod.title}
                      </span>
                      <span className="bundle-product-sub-text">
                        {prod.brand ? `${prod.brand} • Premium Gear` : 'Nitroxx Precision Gear • Premium Gear'}
                      </span>
                    </div>

                    {/* Right: Pill Price & Chevron */}
                    <div className="bundle-product-right-meta">
                      <div className="bundle-product-price-pill">
                        Rs. {Number(prod.offerPrice).toLocaleString('en-IN')}
                      </div>
                      <svg
                        className="bundle-product-chevron-icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Feedback Notification ── */}
      {toastMsg && (
        <div className="bundle-toast-notification">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
