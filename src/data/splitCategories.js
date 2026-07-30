export const splitCategories = [
  { id: "rent", label: "Rent", icon: "home", color: "#9B78D1" },
  { id: "groceries", label: "Groceries", icon: "basket", color: "#E47A68" },
  { id: "food", label: "Food", icon: "restaurant", color: "#E99B54" },
  { id: "trip", label: "Trip", icon: "airplane", color: "#5D87D7" },
  { id: "utilities", label: "Utilities", icon: "flash", color: "#D7A53E" },
  { id: "tickets", label: "Tickets", icon: "ticket", color: "#D0668F" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal", color: "#708078" },
];

export const splitCategoryById = (id) =>
  splitCategories.find((category) => category.id === id) ||
  splitCategories[splitCategories.length - 1];
