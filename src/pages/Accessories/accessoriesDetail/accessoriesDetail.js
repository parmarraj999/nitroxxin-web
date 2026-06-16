import { AccessoriesNav } from "./accessoriesDetailNav/accessoriesNav";
import "./accessoriesDetail.css";
import { AccessoriesHero } from "./accessoriesHero/accessoriesHero";
import { AdditionalInfo } from "./additionalInfo/additionalInfo";
import { FeaturesSection } from "./featuresSection/featuresSection";
import { ReviewSection } from "./reviewSection/reviewSection";
import { RelatedProducts } from "./accessoriesRelatedProduct/accessoriesRelatedProduct";
// import { AdditionalInfo } from "./components/AdditionalInfo";
// import { FeaturesSection } from "./components/FeaturesSection";
// import { ReviewSection } from "./components/ReviewSection";
// import { RelatedProducts } from "./components/RelatedProducts";

export default function AccessoriesDetail() {
  return (
    <div className="product-detail-page">
      <AccessoriesNav />

      <main className="product-detail-page__main">
        <AccessoriesHero />

        <div className="product-detail-page__info-section">
          <AdditionalInfo />
          <div className="product-detail-page__divider-v" />
          <FeaturesSection />
        </div>

        <ReviewSection />

        <RelatedProducts />
      </main>
    </div>
  );
}
