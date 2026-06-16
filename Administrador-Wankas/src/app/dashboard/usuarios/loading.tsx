import { Loader } from '@/components/ui/loader';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-15rem)] w-full">
      <Loader text="Cargando usuarios..." size={48} />
    </div>
  );
}
