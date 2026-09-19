import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Film,
  HeartPulse,
  BookOpen,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  LucideIcon,
  Tag,
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Film,
  HeartPulse,
  BookOpen,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
};

export const CategoryIcon = ({ iconName, className = 'w-5 h-5' }: CategoryIconProps) => {
  const IconComponent = iconMap[iconName] || Tag;
  return <IconComponent className={className} />;
};
