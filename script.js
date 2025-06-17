document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
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
    const initialIsDark = localStorage.getItem('darkMode') === 'enabled';
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

    // Toggle dark mode when the logo is clicked
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer) {
        logoContainer.style.cursor = 'pointer'; // indicate interactivity
        logoContainer.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode');
            applyTheme(!isDark);
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

            // Image element (initial)
            const initialImg = document.createElement('img');
            initialImg.className = 'profile-image';
            initialImg.alt = profile.name;
            initialImg.loading = 'lazy';
            // Pick random start image
            const startIdx = Math.floor(Math.random() * profile.images.length);
            initialImg.dataset.idx = startIdx;
            
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

            // Manual cycle on click/tap
            const clickHandler = () => changeImage();
            card.addEventListener('click', clickHandler);

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
                newImg.alt = profile.name;
                newImg.loading = 'lazy';
                newImg.dataset.idx = nextIdx;
                newImg.style.opacity = '0'; // Start transparent for fade-in
                
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
                card.removeEventListener('click', clickHandler);
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

}); 