export const brandMarkUrl = '/images/legal-ai-logo.svg'

export default function BrandMark({ size, className }: { size: number; className?: string }) {
  return <img src={brandMarkUrl} width={size} height={size} alt="" className={className} />
}
