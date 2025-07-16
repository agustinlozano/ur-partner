import React from "react";

const CopyrightYear: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <span className="font-mono text-xs text-gradient">Couples.gg | {year}</span>
  );
};

export default CopyrightYear;
