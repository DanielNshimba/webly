// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - sectionHeight / 3)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });

    // Close mobile menu on scroll or click
    if (navLinksContainer.classList.contains('show')) {
        navLinksContainer.classList.remove('show');
        navToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
    }
});

// Mobile Menu Toggle
const navToggle = document.getElementById('nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('show');
        const icon = navToggle.querySelector('i');
        if (navLinksContainer.classList.contains('show')) {
            icon.classList.replace('fa-bars', 'fa-times');
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
        }
    });
}

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinksContainer.classList.remove('show');
        if (navToggle) {
            navToggle.querySelector('i').classList.replace('fa-times', 'fa-bars');
        }
    });
});

// Reveal Animations on Scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

// Add fade-in classes to elements
document.querySelectorAll('.section-title, .project-card, .about-content, .hero-content').forEach(el => {
    el.classList.add('fade-in-section');
    observer.observe(el);
});

// Typewriter Effect
const typewriters = document.querySelectorAll('.typewriter-text');

typewriters.forEach((el, index) => {
    const text = el.getAttribute('data-text');
    el.innerText = '';

    // Add cursor
    const cursor = document.createElement('span');
    cursor.classList.add('cursor');
    el.parentNode.appendChild(cursor);
    // Only keep cursor for the last active line or handle logically
    // For now, let's just leave it, or maybe remove it after typing?
    // Let's keep it simple: Blink cursor at end of typing each line.

    let i = 0;
    const speed = 100; // Typing speed
    const startDelay = index * 1000; // Delay next line

    setTimeout(() => {
        function type() {
            if (i < text.length) {
                el.innerText += text.charAt(i);
                i++;
                // Move cursor to always be after the text
                el.appendChild(cursor);
                setTimeout(type, speed);
            }
        }
        type();
    }, startDelay + 500);
});

// Add CSS for fade-in animation via JS (or improved in CSS)
const style = document.createElement('style');
style.innerHTML = `
    .fade-in-section {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .fade-in-section.visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    @keyframes morph {
        0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
        50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
        100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
    }
`;
document.head.appendChild(style);
