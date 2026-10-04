import type { TextStyle } from 'react-native';
import { colors } from "./theme";
import { Platform } from "react-native";

export { colors };

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
};

export const shadow = Platform.select({
  web: {
    boxShadow: "0 8px 16px rgba(22, 51, 38, 0.08)",
  },
  default: {
    shadowColor: "#163326",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});

export const type = {
  title: { fontSize: 32, lineHeight: 38, fontWeight: "800", color: colors.ink },
  h1: { fontSize: 25, lineHeight: 31, fontWeight: "800", color: colors.ink },
  h2: { fontSize: 18, lineHeight: 24, fontWeight: "800", color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  small: { fontSize: 13, lineHeight: 18, color: colors.muted },
} satisfies Record<string, TextStyle>;
