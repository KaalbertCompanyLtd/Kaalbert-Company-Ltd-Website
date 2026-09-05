import Script from "next/script";

/**
 * ADR 0006: GTM is the single measurement container — no tag is ever hard-coded outside
 * it. These two components install the empty container only; Milestone 5 wires the six
 * `dataLayer` events and configures tags inside GTM itself, not in this file.
 */

export function GoogleTagManagerHeadScript({ containerId }: { containerId: string }) {
  return (
    <Script id="gtm-head" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`}
    </Script>
  );
}

export function GoogleTagManagerBodyFrame({ containerId }: { containerId: string }) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
