"use client";

import React, { useEffect, useState } from "react";

import SiteHeader from "../components/SiteHeader";

const SERVICES = [
  {
    id: "standard",
    title: "Standard Clean",
    subtitle: "Routine upkeep for homes that need a solid refresh.",
    items: [
      "Dust accessible surfaces, shelves, and furniture",
      "Vacuum carpets and rugs",
      "Sweep and mop hard floors",
      "Wipe down kitchen counters and appliance exteriors",
      "Clean and sanitize sinks, toilets, tubs, and showers",
      "Take out trash and replace liners",
      'Light straightening of commonly used spaces',
    ],
  },
  {
    id: "deep",
    title: "Deep Clean",
    subtitle: "A more detailed clean for buildup, neglected areas, or first-time service.",
    items: [
      "Everything included in a Standard Clean",
      "Detailed attention to baseboards, trim, and door frames",
      "Spot clean walls, switches, and high-touch surfaces",
      "Clean reachable light fixtures, vents, and ceiling fan blades",
      "Wipe cabinet fronts and deeper kitchen surfaces",
      "Extra scrubbing in bathrooms, kitchens, and problem areas",
      "More detailed dusting behind and under reachable furniture",
    ],
  },
  {
    id: "complete",
    title: "Complete Clean",
    subtitle: "A top-to-bottom reset for homes needing the most intensive service.",
    items: [
      "Everything included in a Deep Clean",
      "Detailed focus on heavy buildup and neglected rooms",
      "More extensive hand-cleaning of surfaces and fixtures",
      "Interior cleaning of reachable appliances by request",
      "Detailed cleaning of doors, frames, and reachable blinds",
      "Extra time for kitchens, bathrooms, and living areas with significant buildup",
      "Best fit for move-ins, move-outs, or major reset appointments",
    ],
  },
] as const;

export default function OurServicesPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<
    (typeof SERVICES)[number]["id"]
  >("standard");
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const selectedService =
    SERVICES.find((service) => service.id === selectedServiceId) ?? SERVICES[0];

  useEffect(() => {
    function syncLayout() {
      setIsMobileLayout(window.innerWidth < 768);
    }

    syncLayout();
    window.addEventListener("resize", syncLayout);

    return () => {
      window.removeEventListener("resize", syncLayout);
    };
  }, []);

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f2",
        minHeight: "100vh",
        color: "#1f2937",
      }}
    >
      <SiteHeader />

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 36 }}>
            Our Services
          </h1>
          <p
            style={{
              marginTop: 0,
              marginBottom: 28,
              color: "#4b5563",
              lineHeight: 1.7,
              maxWidth: 700,
            }}
          >
            Browse our core cleaning levels below. When you upload your service
            docs later, we can swap these placeholder outlines for your exact
            offerings.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobileLayout
                ? "1fr"
                : "minmax(220px, 280px) minmax(0, 1fr)",
              gap: 24,
            }}
          >
            {isMobileLayout ? (
              <div style={{ display: "grid", gap: 10 }}>
                <label
                  htmlFor="service-level-picker"
                  style={{ fontWeight: 700, color: "#0f172a" }}
                >
                  Pick a service level
                </label>
                <select
                  id="service-level-picker"
                  value={selectedServiceId}
                  onChange={(event) =>
                    setSelectedServiceId(
                      event.target.value as (typeof SERVICES)[number]["id"]
                    )
                  }
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    padding: "14px 16px",
                    fontSize: 16,
                    background: "white",
                    color: "#0f172a",
                  }}
                >
                  {SERVICES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <aside
                style={{
                  display: "grid",
                  gap: 12,
                  alignContent: "start",
                }}
              >
                {SERVICES.map((service) => {
                  const isSelected = service.id === selectedService.id;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedServiceId(service.id)}
                      style={{
                        textAlign: "left",
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: isSelected
                          ? "2px solid #0f766e"
                          : "1px solid #d1d5db",
                        background: isSelected ? "#ecfdf5" : "#f8fafc",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {service.title}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "#4b5563" }}>
                        {service.subtitle}
                      </div>
                    </button>
                  );
                })}
              </aside>
            )}

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: isMobileLayout ? 20 : 24,
                background: "#fcfcfc",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>
                {selectedService.title}
              </h2>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 20,
                  color: "#4b5563",
                  lineHeight: 1.7,
                }}
              >
                {selectedService.subtitle}
              </p>

              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  display: "grid",
                  gap: 10,
                  lineHeight: 1.7,
                }}
              >
                {selectedService.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
