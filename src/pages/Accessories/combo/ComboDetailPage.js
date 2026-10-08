import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ComboDetailPage.css';
import { useDocument } from '../../../hooks/useFirestore';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { addToCart } from '../../../services/commerceService';
import AccessoriesHeader from '../accessoriesNav/AccessoriesHeader';

// Fallback high-value combos
const DEFAULT_COMBOS = [
  {
    id: 'combo-starter-touring',
    title: 'Street & Touring Pro Bundle',
    subtitle: 'Complete high-speed protection with aerodynamic full-face helmet, armored gloves, knee guards, balaclava & tail bag.',
    badge: '🔥 Bestseller Combo',
    discountText: 'Save 25% OFF',
    discountPercent: 25,
    color: '#1e7a3a',
    mixedImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
    validUntil: 'Aug 4 - Aug 31',
    productList: [
      {
        id: 'combo-prod-1',
        title: 'Axor Apex Venom Aerodynamic Helmet',
        name: 'Axor Apex Venom Helmet',
        brand: 'Axor',
        category: 'Helmets',
        price: 4999,
        offerPrice: 4299,
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-2',
        title: 'Kevlar Reinforced Touchscreen Riding Gloves',
        name: 'Kevlar Touchscreen Gloves',
        brand: 'Rynox',
        category: 'Riding Gloves',
        price: 2499,
        offerPrice: 1999,
        imageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-3',
        title: 'Anti-Pollution Thermal Rider Balaclava',
        name: 'Thermal Rider Balaclava',
        brand: 'Nitroxx',
        category: 'Balaclava',
        price: 899,
        offerPrice: 599,
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-4',
        title: 'Airframe CE-Level 2 Armored Riding Jacket',
        name: 'Airframe Armored Jacket',
        brand: 'Alpinestars',
        category: 'Riding Jackets',
        price: 7999,
        offerPrice: 6799,
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'combo-urban-commuter',
    title: 'Urban Commuter Essentials Bundle',
    subtitle: 'Essential abrasion resistance with armored jacket, tactical knee guards & waterproof magnetic tank bag.',
    badge: '⚡ Flash Deal',
    discountText: 'Save 20% OFF',
    discountPercent: 20,
    color: '#c0262b',
    mixedImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1400&q=80',
    validUntil: 'Limited Period Deal',
    productList: [
      {
        id: 'combo-prod-4',
        title: 'Airframe CE-Level 2 Armored Riding Jacket',
        name: 'Airframe Armored Jacket',
        brand: 'Alpinestars',
        category: 'Riding Jackets',
        price: 7999,
        offerPrice: 6799,
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-5',
        title: 'BioArmor Ergonomic Dual Bionic Knee Guards',
        name: 'BioArmor Knee Guards',
        brand: 'Scoyco',
        category: 'Protection',
        price: 2899,
        offerPrice: 2299,
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-6',
        title: 'Heavy-Duty Magnetic Waterproof Tank Bag',
        name: 'Waterproof Tank Bag',
        brand: 'ViaTerra',
        category: 'Luggage',
        price: 2599,
        offerPrice: 1999,
        imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'combo-racing-track',
    title: 'Track Day & Racing Superpack',
    subtitle: 'Carbon helmet, racing gauntlets, knee sliders & high-flow air filter for motorsport riders.',
    badge: '🏁 Track Pro',
    discountText: 'Save 30% OFF',
    discountPercent: 30,
    color: '#1e3a8a',
    mixedImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1400&q=80',
    validUntil: 'Weekend Special',
    productList: [
      {
        id: 'combo-prod-1',
        title: 'Axor Apex Venom Aerodynamic Helmet',
        brand: 'Axor',
        price: 4999,
        offerPrice: 4299,
        imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'combo-prod-2',
        title: 'Kevlar Reinforced Touchscreen Riding Gloves',
        brand: 'Rynox',
        price: 2499,
        offerPrice: 1999,
        imageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

export default function ComboDetailPage() {
  const { comboId } = useParams();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const accessoriesCtx = useAccessoriesContext();
  const catalogProducts = useMemo(() => accessoriesCtx?.products || [], [accessoriesCtx]);

  const { data: primaryLayout } = useDocument('page_layouts', 'accessories_layout');
  const { data: fallbackLayout } = useDocument('page_layouts', 'accessories');
  const { data: singularLayout } = useDocument('page_layout', 'accessories_layout');

  const combos = useMemo(() => {
    const raw =
      primaryLayout?.combos ||
      fallbackLayout?.combos ||
      singularLayout?.combos ||
      [];
    if (Array.isArray(raw) && raw.length > 0) {
      const valid = raw.filter((c) => c && c.title);
      if (valid.length > 0) return valid;
    }
    return DEFAULT_COMBOS;
  }, [primaryLayout, fallbackLayout, singularLayout]);

  const combo = useMemo(() => {
    return combos.find((c) => String(c.id) === String(comboId)) || combos[0] || DEFAULT_COMBOS[0];
  }, [combos, comboId]);

  const resolvedProducts = useMemo(() => {
    const list = combo?.productList || [];
    return list.map((item, idx) => {
      const itemId = typeof item === 'string' ? item : item.id || item.productId;
      const matched = catalogProducts.find((p) => String(p.id) === String(itemId));

      const title =
        matched?.title ||
        matched?.name ||
        (typeof item === 'object' ? item.title || item.name : 'Riding Gear Item');
      const brand =
        matched?.brand ||
        (typeof item === 'object' ? item.brand : 'Nitroxx');
      const image =
        matched?.image ||
        matched?.imageUrl ||
        matched?.banner ||
        (typeof item === 'object' ? item.imageUrl || item.image : '');
      const offerPrice = Number(
        matched?.offerPrice ?? (typeof item === 'object' ? item.offerPrice ?? item.price : 0)
      );
      const regularPrice = Number(
        matched?.price ?? (typeof item === 'object' ? item.price ?? item.regularPrice : 0)
      );

      return {
        id: itemId || `combo-prod-${idx}`,
        productId: matched?.id || itemId,
        title,
        brand,
        image: image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        offerPrice: offerPrice > 0 ? offerPrice : (regularPrice > 0 ? regularPrice : 1999),
        regularPrice: regularPrice > offerPrice ? regularPrice : Math.round((offerPrice || 1999) * 1.25),
        rawProduct: matched || (typeof item === 'object' ? item : { id: itemId, title }),
      };
    });
  }, [combo, catalogProducts]);

  const totalOfferPrice = useMemo(() => {
    return resolvedProducts.reduce((acc, p) => acc + Number(p.offerPrice || 0), 0);
  }, [resolvedProducts]);

  const totalRegularPrice = useMemo(() => {
    return resolvedProducts.reduce((acc, p) => acc + Number(p.regularPrice || 0), 0);
  }, [resolvedProducts]);

  const totalSavings = Math.max(0, totalRegularPrice - totalOfferPrice);

  const [addingAll, setAddingAll] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleAddEntireCombo = async () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!resolvedProducts.length) return;

    setAddingAll(true);
    try {
      for (const item of resolvedProducts) {
        await addToCart({
          userId: user.uid,
          product: item.rawProduct || item,
          quantity: 1,
          options: { comboId: combo.id, comboTitle: combo.title },
        });
      }
      showToast(`🎉 Added all ${resolvedProducts.length} items from "${combo.title}" to cart!`);
    } catch (err) {
      console.error('Error adding combo to cart:', err);
      showToast('Could not add combo to cart. Please try again.');
    } finally {
      setAddingAll(false);
    }
  };

  const handleAddSingleItem = async (e, item) => {
    e.preventDefault();
    if (!user) {
      openLogin();
      return;
    }
    try {
      await addToCart({
        userId: user.uid,
        product: item.rawProduct || item,
        quantity: 1,
      });
      showToast(`Added "${item.title}" to cart!`);
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  return (
    <div className="combo-detail-page">
      <AccessoriesHeader showBack={true} />

      <main className="combo-detail-container">
        {/* Breadcrumb Navigation */}
        <nav className="combo-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/accessories">Accessories</Link>
          <span>/</span>
          <span className="combo-breadcrumb-current">{combo.title}</span>
        </nav>

        {/* Hero Card with Themed Color */}
        <div
          className="combo-detail-hero"
          style={{
            background: combo.color
              ? `linear-gradient(135deg, ${combo.color} 0%, rgba(15, 23, 42, 0.95) 100%)`
              : 'linear-gradient(135deg, #1e7a3a 0%, #0f172a 100%)',
          }}
        >
          <div className="combo-detail-hero-content">
            <div className="combo-detail-pill">
              {combo.badge || '🔥 Special Combo Offer'}
            </div>
            <h1 className="combo-detail-title">{combo.title}</h1>
            <p className="combo-detail-subtitle">{combo.subtitle}</p>

            <div className="combo-detail-meta-row">
              <span className="combo-detail-meta-chip">
                {resolvedProducts.length} Premium Gear Items
              </span>
              {combo.discountText && (
                <span className="combo-detail-meta-chip combo-detail-meta-chip--save">
                  {combo.discountText}
                </span>
              )}
            </div>
          </div>

          <div className="combo-detail-hero-visual">
            <img
              src={
                combo.mixedImage ||
                combo.image ||
                combo.bannerUrl ||
                resolvedProducts[0]?.image ||
                'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
              }
              alt={combo.title}
              className="combo-detail-hero-img"
            />
            {combo.discountText && (
              <div className="combo-detail-burst-badge">
                {combo.discountText.replace('Save ', '')}
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Layout: Products list & Checkout Box */}
        <div className="combo-detail-grid">
          {/* Left Column: Bundled Products */}
          <div className="combo-detail-items-col">
            <h2 className="combo-items-heading">
              Items Included in this Package ({resolvedProducts.length})
            </h2>

            <div className="combo-items-list">
              {resolvedProducts.map((prod, idx) => (
                <div key={prod.id || idx} className="combo-item-row">
                  <div className="combo-item-thumb">
                    <img src={prod.image} alt={prod.title} loading="lazy" />
                  </div>

                  <div className="combo-item-details">
                    <span className="combo-item-brand">{prod.brand}</span>
                    <h3 className="combo-item-title">
                      <Link to={`/product/${prod.productId}`}>{prod.title}</Link>
                    </h3>
                    <div className="combo-item-price-wrap">
                      <span className="combo-item-offer-price">
                        Rs. {Number(prod.offerPrice).toLocaleString('en-IN')}
                      </span>
                      {prod.regularPrice > prod.offerPrice && (
                        <span className="combo-item-mrp-price">
                          Rs. {Number(prod.regularPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="combo-item-add-btn"
                    onClick={(e) => handleAddSingleItem(e, prod)}
                    title="Add single item"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Pricing Summary Card */}
          <div className="combo-detail-summary-col">
            <div className="combo-summary-card">
              <h3 className="combo-summary-heading">Package Summary</h3>

              <div className="combo-summary-line">
                <span>Total Items</span>
                <span>{resolvedProducts.length} Items</span>
              </div>

              {totalRegularPrice > totalOfferPrice && (
                <div className="combo-summary-line">
                  <span>Regular MRP</span>
                  <span className="combo-summary-strike">
                    Rs. {totalRegularPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {totalSavings > 0 && (
                <div className="combo-summary-line combo-summary-line--savings">
                  <span>Combo Discount Savings</span>
                  <span>- Rs. {totalSavings.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="combo-summary-divider" />

              <div className="combo-summary-total">
                <span>Bundle Deal Price</span>
                <span className="combo-summary-final-price">
                  Rs. {totalOfferPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <button
                type="button"
                className="combo-checkout-btn"
                onClick={handleAddEntireCombo}
                disabled={addingAll}
              >
                {addingAll ? (
                  'Adding Entire Bundle...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Add Entire Bundle to Cart
                  </>
                )}
              </button>

              <p className="combo-summary-guarantee">
                🛡️ 100% Genuine Certified Rider Gear • Free Shipping & Easy Returns
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Feedback */}
      {toastMsg && (
        <div className="combo-detail-toast">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
