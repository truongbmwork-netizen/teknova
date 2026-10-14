/**
 * Motion.dev Button Hover Engine
 * Implements genuine Motion (animate & hover) for all buttons across the entire website
 * Official Reference: https://examples.motion.dev/js/hover
 * Pattern:
 *   hover(element, (el) => {
 *     animate(el, { scale: 1.08 }, { duration: 0.32, easing: [0.16, 1, 0.3, 1] });
 *     return () => animate(el, { scale: 1 }, { duration: 0.28, easing: [0.16, 1, 0.3, 1] });
 *   })
 */
import { animate, hover } from './assets/js/motion.esm.js';

// Expose globally for convenience
window.Motion = { animate, hover };

const BUTTON_SELECTOR = [
  'button:not([disabled])',
  '.glow-btn',
  'a.bg-primary',
  'a[href*="Profile_2026.pdf"]',
  'a[href*="Teknova_Profile"]',
  'a[href*="#lien-he"]',
  'a[href*="duan.html"].rounded-xl',
  'a[href*="duan.html"].rounded-lg',
  '.filter-tab',
  '#team-carousel-prev',
  '#team-carousel-next',
  '[data-motion-btn]'
].join(', ');

// Track attached elements to prevent duplicate bindings
const boundElements = new WeakSet();

function getTargetScale(el) {
  // Circular icon buttons (prev/next carousel, close buttons, modal icons)
  if (el.classList.contains('rounded-full') && el.offsetWidth <= 56) {
    return 1.12;
  }
  // Filter tabs & small action pills
  if (el.classList.contains('filter-tab') || el.classList.contains('text-xs')) {
    return 1.06;
  }
  // Primary CTA buttons (Header, Hero, Banner)
  return 1.07;
}

export function attachMotionHover(el) {
  if (!el || boundElements.has(el)) return;
  // Skip hidden elements
  if (el.getAttribute('aria-hidden') === 'true') return;
  // Skip plain text navigation links
  if (el.tagName === 'A' && !el.classList.contains('bg-primary') && !el.classList.contains('glow-btn') && !el.classList.contains('rounded-lg') && !el.classList.contains('rounded-xl') && !el.classList.contains('filter-tab')) {
    return;
  }

  boundElements.add(el);

  // Apply baseline transforms safely
  el.style.transformOrigin = 'center center';
  el.style.willChange = 'transform';

  const targetScale = getTargetScale(el);

  // Exact Motion hover pattern from https://examples.motion.dev/js/hover
  hover(el, (element) => {
    // Elevate z-index so scaled button never gets obscured by neighbors
    const origZIndex = element.style.zIndex;
    element.style.zIndex = '35';

    animate(element, { scale: targetScale }, {
      duration: 0.32,
      easing: [0.16, 1, 0.3, 1]
    });

    return () => {
      animate(element, { scale: 1 }, {
        duration: 0.28,
        easing: [0.16, 1, 0.3, 1]
      }).then(() => {
        element.style.zIndex = origZIndex;
      });
    };
  });

  // Tactile press feel (pointerdown / pointerup)
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    animate(el, { scale: 0.95 }, { duration: 0.12, easing: 'ease-out' });
  }, { passive: true });

  el.addEventListener('pointerup', () => {
    animate(el, { scale: targetScale }, { duration: 0.2, easing: [0.16, 1, 0.3, 1] });
  }, { passive: true });

  el.addEventListener('pointercancel', () => {
    animate(el, { scale: 1 }, { duration: 0.2, easing: 'ease-out' });
  }, { passive: true });
}

export function initAllButtons() {
  const elements = document.querySelectorAll(BUTTON_SELECTOR);
  elements.forEach(attachMotionHover);
}

// Observe DOM for dynamically rendered buttons (filter clicks, modals, etc.)
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        initAllButtons();
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Auto-boot on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAllButtons();
    observeDOM();
  });
} else {
  initAllButtons();
  observeDOM();
}

console.log('⚡ Motion.dev button hover engine loaded successfully.');
