import React, { useState } from 'react';
import './faq.css';

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <div
        className="faq-question-row"
        onClick={onToggle}
        role="button"
        tabIndex="0"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h3 className="faq-question">{question}</h3>
        <button
          type="button"
          className="faq-toggle"
          aria-label={isOpen ? "Close answer" : "Expand answer"}
          tabIndex="-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-circle-plus"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </svg>
        </button>
      </div>

      <div className="faq-answer-wrapper">
        <div className="faq-answer-inner">
          <p className="faq-answer">{answer}</p>
        </div>
      </div>

      <div className="faq-divider"></div>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'What is this platform\nabout?',
      answer: 'Nitroxx is an all-in-one platform built for motorcycle riders. We host verified community rides and track-day events, while providing a marketplace for premium riding gear, certified helmets, protection accessories, and performance parts.'
    },
    {
      question: 'Is this app free to use?',
      answer: 'Yes! Creating an account, discovering motorcycling routes, exploring gear collections, and connecting with rider clubs is completely free. You only pay when purchasing products or registering for entry-ticketed events.'
    },
    {
      question: 'How will I get event details?',
      answer: 'Once you register for an event, comprehensive ride briefings, GPS route maps, assembly checkpoints, and organizer contact details are immediately accessible in your profile under My Tickets and sent to your registered email and WhatsApp.'
    },
    {
      question: 'What kind of products are available?',
      answer: 'We offer certified motorcycle helmets, CE-rated armored jackets, riding pants, Kevlar gloves, riding boots, bike luggage & tank bags, mobile mounts, Bluetooth intercoms, and authentic aftermarket accessories.'
    },
    {
      question: 'Are the products original?',
      answer: '100% authentic. All products on Nitroxx are sourced directly from authorized manufacturers and verified official distributors, accompanied by brand warranties and homologation certifications (ECE, DOT, ISI).'
    }
  ];

  return (
    <section className="faq-section">
      <div className="faq-header">
        <div className="faq-brand">
          <h2>FAQ</h2>
          <h2>ANSWERS</h2>
          <h2>
            BY NITRO<span className="brand-x">X</span>X
          </h2>
        </div>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
};

export default FAQ;

