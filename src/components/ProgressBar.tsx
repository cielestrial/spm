import { Progress } from "@mantine/core";
import { useState } from "react";

type proptype = {};
const ProgressBar = (props: proptype) => {
  const [percentage, setPercentage] = useState(0);
  return (
    <Progress
      value={percentage}
      label={percentage + "%"}
      // color="green"
      size="xl"
      radius="xl"
      animate
    />
  );
};

export default ProgressBar;
