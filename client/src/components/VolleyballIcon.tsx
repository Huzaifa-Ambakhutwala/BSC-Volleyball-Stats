import bscLogo from "@assets/BSC Logo (1).png";

interface VolleyballIconProps {
  className?: string;
}

const VolleyballIcon = ({ className = "" }: VolleyballIconProps) => {
  return (
    <img 
      src={bscLogo}
      alt="BSC Sports Club Logo"
      className={className}
    />
  );
};

export default VolleyballIcon;
