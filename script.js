document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Logic
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenuWrapper = document.getElementById('navMenuWrapper');
    // Store original parent to restore later
    const navMenuOriginalParent = navMenuWrapper ? navMenuWrapper.parentElement : null;
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburgerMenu && navMenuWrapper) {
        const updateNavMenuPlacement = () => {
            const isOpen = document.body.classList.contains('menu-open');
            if (isOpen) {
                // Move to <body> so backdrop-filter works
                if (navMenuWrapper.parentElement !== document.body) {
                    document.body.appendChild(navMenuWrapper);
                }
            } else if (navMenuOriginalParent) {
                // Restore to original parent when closed
                if (navMenuWrapper.parentElement !== navMenuOriginalParent) {
                    navMenuOriginalParent.appendChild(navMenuWrapper);
                }
            }
        };

        hamburgerMenu.addEventListener('click', () => {
            document.body.classList.toggle('menu-open');
            updateNavMenuPlacement();
        });

        // Initial placement in case page loads with menu-open class
        updateNavMenuPlacement();
    }

    // Close menu when a nav link is clicked (for single-page anchors)
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (document.body.classList.contains('menu-open')) {
                document.body.classList.remove('menu-open');
                // Ensure nav is moved back after closing via link click
                if (navMenuOriginalParent && navMenuWrapper.parentElement !== navMenuOriginalParent) {
                    navMenuOriginalParent.appendChild(navMenuWrapper);
                }
            }
        });
    });

    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeToggleButton = document.getElementById('darkModeToggleButton');
    const body = document.body;
    const previewImage = document.getElementById('previewImage');

    // Define preview image sources
    const lightPreviewSrc = 'a1_light.png';
    const darkPreviewSrc = 'a1_dark.png';

    // Check local storage for saved preference
    const prefersDark = localStorage.getItem('darkMode') === 'enabled';

    // Function to apply the theme (simplified)
    const applyTheme = (isDark) => {
        // Apply class and preview image immediately
        if (isDark) {
            body.classList.add('dark-mode');
            if (previewImage) previewImage.src = darkPreviewSrc;
            localStorage.setItem('darkMode', 'enabled');
        } else {
            body.classList.remove('dark-mode');
            if (previewImage) previewImage.src = lightPreviewSrc;
            localStorage.setItem('darkMode', 'disabled');
        }

        // Ensure the toggle reflects the current state immediately
        if (darkModeToggle) darkModeToggle.checked = isDark;
    };

    // Apply the theme based on stored preference first (simplified initial setup)
    // Default to dark mode unless preference explicitly set to "disabled"
    const initialIsDark = localStorage.getItem('darkMode') !== 'disabled';
    // Just set the class and preview image, CSS handles the initial logo visibility
    if (initialIsDark) {
        body.classList.add('dark-mode');
        if (previewImage) previewImage.src = darkPreviewSrc;
    } else {
        // Ensure light mode class state is correct if needed
        if (previewImage) previewImage.src = lightPreviewSrc;
    }
    // Set initial toggle state
    if (darkModeToggle) darkModeToggle.checked = initialIsDark;

    // Add event listener for the checkbox 'change' event
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            applyTheme(darkModeToggle.checked);
        });
    }

    // Add event listener for the new toggle button
    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode');
            applyTheme(!isDark);
        });
    }

    // Scroll to top when the logo is clicked (instead of toggling dark mode)
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.style.cursor = 'pointer'; // indicate interactivity
        logoContainer.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Profile Slider Logic (Card-based)
    const sliderContainer = document.getElementById('profileSlider');
    if (sliderContainer) {
        const dataElement = document.getElementById('profilesData');
        let profiles = [];
        if (dataElement) {
            try {
                profiles = JSON.parse(dataElement.textContent.trim());
            } catch (err) {
                console.error('Failed to parse embedded profiles JSON', err);
            }
        }

        if (Array.isArray(profiles) && profiles.length) {
            // Shuffle profiles for random order
            profiles.sort(() => Math.random() - 0.5);
            // Duplicate profiles multiple times for infinite scroll effect
            const duplicatedProfiles = [...profiles, ...profiles, ...profiles];
            buildCards(duplicatedProfiles);
        }

        function buildCards(profiles) {
            const observer = new IntersectionObserver(handleIntersect, {
                root: sliderContainer,
                threshold: 0.25
            });

            profiles.forEach(profile => {
                const { card, start, stop, cleanup } = createCard(profile);
                // Attach control methods for observer
                card.__startTimer = start;
                card.__stopTimer = stop;
                card.__cleanup = cleanup;
                sliderContainer.appendChild(card);
                observer.observe(card);
            });

            // Store observer reference for cleanup
            sliderContainer.__observer = observer;

            // Enable mouse drag scrolling (in addition to native touch)
            addDragScrolling(sliderContainer);
        }

        function createCard(profile) {
            const card = document.createElement('div');
            card.className = 'profile-card';
            
            // Make card keyboard accessible
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `View ${profile.name}'s profile. Age ${profile.age}. ${profile.details}`);

            // Image element (initial)
            const initialImg = document.createElement('img');
            initialImg.className = 'profile-image';
            initialImg.loading = 'lazy';
            // Pick random start image
            const startIdx = Math.floor(Math.random() * profile.images.length);
            initialImg.dataset.idx = startIdx;
            
            // Set appropriate alt text from altTexts array
            initialImg.alt = profile.altTexts && profile.altTexts[startIdx] 
                ? profile.altTexts[startIdx] 
                : profile.name;
            
            // Start with placeholder image
            initialImg.src = 'aikai_profile_card.jpg';
            
            // Preload the actual image
            const actualImg = new Image();
            const onLoadHandler = () => {
                if (initialImg.parentElement) { // Only update if still in DOM
                    initialImg.src = `images/${profile.images[startIdx]}`;
                }
            };
            const onErrorHandler = () => {
                // Keep placeholder if actual image fails to load
                console.warn(`Failed to load profile image: ${profile.images[startIdx]}`);
            };
            actualImg.onload = onLoadHandler;
            actualImg.onerror = onErrorHandler;
            actualImg.src = `images/${profile.images[startIdx]}`;
            
            card.appendChild(initialImg);

            // Track the current visible image element for cross-fading
            let currentImg = initialImg;

            // Info overlay
            const info = document.createElement('div');
            info.className = 'profile-info';
            info.innerHTML = `<h2 class="profile-name">${profile.name}, ${profile.age}</h2><p class="profile-details">${profile.details}</p>`;
            card.appendChild(info);

            // Open modal on click/tap or keyboard activation
            const activateHandler = () => {
                // Get the currently visible image element
                const visibleImg = card.querySelector('.profile-image[style*="opacity: 1"], .profile-image:not([style*="opacity"])');
                if (visibleImg && visibleImg.src && !visibleImg.src.includes('aikai_profile_card.jpg')) {
                    // Pass profile data for navigation
                    const currentIdx = parseInt(visibleImg.dataset.idx, 10);
                    openImageModal(visibleImg, {
                        isProfile: true,
                        profile: profile,
                        currentIndex: currentIdx
                    });
                }
            };
            
            // Add click handler
            card.addEventListener('click', activateHandler);
            
            // Add keyboard handler
            const keyboardHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activateHandler();
                }
            };
            card.addEventListener('keydown', keyboardHandler);

            let timerId = null;
            const firstDelay = 1000 + Math.floor((Math.random() * 3) + 1) * 1000; // 1-4s

            function changeImage() {
                // Determine the next image index & source
                let idx = parseInt(currentImg.dataset.idx, 10);
                const nextIdx = (idx + 1) % profile.images.length;
                const nextSrc = `images/${profile.images[nextIdx]}`;

                // Create a new image element stacked above the current one
                const newImg = document.createElement('img');
                newImg.className = 'profile-image';
                newImg.loading = 'lazy';
                newImg.dataset.idx = nextIdx;
                newImg.style.opacity = '0'; // Start transparent for fade-in
                
                // Set appropriate alt text from altTexts array
                newImg.alt = profile.altTexts && profile.altTexts[nextIdx] 
                    ? profile.altTexts[nextIdx] 
                    : profile.name;
                
                // Start with placeholder image
                newImg.src = 'aikai_profile_card.jpg';
                
                card.appendChild(newImg);

                // Preload the actual image
                const actualImg = new Image();
                const onLoadHandler = () => {
                    if (newImg.parentElement) { // Only update if still in DOM
                        // Update src and start cross-fade
                        newImg.src = nextSrc;
                        requestAnimationFrame(() => {
                            newImg.style.opacity = '1';   // Fade in new
                            currentImg.style.opacity = '0'; // Fade out old
                        });
                    }
                };
                const onErrorHandler = () => {
                    if (newImg.parentElement) { // Only update if still in DOM
                        // If actual image fails, still show placeholder with cross-fade
                        console.warn(`Failed to load profile image: ${profile.images[nextIdx]}`);
                        requestAnimationFrame(() => {
                            newImg.style.opacity = '1';   // Fade in placeholder
                            currentImg.style.opacity = '0'; // Fade out old
                        });
                    }
                };
                actualImg.onload = onLoadHandler;
                actualImg.onerror = onErrorHandler;
                actualImg.src = nextSrc;

                // After transition completes, remove old image & update reference
                newImg.addEventListener('transitionend', () => {
                    if (currentImg && currentImg.parentElement) {
                        currentImg.remove();
                    }
                    currentImg = newImg;
                }, { once: true });
            }

            function scheduleNext(delay) {
                timerId = setTimeout(() => {
                    changeImage();
                    scheduleNext(4000); // subsequent cycles fixed 4s
                }, delay);
            }

            function start() {
                if (timerId !== null) return; // already running
                scheduleNext(firstDelay);
            }

            function stop() {
                clearTimeout(timerId);
                timerId = null;
            }

            function cleanup() {
                stop(); // Clear any running timers
                card.removeEventListener('click', activateHandler);
                card.removeEventListener('keydown', keyboardHandler);
                // Clean up image preloading handlers
                actualImg.onload = null;
                actualImg.onerror = null;
            }

            return { card, start, stop, cleanup };
        }

        function handleIntersect(entries) {
            entries.forEach(entry => {
                const card = entry.target;
                if (entry.isIntersecting) {
                    card.__startTimer && card.__startTimer();
                } else {
                    card.__stopTimer && card.__stopTimer();
                }
            });
        }

        function addDragScrolling(container) {
            /* ---------- state --------------------------------------------------- */
            let isDown       = false;   // finger / mouse button pressed?
            let startX;                 // x-coord where the drag started
            let scrollLeft;             // scrollLeft at drag start

            // auto-scroll speed that runs when the user is NOT touching anything
            const autoScrollSpeed = (() => {
                // Create a tiny off-screen scroller
                const test = document.createElement('div');
                test.style.cssText =
                    'width:20px;height:1px;overflow:scroll;visibility:hidden;position:absolute;';
                const inner = document.createElement('div');
                inner.style.width = '40px';
                test.appendChild(inner);
                document.body.appendChild(test);

                // Try to set a fractional scrollLeft
                test.scrollLeft = 0.5;
                const supportsFractional = test.scrollLeft > 0 && test.scrollLeft < 1;

                // Clean up
                document.body.removeChild(test);

                return supportsFractional ? 0.5 : 1;   // Chrome/Edge vs. Safari
            })();

            let autoScrollAnimationId = null;
            let isPaused      = false;  // true while momentum is running
            let isInitialized = false;

            /* ---------- new momentum state -------------------------------------- */
            let velocity           = 0;   // pixels per frame
            let momentumFrameId    = null;
            let lastMoveTime       = 0;
            let lastMoveScrollLeft = 0;

            /* ---------- helper: infinite-loop positioning ----------------------- */
            function clampInfinite(pos) {
                const S = container.scrollWidth / 3;          // one section width
                const leftLimit  = S - container.clientWidth; // start of section 1 minus viewport
                const rightLimit = 2 * S;                     // end of section 1

                if (pos < leftLimit)  return pos + S; // ran into section 0 → jump forward
                if (pos > rightLimit) return pos - S; // ran into section 2 → jump back
                return pos;                            // still inside section 1
            }

            /* ---------- auto-scroll when idle ----------------------------------- */
            function autoScroll() {
                if (!isInitialized && container.scrollWidth > container.clientWidth) {
                    container.scrollLeft = container.scrollWidth / 3;
                    isInitialized = true;
                }
                if (!isPaused && !isDown) {
                    container.scrollLeft = clampInfinite(
                        container.scrollLeft + autoScrollSpeed
                    );
                }
                autoScrollAnimationId = requestAnimationFrame(autoScroll);
            }
            autoScroll();

            /* ---------- pointer handlers ---------------------------------------- */
            container.addEventListener('pointerdown', (e) => {
                // cancel any momentum that might still be running
                if (momentumFrameId) {
                    cancelAnimationFrame(momentumFrameId);
                    momentumFrameId = null;
                }
                isDown = true;
                container.classList.add('grabbing');
                startX      = e.clientX;
                scrollLeft  = container.scrollLeft;

                // set up velocity measurement
                lastMoveScrollLeft = scrollLeft;
                lastMoveTime       = performance.now();
            });

            container.addEventListener('pointermove', (e) => {
                if (!isDown) return;
                e.preventDefault();

                /* drag ----------------------------------------------------------- */
                const walk        = (e.clientX - startX) * 1.5;
                const newPos      = clampInfinite(scrollLeft - walk);
                container.scrollLeft = newPos;

                /* track velocity ------------------------------------------------- */
                const now       = performance.now();
                const dt        = now - lastMoveTime;          // ms
                if (dt > 0) {
                    const dx   = newPos - lastMoveScrollLeft; // px
                    velocity   = dx / dt * 16;                // ≈ px per frame (16 ms)
                    lastMoveScrollLeft = newPos;
                    lastMoveTime       = now;
                }
            }, { passive: false });

            container.addEventListener('pointerup', pointerUp);
            container.addEventListener('pointercancel', pointerUp);
            container.addEventListener('pointerleave', pointerUp);

            function pointerUp() {
                if (!isDown) return;
                isDown = false;
                container.classList.remove('grabbing');

                /* start momentum if we were moving fast enough ------------------ */
                if (Math.abs(velocity) > 0.5) {
                    isPaused = true;               // stop the background auto-scroll
                    momentumScroll(velocity);
                }
            }

            /* ---------- momentum loop ------------------------------------------- */
            function momentumScroll(v) {
                const friction = 0.95;   // 0.95 → loses ~50 % speed every 13 frames
                function step() {
                    if (Math.abs(v) < autoScrollSpeed) {
                        isPaused        = false;   // resume auto-scroll
                        momentumFrameId = null;
                        return;
                    }
                    container.scrollLeft = clampInfinite(container.scrollLeft + v);
                    v *= friction;                 // slow down
                    momentumFrameId = requestAnimationFrame(step);
                }
                step();
            }

            /* ---------- prevent text / image dragging --------------------------- */
            container.addEventListener('dragstart',   e => e.preventDefault());
            container.addEventListener('selectstart', e => e.preventDefault());

            /* ---------- cleanup function for external use ---------------------- */
            container.__cleanupScrolling = () => {
                cancelAnimationFrame(autoScrollAnimationId);
                if (momentumFrameId) cancelAnimationFrame(momentumFrameId);
                autoScrollAnimationId = null;
                momentumFrameId = null;
            };

            /* ---------- clean up on unload -------------------------------------- */
            window.addEventListener('beforeunload', container.__cleanupScrolling);
        }

        // Global cleanup function for the entire slider
        window.__cleanupSlider = () => {
            if (sliderContainer) {
                // Stop all timers and clean up cards
                Array.from(sliderContainer.children).forEach(card => {
                    if (card.__stopTimer) card.__stopTimer();
                    if (card.__cleanup) card.__cleanup();
                });
                
                // Disconnect observer
                if (sliderContainer.__observer) {
                    sliderContainer.__observer.disconnect();
                }
                
                // Clean up scrolling
                if (sliderContainer.__cleanupScrolling) {
                    sliderContainer.__cleanupScrolling();
                }
            }
        };
    }

    // Handle inline submit button functionality
    const form = document.getElementById('sib-form');
    const inlineButton = document.getElementById('submitButtonInline');
    const originalButton = document.querySelector('.sib-form-block__button-with-loader');
    
    if (form && inlineButton && originalButton) {
        // Handle inline button click
        inlineButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get email input and validate
            const emailInput = document.getElementById('EMAIL');
            if (!emailInput || !emailInput.value.trim()) {
                // Show error for empty email
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                }
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                // Show error for invalid email
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.style.display = 'block';
                }
                return;
            }
            
            // Hide error message
            const errorMessage = document.getElementById('error-message');
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
            
            // Add loading state
            inlineButton.classList.add('loading');
            
            // Trigger the original Brevo button click to use their submission logic
            originalButton.click();
        });
        
        // Monitor form submission states
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' || mutation.type === 'childList') {
                    // Check if success message is shown
                    const successMessage = document.getElementById('success-message');
                    const errorMessage = document.getElementById('error-message');
                    
                    if (successMessage && successMessage.style.display !== 'none' && 
                        successMessage.offsetHeight > 0) {
                        // Success - remove loading state
                        inlineButton.classList.remove('loading');
                    } else if (errorMessage && errorMessage.style.display !== 'none' && 
                              errorMessage.offsetHeight > 0) {
                        // Error - remove loading state
                        inlineButton.classList.remove('loading');
                    }
                }
            });
        });
        
        // Observe the form container for changes
        const formContainer = document.getElementById('sib-form-container');
        if (formContainer) {
            observer.observe(formContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style']
            });
        }
        
        // Also handle form submission via Enter key
        const emailInput = document.getElementById('EMAIL');
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inlineButton.click();
                }
            });
        }
    }

    // Nav Bar VIP Button functionality
    const navVipContainer = document.getElementById('navVipContainer');
    const vipButtonContainer = document.querySelector('.vip-button-container'); // main content button

    if (navVipContainer && vipButtonContainer) {
        const logoContainer = document.querySelector('.logo-container');

        // Intersection observer to toggle nav VIP visibility
        const vipObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Main VIP visible – hide nav VIP
                    navVipContainer.classList.remove('visible');
                } else {
                    // Main VIP not visible – show nav VIP
                    navVipContainer.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '-50px 0px'
        });

        vipObserver.observe(vipButtonContainer);
    }
});

