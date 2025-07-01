/**
 * Main JavaScript File
 * Professional Portfolio Website
 * 
 * Features:
 * - Custom cursor functionality
 * - Navigation controls
 * - Scroll animations
 * - Performance optimizations
 * - Accessibility enhancements
 */

'use strict';

// ==========================================================================
// Global State Management
// ==========================================================================

const App = {
  // Application state
  state: {
    isLoaded: false,
    isMobile: false,
    scrollDirection: 'down',
    lastScrollTop: 0,
    isNavigationOpen: false,
    activeSection: 'home',
    reducedMotion: false
  },

  // DOM elements cache
  elements: {
    cursor: null,
    header: null,
    navToggle: null,
    navMenu: null,
    navLinks: null,
    scrollElements: null,
    interactiveElements: null
  },

  // Configuration
  config: {
    scrollThreshold: 100,
    animationDelay: 50,
    cursorSize: 20,
    debounceDelay: 16 // ~60fps
  }
};

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get element's position relative to viewport
 * @param {Element} element - DOM element
 * @returns {Object} Position object with top, bottom, height
 */
function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
    isVisible: rect.top < window.innerHeight && rect.bottom > 0
  };
}

/**
 * Smooth scroll to element
 * @param {Element} element - Target element
 * @param {number} offset - Offset in pixels
 */
function smoothScrollTo(element, offset = 0) {
  const targetPosition = element.offsetTop - offset;
  
  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  } else {
    // Fallback for browsers that don't support smooth scrolling
    const start = window.pageYOffset;
    const distance = targetPosition - start;
    const duration = 1000;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, start, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function ease(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }

    requestAnimationFrame(animation);
  }
}

// ==========================================================================
// Custom Cursor Module
// ==========================================================================

