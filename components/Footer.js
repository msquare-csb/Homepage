import site from "../data/site.json";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footerInner">
        <div className="footerTop">
          <div className="footerGrid">
            <div className="footerBlock">
              <div className="footerLabel">Address</div>
              <div className="footerValue">{site.footerAddress}</div>
            </div>
            <div className="footerBlock footerContactBlock">
              <div className="footerLabel">Contact</div>
              <div className="footerValue">
                Email: <a href={`mailto:${site.footerEmail}`}>{site.footerEmail}</a>
              </div>
            </div>
          </div>
        </div>
        <div className="footerBottom">&copy; {year} {site.footerCopyrightName} All rights reserved.</div>
      </div>
    </footer>
  );
}
