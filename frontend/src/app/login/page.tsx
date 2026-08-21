'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'parent';

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { name, email, password, role: defaultRole });
        login(res.data, res.data.token);
      } else {
        const res = await api.post('/auth/login', { email, password });
        login(res.data, res.data.token);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-400">
      <h1 className="text-3xl font-black text-blue-500 text-center mb-6">
        {isRegister ? '🎨 Create Account' : '👋 Welcome Back!'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-sm font-bold text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            className="w-full p-4 border-3 border-blue-300 rounded-2xl text-lg font-bold focus:border-blue-500 focus:outline-none transition-colors"
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          className="w-full p-4 border-3 border-blue-300 rounded-2xl text-lg font-bold focus:border-blue-500 focus:outline-none transition-colors"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-4 border-3 border-blue-300 rounded-2xl text-lg font-bold focus:border-blue-500 focus:outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-black text-xl py-4 rounded-2xl shadow-lg transition-all hover:scale-105"
        >
          {loading ? '...' : isRegister ? 'Create Account' : 'Login'}
        </button>
      </form>

      <button
        onClick={() => { setIsRegister(!isRegister); setError(''); }}
        className="w-full mt-4 text-blue-500 font-bold hover:underline text-center"
      >
        {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border-4 border-blue-400 text-center">
          <div className="text-2xl font-black text-blue-400 animate-pulse">Loading...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