const Cursor = {
  /**
   * Initialize custom cursor
   */
  init() {
    if (App.state.isMobile || !App.elements.cursor) return;

    this.cursor = App.elements.cursor;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cursorX = 0;
    this.cursorY = 0;
    this.isVisible = true;

    this.bindEvents();
    this.animate();
  },

  /**
   * Bind cursor events
   */
  bindEvents() {
    // Mouse move event
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      if (!this.isVisible) {
        this.show();
      }
    });

    // Mouse enter/leave events
    document.addEventListener('mouseenter', () => this.show());
    document.addEventListener('mouseleave', () => this.hide());

    // Click events
    document.addEventListener('mousedown', () => this.addState('clicking'));
    document.addEventListener('mouseup', () => this.removeState('clicking'));

    // Interactive element events
    App.elements.interactiveElements?.forEach(element => {
      element.addEventListener('mouseenter', () => this.addState('hover'));
      element.addEventListener('mouseleave', () => this.removeState('hover'));
    });
  },

  /**
   * Animate cursor position
   */
  animate() {
    // Smooth cursor movement
    this.cursorX += (this.mouseX - this.cursorX) * 0.15;
    this.cursorY += (this.mouseY - this.cursorY) * 0.15;

    if (this.cursor) {
      this.cursor.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px)`;
    }

    requestAnimationFrame(() => this.animate());
  },

  /**
   * Add cursor state
   * @param {string} state - State class name
   */
  addState(state) {
    this.cursor?.classList.add(`cursor--${state}`);
  },

  /**
   * Remove cursor state
   * @param {string} state - State class name
   */
  removeState(state) {
    this.cursor?.classList.remove(`cursor--${state}`);
  },

  /**
   * Show cursor
   */
  show() {
    this.isVisible = true;
    this.cursor?.classList.remove('cursor--hidden');
  },

  /**
   * Hide cursor
   */
  hide() {
    this.isVisible = false;
    this.cursor?.classList.add('cursor--hidden');
  }
};

// ==========================================================================
// Navigation Module
// ==========================================================================

const Navigation = {
  /**
   * Initialize navigation functionality
   */
  init() {
    this.bindEvents();
    this.handleScroll();
  },

  /**
   * Bind navigation events
   */
  bindEvents() {
    // Mobile menu toggle
    App.elements.navToggle?.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Navigation link clicks
    App.elements.navLinks?.forEach(link => {
      link.addEventListener('click', (e) => {
        this.handleNavClick(e, link);
      });
    });

    // Scroll event for navigation hide/show
    window.addEventListener('scroll', throttle(() => {
      this.handleScroll();
    }, App.config.debounceDelay));

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (App.state.isNavigationOpen && 
          !App.elements.navMenu?.contains(e.target) && 
          !App.elements.navToggle?.contains(e.target)) {
        this.closeMobileMenu();
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && App.state.isNavigationOpen) {
        this.closeMobileMenu();
      }
    });
  },

  /**
   * Handle navigation link clicks
   * @param {Event} e - Click event
   * @param {Element} link - Clicked link element
   */
  handleNavClick(e, link) {
    const href = link.getAttribute('href');
    
    // Handle internal navigation
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const headerHeight = App.elements.header?.offsetHeight || 0;
        smoothScrollTo(targetElement, headerHeight);
        this.setActiveLink(link);
        
        // Close mobile menu if open
        if (App.state.isNavigationOpen) {
          this.closeMobileMenu();
        }
      }
    }
  },

  /**
   * Handle scroll behavior for navigation
   */
  handleScroll() {
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Update scroll direction
    App.state.scrollDirection = currentScrollTop > App.state.lastScrollTop ? 'down' : 'up';
    
    // Hide/show navigation based on scroll
    if (App.elements.header) {
      if (currentScrollTop > App.config.scrollThreshold && App.state.scrollDirection === 'down') {
        App.elements.header.classList.add('header--hidden');
      } else {
        App.elements.header.classList.remove('header--hidden');
      }
    }
    
    // Update active section
    this.updateActiveSection();
    
    App.state.lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
  },

  /**
   * Update active navigation link based on scroll position
   */
  updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const headerHeight = App.elements.header?.offsetHeight || 0;
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top + window.pageYOffset - headerHeight;
      const sectionBottom = sectionTop + rect.height;
      const currentScroll = window.pageYOffset + headerHeight;
      
      if (currentScroll >= sectionTop && currentScroll < sectionBottom) {
        const sectionId = section.getAttribute('id');
        if (sectionId !== App.state.activeSection) {
          App.state.activeSection = sectionId;
          
          // Update active navigation link
          const activeLink = document.querySelector(`[href="#${sectionId}"]`);
          if (activeLink) {
            this.setActiveLink(activeLink);
          }
        }
      }
    });
  },

  /**
   * Set active navigation link
   * @param {Element} activeLink - Link element to make active
   */
  setActiveLink(activeLink) {
    // Remove active class from all links
    App.elements.navLinks?.forEach(link => {
      link.classList.remove('nav__link--active');
      link.removeAttribute('aria-current');
    });
    
    // Add active class to current link
    activeLink.classList.add('nav__link--active');
    activeLink.setAttribute('aria-current', 'page');
  },

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (App.state.isNavigationOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  /**
   * Open mobile menu
   */
  openMobileMenu() {
    App.state.isNavigationOpen = true;
    App.elements.navMenu?.classList.add('nav__menu--open');
    App.elements.navToggle?.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Animate toggle lines
    this.animateToggle(true);
  },

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    App.state.isNavigationOpen = false;
    App.elements.navMenu?.classList.remove('nav__menu--open');
    App.elements.navToggle?.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Animate toggle lines
    this.animateToggle(false);
  },

  /**
   * Animate mobile menu toggle lines
   * @param {boolean} isOpen - Whether menu is open
   */
  animateToggle(isOpen) {
    const lines = App.elements.navToggle?.querySelectorAll('.nav__toggle-line');
    if (!lines) return;

    if (isOpen) {
      lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      lines[1].style.opacity = '0';
      lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      lines[0].style.transform = '';
      lines[1].style.opacity = '';
      lines[2].style.transform = '';
    }
  }
};

// ==========================================================================
// Scroll Animations Module
// ==========================================================================

const ScrollAnimations = {
  /**
   * Initialize scroll animations
   */
  init() {
    if (App.state.reducedMotion) return;

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.observeElements();
  },

  /**
   * Observe elements for scroll animations
   */
  observeElements() {
    App.elements.scrollElements?.forEach(element => {
      this.observer.observe(element);
    });
  },

  /**
   * Handle intersection observer entries
   * @param {Array} entries - Intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.animateElement(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  },

  /**
   * Animate element when it comes into view
   * @param {Element} element - Element to animate
   */
  animateElement(element) {
    const delay = element.dataset.delay || 0;
    
    setTimeout(() => {
      element.classList.add('visible');
      
      // Add animation class based on data attribute
      const animationType = element.dataset.animate;
      if (animationType) {
        element.classList.add(`animate-${animationType}`);
      }
    }, parseInt(delay));
  },

  /**
   * Destroy scroll animations observer
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
};

// ==========================================================================
// Performance Module
// ==========================================================================

const Performance = {
  /**
   * Initialize performance optimizations
   */
  init() {
    this.preloadCriticalResources();
    this.optimizeImages();
    this.monitorPerformance();
  },

  /**
   * Preload critical resources
   */
  preloadCriticalResources() {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap';
    fontLink.as = 'style';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  },

  /**
   * Optimize images with lazy loading
   */
  optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    // Add intersection observer for lazy images if not supported
    if (!('loading' in HTMLImageElement.prototype)) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  },

  /**
   * Monitor performance metrics
   */
  monitorPerformance() {
    // Performance tracking
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
          
          console.log(`Page loaded in ${loadTime}ms`);
          
          // Track Core Web Vitals
          this.trackCoreWebVitals();
        }, 0);
      });
    }
  },

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('FID:', entry.processingStart - entry.startTime);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('CLS:', clsValue);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

// ==========================================================================
// Form Handling Module
// ==========================================================================

const Forms = {
  /**
   * Initialize form handling
   */
  init() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => this.setupForm(form));
  },

  /**
   * Setup individual form
   * @param {Element} form - Form element
   */
  setupForm(form) {
    form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', debounce(() => this.validateField(input), 300));
    });
  },

  /**
   * Handle form submission
   * @param {Event} e - Submit event
   */
  handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    if (this.validateForm(form)) {
      this.submitForm(form);
    }
  },

  /**
   * Validate entire form
   * @param {Element} form - Form element
   * @returns {boolean} Is form valid
   */
  validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  },

  /**
   * Validate individual field
   * @param {Element} field - Input field element
   * @returns {boolean} Is field valid
   */
  validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    let isValid = true;
    let errorMessage = '';
    
    // Check if required field is empty
    if (required && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Type-specific validation
    if (value && !isValid !== false) {
      switch (type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
        case 'tel':
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
          }
          break;
        case 'url':
          try {
            new URL(value);
          } catch {
            isValid = false;
            errorMessage = 'Please enter a valid URL';
          }
          break;
      }
    }
    
    this.displayFieldValidation(field, isValid, errorMessage);
    return isValid;
  },

  /**
   * Display field validation state
   * @param {Element} field - Input field
   * @param {boolean} isValid - Is field valid
   * @param {string} errorMessage - Error message
   */
  displayFieldValidation(field, isValid, errorMessage) {
    const errorElement = field.parentNode.querySelector('.form__error');
    
    if (isValid) {
      field.classList.remove('form__input--error');
      field.classList.add('form__input--valid');
      if (errorElement) {
        errorElement.textContent = '';
      }
    } else {
      field.classList.add('form__input--error');
      field.classList.remove('form__input--valid');
      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
    }
  },

  /**
   * Submit form data
   * @param {Element} form - Form element
   */
  async submitForm(form) {
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Show loading state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Here you would typically send the data to your server
      // For now, we'll simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.showSuccessMessage(form);
      form.reset();
      
    } catch (error) {
      this.showErrorMessage(form, 'There was an error sending your message. Please try again.');
    } finally {
      // Restore button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  },

  /**
   * Show success message
   * @param {Element} form - Form element
   */
  showSuccessMessage(form) {
    const message = document.createElement('div');
    message.className = 'alert alert--success';
    message.textContent = 'Thank you! Your message has been sent successfully.';
    form.insertBefore(message, form.firstChild);
    
    setTimeout(() => message.remove(), 5000);
  },

  /**
   * Show error message
   * @param {Element} form - Form element
   * @param {string} errorText - Error message
   */
  showErrorMessage(form, errorText) {
    const message = document.createElement('div');
    message.className = 'alert alert--danger';
    message.textContent = errorText;
    form.insertBefore(message, form.firstChild);
    
    setTimeout(() => message.remove(), 5000);
  }
};

// ==========================================================================
// Accessibility Module
// ==========================================================================

const Accessibility = {
  /**
   * Initialize accessibility features
   */
  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupScreenReaderSupport();
    this.checkColorContrast();
  },

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Enable keyboard navigation for interactive elements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Custom keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Skip to main content (Alt + S)
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  },

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Trap focus in modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('.modal--open');
        if (modal) {
          this.trapFocus(e, modal);
        }
      }
    });
  },

  /**
   * Trap focus within an element
   * @param {Event} e - Keyboard event
   * @param {Element} container - Container element
   */
  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  },

  /**
   * Setup screen reader support
   */
  setupScreenReaderSupport() {
    // Announce page changes
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.id = 'announcer';
    document.body.appendChild(announcer);
    
    // Announce navigation changes
    window.addEventListener('popstate', () => {
      this.announce('Page content updated');
    });
  },

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   */
  announce(message) {
    const announcer = document.getElementById('announcer');
    if (announcer) {
      announcer.textContent = message;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  },

  /**
   * Check color contrast (development helper)
   */
  checkColorContrast() {
    if (process.env.NODE_ENV === 'development') {
      // This would typically integrate with an accessibility testing library
      console.log('Color contrast checking enabled in development mode');
    }
  }
};

// ==========================================================================
// Application Initialization
// ==========================================================================

/**
 * Initialize the application
 */
function initApp() {
  // Check user preferences
  App.state.reducedMotion = prefersReducedMotion();
  App.state.isMobile = isMobileDevice();

  // Cache DOM elements
  App.elements.cursor = document.querySelector('.cursor');
  App.elements.header = document.querySelector('.header');
  App.elements.navToggle = document.querySelector('.nav__toggle');
  App.elements.navMenu = document.querySelector('.nav__menu');
  App.elements.navLinks = document.querySelectorAll('.nav__link');
  App.elements.scrollElements = document.querySelectorAll('[data-animate]');
  App.elements.interactiveElements = document.querySelectorAll('a, button, .btn, .card, input, textarea');

  // Initialize modules
  try {
    Cursor.init();
    Navigation.init();
    ScrollAnimations.init();
    Performance.init();
    Forms.init();
    Accessibility.init();
    
    App.state.isLoaded = true;
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing application:', error);
  }
}

/**
 * Handle page visibility changes
 */
function handleVisibilityChange() {
  if (document.hidden) {
    // Page is hidden - pause expensive operations
    ScrollAnimations.destroy();
  } else {
    // Page is visible - resume operations
    if (!App.state.reducedMotion) {
      ScrollAnimations.init();
    }
  }
}

// ==========================================================================
// Event Listeners
// ==========================================================================

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', handleVisibilityChange);

// Handle window resize
window.addEventListener('resize', debounce(() => {
  App.state.isMobile = isMobileDevice();
  
  // Close mobile menu on resize to desktop
  if (!App.state.isMobile && App.state.isNavigationOpen) {
    Navigation.closeMobileMenu();
  }
}, 250));

// Handle reduced motion preference changes
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  App.state.reducedMotion = e.matches;
  
  if (App.state.reducedMotion) {
    ScrollAnimations.destroy();
  } else {
    ScrollAnimations.init();
  }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App, Cursor, Navigation, ScrollAnimations, Performance, Forms, Accessibility };
}