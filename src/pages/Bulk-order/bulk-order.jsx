import React, { useState } from "react";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import "./BulkOrder.css";

const searchProducts = [
  {
    id: "wholesale-sermon",
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    price: "₹550.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "wholesale-streetlevel",
    name: "STREETLEVEL",
    description: "SWEET & BALANCED · MEDIUM ROAST",
    price: "₹520.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "wholesale-aster",
    name: "ASTER",
    description: "VIBRANT & COMPLEX · MEDIUM ROAST",
    price: "₹540.00",
    image: "/Flawlez 2.png",
  },
];

const advantages = [
  {
    title: "Source Transparency",
    description: "Single-origin lots, fully traceable to the farm, cupped and scored above 84.",
  },
  {
    title: "Roasted To Order",
    description: "We roast every wholesale order within 48 hours of dispatch for peak freshness.",
  },
  {
    title: "Training & Equipment",
    description: "On-site barista training, brew recipes, and equipment sourcing support.",
  },
];

const orderTypes = [
  "Cafés & Restaurants",
  "Offices & Co-working Spaces",
  "Hotels & Hospitality",
  "E-commerce & Subscription Brands",
  "Events & Gifting",
];

export default function BulkOrder() {
  const [formData, setFormData] = useState({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    orderType: "",
    monthlyVolume: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={searchProducts} />
      <main className="bulk-page">
        <section className="bulk-hero">
          <div className="bulk-hero-content">
            <h1>Wholesale coffee, roasted just for you</h1>
            <p>
              Partner with our roasting team for consistent quality, flexible profiles, and training
              programs tailored to your business.
            </p>
          </div>
        </section>

        <section className="bulk-advantages">
          {advantages.map((advantage) => (
            <div className="bulk-card" key={advantage.title}>
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
            </div>
          ))}
        </section>

        <section className="bulk-order-types">
          <div className="order-types-content">
            <h2>Who we serve</h2>
            <p>
              Whether you&apos;re brewing hundreds of cups a day or curating a boutique coffee menu,
              we&apos;ll help you dial in the perfect roast.
            </p>
            <ul>
              {orderTypes.map((type) => (
                <li key={type}>{type}</li>
              ))}
            </ul>
          </div>
          <div className="order-support">
            <h3>Wholesale support includes</h3>
            <ul>
              <li>Custom roast profiles (espresso & filter)</li>
              <li>Flavor & blend development</li>
              <li>Equipment calibration and servicing</li>
              <li>Co-branded packaging and white labelling</li>
              <li>Dedicated account manager</li>
            </ul>
          </div>
        </section>

        <section className="bulk-form-section">
          <div className="form-header">
            <h2>Start your wholesale journey</h2>
            <p>
              Share a few details and our team will reach out within one business day with samples,
              pricing, and onboarding information.
            </p>
          </div>
          <form className="bulk-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Company / Brand Name*
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Contact Person*
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Email*
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Phone / WhatsApp*
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Business Type*
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an option</option>
                  {orderTypes.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Monthly Coffee Volume (kg)*
                <input
                  type="number"
                  min="5"
                  name="monthlyVolume"
                  value={formData.monthlyVolume}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="form-full-width">
              Tell us more about your coffee program
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="Preferred roast profiles, flavor notes, equipment you use, launch timelines..."
              />
            </label>

            <button type="submit" className="bulk-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Sending details..." : "Request a call back"}
            </button>
            {submitted && (
              <p className="form-success">
                Thank you! We&apos;ll get back to you within one business day.
              </p>
            )}
          </form>
        </section>

        <section className="bulk-cta">
          <div>
            <h3>Prefer a quick chat?</h3>
            <p>Call us on <a href="tel:+919845612345">+91 98456 12345</a> or drop a note at{" "}
              <a href="mailto:partners@coffeecollective.in">partners@coffeecollective.in</a>.
            </p>
          </div>
          <div className="cta-pill">
            Dispatch within 48 hours • Nationwide cold-chain logistics • Flexible payment terms
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
