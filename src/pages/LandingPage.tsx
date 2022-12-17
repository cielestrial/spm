import Login from "../components/Login";
import { useContext, useEffect } from "react";
import { getCode } from "../App";
import { StateContext } from "../api/ContextProvider";

export let code: string | null;
export const setCode = (newCode: string | null) => {
  code = newCode;
};

const LandingPage = () => {
  const context = useContext(StateContext);
  useEffect(() => {
    if (getCode() !== null) {
      setCode(getCode());
      context.navigate.current("/loading");
    }
  }, []);

  return (
    <div className="background center">
      <p className="title center">Welcome to YSPM</p>
      <Login />
    </div>
  );
};

export default LandingPage;
