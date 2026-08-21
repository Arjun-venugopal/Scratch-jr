'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';

export default function SceneSidebar() {
  const { scenes, activeSceneId, setActiveScene, addScene, removeScene } = useProjectStore();

  return (
    <div className="w-28 bg-orange-50 border-r-4 border-orange-200 flex flex-col items-center py-3 gap-3 overflow-y-auto">
      <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Scenes</h3>

      {scenes.map((scene, idx) => (
        <div
          key={scene.id}
          onClick={() => setActiveScene(scene.id)}
          className={`w-20 h-14 rounded-xl flex items-center justify-center font-bold text-xs relative cursor-pointer transition-all group
            ${scene.id === activeSceneId
              ? 'bg-white border-4 border-orange-500 shadow-md text-orange-500 scale-105'
              : 'bg-orange-100 border-2 border-orange-300 text-orange-400 hover:border-orange-400'
            }`}
        >
          <span className="absolute -top-2 -left-2 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
            {idx + 1}
          </span>
          {scene.name}

          {/* Delete button (hidden for last scene) */}
          {scenes.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeScene(scene.id); }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center text-[10px] hidden group-hover:flex transition-all"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      ))}

      <button
        onClick={addScene}
        className="w-20 h-14 bg-orange-100 hover:bg-orange-200 rounded-xl border-3 border-dashed border-orange-400 flex items-center justify-center text-orange-500 transition-colors"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
}
