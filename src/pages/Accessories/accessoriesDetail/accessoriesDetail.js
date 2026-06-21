import { AccessoriesNav } from "./accessoriesDetailNav/accessoriesNav";
import "./accessoriesDetail.css";
import { AccessoriesHero } from "./accessoriesHero/accessoriesHero";
import { AdditionalInfo } from "./additionalInfo/additionalInfo";
import { FeaturesSection } from "./featuresSection/featuresSection";
import { ReviewSection } from "./reviewSection/reviewSection";
import { RelatedProducts } from "./accessoriesRelatedProduct/accessoriesRelatedProduct";
import { useParams } from "react-router-dom";
import { useDocument } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeProduct } from "../../../services/normalizers";
// import { AdditionalInfo } from "./components/AdditionalInfo";
// import { FeaturesSection } from "./components/FeaturesSection";
// import { ReviewSection } from "./components/ReviewSection";
// import { RelatedProducts } from "./components/RelatedProducts";

export default function AccessoriesDetail() {
  const { id } = useParams();
  const { data } = useDocument(COLLECTIONS.products, id);
  const product = data ? normalizeProduct(data) : null;

  return (
    <div className="product-detail-page">
      <AccessoriesNav />

      <main className="product-detail-page__main">
        <AccessoriesHero product={product} />

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