// Enhanced modal functionality with touch support
let modalTouchStartX = 0;
let modalTouchEndX = 0;
let modalPreviousFocus = null; // Store the previously focused element

// Image Modal Functions (defined globally)
function openImageModal(img, profileData = null) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalNav = document.getElementById('modalNav');
    
    if (!(modal && modalImage)) return;
    
    // Handle crossfading images - find the currently visible image
    let targetImg = img;
    const container = img.parentElement;
    if (container && (container.classList.contains('intro-image-container') || 
                     container.classList.contains('match-image-container') || 
                     container.classList.contains('message-image-container'))) {
        // Find the visible image in the crossfade pair
        const images = container.querySelectorAll('img');
        for (const imgElement of images) {
            const computedStyle = window.getComputedStyle(imgElement);
            if (computedStyle.opacity !== '0') {
                targetImg = imgElement;
                break;
            }
        }
    }
    
    modalImage.src = targetImg.src;
    modalImage.alt = targetImg.alt;
    modal.style.display = 'flex';
    
    // Add touch event listeners for swipe navigation
    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Handle navigation setup
    if (profileData && profileData.isProfile) {
        // Profile card with multiple images
        window.currentProfileData = profileData;
        if (modalNav && profileData.profile.images.length > 1) {
            modalNav.style.display = 'block';
        } else if (modalNav) {
            modalNav.style.display = 'none';
        }
    } else {
        // Check if this is part of an info-images gallery
        const galleryContainer = img.closest('.info-images');
        if (galleryContainer) {
            // Get all crossfade containers and standalone images
            const crossfadeContainers = Array.from(galleryContainer.querySelectorAll('.intro-image-container, .match-image-container, .message-image-container'));
            const standaloneImages = Array.from(galleryContainer.querySelectorAll('.info-image')).filter(imgEl => 
                !imgEl.closest('.intro-image-container, .match-image-container, .message-image-container')
            );
            
            const totalImages = crossfadeContainers.length + standaloneImages.length;
            
            if (totalImages > 1) {
                // Multi-image gallery - need to determine current index and create image list
                let currentIndex = -1;
                const imageList = [];
                
                // Process crossfade containers first
                crossfadeContainers.forEach((container, idx) => {
                    const visibleImg = Array.from(container.querySelectorAll('img')).find(imgEl => {
                        const computedStyle = window.getComputedStyle(imgEl);
                        return computedStyle.opacity !== '0';
                    });
                    if (visibleImg) {
                        imageList.push(visibleImg.src);
                        if (container.contains(img)) {
                            currentIndex = idx;
                        }
                    }
                });
                
                // Then process standalone images
                standaloneImages.forEach((imgEl, idx) => {
                    imageList.push(imgEl.src);
                    if (imgEl === img) {
                        currentIndex = crossfadeContainers.length + idx;
                    }
                });
                
                window.currentProfileData = {
                    isProfile: false,
                    isGallery: true,
                    profile: {
                        name: 'Gallery',
                        images: imageList
                    },
                    currentIndex: Math.max(0, currentIndex)
                };
                if (modalNav) modalNav.style.display = 'block';
            } else {
                window.currentProfileData = null;
                if (modalNav) modalNav.style.display = 'none';
            }
        } else {
            window.currentProfileData = null;
            if (modalNav) modalNav.style.display = 'none';
        }
    }
    
    // Store currently focused element and set focus to modal
    modalPreviousFocus = document.activeElement;
    
    // Add keyboard support and focus trapping
    document.addEventListener('keydown', handleModalKeydown);
    
    // Add background click to close
    modal.addEventListener('click', handleModalBackgroundClick);
    
    // Set focus to close button for keyboard users
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.focus();
    }
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    
    // Remove event listeners
    modal.removeEventListener('touchstart', handleTouchStart);
    modal.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('keydown', handleModalKeydown);
    modal.removeEventListener('click', handleModalBackgroundClick);
    
    modal.style.display = 'none';
    window.currentProfileData = null;
    
    // Restore focus to previously focused element
    if (modalPreviousFocus && modalPreviousFocus.focus) {
        modalPreviousFocus.focus();
    }
    modalPreviousFocus = null;
    
    // Restore body scroll
    document.body.style.overflow = '';
}

