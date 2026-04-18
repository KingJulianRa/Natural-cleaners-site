"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const navLinkStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontWeight: 600,
  color: "#0f172a",
  transition: "color 160ms ease",
};

const navLinkHoverStyle = {
  color: "#0f766e",
};

export default function SiteHeader() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <header
      className="site-header"
    >
      <div className="site-header__inner">
        <Link
          href="/"
          className="site-header__logo-link"
        >
          <Image
            src="/Natural Cleaners Logo.svg"
            alt="Natural Cleaners Logo"
            width={75}
            height={75}
            className="site-header__logo"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="site-header__nav"
        >
          <Link
            href="/"
            className="site-header__nav-link"
            style={hoveredItem === "quote" ? { ...navLinkStyle, ...navLinkHoverStyle } : navLinkStyle}
            onMouseEnter={() => setHoveredItem("quote")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            Quote Estimator
          </Link>
          <Link
            href="/our-services"
            className="site-header__nav-link"
            style={hoveredItem === "services" ? { ...navLinkStyle, ...navLinkHoverStyle } : navLinkStyle}
            onMouseEnter={() => setHoveredItem("services")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            Our Services
          </Link>
          <Link
            href="/about-us"
            className="site-header__nav-link"
            style={hoveredItem === "about" ? { ...navLinkStyle, ...navLinkHoverStyle } : navLinkStyle}
            onMouseEnter={() => setHoveredItem("about")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            About Us
          </Link>
          <Link
            href="/contact-us"
            className="site-header__nav-link"
            style={hoveredItem === "contact" ? { ...navLinkStyle, ...navLinkHoverStyle } : navLinkStyle}
            onMouseEnter={() => setHoveredItem("contact")}
            onMouseLeave={() => setHoveredItem(null)}
          >
            Contact Us
          </Link>
        </nav>
      </div>
    </header>
  );
}
