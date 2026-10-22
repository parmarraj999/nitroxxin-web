import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'
import CategoriesSection from './category/category'
import FeaturedEvents from './featureEvent/featureEvent'
import EventPartners from '../../components/EventPartners/EventPartners'
import CuratedShowcase from './curatedShowcase/curatedShowcase'
import ComboSection from '../../components/ComboSection/ComboSection'
import ShopByCategory from './shopByCategory/shopByCategory'
import ShopByBrands from './shopByBrand/shopByBrand'
import FAQ from './FAQ/faq'
import { useForYouContext } from '../../context/ForYouContext'

function Foryou() {
    const { banners, categories, combos, combosLoading } = useForYouContext();

    return (
        <section className='foryou-section'>
            <Header banners={banners} />
            <Marquee />
            <CategoriesSection categories={categories} />
             <ShopByBrands />
            <FeaturedEvents />
            <EventPartners theme="dark" />
            <CuratedShowcase />
            <ComboSection
                theme="dark"
                sectionTitle="COMBO DEALS & GEAR PACKAGES"
                sectionSubtitle="Handpicked protective bundles curated with exclusive discounts for true riders."
                combos={combos}
                loading={combosLoading}
            />
            <ShopByCategory />
            <div className='foryou-section-image'>
                <img
                    src={'./assets/images/app-soon-banner.png'}
                    alt="Nitroxx Promotions"
                    loading="lazy"
                    decoding="async"
                    style={{ aspectRatio:16/9 }}
                />
            </div>
           
            <FAQ />
        </section>
    )
}

export default Foryou