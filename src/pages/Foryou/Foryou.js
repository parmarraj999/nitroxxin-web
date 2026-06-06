import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'
import CategoriesSection from './category/category'
import FeaturedEvents from './featureEvent/featureEvent'

function Foryou() {
    return (
        <section className='foryou-section'>
            <Header />
            <Marquee />
            <CategoriesSection />
            <FeaturedEvents />
        </section>
    )
}

export default Foryou