// import React from 'react';
// import useSystemInfo from '@/hooks/useSystemInfo';
// import DraggableWrapper from '@/components/utility/DraggableWrapper';
// import { Move } from 'lucide-react';
// import Image from 'next/image';

// function MonitorWidget() {
//   const { systemInfo } = useSystemInfo();

//   return (
//     <ul className='menu w-full  '>
//       <li>
//         <span>CPU</span>
//         <ul>
//           <li>
//             <span>Temperature: {systemInfo.cpu_temperature}</span>
//           </li>
//           <li>
//             <span>Usage: {systemInfo.cpu_usage}</span>
//           </li>
//         </ul>
//       </li>
//       <li>
//         <span>GPU</span>
//         <ul>
//           <li>
//             <span>Temperature: {systemInfo.gpu_temperature}</span>
//           </li>
//           <li>
//             <span>Usage: {systemInfo.gpu_usage}</span>
//           </li>
//         </ul>
//       </li>
//       <li>
//         <span>Memory</span>
//         <ul>
//           <li>
//             <span>Usage: {systemInfo.memory_usage}</span>
//           </li>
//         </ul>
//       </li>
//       <li>
//         <span>GPU Memory Usage</span>
//         <ul>
//           <li>
//             <span>Usage: {systemInfo.gpu_memory_usage}</span>
//           </li>
//         </ul>
//       </li>
//     </ul>
//   );
// }

// export default MonitorWidget;
