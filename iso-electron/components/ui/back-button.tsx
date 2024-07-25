import { Button } from 'primereact/button';
import Link from 'next/link';
type BackButtonProps = {
  title: string;
  href: string;
};
export default function BackButton({ title, href }: BackButtonProps) {
  return (
    <Link href={href} passHref>
      <Button
        icon='pi pi-arrow-left'
        label='Ayarlara dön'
        className='p-button-text p-button-plain'
      >
        {title}
      </Button>
    </Link>
  );
}
