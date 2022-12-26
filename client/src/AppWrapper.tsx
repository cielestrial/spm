import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { BrowserRouter } from "react-router-dom";
import { StateProvider } from "./api/ContextProvider";
import App from "./App";
import { myThemeWrapper } from "./css/Theme";

const AppWrapper = () => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: preferredColorScheme,
  });

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter>
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <MantineProvider
          theme={myThemeWrapper(colorScheme)}
          withGlobalStyles
          withNormalizeCSS
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
