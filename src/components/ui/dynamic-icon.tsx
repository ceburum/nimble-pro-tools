import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

// Simple icon map for commonly used icons
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Briefcase: LucideIcons.Briefcase,
  Scissors: LucideIcons.Scissors,
  Heart: LucideIcons.Heart,
  Dog: LucideIcons.Dog,
  Dumbbell: LucideIcons.Dumbbell,
  Camera: LucideIcons.Camera,
  GraduationCap: LucideIcons.GraduationCap,
  CakeSlice: LucideIcons.CakeSlice,
  ChefHat: LucideIcons.ChefHat,
  PartyPopper: LucideIcons.PartyPopper,
  Wrench: LucideIcons.Wrench,
  Droplet: LucideIcons.Droplet,
  Zap: LucideIcons.Zap,
  Thermometer: LucideIcons.Thermometer,
  Paintbrush: LucideIcons.Paintbrush,
  Trees: LucideIcons.Trees,
  Flower: LucideIcons.Flower,
  Sparkles: LucideIcons.Sparkles,
  Car: LucideIcons.Car,
  Monitor: LucideIcons.Monitor,
  Truck: LucideIcons.Truck,
  Pen: LucideIcons.Pen,
  Music: LucideIcons.Music,
  Palette: LucideIcons.Palette,
  Home: LucideIcons.Home,
  FileSignature: LucideIcons.FileSignature,
  FileText: LucideIcons.FileText,
};

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // Convert icon name to PascalCase if needed
  const iconName = name
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

  const Icon = iconMap[iconName];

  if (!Icon) {
    // Fallback to a default icon
    return <LucideIcons.Briefcase {...props} />;
  }

  return <Icon {...props} />;
}
