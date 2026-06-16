import React, { useState } from 'react';
import './faq.css';

const FAQItem = ({ question, isOpen, onToggle }) => {
  return (
    <div className="faq-item">
      <div className="faq-question-row">
        <h3 className="faq-question">{question}</h3>
        <button className="faq-toggle" onClick={onToggle}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-plus-icon lucide-circle-plus"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
        </button>
      </div>
      <div className="faq-divider"></div>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { question: 'What is this platform\nabout?' },
    { question: 'Is this app free to use?' },
    { question: 'How will I get event details?' },
    { question: 'What kind of products are available?' },
    { question: 'Are the products original?' }
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
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  );
};

export default FAQ;
