import React from "react";
import Navbar from "../../component/Navbar";
import SubNavbar from "../../component/Subnavbar";
import CartPopup from "../../component/Cartpopup";
import SearchOverlay from "../../component/Searchoverlay";
import Footer from "../../component/Footer";
import "./Story.css";

const searchProducts = [
  {
    id: "sermon",
    name: "SERMON",
    description: "FRUITY & DECADENT · MEDIUM ROAST",
    price: "₹550.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "streetlevel",
    name: "STREETLEVEL",
    description: "SWEET & BALANCED · MEDIUM ROAST",
    price: "₹520.00",
    image: "/Flawlez 2.png",
  },
  {
    id: "aster",
    name: "ASTER",
    description: "VIBRANT & COMPLEX · MEDIUM ROAST",
    price: "₹540.00",
    image: "/Flawlez 2.png",
  },
];

const milestones = [
  {
    year: "2015",
    title: "The First Roast",
    description:
      "We began in a tiny garage with a vintage roaster and a promise to source coffee ethically.",
  },
  {
    year: "2018",
    title: "Direct-Trade Partnerships",
    description:
      "Our founder visited smallholder farms across India and East Africa to build direct relationships.",
  },
  {
    year: "2020",
    title: "Sustainability First",
    description:
      "We introduced compostable packaging and invested in solar-powered roasting.",
  },
  {
    year: "2024",
    title: "Brewing Communities",
    description:
      "Launched training programs for baristas and opened our flagship experience bar in Bengaluru.",
  },
];

const values = [
  {
    title: "People Over Profits",
    description: "We pay farmers fairly and reinvest in education, healthcare, and climate resilience.",
  },
  {
    title: "Relentless Quality",
    description: "Every batch is cupped at least four times before it reaches your cup.",
  },
  {
    title: "Sustainable Future",
    description: "Low-waste roasting, biodegradable packaging, and carbon-neutral deliveries.",
  },
];

export default function Story() {
  return (
    <>
      <Navbar />
      <SubNavbar />
      <CartPopup />
      <SearchOverlay products={searchProducts} />
      <main className="story-page">
        <section className="story-hero">
          <div className="story-hero-content">
            <h1>Crafting coffee with purpose since 2015</h1>
            <p>
              From farm to cup, we celebrate the growers, roasters, and baristas who make every sip
              unforgettable.
            </p>
          </div>
        </section>

        <section className="story-mission">
          <div className="mission-card">
            <h2>Our Mission</h2>
            <p>
              To build a transparent coffee supply chain that uplifts farming communities while
              serving remarkable cups to coffee lovers everywhere.
            </p>
          </div>
          <div className="mission-card">
            <h2>Where We Roast</h2>
            <p>
              Our roastery sits in the heart of Bengaluru, where we slow-roast in small batches to
              unlock the nuance of every origin.
            </p>
          </div>
          <div className="mission-card">
            <h2>Impact Highlights</h2>
            <ul>
              <li>17 farming partners across India, Rwanda, and Colombia</li>
              <li>30% increase in farmer earnings through direct trade</li>
              <li>100% compostable retail packaging since 2021</li>
            </ul>
          </div>
        </section>

        <section className="story-timeline">
          <h2>Milestones</h2>
          <div className="timeline-grid">
            {milestones.map((milestone) => (
              <div className="timeline-card" key={milestone.year}>
                <span className="timeline-year">{milestone.year}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="story-values">
          <h2>What We Stand For</h2>
          <div className="values-grid">
            {values.map((value) => (
              <div className="value-card" key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="story-community">
          <div className="community-content">
            <h2>Community & Education</h2>
            <p>
              We host monthly cupping sessions, brewing workshops, and farmer roundtables. Whether
              you&apos;re a seasoned professional or just starting out, our doors are open.
            </p>
            <div className="community-highlights">
              <div>
                <strong>480+</strong>
                <span>Baristas trained</span>
              </div>
              <div>
                <strong>65</strong>
                <span>Community events last year</span>
              </div>
              <div>
                <strong>1%</strong>
                <span>Revenue reinvested into farmer funds</span>
              </div>
            </div>
          </div>
          <div className="community-cta">
            <h3>Visit the roastery</h3>
            <p>Book a tasting session or schedule a roastery tour every Friday & Saturday.</p>
            <a href="mailto:hello@coffeecollective.in" className="cta-link">
              hello@coffeecollective.in
            </a>
            <span className="cta-subtext">Or call us at +91 98456 12345</span>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
