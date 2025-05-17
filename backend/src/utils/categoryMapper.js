/**
 * Utility functions to map Google Books categories to our predefined categories
 */

// Common aliases/variations for each category
const categoryMappings = {
  // General categories
  fiction: ["fiction", "novel", "novels", "stories"],
  non_fiction: ["non-fiction", "nonfiction", "non fiction"],
  science: ["science", "sciences", "scientific"],
  technology: ["technology", "tech", "technologies", "technological"],
  history: ["history", "historical", "past"],
  biography: ["biography", "biographies", "life story"],
  autobiography: ["autobiography", "autobiographies", "personal story"],
  memoir: ["memoir", "memoirs", "personal account"],
  poetry: ["poetry", "poems", "verse", "poetic"],
  drama: ["drama", "dramatic", "play", "plays"],
  romance: ["romance", "romantic", "love", "love story"],
  thriller: ["thriller", "suspense", "suspenseful"],
  mystery: ["mystery", "mysteries", "detective", "crime"],
  horror: ["horror", "scary", "frightening", "terror"],
  fantasy: ["fantasy", "fantastic", "magical", "magic"],
  science_fiction: [
    "science fiction",
    "sci-fi",
    "scifi",
    "sci fi",
    "science-fiction",
  ],
  young_adult: ["young adult", "ya", "teen", "teenage", "young-adult"],
  children: ["children", "kids", "juvenile", "child", "childhood"],
  art: ["art", "arts", "artistic"],
  photography: ["photography", "photographs", "photos"],
  cooking: ["cooking", "cookbook", "cookbooks", "food", "recipes", "culinary"],
  travel: ["travel", "traveling", "travelling", "traveller", "traveler"],
  religion: ["religion", "religious", "faith", "spiritual", "spirituality"],
  philosophy: ["philosophy", "philosophical", "ethics"],
  psychology: ["psychology", "psychological", "human behavior", "behavior"],
  self_help: [
    "self-help",
    "self help",
    "personal development",
    "self-development",
    "self development",
  ],
  business: ["business", "corporate", "commerce", "management"],
  economics: ["economics", "economy", "economic", "finance", "financial"],
  political_science: [
    "political science",
    "politics",
    "political",
    "government",
  ],
  law: ["law", "legal", "legislation", "laws"],
  education: ["education", "educational", "learning", "teaching", "pedagogy"],
  reference: ["reference", "dictionary", "encyclopedia", "guide", "handbook"],
  language: ["language", "languages", "linguistic", "linguistics"],
  mathematics: ["mathematics", "math", "maths", "mathematical"],

  // Computer Science categories
  computer_science: [
    "computer science",
    "computers",
    "computing",
    "computer",
    "CS",
  ],
  programming: [
    "programming",
    "coding",
    "software development",
    "code",
    "developer",
    "programming languages",
    "Java",
    "Python",
    "C++",
    "JavaScript",
    "TypeScript",
    "Ruby",
    "Swift",
    "Kotlin",
    "Go",
    "Rust",
    "PHP",
  ],
  web_development: [
    "web development",
    "web design",
    "web programming",
    "frontend",
    "backend",
    "full stack",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Laravel",
    "web applications",
  ],
  mobile_development: [
    "mobile development",
    "mobile apps",
    "app development",
    "android",
    "ios",
    "flutter",
    "react native",
    "xamarin",
    "swift",
    "kotlin",
  ],
  databases: [
    "databases",
    "database systems",
    "SQL",
    "NoSQL",
    "data storage",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Oracle",
    "SQLite",
    "Cassandra",
    "database design",
    "data modeling",
  ],
  artificial_intelligence: [
    "artificial intelligence",
    "AI",
    "machine learning",
    "ML",
    "deep learning",
    "neural networks",
    "NLP",
    "natural language processing",
    "computer vision",
    "reinforcement learning",
    "AI algorithms",
  ],
  data_science: [
    "data science",
    "big data",
    "data analytics",
    "data mining",
    "statistical analysis",
    "data visualization",
    "predictive modeling",
    "data engineering",
    "Hadoop",
    "Spark",
    "R programming",
    "business intelligence",
    "data warehousing",
  ],

  // Other STEM categories
  engineering: ["engineering", "engineer", "technical"],
  physics: [
    "physics",
    "physical science",
    "quantum",
    "relativity",
    "mechanics",
  ],
  chemistry: ["chemistry", "chemical", "biochemistry", "organic chemistry"],
  biology: ["biology", "biological sciences", "life sciences"],
  medical: ["medical", "medicine", "health", "healthcare", "clinical"],

  // Other general categories
  sports: ["sports", "sport", "athletic", "athletics", "fitness"],
  nature: [
    "nature",
    "environment",
    "ecology",
    "natural",
    "outdoors",
    "wildlife",
  ],
  comics: ["comics", "comic", "graphic novel", "manga"],
  literary_fiction: ["literary fiction", "literature", "literary", "classics"],
  historical_fiction: ["historical fiction", "period fiction"],
  academic: [
    "academic",
    "scholarly",
    "textbook",
    "study",
    "research",
    "university",
  ],
};

