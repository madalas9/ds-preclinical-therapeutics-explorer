"use client";

import { useState, useId } from "react";
import { CheckCircle } from "lucide-react";

const DST_OPTIONS = [
  { value: "", label: "N/A — new compound" },
  ...Array.from({ length: 38 }, (_, i) => {
    const id = `DST${String(i + 1).padStart(2, "0")}`;
    return { value: id, label: id };
  }),
];

const SUBMISSION_TYPES = [
  { value: "new", label: "New intervention not in database" },
  { value: "correction", label: "Correction to existing data" },
  { value: "missing", label: "Missing data for existing entry" },
  { value: "other", label: "Other feedback" },
];

interface FormData {
  name: string;
  email: string;
  affiliation: string;
  submission_type: string;
  compound_name: string;
  dst_id: string;
  doi: string;
  species_model: string;
  description: string;
  missing_or_incorrect: string;
  honeypot: string;
}

interface FieldErrors {
  [key: string]: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  email: "",
  affiliation: "",
  submission_type: "new",
  compound_name: "",
  dst_id: "",
  doi: "",
  species_model: "",
  description: "",
  missing_or_incorrect: "",
  honeypot: "",
};

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-rescue focus:border-transparent transition-colors";

const INPUT_ERROR_CLASS =
  "w-full rounded-md border border-red-500 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors";

function validateField(name: keyof FormData, value: string): string {
  switch (name) {
    case "name":
      if (!value.trim()) return "Name is required";
      if (value.length < 2) return "Name must be at least 2 characters";
      if (value.length > 120) return "Name must be less than 120 characters";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address";
      if (value.length > 200) return "Email must be less than 200 characters";
      return "";
    case "affiliation":
      if (value.length > 200) return "Affiliation must be less than 200 characters";
      return "";
    case "submission_type":
      if (!value) return "Please select a submission type";
      return "";
    case "compound_name":
      if (!value.trim()) return "Compound name is required";
      if (value.length > 200) return "Compound name must be less than 200 characters";
      return "";
    case "doi":
      if (!value.trim()) return "DOI or reference URL is required";
      if (value.length > 500) return "DOI must be less than 500 characters";
      if (!value.startsWith("10.") && !value.startsWith("http")) {
        return "Must be a DOI (starting with 10.) or URL";
      }
      return "";
    case "species_model":
      if (value.length > 200) return "Species/model must be less than 200 characters";
      return "";
    case "description":
      if (!value.trim()) return "Description is required";
      if (value.length < 20) return "Description must be at least 20 characters";
      if (value.length > 5000) return "Description must be less than 5000 characters";
      return "";
    case "missing_or_incorrect":
      if (value.length > 5000) return "This field must be less than 5000 characters";
      return "";
    default:
      return "";
  }
}

