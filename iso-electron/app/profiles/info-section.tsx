'use client';

export default function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className='text-lg font-semibold text-gray-800 mb-2'>{title}</h2>
      <div className='space-y-2'>{children}</div>
    </div>
  );
}
