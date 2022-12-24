import { ColorScheme, MantineThemeOverride } from "@mantine/core";

export const myThemeWrapper = (colorScheme: ColorScheme) => {
  const myTheme: MantineThemeOverride = {
    colorScheme: colorScheme,
    primaryColor: colorScheme === "dark" ? "green" : "blue",
    primaryShade: { light: 4, dark: 8 },
    colors: {
      dark: [
        "#f1f3f5",
        "#A6A7AB",
        "#909296",
        "#5C5F66",
        "#373A40",
        "#2C2E33",
        "#25262B",
        "#1A1B1E",
        "#141517",
        "#101113",
      ],
    },
    fontFamily: "Arial, Helvetica, system-ui, sans-serif",
    headings: { fontFamily: "Tahoma, system-ui, sans-serif" },
    focusRing: "auto",
    respectReducedMotion: true,
    loader: "bars",
    components: {
      TextInput: {
        styles: {
          label: {
            marginLeft: "0.33rem", // same as border-radius
          },
        },
      },
      NativeSelect: {
        styles: {
          label: { marginLeft: "0.33rem" }, // Same as border-radius
        },
      },
    },
  };
  return myTheme;
};
