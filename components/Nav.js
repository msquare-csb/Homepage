"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import navigation from "../data/navigation.json";
import { withBasePath } from "../lib/basePath";

export default function Nav() {
  const pathname = usePathname() || "/";
  const trimSlash = (value) => {
    if (!value) return "/";
    if (value === "/") return "/";
    return value.replace(/\/+$/, "");
  };

  const isActiveLink = (href) => {
    const normalizedPath = trimSlash(pathname);
    const rawHref = trimSlash(href);
    const basedHref = trimSlash(withBasePath(href));

    if (href === "/") {
      return normalizedPath === rawHref || normalizedPath === basedHref;
    }

    return (
      normalizedPath === rawHref ||
      normalizedPath.startsWith(`${rawHref}/`) ||
      normalizedPath === basedHref ||
      normalizedPath.startsWith(`${basedHref}/`)
    );
  };

  return (
    <header className="navbar">
      <div className="container navInner">
        <Link className="navBrand" href="/">
          <span className="navBrandText">Materials AI Modeling Laboratory</span>
        </Link>
        <nav className="navLinks">
          {navigation.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActiveLink(l.href) ? "isActive" : ""}
              aria-current={isActiveLink(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
