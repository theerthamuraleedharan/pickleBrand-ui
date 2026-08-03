import { useState } from "react";

function Abc() {
  const [value, setValue] = useState(0);

  setValue(value + 1);
}