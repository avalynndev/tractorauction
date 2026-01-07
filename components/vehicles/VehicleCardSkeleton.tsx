import Skeleton from "@/components/ui/Skeleton";

export default function VehicleCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton height={192} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton height={24} width="80%" />
        <div className="space-y-2">
          <Skeleton height={16} width="60%" />
          <Skeleton height={16} width="70%" />
          <Skeleton height={16} width="50%" />
        </div>
        <Skeleton height={40} width="100%" />
      </div>
    </div>
  );
}





















