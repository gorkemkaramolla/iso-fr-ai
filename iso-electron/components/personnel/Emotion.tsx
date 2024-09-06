import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const emotions = [
  "Normal",
  "Mutlu",
  "Üzgün",
  "Şaşırmış",
  "Korkmuş",
  "İğrenmiş",
  "Kızgın",
];
const emotionEmojis = ["😐", "😄", "😢", "😲", "😨", "🤢", "😠"];

interface RecogData {
  _id: string;
  age: number;
  camera: string;
  emotion_0?: number;
  emotion_1?: number;
  emotion_2?: number;
  emotion_3?: number;
  emotion_4?: number;
  emotion_5?: number;
  emotion_6?: number;
  gender: number;
  image_path: string;
  label: string;
  personnel_id: string;
  similarity: number;
  timestamp: number;
}

const EmotionChart: React.FC = () => {
  const [data, setData] = useState<RecogData[]>([]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_UTILS_URL}/personel_last_recog/${id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const result = await response.json();
            const now = new Date();
            const startOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            const endOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() + 1
            );
            const filteredData = result.filter((log: RecogData) => {
              const logDate = new Date(log.timestamp);
              return logDate >= startOfDay && logDate < endOfDay;
            });
            setData(filteredData);
          } else {
            console.error("Error fetching data:", response.statusText);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [id]);

  const aggregateEmotions = (emotionIndex: number) => {
    // Calculate the mean of the emotion values
    const mean =
      data.reduce(
        (acc, item) =>
          acc + Number(item[`emotion_${emotionIndex}` as keyof RecogData]),
        0
      ) / data.length;

    // Apply multipliers based on the mean value
    let adjustedMean = mean;
    if (mean < 0.25) {
      adjustedMean *= 4;
    } else if (mean < 0.33) {
      adjustedMean *= 3;
    } else if (mean < 0.5) {
      adjustedMean *= 2;
    }

    return adjustedMean;
  };

  const chartData = emotions.map((emotion, index) => ({
    emotion: emotion,
    value: aggregateEmotions(index),
    emoji: emotionEmojis[index],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow">
          <p className="text-lg font-semibold">{`${data.emoji} ${data.emotion}`}</p>
          <p className="text-sm">{`Value: ${data.value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] p-4">
      <h3 className="text-2xl font-bold text-center mb-4">
        Günlük Duygu Analizi
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="emotion"
            tick={({ payload, x, y, cx, cy, ...rest }) => (
              <g>
                <text
                  {...rest}
                  x={x}
                  y={y}
                  textAnchor={x > cx ? "start" : "end"}
                  fill="#333"
                  fontSize={12}
                >
                  {payload.value}{" "}
                  {emotionEmojis[emotions.indexOf(payload.value)]}
                </text>
              </g>
            )}
          />
          <PolarRadiusAxis angle={90} domain={[0, 1]} />
          <Radar
            name="Emotions"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionChart;

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import { Line } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const emotions = ["😐", "😄", "😢", "😲", "😨", "🤢", "😠"]; // Emotion labels

// interface RecogData {
//   _id: string;
//   age: number;
//   camera: string;
//   emotion_0?: number;
//   emotion_1?: number;
//   emotion_2?: number;
//   emotion_3?: number;
//   emotion_4?: number;
//   emotion_5?: number;
//   emotion_6?: number;
//   gender: number;
//   image_path: string;
//   label: string;
//   personnel_id: string;
//   similarity: number;
//   timestamp: number;
// }

// const ProfilePage: React.FC = () => {
//   const [data, setData] = useState<RecogData[]>([]);
//   const searchParams = useSearchParams();
//   const id = searchParams.get("id");
//   console.log("id", id);
//   useEffect(() => {
//     const fetchData = async () => {
//       if (id) {
//         try {
//           const response = await fetch(
//             `${process.env.NEXT_PUBLIC_UTILS_URL}/personel_last_recog/${id}`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             }
//           );
//           if (response.ok) {
//             const result = await response.json();
//             console.log("Data fetched:", result);

//             // Filter the data to include only today's logs
//             const now = new Date();
//             const startOfDay = new Date(
//               now.getFullYear(),
//               now.getMonth(),
//               now.getDate()
//             );
//             const endOfDay = new Date(
//               now.getFullYear(),
//               now.getMonth(),
//               now.getDate() + 1
//             );

//             const filteredData = result.filter((log) => {
//               const logDate = new Date(log.timestamp);
//               return logDate >= startOfDay && logDate < endOfDay;
//             });

//             console.log("Filtered data:", filteredData);
//             setData(filteredData);
//           } else {
//             console.error("Error fetching data:", response.statusText);
//           }
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         }
//       }
//     };
//     fetchData();
//   }, [id]);

//   const aggregateEmotions = (emotionIndex: number) => {
//     return (
//       data.reduce(
//         (acc, item) =>
//           acc + Number(item[`emotion_${emotionIndex}` as keyof RecogData]),
//         0
//       ) / data.length
//     );
//   };

//   const emotionValues =
//     data.length > 0
//       ? [
//           aggregateEmotions(0),
//           aggregateEmotions(1),
//           aggregateEmotions(2),
//           aggregateEmotions(3),
//           aggregateEmotions(4),
//           aggregateEmotions(5),
//           aggregateEmotions(6),
//         ]
//       : [];

//   const chartData = {
//     labels: emotions,
//     datasets: [
//       {
//         label: "Average Emotions",
//         data: emotionValues,
//         borderColor: "rgba(75,192,192,1)",
//         backgroundColor: "rgba(75,192,192,0.2)",
//         pointBackgroundColor: "rgba(75,192,192,1)",
//         pointBorderColor: "#fff",
//         pointHoverBackgroundColor: "#fff",
//         pointHoverBorderColor: "rgba(75,192,192,1)",
//         fill: true,
//       },
//     ],
//   };

//   return (
//     <div>
//       {data.length > 0 && (
//         <>
//           <div>
//             <h3>Emotion Graph</h3>
//             <Line data={chartData} />
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default ProfilePage;
