export const subscriptionCatalog = [
  {
    id: "netflix",
    name: "Netflix",
    icon: "play",
    color: "#E84B4B",
    category: "entertainment",
    suggestedAmount: 13.99,
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: "musical-notes",
    color: "#32B86B",
    category: "entertainment",
    suggestedAmount: 5.99,
  },
  {
    id: "youtube",
    name: "YouTube Premium",
    icon: "logo-youtube",
    color: "#F04D45",
    category: "entertainment",
    suggestedAmount: 7.99,
  },
  {
    id: "apple-music",
    name: "Apple Music",
    icon: "musical-note",
    color: "#F56A8A",
    category: "entertainment",
    suggestedAmount: 5.99,
  },
  {
    id: "disney",
    name: "Disney+",
    icon: "sparkles",
    color: "#536EE8",
    category: "entertainment",
    suggestedAmount: 9.99,
  },
  {
    id: "icloud",
    name: "iCloud+",
    icon: "cloud",
    color: "#5C9CF2",
    category: "cloud",
    suggestedAmount: 0.99,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "chatbubbles",
    color: "#2D8C72",
    category: "productivity",
    suggestedAmount: 23,
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    icon: "apps",
    color: "#E07A3E",
    category: "productivity",
    suggestedAmount: 6.99,
  },
  {
    id: "adobe",
    name: "Adobe Creative",
    icon: "color-palette",
    color: "#E45762",
    category: "study",
    suggestedAmount: 19.99,
  },
  {
    id: "notion",
    name: "Notion",
    icon: "document-text",
    color: "#323A36",
    category: "productivity",
    suggestedAmount: 4,
  },
  {
    id: "gym",
    name: "Gym membership",
    icon: "barbell",
    color: "#B57BE8",
    category: "health",
    suggestedAmount: 25,
  },
  {
    id: "other",
    name: "Something else",
    icon: "add",
    color: "#708078",
    category: "other",
    suggestedAmount: 0,
  },
];

export const subscriptionCategories = [
  { id: "entertainment", label: "Entertainment", icon: "film-outline" },
  { id: "productivity", label: "Productivity", icon: "flash-outline" },
  { id: "study", label: "Study", icon: "school-outline" },
  { id: "cloud", label: "Cloud", icon: "cloud-outline" },
  { id: "health", label: "Health", icon: "fitness-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal" },
];

export const serviceById = (id) =>
  subscriptionCatalog.find((service) => service.id === id) ||
  subscriptionCatalog[subscriptionCatalog.length - 1];

export const subscriptionCategoryById = (id) =>
  subscriptionCategories.find((category) => category.id === id) ||
  subscriptionCategories[subscriptionCategories.length - 1];
