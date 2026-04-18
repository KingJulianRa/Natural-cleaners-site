"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import SiteHeader from "./components/SiteHeader";

const CLEANLINESS_FACTORS = {
  "1": 1.12,
  "2": 1.82,
  "3": 10,
};

const SERVICE_FACTORS = {
  "1": 1.10,
  "2": 3.5,
  "3": 10,
};

const SERVICE_LABELS = {
  "1": "Level 1 - Standard Clean",
  "2": "Level 2 - Deep Clean",
  "3": "Level 3 - Complete Clean",
};

const BATHROOM_SIZE_GUIDE = {
  Small: 30,
  Medium: 70,
  Large: 120,
};

const KITCHEN_SIZE_GUIDE = {
  Small: 120,
  Medium: 250,
  Large: 320,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export default function Page() {
  const [houseSize, setHouseSize] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [bathroomSize, setBathroomSize] = useState("");
  const [kitchenSize, setKitchenSize] = useState("");
  const [cleanlinessLevel, setCleanlinessLevel] = useState("");
  const [serviceLevel, setServiceLevel] = useState("");

  const quote = useMemo(() => {
    const sizeSqFt = Number(houseSize) || 0;
    const bathroomCount = Number(bathrooms) || 0;
    const hasBathroomSize = bathroomSize in BATHROOM_SIZE_GUIDE;
    const hasKitchenSize = kitchenSize in KITCHEN_SIZE_GUIDE;
    const hasCleanlinessLevel = cleanlinessLevel in CLEANLINESS_FACTORS;
    const hasServiceLevel = serviceLevel in SERVICE_FACTORS;

    if (
      !sizeSqFt ||
      !bathroomCount ||
      !hasBathroomSize ||
      !hasKitchenSize ||
      !hasCleanlinessLevel ||
      !hasServiceLevel
    ) {
      return {
        estimatedBathroomSize: 0,
        estimatedKitchenSize: 0,
        estimatedLivingSpaces: 0,
        priceOfLivingSpaces: 0,
        priceOfBathrooms: 0,
        priceOfKitchen: 0,
        totalPrice: 0,
      };
    }

    const estimatedBathroomSize =
      bathroomCount *
      BATHROOM_SIZE_GUIDE[bathroomSize as keyof typeof BATHROOM_SIZE_GUIDE];

    const estimatedKitchenSize =
      KITCHEN_SIZE_GUIDE[kitchenSize as keyof typeof KITCHEN_SIZE_GUIDE];

    const estimatedLivingSpaces = Math.max(
      sizeSqFt - estimatedBathroomSize - estimatedKitchenSize,
      0
    );

    const priceOfLivingSpaces = estimatedLivingSpaces * 0.1;
    const priceOfBathrooms = estimatedBathroomSize * 0.3;
    const priceOfKitchen = estimatedKitchenSize * 0.35;
    const basePrice =
      priceOfLivingSpaces + priceOfBathrooms + priceOfKitchen;

    const totalPrice =
      Number(cleanlinessLevel) < 3
        ? basePrice *
          CLEANLINESS_FACTORS[
            cleanlinessLevel as keyof typeof CLEANLINESS_FACTORS
          ] *
          SERVICE_FACTORS[serviceLevel as keyof typeof SERVICE_FACTORS]
        : basePrice * CLEANLINESS_FACTORS["3"] +
          basePrice * SERVICE_FACTORS["3"];

    return {
      estimatedBathroomSize,
      estimatedKitchenSize,
      estimatedLivingSpaces,
      priceOfLivingSpaces,
      priceOfBathrooms,
      priceOfKitchen,
      totalPrice,
    };
  }, [
    houseSize,
    bathrooms,
    bathroomSize,
    kitchenSize,
    cleanlinessLevel,
    serviceLevel,
  ]);

  const canSchedule =
    quote.totalPrice > 0 &&
    houseSize.trim() !== "" &&
    bathrooms.trim() !== "" &&
    bathroomSize !== "" &&
    kitchenSize !== "" &&
    cleanlinessLevel !== "" &&
    serviceLevel !== "";

  const selectedServiceLabel =
    serviceLevel in SERVICE_LABELS
      ? SERVICE_LABELS[serviceLevel as keyof typeof SERVICE_LABELS]
      : "";

  return (
    <main style={{ fontFamily: "Arial, sans-serif", background: "#f7f7f2", minHeight: "100vh", color: "#1f2937" }}>
      <SiteHeader />

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>

        <div id="quote-estimator" style={{ marginBottom: 24 }}>
          <h1 style={{ marginTop: 0, marginBottom: 0, fontSize: 22 }}>Get an instant quote today</h1>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
          gap: 24
        }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Quote Estimator</h2>

            <label style={labelStyle}>House size (sq ft)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              placeholder="Enter square footage"
              value={houseSize}
              onChange={(e) => setHouseSize(e.target.value)}
            />

            <label style={labelStyle}>Number of bathrooms</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              placeholder="Enter number of bathrooms"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
            />

            <label style={labelStyle}>Bathroom size</label>
            <select
              style={inputStyle}
              value={bathroomSize}
              onChange={(e) => setBathroomSize(e.target.value)}
            >
              <option value="">Select one</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>

            <label style={labelStyle}>Kitchen size</label>
            <select
              style={inputStyle}
              value={kitchenSize}
              onChange={(e) => setKitchenSize(e.target.value)}
            >
              <option value="">Select one</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>

            <label style={labelStyle}>Current level of cleanliness</label>
            <select
              style={inputStyle}
              value={cleanlinessLevel}
              onChange={(e) => setCleanlinessLevel(e.target.value)}
            >
              <option value="">Select one</option>
              <option value="1">1 - Clean</option>
              <option value="2">2 - Clutter</option>
              <option value="3">3 - Hoarding</option>
            </select>

            <label style={labelStyle}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span>Level of service</span>
                <Link
                  href="/our-services"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#475569",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                  }}
                >
                  Click here for more info
                </Link>
              </span>
            </label>
            <select
              style={inputStyle}
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
            >
              <option value="">Select one</option>
              <option value="1">1 - Standard Clean</option>
              <option value="2">2 - Deep Clean</option>
              <option value="3">3 - Complete Clean</option>
            </select>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Estimated Price</h2>
            <div style={{ fontSize: 48, fontWeight: 700, margin: "10px 0 20px" }}>
              {formatCurrency(quote.totalPrice)}
            </div>

            <div style={detailBoxStyle}>
              <strong>Bathrooms</strong>
              <p>Estimated bathroom area: {quote.estimatedBathroomSize} sq ft</p>
              <p>Bathroom price: {formatCurrency(quote.priceOfBathrooms)}</p>
            </div>

            <div style={detailBoxStyle}>
              <strong>Kitchen</strong>
              <p>Estimated kitchen area: {quote.estimatedKitchenSize} sq ft</p>
              <p>Kitchen price: {formatCurrency(quote.priceOfKitchen)}</p>
            </div>

            <div style={detailBoxStyle}>
              <strong>Living spaces</strong>
              <p>Estimated living space area: {quote.estimatedLivingSpaces} sq ft</p>
              <p>Living space price: {formatCurrency(quote.priceOfLivingSpaces)}</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <a
                href={
                  canSchedule
                    ? `/schedule?price=${encodeURIComponent(String(quote.totalPrice))}&serviceLevel=${encodeURIComponent(selectedServiceLabel)}`
                    : undefined
                }
                aria-disabled={!canSchedule}
                onClick={(event) => {
                  if (!canSchedule) {
                    event.preventDefault();
                  }
                }}
                style={{
                  ...buttonStylePrimary,
                  opacity: canSchedule ? 1 : 0.5,
                  cursor: canSchedule ? "pointer" : "not-allowed",
                  pointerEvents: canSchedule ? "auto" : "none",
                }}
              >
                Schedule an Appointment
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const buttonStylePrimary: React.CSSProperties = {
  background: "#0f766e",
  color: "white",
  padding: "12px 18px",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 600,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  padding: 24,
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  marginTop: 6,
  marginBottom: 16,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  fontSize: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginTop: 8,
};

const detailBoxStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
};
