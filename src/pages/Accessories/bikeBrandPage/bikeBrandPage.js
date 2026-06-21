import { useState } from "react";
import "./bikeBrandPage.css";
import { Link } from "react-router-dom";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";

const bikes = [
    {
        id: 1,
        name: "XPULSE 210",
        image: "/images/xpulse210.png",
    },
    {
        id: 2,
        name: "MAVRICK 440",
        image: "/images/mavrick440.png",
    },
    {
        id: 3,
        name: "XPULSE 200",
        image: "/images/xpulse200.png",
    },
];

export default function BikeBrandPage() {

    const [search, setSearch] = useState("");

    return (
        <section className="brand-page">
            <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
            <div className="brand-page__container">
                <div className="brand-page__banner">

                    {/* Replace with image later */}
                    <div className="brand-page__banner-image"></div>

                    <div className="brand-page__overlay">
                        <h1 className="brand-page__title">HERO</h1>
                    </div>
                </div>

                <div className="brand-page__grid">
                    {bikes.map((bike) => (
                        <Link
                       
                            key={bike.id}
                            className="brand-page__card"
                        >
                            <div className="brand-page__image-box">
                                {/* Replace with actual image */}
                                <img
                                    src={bike.image}
                                    alt={bike.name}
                                    className="brand-page__bike-image"
                                />
                            </div>

                            <h3 className="brand-page__bike-name">
                                {bike.name}
                            </h3>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}