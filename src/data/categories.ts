import type { Category } from '../domain/models';
import { colors } from "../theme";

export const expenseCategories: Category[] = [
  { id: "food", label: "Food", icon: "fast-food-outline", color: colors.coral },
  { id: "housing", label: "Housing", icon: "home-outline", color: colors.lavender },
  { id: "transport", label: "Transport", icon: "bus-outline", color: colors.blue },
  { id: "study", label: "Study", icon: "book-outline", color: colors.amber },
  { id: "social", label: "Social", icon: "people-outline", color: "#EE9CC5" },
  { id: "health", label: "Health", icon: "fitness-outline", color: "#7CCFB0" },
  { id: "shopping", label: "Shopping", icon: "bag-handle-outline", color: "#91A6F2" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal", color: colors.soft },
];

export const incomeCategories: Category[] = [
  { id: "salary", label: "Part-time job", icon: "briefcase-outline", color: colors.primary },
  { id: "allowance", label: "Allowance", icon: "gift-outline", color: colors.blue },
  { id: "scholarship", label: "Scholarship", icon: "school-outline", color: colors.lavender },
  { id: "refund", label: "Refund", icon: "return-down-back-outline", color: colors.amber },
  { id: "other-income", label: "Other", icon: "add-circle-outline", color: colors.soft },
];

export const allCategories = [...expenseCategories, ...incomeCategories];

export const categoryById = (id?: string) =>
  allCategories.find((category) => category.id === id) || expenseCategories[7];
