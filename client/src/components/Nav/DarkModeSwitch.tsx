import { Switch, useMantineColorScheme } from "@mantine/core";
import { useContext, useState } from "react";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { StateContext } from "../../api/ContextProvider";

const DarkModeSwitch = () => {
  const context = useContext(StateContext);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [checked, setChecked] = useState(colorScheme === "light");

  return (
    <Switch
      color={"gray.2"}
      labelPosition="left"
      aria-label="Dark Mode Switch"
      size="lg"
      h="60px"
      checked={checked}
      onChange={(event) => {
        setChecked(event.currentTarget.checked);
        toggleColorScheme();
      }}
      thumbIcon={
        !checked ? (
          <MdDarkMode fontSize="1.6em" color={context.theme.colors.green[7]} />
        ) : (
          <MdLightMode fontSize="1.75em" color={context.theme.colors.blue[4]} />
        )
      }
      styles={(theme) => ({
        thumb: {
          border: "none",
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[5]
              : theme.colors.gray[0],
        },
      })}
    />
  );
};

export default DarkModeSwitch;
