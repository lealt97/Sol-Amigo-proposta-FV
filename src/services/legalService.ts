import type { User } from '@supabase/supabase-js';
import {
  LEGAL_DOCUMENTS,
  REQUIRED_LEGAL_ACCEPTANCES,
  type LegalDocumentType,
} from '../lib/legal/legalCatalog';
import { supabase } from '../lib/supabase/client';

export interface LegalStatusDocument {
  document_type: LegalDocumentType;
  version: string;
  title: string;
  review_status: 'draft' | 'legal_review' | 'approved' | 'retired';
  accepted: boolean;
}

export interface LegalStatus {
  complete: boolean;
  documents: LegalStatusDocument[];
}

type LegalAcceptanceMetadata = {
  document_type?: unknown;
  version?: unknown;
};

function metadataAcceptances(user: User | null): LegalAcceptanceMetadata[] {
  const value = user?.user_metadata?.legal_acceptances;
  return Array.isArray(value) ? value : [];
}

function buildMetadataStatus(user: User | null): LegalStatus {
  const accepted = metadataAcceptances(user);
  const documents = REQUIRED_LEGAL_ACCEPTANCES.map((required) => {
    const definition = LEGAL_DOCUMENTS[required.document_type];
    const isAccepted = accepted.some((item) => (
      item?.document_type === required.document_type
      && item?.version === required.version
    ));

    return {
      document_type: required.document_type,
      version: required.version,
      title: definition.title,
      review_status: definition.reviewStatus,
      accepted: isAccepted,
    } satisfies LegalStatusDocument;
  });

  return {
    complete: documents.every((document) => document.accepted),
    documents,
  };
}

async function getAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

async function readDatabaseStatus(): Promise<LegalStatus> {
  const { data, error } = await supabase.rpc('get_my_legal_status');
  if (error) throw error;

  return {
    complete: data?.complete === true,
    documents: Array.isArray(data?.documents) ? data.documents : [],
  };
}

async function writeDatabaseAcceptances() {
  const { data, error } = await supabase.rpc('accept_current_legal_documents');
  if (error) throw error;
  return data;
}

async function persistAcceptanceMetadata() {
  const { data, error } = await supabase.auth.updateUser({
    data: { legal_acceptances: REQUIRED_LEGAL_ACCEPTANCES },
  });
  if (error) throw error;
  return data.user;
}

export const legalService = {
  async getMyStatus(): Promise<LegalStatus> {
    const user = await getAuthenticatedUser();
    const metadataStatus = buildMetadataStatus(user);

    try {
      const databaseStatus = await readDatabaseStatus();
      if (databaseStatus.complete || !metadataStatus.complete) return databaseStatus;

      // Contas criadas enquanto a RPC ainda não estava publicada possuem o aceite
      // no metadata do Auth. Quando o banco estiver disponível, sincronizamos sem
      // bloquear o primeiro acesso.
      try {
        await writeDatabaseAcceptances();
        return await readDatabaseStatus();
      } catch (syncError) {
        console.warn('Não foi possível sincronizar os aceites legais com o banco:', syncError);
        return metadataStatus;
      }
    } catch (error) {
      // O Railway pode publicar o frontend antes das migrations/RPCs do Supabase.
      // O aceite feito no cadastro continua verificável no metadata e impede que
      // o Wizard permaneça preso na tela de carregamento.
      console.warn('RPC de status legal indisponível; usando metadata da autenticação:', error);
      return metadataStatus;
    }
  },

  async acceptCurrentDocuments() {
    let databaseResult: unknown = null;

    try {
      databaseResult = await writeDatabaseAcceptances();
    } catch (error) {
      console.warn('RPC de aceite legal indisponível; registrando aceite no metadata:', error);
    }

    const user = await persistAcceptanceMetadata();
    return databaseResult ?? {
      accepted: true,
      source: 'auth_metadata',
      user_id: user?.id,
    };
  },
};
