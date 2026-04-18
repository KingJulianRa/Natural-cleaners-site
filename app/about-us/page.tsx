import SiteHeader from "../components/SiteHeader";

export default function AboutUsPage() {
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
          <h1 style={{ marginTop: 0, fontSize: 36 }}>About Us</h1>
          <p style={{ marginBottom: 0, fontSize: 18, lineHeight: 1.7 }}>
            Cleaners that use natural products
          </p>
        </div>
      </section>
    </main>
  );
}
