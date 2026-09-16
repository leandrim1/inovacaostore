import { useEffect } from "react";
import { STORE } from "../../data/store";

interface SeoProps {
  title?: string;
  description?: string;
  jsonLd?: Record<string, unknown>;
}

function setMetaTag(name: string, content: string, attr: "name" | "property" = "name") {
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function Seo({ title, description, jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${STORE.name}` : STORE.seoDefaultTitle;
    const desc = description ?? STORE.seoDefaultDescription;

    document.title = fullTitle;
    setMetaTag("description", desc);
    setMetaTag("og:title", fullTitle, "property");
    setMetaTag("og:description", desc, "property");
    setMetaTag("og:type", "website", "property");

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script) document.head.removeChild(script);
    };
  }, [title, description, jsonLd]);

  return null;
}
