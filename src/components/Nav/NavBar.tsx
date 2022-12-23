import Logout from "./Logout";
import { Group } from "@mantine/core";
import DownloadButton from "./DownloadButton";
import DarkModeSwitch from "./DarkModeSwitch";
import PageNavigatorButton from "./PageNavigatorButton";
import NavLogo from "./NavLogo";
import SearchBar from "./SearchBar";
import { useMediaQuery } from "@mantine/hooks";
import { dashboardRefType } from "../../api/SpotifyApiClientTypes";

export const breakpoints = {
  xxs: "288px",
  xs: "500px",
  sm: "800px",
  md: "1000px",
  lg: "1275px",
  xl: "1800px",
};

type propType = {
  dashboardRef: React.RefObject<dashboardRefType>;
};

const NavBar = (props: propType) => {
  const full = "95%";
  const smMediaQuery = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const xsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xs})`);
  const xxsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xxs})`);

  return (
    <Group w={full} h={full} position="apart" align="end" noWrap py={0}>
      <Group h={full} position="left" align="end" noWrap spacing={0}>
        <NavLogo height={full} dashboardRef={props.dashboardRef} />

        {smMediaQuery ? (
          <Group h={full} position="left" noWrap spacing={0}>
            <PageNavigatorButton height={full} />
            <DownloadButton height={full} />
          </Group>
        ) : null}
      </Group>

      {xsMediaQuery ? (
        <Group w={full} h={full} position="apart" noWrap spacing={"md"}>
          <SearchBar dashboardRef={props.dashboardRef} />
          <Logout height={full} />
        </Group>
      ) : null}

      {xxsMediaQuery ? (
        <Group h={full} position="right" align="center" mr="xl" noWrap>
          <DarkModeSwitch />
        </Group>
      ) : null}
    </Group>
  );
};

export default NavBar;
