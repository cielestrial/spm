import { useContext, useEffect, useState } from "react";
import { Avatar, Burger, Drawer, Group, Stack, Text } from "@mantine/core";
import DarkModeSwitch from "./DarkModeSwitch";
import DownloadButton from "./DownloadButton";
import Logout from "./Logout";
import PageNavigatorButton from "./PageNavigatorButton";
import SearchBar from "./SearchBar";
import { dashboardRefType } from "../pages/Dashboard";
import { StateContext } from "../api/ContextProvider";
import { useMediaQuery } from "@mantine/hooks";
import { breakpoints } from "./NavBar";

type propType = {
  height: string | number;
  dashboardRef: React.RefObject<dashboardRefType>;
};

const NavLogo = (props: propType) => {
  const context = useContext(StateContext);
  const [opened, setOpened] = useState(false);
  const navItemHeight = undefined;

  const smMediaQuery = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const xsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xs})`);
  const xxsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xxs})`);

  useEffect(() => {
    hideSideNav();
  }, [context.currentPage]);

  const hideSideNav = () => {
    if (opened) setOpened(false);
    return null;
  };

  return (
    <>
      <Group ml="xl" mr="xs" h="100%" position="left" noWrap spacing={"xs"}>
        {smMediaQuery ? (
          hideSideNav()
        ) : (
          <Burger
            color="forestgreen"
            h={props.height}
            size="md"
            opened={opened}
            onClick={() => setOpened((prev) => !prev)}
          ></Burger>
        )}
        <Text color="green" size={25} fw="bolder">
          {"YSPM"}
        </Text>
        <Avatar
          radius="xl"
          size={45}
          color="green"
          src={context.userInfo?.display_image}
          alt={
            context.userInfo?.display_name !== undefined &&
            context.userInfo.display_name !== null
              ? context.userInfo.display_name
              : "Anonymous"
          }
        >
          {context.userInfo?.display_name !== undefined &&
          context.userInfo.display_name !== null ? (
            <Text size="xl">
              {context.userInfo.display_name.charAt(0).toUpperCase()}
            </Text>
          ) : null}
        </Avatar>
      </Group>

      <Drawer
        withCloseButton={true}
        opened={opened}
        onClose={() => setOpened(false)}
        position="left"
        padding={0}
        size="sm"
        target=".App"
        styles={(theme) => ({
          closeButton: {
            margin: "1.5rem 1.5rem 0 0",
          },
        })}
      >
        <Stack
          miw="max-content"
          h={props.height}
          justify="start"
          align="stretch"
          spacing={0}
        >
          {xsMediaQuery ? null : (
            <Stack align="center" spacing="xs">
              <SearchBar dashboardRef={props.dashboardRef} />
            </Stack>
          )}
          <DownloadButton height={navItemHeight} />
          <PageNavigatorButton height={navItemHeight} />
          {xsMediaQuery ? null : <Logout height={navItemHeight} />}
          {xxsMediaQuery ? null : (
            <Stack align="center" spacing="xs">
              <DarkModeSwitch />
            </Stack>
          )}
        </Stack>
      </Drawer>
    </>
  );
};

export default NavLogo;
