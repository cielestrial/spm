import { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Burger,
  Drawer,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import DarkModeSwitch from "./DarkModeSwitch";
import DownloadButton from "./DownloadButton";
import Logout from "./Logout";
import PageNavigatorButton from "./PageNavigatorButton";
import SearchBar from "./SearchBar";
import { dashboardRefType } from "../../pages/Dashboard";
import { StateContext } from "../../api/ContextProvider";
import { useMediaQuery } from "@mantine/hooks";
import { breakpoints } from "./NavBar";

type propType = {
  height: string | number;
  dashboardRef: React.RefObject<dashboardRefType>;
};

const NavLogo = (props: propType) => {
  const context = useContext(StateContext);
  const [opened, setOpened] = useState(false);
  const smMediaQuery = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const xsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xs})`);
  const xxsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xxs})`);
  const navItemHeight = undefined;
  const color =
    context.theme.colorScheme === "dark"
      ? context.theme.colors.green[5]
      : context.theme.colors.blue[5];
  const gradientColor =
    context.theme.colorScheme === "dark"
      ? {
          from: context.theme.colors.green[8],
          to: context.theme.colors.dark[3],
          deg: 30,
        }
      : {
          from: context.theme.colors.blue[4],
          to: context.theme.colors.gray[3],
          deg: 30,
        };

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
            h={props.height}
            size="md"
            opened={opened}
            onClick={() => setOpened((prev) => !prev)}
          ></Burger>
        )}
        <Title variant="gradient" gradient={gradientColor} order={2}>
          {"YSPM"}
        </Title>
        <Avatar
          variant="gradient" //light or gradient
          gradient={gradientColor}
          radius="xl"
          size={45}
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
        shadow={"0.33rem 0 1rem 0" + context.theme.colors.gray[9]}
        size="sm"
        target=".App"
        styles={(theme) => ({
          closeButton: {
            color: color,
            margin: "1.5rem 1.5rem 0 0",
          },
          drawer: {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.colors.gray[0],
          },
        })}
      >
        <Stack
          miw="max-content"
          h={props.height}
          justify="start"
          align="stretch"
          spacing={"sm"}
        >
          {xsMediaQuery ? null : (
            <Stack align="center" spacing="xs">
              <SearchBar dashboardRef={props.dashboardRef} />
            </Stack>
          )}
          {xxsMediaQuery ? null : (
            <Stack align="center" spacing="xs">
              <DarkModeSwitch />
            </Stack>
          )}
          <PageNavigatorButton height={navItemHeight} />
          <DownloadButton height={navItemHeight} />
          {xsMediaQuery ? null : <Logout height={navItemHeight} />}
        </Stack>
      </Drawer>
    </>
  );
};

export default NavLogo;
