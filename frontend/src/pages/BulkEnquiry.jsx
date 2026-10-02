import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import SeoHead from "../components/SeoHead";

const INSTITUTION_PURPOSE =
  "Institution / Government / Corporate / Sports event";
const REDIRECT_DELAY_SECONDS = 5;
const SALES_PHONE = "+919216577789";

const PURPOSE_OPTIONS = [
  {
    value: "Own use",
    title: "For own use",
    note: "Personal requirement",
    marker: "01",
  },
  {
    value: INSTITUTION_PURPOSE,
    title: "Institution or event",
    note: "Education, government, corporate or sports",
    marker: "02",
  },
  {
    value: "Resale",
    title: "For resale",
    note: "Dealers and distributors",
    marker: "03",
  },
];

const INSTITUTION_TYPES = [
  "Business",
  "Educational Institute",
  "Sports Events",
  "Corporate Events",
  "Bank",
  "Others",
];
const RESELLER_TYPES = [
  "Wholesaler",
  "Retailer",
  "Dealer / Distributor",
  "Other",
];
const QUANTITY_OPTIONS = [
  {
    value: "Less than 100",
    title: "Less than 100",
    note: "One-time bulk requirement",
    marker: "A",
  },
  {
    value: "100 - 1000",
    title: "100 – 1,000",
    note: "Large event or organisation order",
    marker: "B",
  },
];

const INITIAL_FORM = {
  purpose: "",
  institutionType: "",
  resellerType: "",
  quantity: "",
  personName: "",
  organisation: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  minimumOrderConfirmed: false,
  website: "",
};

const fieldLabels = {
  purpose: "Please select why you need trophies.",
  institutionType: "Please select your organisation or event type.",
  resellerType: "Please select your resale business type.",
  quantity: "Please select the required quantity.",
  personName: "Please enter your name.",
  phone: "Please enter a valid 10-digit mobile number.",
  email: "Please enter a valid email address.",
  pincode: "Please enter a valid 6-digit pincode.",
  minimumOrderConfirmed: "Please confirm the minimum order value.",
};

const inputClass =
  "mt-2 w-full rounded-md border border-gold/20 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-gold/35 focus:border-gold focus:ring-2 focus:ring-gold/10";

function validate(form) {
  const errors = {};
  const phoneDigits = form.phone.replace(/\D/g, "");
  for (const key of [
    "purpose",
    "quantity",
    "personName",
    "phone",
    "minimumOrderConfirmed",
  ]) {
    if (!form[key]) errors[key] = fieldLabels[key];
  }
  if (form.purpose === INSTITUTION_PURPOSE && !form.institutionType) {
    errors.institutionType = fieldLabels.institutionType;
  }
  if (form.purpose === "Resale" && !form.resellerType) {
    errors.resellerType = fieldLabels.resellerType;
  }
  if (form.phone && !/^[6-9]\d{9}$/.test(phoneDigits)) {
    errors.phone = fieldLabels.phone;
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = fieldLabels.email;
  }
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = fieldLabels.pincode;
  }
  return errors;
}

function captureAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    sourceUrl: window.location.href,
    referrer: document.referrer || "Direct",
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    fbclid: params.get("fbclid") || "",
  };
}

