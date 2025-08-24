export default function PoweredByStatic() {
  return (
    <div
      className="group absolute top-0 left-0 w-64 h-64 md:block z-10 hidden shape-top-left-corner overflow-hidden bg-gradient-to-br from-green-600 to-blue-600"
      aria-label="Powered by Static Architecture"
    >
      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>

      <div className="absolute inset-0 flex p-6">
        <div className="flex flex-col gap-1 items-center">
          <span className="font-system font-medium uppercase tracking-wider text-white">
            Migrated to
          </span>
          <div className="text-white font-bold text-lg">
            Static<br/>Architecture
          </div>
          <div className="text-xs text-white mt-2">
            ✅ DuckDB-WASM<br/>
            ✅ PGLite<br/>
            ✅ Serverless
          </div>
        </div>
      </div>
    </div>
  );
}
