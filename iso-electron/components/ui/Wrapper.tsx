export default function UiWrapper({ children }: { children: React.ReactNode }) {
  return <div className='container  mx-auto max-w-9xl p-4'>{children}</div>;
}
