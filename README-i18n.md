# Bilingual Translation System for University Library

This documentation explains the implementation of the bilingual (English/Arabic) translation system for the University Library web application.

## Features

- Dynamic switching between English (🇺🇸) and Arabic (🇸🇦)
- Language preference stored in localStorage
- Automatic loading of preferred language on page load
- RTL support for Arabic language
- Modular, ES6 class-based implementation

## File Structure

```
frontend/
├── js/
│   ├── lang/
│   │   ├── en.js       // English translations
│   │   └── ar.js       // Arabic translations
│   └── i18n.js         // Translation manager class
├── css/
│   └── styles.css      // Including RTL support
└── components/
    └── navbar.html     // With language switcher
```

## Usage

### HTML Markup

Use data-i18n attributes to mark translatable text elements:

```html
<h1 data-i18n="welcomeMessage">Welcome to the Library</h1>
<button data-i18n="loginButton">Login</button>
```

### JavaScript Implementation

The translation system is implemented using the I18nManager class:

```javascript
// Import the translation manager
import i18n from "./js/i18n.js";

// Initialize translations when page loads
document.addEventListener("DOMContentLoaded", async function () {
  await i18n.init();
});
```

### Adding New Translations

1. Add new keys to both language files (`en.js` and `ar.js`)
2. Use the same key in HTML with the `data-i18n` attribute

Example:

```javascript
// en.js
export const en = {
  newFeature: "New Feature",
};

// ar.js
export const ar = {
  newFeature: "ميزة جديدة",
};
```

```html
<span data-i18n="newFeature">New Feature</span>
```

## RTL Support

The system automatically switches to RTL layout when Arabic is selected by:

1. Adding `dir="rtl"` to the HTML element
2. Adding the `.rtl` class to the body
3. Applying specific CSS rules for RTL layout

## Best Practices

1. Keep translation keys consistent and descriptive
2. Group related translations in the language files
3. Avoid hardcoded text in JavaScript code - use `i18n.translate("key")` instead
4. Test both languages thoroughly, especially RTL layout