export default function ContributePage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const formId = useId();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched.has(name)) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormData, value) }));
    }
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setTouched((prev) => new Set(prev).add(name));
    setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof FormData, value) }));
  }

  function validateAll(): boolean {
    const newErrors: FieldErrors = {};
    let isValid = true;

    const requiredFields: (keyof FormData)[] = [
      "name",
      "email",
      "submission_type",
      "compound_name",
      "doi",
      "description",
    ];

    for (const field of requiredFields) {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    const optionalFields: (keyof FormData)[] = ["affiliation", "species_model", "missing_or_incorrect"];
    for (const field of optionalFields) {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(new Set([...requiredFields, ...optionalFields]));
    return isValid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          affiliation: form.affiliation.trim() || undefined,
          submission_type: form.submission_type,
          compound_name: form.compound_name.trim(),
          dst_id: form.dst_id || undefined,
          doi: form.doi.trim(),
          species_model: form.species_model.trim() || undefined,
          description: form.description.trim(),
          missing_or_incorrect: form.missing_or_incorrect.trim() || undefined,
          honeypot: form.honeypot,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setIsSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched(new Set());
    setSubmitError(null);
    setIsSuccess(false);
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="rounded-md border border-border bg-surface p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-accent-rescue" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Thank you for your contribution!
          </h1>
          <p className="text-text-secondary mb-6">
            Your submission was sent to the curation team. We&apos;ll reach out if we need
            clarification.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] px-6 py-3 rounded-md bg-accent-rescue text-white font-medium hover:bg-accent-rescue/90 transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  const getFieldError = (name: string) => (touched.has(name) ? errors[name] : undefined);
  const getErrorId = (name: string) => `${formId}-${name}-error`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Contribute to the Database</h1>
        <p className="text-text-secondary">
          Flag missing interventions, corrections, or data gaps. Submissions are reviewed by the
          T21RS Preclinical Committee before inclusion.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        >
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Honeypot field - hidden from users, catches bots */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
          <label htmlFor={`${formId}-honeypot`}>Website</label>
          <input
            type="text"
            id={`${formId}-honeypot`}
            name="honeypot"
            value={form.honeypot}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Your Information */}
        <fieldset>
          <legend className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border w-full">
            Your Information
          </legend>
          <div className="space-y-4">
            <div>
              <label htmlFor={`${formId}-name`} className="block text-sm font-medium text-text-primary mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`${formId}-name`}
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("name") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="Your full name"
                aria-invalid={!!getFieldError("name")}
                aria-describedby={getFieldError("name") ? getErrorId("name") : undefined}
              />
              {getFieldError("name") && (
                <p id={getErrorId("name")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-email`} className="block text-sm font-medium text-text-primary mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id={`${formId}-email`}
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("email") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="you@institution.edu"
                aria-invalid={!!getFieldError("email")}
                aria-describedby={getFieldError("email") ? getErrorId("email") : undefined}
              />
              {getFieldError("email") && (
                <p id={getErrorId("email")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-affiliation`} className="block text-sm font-medium text-text-primary mb-1.5">
                Affiliation
              </label>
              <input
                type="text"
                id={`${formId}-affiliation`}
                name="affiliation"
                value={form.affiliation}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("affiliation") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="University, research institute, etc."
                aria-invalid={!!getFieldError("affiliation")}
                aria-describedby={getFieldError("affiliation") ? getErrorId("affiliation") : undefined}
              />
              {getFieldError("affiliation") && (
                <p id={getErrorId("affiliation")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.affiliation}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Submission Type */}
        <fieldset>
          <legend className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border w-full">
            Submission Type <span className="text-red-500">*</span>
          </legend>
          <div className="space-y-3">
            {SUBMISSION_TYPES.map((type) => (
              <label
                key={type.value}
                className="flex items-center gap-3 cursor-pointer group min-h-[44px]"
              >
                <input
                  type="radio"
                  name="submission_type"
                  value={type.value}
                  checked={form.submission_type === type.value}
                  onChange={handleChange}
                  className="h-5 w-5 text-accent-rescue border-border focus:ring-accent-rescue focus:ring-2"
                />
                <span className="text-text-primary group-hover:text-text-primary/80">
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Intervention Details */}
        <fieldset>
          <legend className="text-lg font-semibold text-text-primary mb-4 pb-2 border-b border-border w-full">
            Intervention Details
          </legend>
          <div className="space-y-4">
            <div>
              <label htmlFor={`${formId}-compound_name`} className="block text-sm font-medium text-text-primary mb-1.5">
                Compound / Treatment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`${formId}-compound_name`}
                name="compound_name"
                value={form.compound_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("compound_name") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="e.g., EGCG, Memantine, Fluoxetine"
                aria-invalid={!!getFieldError("compound_name")}
                aria-describedby={getFieldError("compound_name") ? getErrorId("compound_name") : undefined}
              />
              {getFieldError("compound_name") && (
                <p id={getErrorId("compound_name")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.compound_name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-dst_id`} className="block text-sm font-medium text-text-primary mb-1.5">
                Existing DST ID (if applicable)
              </label>
              <select
                id={`${formId}-dst_id`}
                name="dst_id"
                value={form.dst_id}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${getFieldError("dst_id") ? INPUT_ERROR_CLASS : INPUT_CLASS} font-mono`}
                aria-invalid={!!getFieldError("dst_id")}
                aria-describedby={getFieldError("dst_id") ? getErrorId("dst_id") : undefined}
              >
                {DST_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className={opt.value ? "font-mono" : ""}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {getFieldError("dst_id") && (
                <p id={getErrorId("dst_id")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.dst_id}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-doi`} className="block text-sm font-medium text-text-primary mb-1.5">
                DOI or Reference URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id={`${formId}-doi`}
                name="doi"
                value={form.doi}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("doi") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="e.g., 10.1016/j.xxx or https://doi.org/..."
                aria-invalid={!!getFieldError("doi")}
                aria-describedby={getFieldError("doi") ? getErrorId("doi") : undefined}
              />
              {getFieldError("doi") && (
                <p id={getErrorId("doi")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.doi}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-species_model`} className="block text-sm font-medium text-text-primary mb-1.5">
                Species / Model
              </label>
              <input
                type="text"
                id={`${formId}-species_model`}
                name="species_model"
                value={form.species_model}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getFieldError("species_model") ? INPUT_ERROR_CLASS : INPUT_CLASS}
                placeholder="e.g., Mouse / Ts65Dn"
                aria-invalid={!!getFieldError("species_model")}
                aria-describedby={getFieldError("species_model") ? getErrorId("species_model") : undefined}
              />
              {getFieldError("species_model") && (
                <p id={getErrorId("species_model")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.species_model}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-description`} className="block text-sm font-medium text-text-primary mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id={`${formId}-description`}
                name="description"
                value={form.description}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className={`${getFieldError("description") ? INPUT_ERROR_CLASS : INPUT_CLASS} resize-y`}
                placeholder="Describe the intervention, key findings, outcomes measured, etc."
                aria-invalid={!!getFieldError("description")}
                aria-describedby={getFieldError("description") ? getErrorId("description") : undefined}
              />
              {getFieldError("description") && (
                <p id={getErrorId("description")} className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-missing_or_incorrect`} className="block text-sm font-medium text-text-primary mb-1.5">
                What&apos;s missing or incorrect?
              </label>
              <textarea
                id={`${formId}-missing_or_incorrect`}
                name="missing_or_incorrect"
                value={form.missing_or_incorrect}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                className={`${getFieldError("missing_or_incorrect") ? INPUT_ERROR_CLASS : INPUT_CLASS} resize-y`}
                placeholder="If reporting a correction or missing data, describe what needs to be fixed..."
                aria-invalid={!!getFieldError("missing_or_incorrect")}
                aria-describedby={
                  getFieldError("missing_or_incorrect") ? getErrorId("missing_or_incorrect") : undefined
                }
              />
              {getFieldError("missing_or_incorrect") && (
                <p
                  id={getErrorId("missing_or_incorrect")}
                  className="mt-1.5 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.missing_or_incorrect}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-md bg-accent-rescue text-white font-medium hover:bg-accent-rescue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit Contribution"}
          </button>
        </div>
      </form>
    </div>
  );
}
