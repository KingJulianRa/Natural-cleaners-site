import SiteHeader from "../components/SiteHeader";

export default function ContactUsPage() {
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
          <h1 style={{ marginTop: 0, fontSize: 36 }}>Contact Us</h1>
          <p
            style={{
              marginBottom: 12,
              fontSize: "clamp(10px, 3vw, 18px)",
              lineHeight: 1.7,
              whiteSpace: "nowrap",
            }}
          >
            Phone number: 623-335-2732
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(10px, 3vw, 18px)",
              lineHeight: 1.7,
              whiteSpace: "nowrap",
            }}
          >
            Email: julian@naturalcleanaz.com
          </p>
        </div>
      </section>
    </main>
  );
}
