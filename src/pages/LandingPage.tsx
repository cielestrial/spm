import Login from "../components/Login";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCode } from "../App";

export let code: string | null;
export const setCode = (newCode: string | null) => {
  code = newCode;
};

const LandingPage = () => {
  const navigate = useRef(useNavigate());

  useEffect(() => {
    if (getCode() !== null) {
      setCode(getCode());
      navigate.current("/dashboard");
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
