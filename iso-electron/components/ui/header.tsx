type Props = {
  title: string;
};
export default function Header({ title }: Props) {
  return (
    <h1 className='text-2xl font-bold break-words whitespace-pre-wrap mb-4 text-gray-600 hover:text-gray-700 transition-all'>
      {title}
    </h1>
  );
}
