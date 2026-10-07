import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'
import CategoriesSection from './category/category'
import FeaturedEvents from './featureEvent/featureEvent'
import CuratedShowcase from './curatedShowcase/curatedShowcase'
import ComboSection from '../../components/ComboSection/ComboSection'
import ShopByCategory from './shopByCategory/shopByCategory'
import ShopByBrands from './shopByBrand/shopByBrand'
import FAQ from './FAQ/faq'
import { useDocument } from '../../hooks/useFirestore'

function Foryou() {
    const { data: layoutData } = useDocument('page_layouts', 'for_you');
    const banners = layoutData?.banners || [];
    const categories = layoutData?.categories || [];

    return (
        <section className='foryou-section'>
            <Header banners={banners} />
            <Marquee />
            <CategoriesSection categories={categories} />
            <FeaturedEvents />
            <CuratedShowcase />
            <ComboSection
                theme="dark"
                sectionTitle="COMBO DEALS & GEAR PACKAGES"
                sectionSubtitle="Handpicked protective bundles curated with exclusive discounts for true riders."
            />
            <ShopByCategory />
            <div style={{ margin: '30px', display: 'flex', justifyContent: 'center', padding: '50px 0px' }}>
                <img src={'./assets/images/for-you-bottom.png'} alt="Nitroxx Promotions" style={{ width: '94%', height: '85vh', borderRadius: '40px' }} />
            </div>
            <ShopByBrands />
            <FAQ />
        </section>
    )
}

export default Foryou