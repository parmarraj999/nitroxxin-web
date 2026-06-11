import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'
import CategoriesSection from './category/category'
import FeaturedEvents from './featureEvent/featureEvent'
import ShopByCategory from './shopByCategory/shopByCategory'
import ShopByBrands from './shopByBrand/shopByBrand'
import FAQ from './FAQ/faq'

function Foryou() {
    return (
        <section className='foryou-section'>
            <Header />
            <Marquee />
            <CategoriesSection />
            <FeaturedEvents />
            <ShopByCategory />
            <ShopByBrands />
            <FAQ />
        </section>
    )
}

export default Foryou