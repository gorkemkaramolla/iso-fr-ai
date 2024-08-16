export default function UiWrapper({ children }: { children: React.ReactNode }) {
  return <div className='  mx-auto max-w-8xl p-4'>{children}</div>;
}
