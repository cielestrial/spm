import { Group, Text } from "@mantine/core";
import { span } from "../api/misc/HelperFunctions";

type proptype = {
  label: string;
  value: number | string | null;
};

const Row = (props: proptype) => {
  return (
    <Group spacing={0}>
      <Text miw={span} color={"green"}>
        {props.label}
      </Text>
      <Text>{props.value}</Text>
    </Group>
  );
};

export default Row;
