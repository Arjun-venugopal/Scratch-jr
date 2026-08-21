import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <header className="mb-12 animate-bounce">
        <h1 className="text-6xl font-black text-blue-500 drop-shadow-md">
          LogicBox <span className="text-orange-500">Jr</span>
        </h1>
        <p className="mt-4 text-2xl font-bold text-slate-600">
          Code, create, and play!
        </p>
      </header>

      <main className="flex flex-col gap-6 w-full max-w-md">
        <Link 
          href="/editor/new"
          className="w-full bg-green-500 hover:bg-green-400 text-white font-black text-3xl py-6 px-8 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
        >
          <span className="text-4xl">🚀</span>
          Start Coding!
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/login"
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold text-xl py-4 rounded-2xl shadow-lg transition-transform hover:scale-105"
          >
            Parents
          </Link>
          <Link
            href="/login?role=teacher"
            className="bg-orange-500 hover:bg-orange-400 text-white font-bold text-xl py-4 rounded-2xl shadow-lg transition-transform hover:scale-105"
          >
            Teachers
          </Link>
        </div>
      </main>

      <div className="mt-20">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-8 border-4 border-yellow-400">
          <h2 className="text-3xl font-black text-blue-500 mb-4">Your Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-video bg-blue-100 rounded-2xl flex items-center justify-center text-blue-300 font-bold border-4 border-dashed border-blue-300 cursor-pointer hover:bg-blue-200 transition-colors">
              + New Project
            </div>
            {/* Placeholder for projects */}
          </div>
        </div>
      </div>
    </div>
  );
}
