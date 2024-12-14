import ActionButton from './buttons/ActionButton';

interface RoadmapCardProps {
  phase: string;
  title: string;
  items: string[];
}

export default function RoadmapCard({ phase, title, items }: RoadmapCardProps) {
  return (
    <div className="bg-black/80 rounded-lg p-16">
      <h3 className="font-display text-[#eeff99] text-4xl mb-8">{phase}</h3>
      <h4 className="text-white mb-10 text-xl">{title}</h4>
      <ul className="text-white space-y-8">
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-16">
        <ActionButton>Start</ActionButton>
      </div>
    </div>
  );
}
