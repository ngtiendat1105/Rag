import { User } from 'lucide-react'

interface UserAvatarProps {
  src?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-12 w-12',
}

export default function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[#173f73] ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={`Ảnh đại diện của ${name}`} className="h-full w-full object-cover" />
      ) : (
        <User className={size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      )}
    </div>
  )
}
