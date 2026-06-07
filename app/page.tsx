export const dynamic = 'force-dynamic'
import Link from "next/link";
import type { CSSProperties } from "react";

const navButtonStyle: CSSProperties = {
  border: "1px solid #1e3a5f",
  color: "#e6edf3",
  padding: "8px 16px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 13
};

const amberButtonStyle: CSSProperties = {
  backgroundColor: "#f0a500",
  color: "#0a1628",
  fontWeight: 700,
  padding: "12px 24px",
  borderRadius: 8,
  fontSize: 15,
  border: "none",
  textDecoration: "none",
  display: "inline-flex"
};

const ghostCtaStyle: CSSProperties = {
  border: "1px solid #1e3a5f",
  color: "#e6edf3",
  backgroundColor: "transparent",
  padding: "12px 24px",
  borderRadius: 8,
  fontSize: 15,
  textDecoration: "none",
  display: "inline-flex"
};

const featureTiles = [
  {
    icon: "📋",
    title: "Source-Backed",
    text: "Every claim linked to an official source. No guesswork."
  },
  {
    icon: "🎯",
    title: "Stakeholder Lens",
    text: "Intelligence tailored to your role — contractor, lender, consultant and more."
  },
  {
    icon: "📡",
    title: "Live Pipeline",
    text: "Active procurement signals across energy and infrastructure sectors."
  },
  {
    icon: "📍",
    title: "Milestone Tracking",
    text: "Full project lifecycle tracked from planning permit to operations."
  }
];

const pricingCards = [
  {
    tier: "Free",
    price: "£0",
    per: "/month",
    features: [
      "Interactive project map",
      "Project overview panel",
      "ConstructionFront coverage",
      "Region and sector filters"
    ],
    cta: "Explore Map ->",
    href: "/map",
    highlighted: false
  },
  {
    tier: "Professional",
    price: "£79",
    per: "/month",
    features: [
      "Everything in Free",
      "Full project intelligence",
      "Market signals — 9 stakeholder lenses",
      "Sources and milestone history",
      "All filters including country and stage",
      "Save and bookmark projects"
    ],
    cta: "Get Started ->",
    href: "/sign-up",
    highlighted: true
  },
  {
    tier: "Enterprise",
    price: "£299",
    per: "/month per team",
    features: [
      "Everything in Professional",
      "Team access — unlimited users",
      "API access",
      "Analytics dashboard",
      "Custom sector/region focus",
      "White label option"
    ],
    cta: "Contact Us ->",
    href: "/contact",
    highlighted: false
  }
];

export default function LandingPage() {
  return (
    <main
      style={{
        fontSize: 13,
        minHeight: "100vh",
        backgroundColor: "#0a1628",
        color: "#e6edf3"
      }}
    >
      <nav
        style={{
          height: 56,
          backgroundColor: "#0f2240",
          borderBottom: "1px solid #1e3a5f",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          <span style={{ color: "#f0a500" }}>ConstructionFront</span>{" "}
          <span style={{ color: "#ffffff" }}>Intelligence</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" style={navButtonStyle}>
            Sign In
          </Link>
          <Link
            href="/map"
            style={{
              backgroundColor: "#f0a500",
              color: "#0a1628",
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13
            }}
          >
            Open App -&gt;
          </Link>
        </div>
      </nav>

      <section
        style={{
          backgroundColor: "#0a1628",
          padding: "80px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
          minHeight: 480
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <div
            style={{
              color: "#f0a500",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 16
            }}
          >
            37 projects · 12 countries · 226 sources
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#e6edf3",
              lineHeight: 1.2,
              margin: "0 0 16px"
            }}
          >
            Commercial Intelligence for
            <br />
            Energy &amp; Infrastructure
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#8b949e",
              lineHeight: 1.6,
              margin: "0 0 32px"
            }}
          >
            Source-backed project tracking, stakeholder signals and procurement
            intelligence across the full development lifecycle.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/map" style={ghostCtaStyle}>
              Explore Free -&gt;
            </Link>
            <Link href="/sign-up" style={amberButtonStyle}>
              Get Started
            </Link>
          </div>
          <div style={{ fontSize: 12, color: "#8b949e", marginTop: 12 }}>
            No sign up required to explore the map.
          </div>
        </div>

        <div
          style={{
            width: 580,
            height: 336,
            borderRadius: 12,
            border: "1px solid #1e3a5f",
            overflow: "hidden",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            backgroundColor: "#0f2240",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#8b949e",
            fontSize: 14
          }}
        >
          Intelligence Map Preview
        </div>
      </section>

      <section
        style={{
          backgroundColor: "#0f2240",
          borderTop: "1px solid #1e3a5f",
          borderBottom: "1px solid #1e3a5f",
          padding: 48,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32
        }}
      >
        {featureTiles.map((feature) => (
          <div
            key={feature.title}
            style={{
              backgroundColor: "#132845",
              border: "1px solid #1e3a5f",
              borderRadius: 8,
              padding: 24
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 12 }}>{feature.icon}</div>
            <div
              style={{
                color: "#e6edf3",
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 8
              }}
            >
              {feature.title}
            </div>
            <p style={{ color: "#8b949e", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {feature.text}
            </p>
          </div>
        ))}
      </section>

      <section
        style={{
          backgroundColor: "#0a1628",
          padding: "80px 48px",
          textAlign: "center"
        }}
      >
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#e6edf3",
            margin: "0 0 8px"
          }}
        >
          Simple, transparent pricing
        </h2>
        <p style={{ fontSize: 15, color: "#8b949e", margin: "0 0 48px" }}>
          Start free. Upgrade when you need full intelligence.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            maxWidth: 960,
            margin: "0 auto"
          }}
        >
          {pricingCards.map((card) => (
            <div
              key={card.tier}
              style={{
                backgroundColor: "#0f2240",
                border: card.highlighted ? "2px solid #f0a500" : "1px solid #1e3a5f",
                borderRadius: 12,
                padding: 32,
                textAlign: "left",
                position: "relative"
              }}
            >
              {card.highlighted ? (
                <div
                  style={{
                    backgroundColor: "#f0a500",
                    color: "#0a1628",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 4,
                    position: "absolute",
                    top: 16,
                    right: 16
                  }}
                >
                  Most Popular
                </div>
              ) : null}
              <div
                style={{
                  fontSize: 13,
                  color: "#8b949e",
                  fontWeight: 600,
                  textTransform: "uppercase"
                }}
              >
                {card.tier}
              </div>
              <div style={{ marginTop: 12, marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: card.highlighted ? "#f0a500" : "#e6edf3"
                  }}
                >
                  {card.price}
                </span>
                <span style={{ color: "#8b949e", marginLeft: 6 }}>{card.per}</span>
              </div>
              <div style={{ borderTop: "1px solid #1e3a5f", marginBottom: 20 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {card.features.map((feature) => (
                  <div
                    key={feature}
                    style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.5 }}
                  >
                    <span style={{ color: "#3fb950", marginRight: 8 }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
              <Link
                href={card.href}
                style={{
                  ...(card.highlighted ? amberButtonStyle : ghostCtaStyle),
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 28
                }}
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer
        style={{
          backgroundColor: "#0f2240",
          borderTop: "1px solid #1e3a5f",
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ color: "#8b949e", fontSize: 12 }}>
          ConstructionFront Intelligence
        </div>
        <div style={{ color: "#8b949e", fontSize: 12 }}>
          © 2026 ConstructionFront. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
