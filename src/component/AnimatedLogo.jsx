import React from "react";

const letters = [
  { value: "F", x: "-34px", y: "10px", rotate: "-8deg" },
  { value: "L", x: "-24px", y: "-14px", rotate: "6deg" },
  { value: "A", x: "-16px", y: "12px", rotate: "-5deg" },
  { value: "W", x: "-8px", y: "-10px", rotate: "4deg" },
  { value: "L", x: "8px", y: "12px", rotate: "-5deg" },
  { value: "E", x: "18px", y: "-14px", rotate: "6deg" },
  { value: "Z", x: "28px", y: "10px", rotate: "-8deg" },
];

export default function AnimatedLogo() {
  return (
    <div className="animated-brand" aria-hidden="true">
      <img src="/Flawlez5.png" alt="" className="animated-brand-icon" />

      <div className="animated-brand-stage">
        <span className="animated-brand-glow" />

        <div className="animated-brand-build">
          {letters.map((letter, index) => (
            <span
              key={`${letter.value}-${index}`}
              style={{
                "--letter-x": letter.x,
                "--letter-y": letter.y,
                "--letter-rotate": letter.rotate,
              }}
            >
              {letter.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