function SectionTitle({ number, children, className = "" }) {
  return (
    <div
      className={`mt-4 mb-6 flex items-center gap-3 text-base font-semibold text-white sm:text-lg ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 translate-y-[1px] items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold">
        {number}
      </span>
      {children}
    </div>
  );
}

function RequirementBadge({ required = false }) {
  return (
    <span
      className={`ml-1 inline-flex rounded border px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide ${
        required
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-white/15 bg-white/[0.04] text-white/50"
      }`}
    >
      {required ? "Required" : "Optional"}
    </span>
  );
}

function ChoiceCard({ name, option, selected, onChange, error }) {
  return (
    <label
      className={`group relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition focus-within:ring-2 focus-within:ring-gold/30 ${
        selected
          ? "border-gold bg-gold/[0.09] shadow-[0_0_30px_rgba(212,175,55,0.08)]"
          : "border-white/10 bg-white/[0.025] hover:border-gold/35 hover:bg-white/[0.04]"
      }`}
    >
      <input
        className="sr-only"
        type="radio"
        name={name}
        value={option.value}
        checked={selected}
        onChange={onChange}
        required
        aria-invalid={Boolean(error)}
      />
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-xs font-bold tracking-wider ${
          selected
            ? "border-gold bg-gold text-darkbg"
            : "border-white/10 text-white/35 group-hover:border-gold/30 group-hover:text-gold"
        }`}
      >
        {option.marker}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold text-white">
          {option.title}
        </strong>
        <small className="mt-1 block text-xs leading-relaxed text-white/40">
          {option.note}
        </small>
      </span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-gold bg-gold text-darkbg" : "border-white/20"
        }`}
      >
        {selected && <FiCheck className="h-3.5 w-3.5" />}
      </span>
    </label>
  );
}

function ErrorText({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 text-xs text-red-400" role="alert">
      {children}
    </p>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  wide = false,
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={name} className="text-xs font-medium text-white/65">
        {label} <RequirementBadge required={required} />
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputClass} ${error ? "border-red-400/70" : ""}`}
      />
      <ErrorText id={`${name}-error`}>{error}</ErrorText>
    </div>
  );
}

