import { Group, Text } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";
import { span } from "../api/misc/HelperFunctions";

type proptype = {
  label: string;
  value: number | string | null;
};

const Row = (props: proptype) => {
  const context = useContext(StateContext);
  return (
    <Group spacing={0}>
      <Text miw={span} color={context.theme.primaryColor}>
        {props.label}
      </Text>
      <Text>{props.value}</Text>
    </Group>
  );
};

export default Row;
