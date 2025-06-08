interface SimpleStatCardProps {
  title: string;
  value: number;
  bgColor: string;
  emoji: string;
}

const SimpleStatCard = ({ title, value, bgColor, emoji }: SimpleStatCardProps) => {
  return (
    <div className={`${bgColor} text-white rounded-lg p-4 flex items-center`}>
      <span className="text-2xl mr-3">{emoji}</span>
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default SimpleStatCard;