import "./globals.css";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { withBasePath } from "../lib/basePath";

export const metadata = {
  title: "M-Square Lab",
  description: "Lab website (draft)"
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
