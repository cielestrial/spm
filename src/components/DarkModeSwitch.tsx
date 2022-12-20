import { Switch, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";
import { MdOutlineLightMode, MdDarkMode } from "react-icons/md";

const DarkModeSwitch = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [checked, setChecked] = useState(colorScheme === "dark");

  return (
    <Switch
      labelPosition="left"
      aria-label="Dark Mode Switch"
      size="lg"
      h="100%"
      color="green"
      checked={checked}
      onChange={(event) => {
        setChecked(event.currentTarget.checked);
        toggleColorScheme();
      }}
      thumbIcon={
        checked ? (
          <MdDarkMode fontSize="1.6em" color="#2b3039" />
        ) : (
          <MdOutlineLightMode fontSize="1.75em" color="forestgreen" />
        )
      }
    />
  );
};

export default DarkModeSwitch;
