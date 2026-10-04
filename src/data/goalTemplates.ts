import type { IconName } from '../domain/models';
export const goalTemplates: { id: string; name: string; icon: IconName; color: string; suggestedTarget: number; description: string }[] = [
  {
    id: "emergency",
    name: "Emergency cushion",
    icon: "shield-checkmark",
    color: "#4FA982",
    suggestedTarget: 500,
    description: "A buffer for surprise costs",
  },
  {
    id: "laptop",
    name: "New laptop",
    icon: "laptop",
    color: "#5D82D8",
    suggestedTarget: 900,
    description: "Save for your next study setup",
  },
  {
    id: "travel",
    name: "Student trip",
    icon: "airplane",
    color: "#E58C5B",
    suggestedTarget: 600,
    description: "Build a travel fund gradually",
  },
  {
    id: "tuition",
    name: "Tuition & books",
    icon: "school",
    color: "#9972D9",
    suggestedTarget: 1200,
    description: "Prepare for the next semester",
  },
  {
    id: "moving",
    name: "Moving fund",
    icon: "home",
    color: "#D16B7B",
    suggestedTarget: 800,
    description: "Deposit, furniture, and setup",
  },
  {
    id: "other",
    name: "My own goal",
    icon: "flag",
    color: "#708078",
    suggestedTarget: 0,
    description: "Create something personal",
  },
];

export const goalTemplateById = (id?: string) =>
  goalTemplates.find((template) => template.id === id) ||
  goalTemplates[goalTemplates.length - 1];
