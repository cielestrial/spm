import { MantineThemeOverride } from "@mantine/core";

export const myTheme: MantineThemeOverride = {
  colorScheme: "dark",
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
