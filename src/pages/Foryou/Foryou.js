import React from 'react'
import './Foryou.css'
import Header from './header/header'
import Marquee from './marquee/marquee'

function Foryou() {
    return (
        <section className='foryou-section'>
            <Header />
            <Marquee />
        </section>
    )
}

export default Foryou