function SelectField({ label, name, value, options, onChange, error }) {
  return (
    <div className="mt-5 rounded-lg border border-gold/15 bg-black/20 p-4 sm:p-5">
      <label htmlFor={name} className="text-xs font-medium text-white/65">
        {label} <RequirementBadge required />
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputClass} ${error ? "border-red-400/70" : ""}`}
      >
        <option value="" className="bg-darkbg">
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="bg-darkbg">
            {option}
          </option>
        ))}
      </select>
      <ErrorText id={`${name}-error`}>{error}</ErrorText>
    </div>
  );
}

function BulkEnquiry() {
  const navigate = useNavigate();
  const isSuccessPreview =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("preview_success") === "1";
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(isSuccessPreview ? "success" : "idle");
  const [submitMessage, setSubmitMessage] = useState(
    isSuccessPreview
      ? "Thank you! Your bulk enquiry has been received. Our team will contact you shortly."
      : "",
  );
  const [redirectSeconds, setRedirectSeconds] = useState(
    REDIRECT_DELAY_SECONDS,
  );
  const attribution = useMemo(() => captureAttribution(), []);

  useEffect(() => {
    if (status !== "success" || isSuccessPreview) return undefined;
    let secondsRemaining = REDIRECT_DELAY_SECONDS;
    const countdownTimer = window.setInterval(() => {
      secondsRemaining -= 1;
      setRedirectSeconds(Math.max(secondsRemaining, 0));
    }, 1000);
    const redirectTimer = window.setTimeout(
      () => navigate("/"),
      REDIRECT_DELAY_SECONDS * 1000,
    );
    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [isSuccessPreview, navigate, status]);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      if (name === "purpose") {
        return {
          ...current,
          purpose: value,
          institutionType: "",
          resellerType: "",
          organisation: value === "Own use" ? "" : current.organisation,
        };
      }
      return { ...current, [name]: type === "checkbox" ? checked : value };
    });
    setErrors((current) => ({
      ...current,
      [name]: undefined,
      ...(name === "purpose"
        ? { institutionType: undefined, resellerType: undefined }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setSubmitMessage("Please complete all required fields.");
      const firstField = document.querySelector(
        `[name="${Object.keys(validationErrors)[0]}"]`,
      );
      firstField?.focus();
      firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (form.website) return;

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
    if (!scriptUrl || scriptUrl.includes("YOUR_DEPLOYMENT_ID")) {
      setStatus("error");
      setSubmitMessage(
        "The enquiry service is being configured. Please call us at +91 92165 77789.",
      );
      return;
    }

    setStatus("submitting");
    setSubmitMessage("");
    const payload = {
      ...form,
      phone: form.phone.replace(/\D/g, ""),
      submittedAt: new Date().toISOString(),
      ...attribution,
    };

    try {
      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setForm(INITIAL_FORM);
      setRedirectSeconds(REDIRECT_DELAY_SECONDS);
      setStatus("success");
      setSubmitMessage(
        "Thank you! Your bulk enquiry has been received. Our team will contact you shortly.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (typeof window.fbq === "function") {
        window.fbq("track", "Lead", {
          content_name: "B2B Trophy Enquiry",
          value: 10000,
          currency: "INR",
        });
      }
    } catch {
      setStatus("error");
      setSubmitMessage(
        "We could not submit your enquiry. Please check your connection or call +91 92165 77789.",
      );
    }
  };

  if (status === "success") {
    const progress = (redirectSeconds / REDIRECT_DELAY_SECONDS) * 100;
    return (
      <main className="relative min-h-screen overflow-hidden bg-darkbg px-4 pb-16 pt-28 text-white sm:px-6 sm:pt-36">
        <SeoHead
          title="Bulk Enquiry Received | Delta Industries"
          description="Your Delta Industries bulk trophy enquiry has been received."
          canonicalPath="/bulk-enquiry"
          noindex
        />
        <div className="pointer-events-none absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gold/[0.1] blur-[160px]" />
        <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 rounded-full border border-gold/10" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full border border-gold/10" />

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gold/25 bg-[#101010]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
        >
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />
          <div className="grid md:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 text-center sm:p-12 md:text-left">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
                className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-gold/45 bg-gold/[0.1] text-gold shadow-[0_0_50px_rgba(212,175,55,0.16)] md:mx-0"
              >
                <FiCheckCircle className="h-10 w-10" />
              </motion.div>
              <p className="mb-3 text-[11px] font-bold tracking-[0.35em] text-gold">
                ENQUIRY RECEIVED
              </p>
              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                Thank you for choosing <span className="text-gold">Delta.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                {submitMessage}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("idle");
                    setSubmitMessage("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-darkbg transition hover:bg-yellow-300"
                >
                  Submit another enquiry
                  <FiArrowRight />
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center rounded-md border border-gold/30 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-gold transition hover:border-gold hover:bg-gold/5"
                >
                  Return home
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.025] p-7 sm:p-9 md:border-l md:border-t-0">
              <p className="text-[10px] font-bold tracking-[0.28em] text-white/35">
                WHAT HAPPENS NEXT
              </p>
              <div className="mt-6 space-y-5">
                {[
                  [
                    "01",
                    "Requirement review",
                    "Our team reviews your order details.",
                  ],
                  [
                    "02",
                    "Personal follow-up",
                    "A specialist contacts you shortly.",
                  ],
                  [
                    "03",
                    "Curated quotation",
                    "You receive the right options and pricing.",
                  ],
                ].map(([number, title, copy]) => (
                  <div key={number} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-[10px] font-bold text-gold">
                      {number}
                    </span>
                    <div>
                      <strong className="block text-sm text-white">
                        {title}
                      </strong>
                      <span className="mt-1 block text-xs leading-5 text-white/35">
                        {copy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-gold/20 bg-black/25 p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full p-[3px] transition-all duration-1000"
                    style={{
                      background: `conic-gradient(#D4AF37 ${progress}%, rgba(255,255,255,0.08) ${progress}%)`,
                    }}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#111]">
                      <strong className="text-xl leading-none text-gold">
                        {redirectSeconds}
                      </strong>
                      <small className="mt-1 text-[8px] uppercase tracking-widest text-white/35">
                        sec
                      </small>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-white/35">
                      Redirecting to
                    </span>
                    <strong className="mt-1 block text-sm text-white">
                      Delta Industries home
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-darkbg px-4 pb-10 pt-24 text-white sm:px-6 sm:pt-28">
      <SeoHead
        title="Bulk Trophy Enquiry | Request a Quotation | Delta Industries"
        description="Send a qualified bulk trophy and awards enquiry to Delta Industries. Suitable for institutions, corporate events, sports events and resellers."
        canonicalPath="/bulk-enquiry"
      />
      <div className="pointer-events-none absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-gold/[0.09] blur-[150px]" />
      <div className="pointer-events-none absolute left-8 top-48 hidden h-52 w-52 rounded-full border border-gold/10 lg:block" />
      <div className="pointer-events-none absolute right-8 top-80 hidden h-72 w-72 rounded-full border border-gold/[0.07] lg:block" />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-[#17150e] via-[#111] to-[#0d0d0d] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-10 lg:p-12"
      >
        <span className="pointer-events-none absolute -right-4 -top-12 select-none text-[9rem] font-black leading-none text-white/[0.018] sm:text-[13rem]">
          Δ
        </span>
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-gold" />
              <p className="text-[11px] font-bold tracking-[0.38em] text-gold">
                DELTA B2B ENQUIRY
              </p>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Let&apos;s create something{" "}
              <span className="text-gold">worth celebrating.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              Tell us about your trophy requirement. We&apos;ll understand your
              event, curate the right designs and prepare a tailored quotation.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/45">
              <span className="flex items-center gap-2">
                <FiAward className="text-gold" /> Customisable awards
              </span>
              <span className="flex items-center gap-2">
                <FiUsers className="text-gold" /> Bulk orders
              </span>
              <span className="flex items-center gap-2">
                <FiShield className="text-gold" /> Private & secure
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gold/25 bg-black/25 p-6 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-[0.26em] text-white/35">
              MINIMUM ORDER VALUE
            </span>
            <strong className="mt-2 block text-4xl text-gold sm:text-5xl">
              ₹10,000+
            </strong>
            <div className="mt-5 h-px bg-gradient-to-r from-gold/40 to-transparent" />
            <div className="mt-5 flex items-center gap-3 text-sm text-white/50">
              <FiClock className="text-gold" /> Takes about 2 minutes
            </div>
            <a
              href={`tel:${SALES_PHONE}`}
              className="mt-3 flex items-center gap-3 text-sm text-white/50 transition hover:text-gold"
            >
              <FiPhone className="text-gold" /> +91 92165 77789
            </a>
          </div>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
        className="relative mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#101010]/95 shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
      >
        <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.025] px-5 py-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-sm font-semibold text-white">Your requirement</p>
            <p className="mt-1 text-xs text-white/35">
              Each question and field is marked Required or Optional.
            </p>
          </div>
          <div
            className="mt-1 flex items-center gap-2.5 self-start pt-1 sm:mt-0 sm:pt-0"
            aria-hidden="true"
          >
            {["Purpose", "Quantity", "Contact"].map((step, index) => (
              <div key={step} className="flex items-center gap-2.5 pb-[2px]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08] text-[9px] font-bold text-gold">
                  {index + 1}
                </span>
                <span className="hidden text-[10px] uppercase tracking-wider text-white/35 sm:block">
                  {step}
                </span>
                {index < 2 && (
                  <span className="mb-[3px] h-px w-4 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="border-b border-white/10 px-5 pb-5 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
            <SectionTitle number="01">
              Why do you need trophies? <RequirementBadge required />
            </SectionTitle>
            <div className="grid gap-3 xl:grid-cols-3">
              {PURPOSE_OPTIONS.map((option) => (
                <ChoiceCard
                  key={option.value}
                  name="purpose"
                  option={option}
                  selected={form.purpose === option.value}
                  onChange={updateField}
                  error={errors.purpose}
                />
              ))}
            </div>
            <ErrorText id="purpose-error">{errors.purpose}</ErrorText>
            {form.purpose === INSTITUTION_PURPOSE && (
              <SelectField
                label="What type of organisation or event is this?"
                name="institutionType"
                value={form.institutionType}
                options={INSTITUTION_TYPES}
                onChange={updateField}
                error={errors.institutionType}
              />
            )}
            {form.purpose === "Resale" && (
              <SelectField
                label="What type of reseller are you?"
                name="resellerType"
                value={form.resellerType}
                options={RESELLER_TYPES}
                onChange={updateField}
                error={errors.resellerType}
              />
            )}
          </fieldset>

          <fieldset className="border-b border-white/10 px-5 pb-5 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
            <SectionTitle number="02">
              How many pieces do you need? <RequirementBadge required />
            </SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {QUANTITY_OPTIONS.map((option) => (
                <ChoiceCard
                  key={option.value}
                  name="quantity"
                  option={option}
                  selected={form.quantity === option.value}
                  onChange={updateField}
                  error={errors.quantity}
                />
              ))}
            </div>
            <ErrorText id="quantity-error">{errors.quantity}</ErrorText>
          </fieldset>

          <fieldset className="px-5 pb-5 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
            <SectionTitle number="03">Your contact details</SectionTitle>
            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <Field
                label="Person name"
                name="personName"
                value={form.personName}
                onChange={updateField}
                error={errors.personName}
                required
                placeholder="Your full name"
                autoComplete="name"
                wide={!form.purpose || form.purpose === "Own use"}
              />
              {form.purpose && form.purpose !== "Own use" && (
                <Field
                  label="Organisation"
                  name="organisation"
                  value={form.organisation}
                  onChange={updateField}
                  placeholder="Company / institute name"
                  autoComplete="organization"
                />
              )}
              <Field
                label="Phone number"
                name="phone"
                value={form.phone}
                onChange={updateField}
                error={errors.phone}
                required
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                autoComplete="tel"
              />
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={updateField}
                error={errors.email}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
              />
              <Field
                label="Address"
                name="address"
                value={form.address}
                onChange={updateField}
                placeholder="Street / area"
                autoComplete="street-address"
                wide
              />
              <Field
                label="City"
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="City"
                autoComplete="address-level2"
              />
              <Field
                label="State"
                name="state"
                value={form.state}
                onChange={updateField}
                placeholder="State"
                autoComplete="address-level1"
              />
              <Field
                label="Pincode"
                name="pincode"
                value={form.pincode}
                onChange={updateField}
                error={errors.pincode}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit pincode"
                autoComplete="postal-code"
              />
            </div>

            <div className="mt-7 rounded-lg border border-gold/20 bg-gold/[0.055] p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="minimumOrderConfirmed"
                  checked={form.minimumOrderConfirmed}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.minimumOrderConfirmed)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#D4AF37]"
                />
                <span className="text-sm leading-6 text-white/65">
                  I confirm that my requirement has a minimum order value of{" "}
                  <strong className="text-white">₹10,000 or more.</strong>
                  <RequirementBadge required />
                </span>
              </label>
              <ErrorText id="minimumOrderConfirmed-error">
                {errors.minimumOrderConfirmed}
              </ErrorText>
            </div>

            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                value={form.website}
                onChange={updateField}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {submitMessage && (
              <div
                role="alert"
                className={`mt-6 rounded-md border px-4 py-3 text-sm ${
                  status === "error"
                    ? "border-red-400/30 bg-red-400/10 text-red-300"
                    : "border-gold/25 bg-gold/[0.06] text-gold"
                }`}
              >
                {submitMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 flex w-full items-center justify-center gap-3 rounded-md bg-gold px-6 py-4 text-xs font-bold uppercase tracking-[0.18em] text-darkbg transition hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
            >
              {status === "submitting"
                ? "Submitting enquiry…"
                : "Request a quotation"}
              {status !== "submitting" && <FiArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-4 text-center text-[11px] leading-5 text-white/30">
              By submitting, you agree to be contacted by Delta Industries about
              this enquiry. We do not sell your information.
            </p>
          </fieldset>
        </form>
      </motion.section>
    </main>
  );
}

export default BulkEnquiry;