// Category groupings for improved UI organization
const categoryGroups = {
  general: ["fiction", "non_fiction"],
  genres: [
    "science_fiction",
    "fantasy",
    "mystery",
    "thriller",
    "horror",
    "romance",
    "drama",
    "poetry",
    "historical_fiction",
    "literary_fiction",
    "comics",
  ],
  audience: ["children", "young_adult", "adult"],
  academic: ["academic", "education", "reference", "language", "mathematics"],
  technology: [
    "technology",
    "computer_science",
    "programming",
    "web_development",
    "mobile_development",
    "databases",
    "artificial_intelligence",
    "data_science",
  ],
  science: ["science", "physics", "chemistry", "biology", "medical"],
  humanities: [
    "history",
    "biography",
    "autobiography",
    "memoir",
    "philosophy",
    "religion",
    "psychology",
    "self_help",
    "art",
    "photography",
  ],
  business: ["business", "economics", "political_science", "law"],
  lifestyle: ["cooking", "travel", "sports", "nature"],
};

/**
 * Maps a Google Books category to a predefined category key
 * @param {string} googleCategory - The category from Google Books
 * @returns {string|null} - The matching predefined category key, or null if not found
 */
function mapGoogleCategoryToCategoryKey(googleCategory) {
  if (!googleCategory) return null;

  const lowerCaseCategory = googleCategory.toLowerCase().trim();

  // Direct match with a category key
  if (Object.keys(categoryMappings).includes(lowerCaseCategory)) {
    return lowerCaseCategory;
  }

  // Check each category mapping
  for (const [categoryKey, variations] of Object.entries(categoryMappings)) {
    // Check if the category matches any of the variations
    if (
      variations.some(
        (variation) =>
          lowerCaseCategory === variation ||
          lowerCaseCategory.includes(variation),
      )
    ) {
      return categoryKey;
    }
  }

  return null;
}

/**
 * Maps an array of Google Books categories to an array of our predefined category keys
 * @param {string[]} googleCategories - Array of categories from Google Books
 * @returns {string[]} - Array of matching predefined category keys
 */
function mapGoogleCategoriesToCategoryKeys(googleCategories) {
  if (!googleCategories || !Array.isArray(googleCategories)) return [];

  const mappedCategories = new Set();

  googleCategories.forEach((category) => {
    // Split categories by common separators
    const subCategories = category.split(/[/&,;]/).map((c) => c.trim());

    subCategories.forEach((subCategory) => {
      const mappedCategory = mapGoogleCategoryToCategoryKey(subCategory);
      if (mappedCategory) {
        mappedCategories.add(mappedCategory);
      }
    });
  });

  return Array.from(mappedCategories);
}

/**
 * Gets the full list of available category keys
 * @param {boolean} grouped - Whether to return categories organized by groups
 * @returns {Array|Object} - Array of category keys or object with categories organized by groups
 */
function getAllCategoryKeys(grouped = false) {
  const categoryKeys = Object.keys(categoryMappings);
  console.log(`getAllCategoryKeys: Found ${categoryKeys.length} category keys`);

  if (!grouped) {
    return categoryKeys;
  }

  // Return categories organized by group
  const result = {};

  // Initialize with empty arrays for all groups
  Object.keys(categoryGroups).forEach((group) => {
    result[group] = [];
  });

  // Add "other" group for uncategorized categories
  result.other = [];

  // Assign each category to its group
  categoryKeys.forEach((categoryKey) => {
    const group = getCategoryGroup(categoryKey);
    result[group].push(categoryKey);
  });

  return result;
}

/**
 * Get all category groups for UI organization
 * @returns {Object} - Object with group names as keys and arrays of category keys as values
 */
function getCategoryGroups() {
  return categoryGroups;
}

/**
 * Get the group a category belongs to
 * @param {string} categoryKey - The category key to find the group for
 * @returns {string} - The group name or 'other' if not found
 */
function getCategoryGroup(categoryKey) {
  for (const [group, categories] of Object.entries(categoryGroups)) {
    if (categories.includes(categoryKey)) {
      return group;
    }
  }
  return "other";
}

module.exports = {
  mapGoogleCategoryToCategoryKey,
  mapGoogleCategoriesToCategoryKeys,
  getAllCategoryKeys,
  getCategoryGroups,
  getCategoryGroup,
};
