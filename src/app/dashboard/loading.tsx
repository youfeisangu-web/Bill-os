export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-billia-blue/20 border-t-billia-blue rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-billia-text-muted">読み込み中...</p>
      </div>
    </div>
  );
}