function handleTouchStart(event) {
    modalTouchStartX = event.changedTouches[0].screenX;
}

function handleTouchEnd(event) {
    modalTouchEndX = event.changedTouches[0].screenX;
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const swipeThreshold = 50; // Minimum distance for a swipe
    const swipeDistance = modalTouchStartX - modalTouchEndX;
    
    if (Math.abs(swipeDistance) > swipeThreshold && window.currentProfileData) {
        if (swipeDistance > 0) {
            // Swiped left - next image
            navigateModalImage(1);
        } else {
            // Swiped right - previous image
            navigateModalImage(-1);
        }
    }
}

function handleModalKeydown(event) {
    const modal = document.getElementById('imageModal');
    
    if (event.key === 'Escape') {
        closeImageModal();
        return;
    }
    
    // Focus trapping
    if (event.key === 'Tab') {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
            // Shift + Tab (backwards)
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab (forwards)
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }
    }

    if (!window.currentProfileData || !window.currentProfileData.profile) return;
    
    const totalImages = window.currentProfileData.profile.images.length;
    if (totalImages <= 1) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateModalImage(-1);
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateModalImage(1);
    }
}

function handleModalBackgroundClick(event) {
    const modalImage = document.getElementById('modalImage');
    const modalClose = document.querySelector('.modal-close');
    const modalArrows = document.querySelectorAll('.modal-arrow');
    
    // Don't close if clicking on image, close button, or navigation arrows
    let isArrowClick = false;
    modalArrows.forEach(arrow => {
        if (arrow.contains(event.target)) {
            isArrowClick = true;
        }
    });
    
    if (event.target !== modalImage && event.target !== modalClose && !isArrowClick) {
        closeImageModal();
    }
}

