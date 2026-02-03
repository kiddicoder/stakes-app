import { MD3LightTheme, type Theme } from "react-native-paper";

export const appTheme: Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#0B3D91",
    secondary: "#F29F05",
    background: "#F2EFEA",
    surface: "#FFFFFF",
    onPrimary: "#FFFFFF",
    onSecondary: "#1D1D1D"
  }
};
