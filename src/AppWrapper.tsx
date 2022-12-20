import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { BrowserRouter } from "react-router-dom";
import { StateProvider } from "./api/ContextProvider";
import App from "./App";
import { myTheme } from "./css/Theme";

const AppWrapper = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: preferredColorScheme,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  myTheme.colorScheme = colorScheme;

  return (
    <BrowserRouter>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          theme={myTheme}
          withGlobalStyles
          withNormalizeCSS
          withCSSVariables
        >
          <StateProvider>
            <App />
          </StateProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </BrowserRouter>
  );
};

export default AppWrapper;
