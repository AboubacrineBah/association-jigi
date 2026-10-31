import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import type { FieldErrors, Resolver } from 'react-hook-form';
import type { z } from 'zod';
import type { FormValues } from '../../schemas/common';
import type { Result } from '../../types';
import type { Option } from '../../utils/options';

export type FieldType = 'text' | 'email' | 'date' | 'amount' | 'select' | 'textarea';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: readonly Option[];
  placeholder?: string;
  /** Champ pleine largeur (par défaut : demi-largeur sur écran large). */
  wide?: boolean;
}

interface FormModalProps<TInput> {
  title: string;
  fields: readonly FieldDef[];
  initialValues: FormValues;
  schema: z.ZodType<TInput>;
  onSubmit: (input: TInput) => Promise<Result<unknown>>;
  onClose: () => void;
  submitLabel?: string;
  intro?: ReactNode;
}

/** Résolveur RHF minimal : les messages d'erreur viennent du schéma Zod (en français). */
export function resolverFor<TInput>(schema: z.ZodType<TInput>): Resolver<FormValues> {
  return async (values) => {
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values, errors: {} };
    const errors: FieldErrors<FormValues> = {};
    for (const issue of parsed.error.issues) {
      const name = String(issue.path[0] ?? '');
      if (name && !(name in errors)) errors[name] = { type: 'validation', message: issue.message };
    }
    return { values: {}, errors };
  };
}

/** Formulaire générique en fenêtre modale : validation Zod, erreurs accessibles, erreurs serveur. */
export function FormModal<TInput>({ title, fields, initialValues, schema, onSubmit, onClose, submitLabel = 'Enregistrer', intro }: FormModalProps<TInput>) {
  const prefix = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: initialValues, resolver: resolverFor(schema) });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;
    const result = await onSubmit(parsed.data);
    if (result.ok) return;
    setServerError(result.error.message);
    for (const [field, messages] of Object.entries(result.error.fieldErrors ?? {})) {
      if (field in initialValues && messages[0]) setError(field, { type: 'server', message: messages[0] });
    }
  });

  return (
    <Modal show onHide={onClose} backdrop="static" centered size="lg" aria-labelledby={`${prefix}-title`}>
      <Modal.Header closeButton closeLabel="Fermer">
        <Modal.Title as="h2" id={`${prefix}-title`} className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Form noValidate onSubmit={submit}>
        <Modal.Body>
          {intro}
          {serverError ? (
            <Alert variant="danger" role="alert">
              <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
              {serverError}
            </Alert>
          ) : null}
          <Row className="g-3">
            {fields.map((field) => {
              const id = `${prefix}-${field.name}`;
              const message = errors[field.name]?.message;
              const common = { id, isInvalid: Boolean(message), 'aria-invalid': Boolean(message), 'aria-describedby': message ? `${id}-error` : undefined, ...register(field.name) };
              return (
                <Col key={field.name} md={field.wide ? 12 : 6}>
                  <Form.Label htmlFor={id} className="fw-semibold small mb-1">
                    {field.label}
                  </Form.Label>
                  {field.type === 'select' ? (
                    <Form.Select {...common}>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : field.type === 'textarea' ? (
                    <Form.Control as="textarea" rows={3} placeholder={field.placeholder} {...common} />
                  ) : (
                    <Form.Control
                      type={field.type === 'amount' ? 'text' : field.type}
                      inputMode={field.type === 'amount' ? 'decimal' : undefined}
                      placeholder={field.placeholder}
                      {...common}
                    />
                  )}
                  {message ? (
                    <Form.Control.Feedback type="invalid" id={`${id}-error`} role="alert">
                      {message}
                    </Form.Control.Feedback>
                  ) : null}
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : submitLabel}
          </Button>
          <Button variant="outline-primary" onClick={onClose}>
            Annuler
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