function navigateModalImage(direction) {
    if (!window.currentProfileData || !window.currentProfileData.profile) return;

    const modalImage = document.getElementById('modalImage');
    const profile = window.currentProfileData.profile;
    const totalImages = profile.images.length;

    if (totalImages <= 1) return;

    // Update the current index
    window.currentProfileData.currentIndex = 
        (window.currentProfileData.currentIndex + direction + totalImages) % totalImages;

    const nextImageData = profile.images[window.currentProfileData.currentIndex];
    
    // Determine correct src path based on image type
    let nextSrc;
    if (window.currentProfileData.isGallery) {
        // Gallery images - use full src path as stored, but check for crossfade alternatives
        nextSrc = nextImageData;
        
        // For gallery navigation, we need to check if we should show dark mode alternative
        const isDarkMode = document.body.classList.contains('dark-mode');
                 if (isDarkMode) {
             // Check if this is a light mode image that has a dark mode alternative
             if (nextSrc.includes('aikai_intro.jpg')) {
                 nextSrc = nextSrc.replace('aikai_intro.jpg', 'aikai_intro_dark.jpg');
             } else if (nextSrc.includes('match_light.jpg')) {
                 nextSrc = nextSrc.replace('match_light.jpg', 'match.jpg');
             } else if (nextSrc.includes('message_light.png')) {
                 nextSrc = nextSrc.replace('message_light.png', 'message_dark.png');
             }
         } else {
             // Light mode - make sure we're using light versions
             if (nextSrc.includes('aikai_intro_dark.jpg')) {
                 nextSrc = nextSrc.replace('aikai_intro_dark.jpg', 'aikai_intro.jpg');
             } else if (nextSrc.includes('match.jpg') && !nextSrc.includes('match_light.jpg')) {
                 nextSrc = nextSrc.replace('match.jpg', 'match_light.jpg');
             } else if (nextSrc.includes('message_dark.png')) {
                 nextSrc = nextSrc.replace('message_dark.png', 'message_light.png');
             }
         }
    } else {
        // Profile card images - add images/ prefix to filename
        nextSrc = `images/${nextImageData}`;
    }

    // Preload the image before showing it
    const preloader = new Image();
    preloader.onload = () => {
        if (modalImage) {
            modalImage.src = nextSrc;
            // Use the actual alt text from the altTexts array if available
            if (window.currentProfileData.isProfile && profile.altTexts && profile.altTexts[window.currentProfileData.currentIndex]) {
                modalImage.alt = profile.altTexts[window.currentProfileData.currentIndex];
            } else {
                const imageNumber = window.currentProfileData.currentIndex + 1;
                const totalCount = totalImages;
                modalImage.alt = `${profile.name} - Photo ${imageNumber} of ${totalCount}`;
            }
        }
    };
    preloader.onerror = () => {
        console.warn(`Failed to load modal image: ${nextImageData}`);
        console.warn(`Attempted src: ${nextSrc}`);
    };
    preloader.src = nextSrc;
} 