/* =====================================================
   RE.JS — Aurum Restaurant · Interactive Features
   ===================================================== */

(function () {
    'use strict';

    /* -------------------------------------------------------
       HERO SLIDER
    ------------------------------------------------------- */
    const track = document.getElementById('heroTrack');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    const counterNum = document.getElementById('heroCurrentNum');
    const SLIDE_COUNT = 3;
    let currentSlide = 0;
    let autoTimer;

    function goToSlide(index) {
        currentSlide = (index + SLIDE_COUNT) % SLIDE_COUNT;
        track.style.transform = `translateX(-${(100 / SLIDE_COUNT) * currentSlide}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
        counterNum.textContent = String(currentSlide + 1).padStart(2, '0');
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    function startAuto() {
        stopAuto();
        autoTimer = setInterval(nextSlide, 5200);
    }
    function stopAuto() { clearInterval(autoTimer); }

    nextBtn.addEventListener('click', () => { nextSlide(); startAuto(); });
    prevBtn.addEventListener('click', () => { prevSlide(); startAuto(); });

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goToSlide(parseInt(dot.dataset.index, 10));
            startAuto();
        });
    });

    // Swipe / drag support
    let touchStartX = 0;
    const hero = document.querySelector('.hero');
    hero.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    hero.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); startAuto(); }
    });

    startAuto();


    /* -------------------------------------------------------
       NAV: scroll effect
    ------------------------------------------------------- */
    const navbar = document.getElementById('navbar');

    function handleNavScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();


    /* -------------------------------------------------------
       MOBILE MENU
    ------------------------------------------------------- */
    const burger = document.getElementById('navBurger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileClose = document.getElementById('mobileClose');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function openMenu() { mobileMenu.classList.add('open'); mobileOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeMenu() { mobileMenu.classList.remove('open'); mobileOverlay.classList.remove('open'); document.body.style.overflow = ''; }

    burger.addEventListener('click', openMenu);
    mobileClose.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);
    mobileLinks.forEach(l => l.addEventListener('click', closeMenu));


    /* -------------------------------------------------------
       MENU FILTER TABS
    ------------------------------------------------------- */
    const tabs = document.querySelectorAll('.menu-tab');
    const cards = document.querySelectorAll('.menu-card');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.category;

            cards.forEach(card => {
                const match = category === 'all' || card.dataset.category === category;
                card.style.transition = 'opacity .35s ease, transform .35s ease';

                if (match) {
                    card.style.display = '';
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(12px)';
                    setTimeout(() => { card.style.display = 'none'; }, 360);
                }
            });
        });
    });


    /* -------------------------------------------------------
       SCROLL REVEAL
    ------------------------------------------------------- */
    const reveals = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger cards in the grid
                const delay = entry.target.closest('.menu-grid')
                    ? Array.from(cards).indexOf(entry.target) % 3 * 120
                    : 0;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    reveals.forEach(el => revealObserver.observe(el));


    /* -------------------------------------------------------
       RESERVATION FORM
    ------------------------------------------------------- */
    const form = document.getElementById('reservationForm');
    const success = document.getElementById('reservationSuccess');
    const submit = document.getElementById('reserveSubmit');
    const dateInput = document.getElementById('resDate');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic validation
        const required = form.querySelectorAll('[required]');
        let valid = true;

        required.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.style.borderColor = '#d9534f';
                field.addEventListener('input', () => { field.style.borderColor = ''; }, { once: true });
            }
        });

        if (!valid) {
            shakeForm();
            return;
        }

        // Simulate submission
        submit.textContent = 'Sending…';
        submit.disabled = true;

        setTimeout(() => {
            form.style.display = 'none';
            success.classList.add('show');
        }, 1200);
    });

    function shakeForm() {
        const card = document.querySelector('.reservation-form-card');
        card.style.animation = 'none';
        card.offsetHeight; // Reflow
        card.style.animation = 'shake .45s ease';
    }

    // Inject shake keyframe once
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-5px); }
      80%      { transform: translateX(5px); }
    }
  `;
    document.head.appendChild(styleSheet);


    /* -------------------------------------------------------
       SMOOTH SCROLL for anchor links
    ------------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

})();
