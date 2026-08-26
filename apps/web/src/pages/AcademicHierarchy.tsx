import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Building2, BookOpen, GraduationCap, Plus, Users, ChevronRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AcademicHierarchy: React.FC = () => {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/faculties');
        setFaculties(res.data.data || []);
        if (res.data.data?.length > 0) {
          const firstFac = res.data.data[0];
          setSelectedFaculty(firstFac);
          loadCourses(firstFac.id);
        }
      } catch (err) {
        console.error('Error fetching faculties:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadCourses = async (facultyId: string) => {
    try {
      const res = await api.get(`/courses?facultyId=${facultyId}`);
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleSelectFaculty = (fac: any) => {
    setSelectedFaculty(fac);
    loadCourses(fac.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Estrutura Acadêmica</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Hierarquia de Faculdades, Cursos Superiores e Matrizes Curriculares.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Modo Gestor Administrativo</span>
            </span>
          </div>
        )}
      </div>

      {/* Grid: Faculty Selector + Course/Class Hierarchy */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Faculties List */}
        <div className="rounded-2xl bg-[#0f1628]/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Faculdades
            </h2>
            <span className="text-xs text-slate-400">{faculties.length} Registradas</span>
          </div>

          <div className="space-y-2">
            {faculties.map((fac) => (
              <button
                key={fac.id}
                onClick={() => handleSelectFaculty(fac)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedFaculty?.id === fac.id
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-indigo-400">{fac.code}</span>
                  <span className="text-[11px] text-slate-400">{fac.city} - {fac.state}</span>
                </div>
                <div className="font-bold text-sm">{fac.name}</div>
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                  <span>Cursos: {fac._count?.courses || 0}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Courses & Related Classes for Selected Faculty (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0f1628]/80 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Cursos em {selectedFaculty?.name}</span>
                </h2>
                <p className="text-xs text-slate-400">Selecione um curso para ver suas turmas e matrizes.</p>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhum curso cadastrado nesta faculdade.
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
                          {course.code}
                        </span>
                        <h3 className="font-bold text-sm text-slate-100">{course.name}</h3>
                      </div>
                      <span className="text-xs text-slate-400">
                        {course._count?.classes || 0} Turmas Ativas
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {course.description || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Estrutura Curricular Pronta</span>
                      <Link
                        to="/classes"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                      >
                        <span>Acessar Turmas</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
