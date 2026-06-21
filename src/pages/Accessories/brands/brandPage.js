import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import AccessoriesHeader from '../accessoriesNav/AccessoriesHeader';

const brands = [
  {
    id: 1,
    name: "Zana Motorcycles",
    logo: "/brands/zana.png",
    slug: "zana-motorcycles",
  },
  {
    id: 2,
    name: "Moto Torque",
    logo: "/brands/moto-torque.png",
    slug: "moto-torque",
  },
  {
    id: 3,
    name: "Bandidos Pitstop",
    logo: "/brands/bandidos.png",
    slug: "bandidos-pitstop",
  },
  {
    id: 4,
    name: "Carbon Racing",
    logo: "/brands/carbon-racing.png",
    slug: "carbon-racing",
  },
  {
    id: 5,
    name: "HJG",
    logo: "/brands/hjg.png",
    slug: "hjg",
  },
  {
    id: 6,
    name: "Rynox",
    logo: "/brands/rynox.png",
    slug: "rynox",
  },
  {
    id: 7,
    name: "Viaterra",
    logo: "/brands/viaterra.png",
    slug: "viaterra",
  },
  {
    id: 8,
    name: "Studds",
    logo: "/brands/studds.png",
    slug: "studds",
  },
  {
    id: 9,
    name: "SMK Helmets",
    logo: "/brands/smk.png",
    slug: "smk-helmets",
  },
  {
    id: 10,
    name: "Axor",
    logo: "/brands/axor.png",
    slug: "axor",
  },
  {
    id: 11,
    name: "Raida",
    logo: "/brands/raida.png",
    slug: "raida",
  },
  {
    id: 12,
    name: "Autologue Design",
    logo: "/brands/autologue.png",
    slug: "autologue-design",
  },
];

const BrandPage = () => {
  const [search, setSearch] = useState("");

  return (
    <section className="collection-page">
      <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
      <div className="collection-page__container">


        <div className="collection-page__breadcrumb">
          <span>Home</span>
          <span>•</span>
          <span>Collections</span>
        </div>

        <h1 className="collection-page__title">
          SHOP BY BRANDS
        </h1>

        <div className="collection-page__grid">
          {brands.map((brand) => (
            <Link
              to={`/accessories/products`}
              key={brand.id}
              className="collection-page__card"
            >
              <div className="collection-page__image-wrapper">
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="collection-page__image"
                />
              </div>

              <h3 className="collection-page__name">
                {brand.name}
              </h3>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

export default BrandPage