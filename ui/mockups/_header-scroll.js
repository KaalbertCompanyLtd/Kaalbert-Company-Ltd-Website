// Toggles .is-scrolled on the fixed header shortly after the page starts scrolling, so the
// transparent-over-hero header becomes a solid, legible bar quickly — not only once the
// (potentially very tall, up to 100vh) hero has almost entirely scrolled past. A small fixed
// distance, not the hero's own height, is the right trigger: the reader has barely moved
// before the header needs to stop competing with whatever's now behind it. The state change
// itself is a binary class toggle — the CSS transition on .site-header (a real ease-in-out
// timing function) is what makes it feel smooth, crossing the whole visual distance in a
// fixed ~0.4s once triggered, not tied to how far the user has scrolled.
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;

  var threshold = 64;

  function onScroll() {
    if (window.scrollY > threshold) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
