// RepairMaster Web Design & Stylesheet Setup
// Configures Tailwind CSS and handles premium visual card effects

tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            colors: {
                navyBG: '#0A0F1D',
                navySurface: '#121B33',
                tealPrimary: '#0D9488', // Teal 600
                tealAccent: '#14B8A6', // Teal 500
                amberAccent: '#F59E0B', // Amber 500
                grayText: '#94A3B8', // Slate 400
                grayBorder: '#1E293B' // Slate 800
            }
        }
    }
};

// Apply interactive hover effects or ambient glows programmatically if needed
document.addEventListener('DOMContentLoaded', () => {
    console.log("RepairMaster Visual Styling Initialized");

    // Inject a global stylesheet style rule for .rm-logo to be absolutely reliable
    const styleEl = document.createElement('style');
    styleEl.id = 'global-brand-logo-styles';
    styleEl.innerHTML = `
        .rm-logo {
            background-image: url('img_maintenance_mode_active.png.png') !important;
            background-size: cover !important;
            background-position: center !important;
            background-repeat: no-repeat !important;
            background-color: transparent !important;
            color: transparent !important;
            text-shadow: none !important;
            overflow: hidden !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 8px 30px rgba(13, 148, 136, 0.5) !important;
            border: 1px solid rgba(20, 184, 166, 0.4) !important;
        }
        
        /* Make sure slides render background images perfectly with high fidelity and proper parallax positioning */
        .carousel-slide {
            background-size: cover !important;
            background-position: center center !important;
            background-repeat: no-repeat !important;
            transition: opacity 1.2s ease-in-out !important;
        }
    `;
    document.head.appendChild(styleEl);

    // Also double-secure existing elements
    const logoElements = document.querySelectorAll('.rm-logo');
    logoElements.forEach(el => {
        el.innerHTML = '';
    });
});
