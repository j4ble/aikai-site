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

}); 