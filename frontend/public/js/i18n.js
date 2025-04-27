/**
 * I18nManager - Internationalization manager for handling translations
 */
class I18nManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = localStorage.getItem("language") || "en";
    this.defaultLanguage = "en";
    this.supportedLanguages = ["en", "ar"];
    this.rtlLanguages = ["ar"];
    this.initialized = false;
  }

  /**
   * Initialize the translation system
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Load all language files dynamically
      for (const lang of this.supportedLanguages) {
        const module = await import(`./lang/${lang}.js`);
        this.translations[lang] = module[lang];
      }

      // Make the i18n instance available globally for non-module scripts
      window.i18n = this;

      // Apply current language
      this.applyLanguage(this.currentLanguage);
      this.initialized = true;

      // Create language switcher if it doesn't exist
      this.createLanguageSwitcher();
    } catch (error) {
      console.error("Error initializing translations:", error);
    }
  }

  /**
   * Apply the specified language to the UI
   * @param {string} lang - Language code to apply
   */
  applyLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.error(`Language '${lang}' is not supported`);
      return;
    }

    // Store the current language
    this.currentLanguage = lang;
    localStorage.setItem("language", lang);

    // Apply RTL if needed
    this.applyTextDirection(lang);

    // Translate all elements with data-i18n attribute
    const elements = document.querySelectorAll("[data-i18n]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedTranslation(lang, key);

      if (translation) {
        // Handle different element types
        if (element.tagName === "INPUT" && element.type === "placeholder") {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      } else {
        console.warn(
          `Translation key '${key}' not found for language '${lang}'`,
        );
      }
    });
  }

  /**
   * Get a nested translation using dot notation
   * @param {string} lang - Language code
   * @param {string} key - Translation key with optional dot notation (e.g., "departments.engineering")
   * @returns {string|null} - Translated string or null if not found
   */
  getNestedTranslation(lang, key) {
    if (!key || !this.translations[lang]) return null;

    // Handle nested keys with dot notation
    if (key.includes(".")) {
      const keys = key.split(".");
      let result = this.translations[lang];

      for (const k of keys) {
        if (result && typeof result === "object" && k in result) {
          result = result[k];
        } else {
          return null;
        }
      }

      return result;
    }

    // Handle simple keys
    return this.translations[lang][key] || null;
  }

  /**
   * Get a translation string for the current language
   * @param {string} key - Translation key
   * @returns {string} - Translated string or the key if translation not found
   */
  translate(key) {
    const translation =
      this.getNestedTranslation(this.currentLanguage, key) ||
      this.getNestedTranslation(this.defaultLanguage, key);
    return translation || key;
  }

  /**
   * Change the current language
   * @param {string} lang - Language code to switch to
   */
  changeLanguage(lang) {
    if (!this.supportedLanguages.includes(lang)) {
      console.error(`Language '${lang}' is not supported`);
      return;
    }

    this.applyLanguage(lang);

    // Update language switcher
    const languageSwitchers = document.querySelectorAll(".language-switcher");
    languageSwitchers.forEach((switcher) => {
      const buttons = switcher.querySelectorAll("button");
      buttons.forEach((button) => {
        if (button.getAttribute("data-lang") === lang) {
          button.classList.add("active");
        } else {
          button.classList.remove("active");
        }
      });
    });
  }

  /**
   * Apply text direction based on language (RTL/LTR)
   * @param {string} lang - Language code
   */
  applyTextDirection(lang) {
    const isRtl = this.rtlLanguages.includes(lang);
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;

    // Add or remove RTL class from body
    if (isRtl) {
      document.body.classList.add("rtl");
    } else {
      document.body.classList.remove("rtl");
    }
  }

  /**
   * Create language switcher UI
   */
  createLanguageSwitcher() {
    // Check if language switcher already exists
    if (document.querySelector(".language-switcher")) {
      return;
    }

    // Create the language switcher
    const navbarNav = document.querySelector("#navbarNav .navbar-nav");
    if (!navbarNav) return;

    const langItem = document.createElement("li");
    langItem.className = "nav-item dropdown";

    langItem.innerHTML = `
      <a class="nav-link dropdown-toggle" href="#" id="languageDropdown" role="button" 
         data-bs-toggle="dropdown" aria-expanded="false" data-i18n="language">
        Language
      </a>
      <ul class="dropdown-menu dropdown-menu-end language-switcher" aria-labelledby="languageDropdown">
        <li>
          <button class="dropdown-item ${
            this.currentLanguage === "en" ? "active" : ""
          }" 
                  data-lang="en">
            <span class="flag-icon">🇺🇸</span> 
            <span data-i18n="english">English</span>
          </button>
        </li>
        <li>
          <button class="dropdown-item ${
            this.currentLanguage === "ar" ? "active" : ""
          }" 
                  data-lang="ar">
            <span class="flag-icon">🇸🇦</span> 
            <span data-i18n="arabic">Arabic</span>
          </button>
        </li>
      </ul>
    `;

    navbarNav.appendChild(langItem);

    // Translate the language switcher text
    this.applyLanguage(this.currentLanguage);

    // Add event listeners to language switcher buttons
    const buttons = document.querySelectorAll(".language-switcher button");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const lang = e.currentTarget.getAttribute("data-lang");
        this.changeLanguage(lang);
      });
    });
  }
}

// Create and export a singleton instance
const i18n = new I18nManager();
export default i18n;
