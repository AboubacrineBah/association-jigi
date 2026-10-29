import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import type { Crud, Id, Result } from '../types';

interface Messages {
  saved: string;
  deleted: string;
}

/** Gère l'édition (création / modification) et la suppression avec confirmation d'une entité. */
export function useEntityEditor<T extends { id: Id }, I>(crud: Crud<T, I>, reload: () => void, messages: Messages) {
  const { notify } = useToast();
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  async function save(input: I): Promise<Result<T>> {
    const result = editing !== null && editing !== 'new' ? await crud.update(editing.id, input) : await crud.create(input);
    if (result.ok) {
      notify(messages.saved);
      setEditing(null);
      reload();
    }
    return result;
  }

  async function confirmDelete(): Promise<void> {
    if (!deleting) return;
    const result = await crud.remove(deleting.id);
    setDeleting(null);
    if (result.ok) {
      notify(messages.deleted);
      reload();
    } else {
      notify(result.error.message, 'danger');
    }
  }

  return {
    isOpen: editing !== null,
    current: editing === 'new' || editing === null ? undefined : editing,
    openNew: () => setEditing('new'),
    openEdit: (item: T) => setEditing(item),
    closeEditor: () => setEditing(null),
    save,
    deleting,
    askDelete: (item: T) => setDeleting(item),
    cancelDelete: () => setDeleting(null),
    confirmDelete,
  };
}
