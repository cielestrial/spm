import { ScrollArea, ScrollAreaStylesParams, Styles } from "@mantine/core";
import { debounceWaitTime } from "../api/SpotifyApiClientData";

type propType = {
  maxHeight: string | number;
  type: "auto" | "always" | "scroll" | "hover" | "never";
  styles?:
    | Styles<
        "scrollbar" | "root" | "viewport" | "thumb" | "corner",
        ScrollAreaStylesParams
      >
    | undefined;
  children: React.ReactNode;
};

const MyScrollArea = (props: propType) => {
  return (
    <ScrollArea.Autosize
      maxHeight={props.maxHeight}
      type={props.type}
      offsetScrollbars
      scrollbarSize={8}
      scrollHideDelay={debounceWaitTime}
      styles={(theme) => ({
        ...props.styles,
        scrollbar: {
          '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.green
                : theme.colors.blue[5],
          },
          '&[data-orientation="horizontal"] .mantine-ScrollArea-thumb': {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.green
                : theme.colors.blue[5],
          },
          "&, &:hover": {
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[1],
          },
        },
        corner: {
          opacity: 1,
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[6]
              : theme.colors.gray[1],
        },
      })}
    >
      {props.children}
    </ScrollArea.Autosize>
  );
};

export default MyScrollArea;
