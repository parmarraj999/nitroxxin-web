import React from "react";
import "./category.css";

const categories = [
  {
    title: "Night Ride",
    image: "https://i.pinimg.com/736x/02/97/ad/0297ad76a7f6eb54618803075821b4d4.jpg",
  },
  {
    title: "Mountain Rides",
    image: "https://i.pinimg.com/1200x/a0/bc/85/a0bc85edbca6ffab49f67af6200f9540.jpg",
  },
  {
    title: "Bike Festivals",
    image: "https://i.pinimg.com/736x/47/0a/83/470a83dd9413034acb44144e1852859a.jpg",
  },
  {
    title: "Meetups",
    image: "https://i.pinimg.com/736x/a4/3c/e1/a43ce1841060ac984db4a5a3b4958388.jpg",
  },
  {
    title: "Adventure",
    image: "https://i.pinimg.com/736x/51/b6/27/51b6272f6618a7bc747fc312d38d28ef.jpg",
  },
  {
    title: "Track Days",
    image: "https://i.pinimg.com/736x/e6/d1/d6/e6d1d6056565e2cb1013ec7e3b845104.jpg",
  },
  {
    title: "Off-Road Trails",
    image: "https://i.pinimg.com/736x/8f/c8/8b/8fc88b06aa77a789b748bd3e19781f93.jpg",
  },
  {
    title: "Stunt Shows",
    image: "https://i.pinimg.com/736x/f5/7c/c8/f57cc8520fac1945540dad34175576d5.jpg",
  },
];

const CategoriesSection = () => {
  const sliderRef = React.useRef(null);

  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -350, behavior: "smooth" });
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 350, behavior: "smooth" });
    }
  };

  return (
    <section className="categories-section">
      <h2 className="categories-title">CATEGORIES</h2>

      <div className="categories-wrapper" ref={sliderRef}>
        {categories.map((item, index) => (
          <div
            className="category-card"
            key={index}
            style={{
              backgroundImage: `url(${item.image})`,
            }}
          >
            <div className="overlay"></div>
            <h3>{item.title}</h3>
          </div>
        ))}
      </div>

      <div className="category-slider-btn">
        <button className="arrow-btn" onClick={slideLeft}>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button className="arrow-btn" onClick={slideRight}>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </section>
  );
};

export default CategoriesSection;