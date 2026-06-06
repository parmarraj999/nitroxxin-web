import React from 'react';
import './featureEvent.css';


const EventCard= ({ image, title, date, price }) => {
  return (
    <div className="event-card">
      <div className="event-image-wrapper">
        <img src={image} alt={title} className="event-image" />
      </div>
      <div className="event-info">
        <h3 className="event-title">{title}</h3>
        <div className="event-details">
          <span className="event-date">{date}</span>
          <span className="event-divider"></span>
          <span className="event-price">{price}</span>
        </div>
      </div>
    </div>
  );
};

const FeaturedEvents = () => {
  const events = [
    {
      id: 1,
      image: 'https://i.pinimg.com/736x/2c/69/3c/2c693c3f24c4642755f69fade9b71091.jpg',
      title: 'Swift Motion',
      date: '27 May 2026',
      price: '₹ 1200'
    },
    {
      id: 2,
      image: 'https://i.pinimg.com/736x/85/4d/5c/854d5c3f870fc77a03300d53264c4c36.jpg',
      title: 'Limits Fest',
      date: '27 May 2026',
      price: '₹ 900'
    },
    {
      id: 3,
      image: 'https://i.pinimg.com/736x/07/12/32/071232aa0a4e1922c85c2b33df25dfe0.jpg',
      title: 'Retro Bikers',
      date: '27 May 2026',
      price: '₹ 1500'
    },
    {
      id: 4,
      image: 'https://i.pinimg.com/736x/81/a7/7f/81a77f84779864d383eb3698418b7d3a.jpg',
      title: 'Emotive Events',
      date: '27 May 2026',
      price: '₹ 1500'
    },
    {
      id: 5,
      image: 'https://i.pinimg.com/1200x/70/70/f0/7070f03606736658ea83ce50f0169564.jpg',
      title: 'Swift Motion',
      date: '27 May 2026',
      price: '₹ 1200'
    },
    {
      id: 6,
      image: 'https://i.pinimg.com/736x/85/f4/2e/85f42ed4e6cfbe35741add72990ae7d5.jpg',
      title: 'Retro Bikers',
      date: '27 May 2026',
      price: '₹ 1500'
    },
    {
      id: 7,
      image: 'https://i.pinimg.com/1200x/f6/a0/ea/f6a0eafe6e0d94f1202cab1695a9baeb.jpg',
      title: 'Emotive Events',
      date: '27 May 2026',
      price: '₹ 1500'
    },
    {
      id: 8,
      image: 'https://i.pinimg.com/736x/39/92/ba/3992ba3cb453ede20ce53a96f37fabdb.jpg',
      title: 'Limits Fest',
      date: '27 May 2026',
      price: '₹ 900'
    }
  ];

  return (
    <section className="featured-events">
      <h2 className="section-title events-title">FEATURED EVENTS</h2>

      <div className="events-grid">
        {events.map((event) => (
          <EventCard key={event.id} {...event} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEvents;
