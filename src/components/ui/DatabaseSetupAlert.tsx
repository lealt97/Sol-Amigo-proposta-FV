import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface DatabaseSetupAlertProps {
  error: any;
  resourceName?: string;
}

export function DatabaseSetupAlert({ error, resourceName = 'dados' }: DatabaseSetupAlertProps) {
  const isMissingTable = error?.code === 'PGRST205' || error?.message?.includes('schema cache');
  const isRLSError = error?.message?.includes('row-level security policy') || error?.message?.includes('RLS');

  if (isMissingTable || isRLSError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg text-center max-w-2xl mx-auto my-8">
        <Database className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-800 mb-2">Banco de dados não inicializado</h3>
        <p className="text-red-700 mb-4">
          Não foi possível carregar ou salvar {resourceName} porque as tabelas ou políticas de segurança (RLS) estão faltando no Supabase.
        </p>
        <div className="bg-brand-surface p-4 rounded border border-red-100 text-left w-full shadow-sm">
          <p className="font-medium text-brand-dark mb-2 text-sm">Para corrigir isso, siga estes passos:</p>
          <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
            <li>Abra o painel do seu projeto no <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Supabase</a>.</li>
            <li>Vá para a seção <strong>SQL Editor</strong> no menu esquerdo.</li>
            <li>Clique em <strong>New Query</strong>.</li>
            <li>Copie o conteúdo do arquivo <code className="bg-gray-100 px-1 rounded">supabase-schema.sql</code> que está na raiz do projeto.</li>
            <li>Cole no SQL Editor e clique em <strong>Run</strong>.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg text-center my-8">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar {resourceName}</h3>
      <p className="text-red-700">
        {error?.message || 'Ocorreu um erro desconhecido ao tentar acessar o banco de dados.'}
      </p>
    </div>
  );
}
