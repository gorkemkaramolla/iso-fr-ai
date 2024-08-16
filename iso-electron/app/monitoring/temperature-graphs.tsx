type Props = {
  host_cpu_temp: string;
  host_gpu_temp: string;
};
export default function TemparatureGraphs({
  host_cpu_temp,
  host_gpu_temp,
}: Props) {
  return (
    <div className='w-full  bg-white shadow-lg rounded-lg p-4'>
      <h2 className='text-xl font-semibold mb-4'>
        İşlemci & Ekran kartı Sıcaklıkları
      </h2>
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-medium mb-2'>İşlemci Sıcaklığı</h3>

          {host_cpu_temp !== 'N/A'
            ? 'İşlemci Sıcaklığı: ' + host_cpu_temp + '°C'
            : 'İşlemci Sıcaklığı: Bilgi Yok'}
        </div>
        <div>
          <h3 className='text-lg font-medium mb-2'>Ekran kartı Sıcaklığı</h3>

          {host_cpu_temp !== 'N/A'
            ? 'Ekran Kartı Sıcaklığı: ' + host_cpu_temp + '°C'
            : 'Ekran Kartı Sıcaklığı: Bilgi Yok'}
        </div>
      </div>
    </div>
  );
}
