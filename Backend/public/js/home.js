/**
 * HOME PAGE JAVASCRIPT
 * Interactive elements and animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    setupScrollAnimations();
    setupSmoothScroll();
});

/**
 * Initialize Animations
 */
function initializeAnimations() {
    // Add animation classes to elements on load
    const cards = document.querySelectorAll('.feature-card, .stat-card, .tech-item');
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = 'slideInUp 0.6s ease forwards';
        }, index * 100);
    });
}

/**
 * Setup Scroll Animations
 */
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.feature-card, .stat-card, .workflow-step').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

/**
 * Setup Smooth Scroll
 */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Add CSS animations
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .feature-card:hover,
    .stat-card:hover,
    .tech-item:hover {
        transform: translateY(-10px);
    }
`;
document.head.appendChild(style);
