import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'
import CategoriesSection from './category/category'
import FeaturedEvents from './featureEvent/featureEvent'
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
            <ShopByCategory />
            <ShopByBrands />
            <FAQ />
        </section>
    )
}

export default Foryou