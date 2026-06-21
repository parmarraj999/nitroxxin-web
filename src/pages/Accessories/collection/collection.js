import { useState } from "react";
import "./collection.css";
import { Link } from "react-router-dom";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";

const brands = [
  {
    id: 1,
    name: "ROYAL ENFIELD",
    image: "/images/royal-enfield.png",
  },
  {
    id: 2,
    name: "KTM",
    image: "/images/hero.png",
  },
  {
    id: 3,
    name: "SUZUKI",
    image: "/images/triumph.png",
  },
  {
    id: 4,
    name: "TRIUMPH",
    image: "/images/honda.png",
  },
  {
    id: 5,
    name: "HARLEY DAVIDSON",
    image: "/images/yamaha.png",
  },
  {
    id: 6,
    name: "TVS",
    image: "/images/ktm.png",
  },
  {
    id: 7,
    name: "YAMAHA",
    image: "/images/bajaj.png",
  },
  {
    id: 8,
    name: "KAWASAKI",
    image: "/images/kawasaki.png",
  },
  {
    id: 9,
    name: "BAJAJ",
    image: "/images/kawasaki.png",
  },
  {
    id: 10,
    name: "BMW",
    image: "/images/kawasaki.png",
  },
  {
    id: 11,
    name: "HERO",
    image: "/images/kawasaki.png",
  },
  {
    id: 12,
    name: "HONDA",
    image: "/images/kawasaki.png",
  },
];

export default function CollectionPage() {

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
          SHOP BY BIKE
        </h1>

        <div className="collection-page__grid">
          {brands.map((brand) => (
            <Link
              to={`/accessories/collection/1232`}
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