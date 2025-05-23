import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-[#1A1D25]/80 backdrop-blur-md rounded-xl p-6 transition-all duration-300 hover:shadow-glow-sm hover:translate-y-[-5px]">
      <div className="bg-gradient-to-br from-purple-600/20 to-indigo-700/20 p-3 rounded-lg w-fit mb-4">
        <Icon className="w-6 h-6 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
