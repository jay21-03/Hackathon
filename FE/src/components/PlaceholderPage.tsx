
// interface PlaceholderPageProps {
//   title: string;
// }

// export function PlaceholderPage({ title }: PlaceholderPageProps) {
//   return (
//     <section className="card">
//       <h2>{title}</h2>
//       <p>Skeleton page ready for upcoming implementation.</p>
//     </section>
//   );
// }

// import { Link } from "react-router-dom";
// import { Icon } from "./ui/Icon";

// interface PlaceholderPageProps {
//   title: string;
//   description?: string;
// }

// export function PlaceholderPage({ title, description }: PlaceholderPageProps) {

//   return (
//     <div className="glass-panel rounded-xl p-lg max-w-2xl">
//       <div className="flex items-center gap-sm mb-md">
//         <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant">
//           <Icon name="construction" className="text-primary" />
//         </div>
//         <div>
//           <p className="font-label-sm text-on-surface-variant normal-case">Coming soon</p>
//           <h1 className="font-headline-sm text-on-surface">{title}</h1>
//         </div>
//       </div>

//       <p className="font-body-md text-on-surface-variant mb-md">
//         {description ??
//           "Màn hình này sẽ được triển khai theo thiết kế Stitch. UI shell và routing đã sẵn sàng."}
//       </p>

//       {stitchRef && (
//         <p className="font-mono-data text-xs text-outline mb-lg">
//           Stitch reference: <span className="text-primary">{stitchRef}</span>
//         </p>
//       )}

//       <Link
//         to="/events"
//         className="inline-flex items-center gap-1 text-primary font-label-md normal-case"
//       >
//         <Icon name="arrow_back" className="text-[18px]" />
//         Back to Events
//       </Link>
//     </div>
//   );
// }
