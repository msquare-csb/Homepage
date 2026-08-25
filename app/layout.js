import "./globals.css";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { withBasePath } from "../lib/basePath";

export const metadata = {
  title: "Materials AI Modeling Laboratory",
  description: "Materials AI Modeling Laboratory at Sungkyunkwan University."
};

export default function RootLayout({ children }) {
  const bodyBackground = `url(${withBasePath("/Back.opt.jpg")})`;

  return (
    <html lang="en">
      <body style={{ "--body-bg-image": bodyBackground }}>
        <Nav />
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
