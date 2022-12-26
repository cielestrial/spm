import { keyframes } from "@mantine/core";

export const custom_ease_out = "cubic-bezier(0,0.7,1,1)";

export const fadeIn = keyframes({
  from: { opacity: "0" },
  to: { opacity: "1" },
});

export const shake = (amount: number) =>
  keyframes({
    "0%": { transform: "translateX(0)" },
    "25%": { transform: `translateX(${amount}%)` },
    "50%": { transform: `translateX(-${amount}%)` },
    "75%": { transform: `translateX(${amount}%)` },
    "100%": { transform: "translateX(0)" },
  });

export const slideDown = keyframes({
  from: { transform: "translateY(-100%)", marginBottom: "100%" },
  to: { transform: "translateY(0)", marginBottom: "0" },
});
