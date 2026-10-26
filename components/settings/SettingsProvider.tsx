"use client";
import { createContext, useContext, useEffect } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import type { SiteSettings } from "@/lib/api/settings";
import { fetchSettings } from "@/lib/api/settings";
const Context = createContext<ReturnType<typeof useApiResource<SiteSettings>> | null>(
  null,
);
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const resource = useApiResource("site-settings", fetchSettings);
  useEffect(() => {
    if (!resource.data?.favicon) return;
    const favicon = resource.data.favicon;
    const previous = new Map<HTMLLinkElement, { href: string; type: string }>();
    let created: HTMLLinkElement | null = null;
    function updateIcons() {
      const links = Array.from(
        document.head.querySelectorAll<HTMLLinkElement>(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
        ),
      );
      if (!links.length) {
        created = document.createElement("link");
        created.rel = "icon";
        document.head.appendChild(created);
        links.push(created);
      }
      links.forEach((link) => {
        if (!previous.has(link)) previous.set(link, { href: link.href, type: link.type });
        if (link.href !== favicon) link.href = favicon;
        if (link.hasAttribute("type")) link.removeAttribute("type");
      });
    }
    updateIcons();
    // Next.js replaces metadata links on navigation; keep the configured icon in sync.
    const observer = new MutationObserver(updateIcons);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "rel"],
    });
    return () => {
      observer.disconnect();
      created?.remove();
      previous.forEach(({ href, type }, link) => {
        if (link.isConnected) {
          link.href = href;
          if (type) link.type = type;
        }
      });
    };
  }, [resource.data?.favicon]);
  return <Context.Provider value={resource}>{children}</Context.Provider>;
}
export function useSettings() {
  const value = useContext(Context);
  if (!value) throw new Error("SettingsProvider is required");
  return value;
}
