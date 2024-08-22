import UiWrapper from '@/components/ui/Wrapper';

interface TranscriptionLayoutProps {
  children: React.ReactNode;
}
export default function TranscriptionLayout({
  children,
}: TranscriptionLayoutProps) {
  return <UiWrapper>{children}</UiWrapper>;
}
