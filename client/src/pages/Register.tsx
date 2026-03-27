import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/SectionHeader";
import { createRegistration, fetchEvent } from "@/data/api";
import { formatDateLabel, formatTimeLabel, isRegistrationClosed, openPrintPassWindow } from "@/data/helpers";
import { BackendEvent } from "@/types";
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, PartyPopper } from "lucide-react";

const steps = ["Participant Details", "Payment", "Pass"];
const departmentOptions = [
  "Computer Engineering",
  "Information Technology",
  "Electronics and Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and Data Science",
  "Electrical Engineering",
  "MBA",
  "Other",
];

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [step, setStep] = useState(0);
  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [savedRegistration, setSavedRegistration] = useState<Record<string, string> | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [showClosedPopup, setShowClosedPopup] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    studentCollege: "",
    studentDepartment: "",
    studentYear: "",
    teamMembers: "",
    paymentRef: "",
    confirmCheck: false,
  });
  const [memberCount, setMemberCount] = useState("1");
  const [memberNames, setMemberNames] = useState<string[]>([""]);
  const [memberCountTouched, setMemberCountTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const errorFieldOrder = [
    "fullName",
    "email",
    "phone",
    "studentCollege",
    "studentDepartment",
    "studentYear",
    "memberCount",
    "memberNames",
    "paymentRef",
    "confirmCheck",
  ] as const;

  const errorFieldToId: Record<string, string> = {
    fullName: "reg-full-name",
    email: "reg-email",
    phone: "reg-phone",
    studentCollege: "reg-college",
    studentDepartment: "reg-department",
    studentYear: "reg-year",
    memberCount: "reg-member-count",
    memberNames: "reg-member-names-0",
    paymentRef: "reg-payment-ref",
    confirmCheck: "reg-confirm-check",
  };

  function scrollToFirstError(nextErrors: Record<string, string>) {
    const firstKey = errorFieldOrder.find((key) => nextErrors[key]);
    if (!firstKey) return;
    const id = errorFieldToId[firstKey];
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if ("focus" in el) (el as HTMLInputElement).focus();
    }
  }

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  }

  useEffect(() => {
    if (!eventId) return;
    fetchEvent(eventId)
      .then((data) => setEvent(data.event || null))
      .catch((error) => setStatusMessage(error instanceof Error ? error.message : "Failed to load event."));
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    const closed = isRegistrationClosed(event.time);
    setRegistrationClosed(closed);
    if (closed) {
      setShowClosedPopup(true);
    } else {
      setShowClosedPopup(false);
    }
  }, [event]);

  const isPaidEvent = useMemo(() => Number(event?.fee || 0) > 0, [event]);

  const isTeamEvent = useMemo(() => {
    const teamSize = Number(event?.teamSize || 1);
    return Boolean(event?.isTeamEvent) || teamSize > 1;
  }, [event]);

  const prizeNumbers = useMemo(() => {
    const raw = String(event?.displayPrize || "");
    const matches = raw.match(/[\d,]+/g) || [];
    return matches.filter(Boolean);
  }, [event?.displayPrize]);

  useEffect(() => {
    if (!event) return;
    const size = Math.max(1, Number(event.teamSize || 1));
    if (!Number.isFinite(size)) return;
    const maxAllowed = Math.max(1, size - 1);
    setMemberCount((prev) => {
      const current = Math.max(1, Number(prev || 1));
      const clamped = Math.min(current, maxAllowed);
      return String(clamped);
    });
    setMemberNames((prev) => {
      const next = [...prev];
      while (next.length < maxAllowed) next.push("");
      return next.slice(0, maxAllowed);
    });
  }, [event]);

  function validateDetails() {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().split(/\s+/).length < 2) nextErrors.fullName = "Enter full name";
    if (!form.email.includes("@")) nextErrors.email = "Invalid email";
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) nextErrors.phone = "Invalid phone";
    if (!form.studentCollege.trim()) nextErrors.studentCollege = "Required";
    if (!form.studentDepartment.trim()) nextErrors.studentDepartment = "Required";
    if (!form.studentYear) nextErrors.studentYear = "Required";
    if (isTeamEvent) {
      const maxAllowed = Math.max(1, Number(event?.teamSize || 1) - 1);
      const count = Math.max(1, Math.min(Number(memberCount || 1), maxAllowed));
      if (!Number.isFinite(count) || count < 1) nextErrors.memberCount = "Enter valid number of members";
      if (Number(memberCount || 1) > maxAllowed) nextErrors.memberCount = `Maximum ${maxAllowed} members allowed`;
      const trimmedNames = memberNames.map((name) => name.trim()).slice(0, count);
      if (trimmedNames.length < count || trimmedNames.some((name) => !name)) {
        nextErrors.memberNames = "Enter all member names";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
    }
    return Object.keys(nextErrors).length === 0;
  }

  function validatePayment() {
    const nextErrors: Record<string, string> = {};
    if (isPaidEvent && !form.paymentRef.trim()) nextErrors.paymentRef = "Payment reference required";
    if (!form.confirmCheck) nextErrors.confirmCheck = "Please confirm details";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError(nextErrors);
    }
    return Object.keys(nextErrors).length === 0;
  }

  function next() {
    setStatusMessage("");
    if (registrationClosed) {
      setShowClosedPopup(true);
      return;
    }
    if (step === 0 && validateDetails()) setStep(1);
  }

  function prev() {
    setStatusMessage("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function submit() {
    if (registrationClosed) {
      setShowClosedPopup(true);
      return;
    }
    if (!event || !validatePayment()) return;

    try {
      setSubmitting(true);
      setStatusMessage("");
      const payload = {
        fullName: form.fullName.trim(),
        studentDepartment: form.studentDepartment.trim(),
        studentCollege: form.studentCollege.trim(),
        studentYear: form.studentYear,
        phone: form.phone.replace(/\D/g, "").slice(0, 10),
        email: form.email.trim(),
        paymentRef: isPaidEvent ? form.paymentRef.trim() : "Not Required",
        teamMembers: isTeamEvent
          ? memberNames.map((name) => name.trim()).filter(Boolean).join(", ") || "N/A"
          : "N/A",
        eventId: event.eventId,
        eventName: event.title,
        subEventId: "",
        subEventName: "",
        department: event.department,
        address: event.address || "To be announced",
        time: event.time || "To be announced",
        guide: event.guide || "Coordinator",
        guidePhone: event.guidePhone || "N/A",
      };

      const response = await createRegistration(payload);
      setSavedRegistration((response.registration || payload) as Record<string, string>);
      setStep(2);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";

  return (
    <div className="pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeader title="Register" subtitle="Complete details, confirm payment, and generate your pass." />

        {showClosedPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="max-w-md w-full rounded-2xl border border-white/10 bg-card/90 p-6 text-center shadow-xl">
              <h3 className="font-heading text-xl font-bold text-foreground mb-3">Registration Closed</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Registration closes 12 hours before the event. Please contact the coordinator for assistance.
              </p>
              <button
                type="button"
                onClick={() => setShowClosedPopup(false)}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {event ? (
            <div className="glass-card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-stretch">
              <div>
                <div className="w-full h-52 md:h-60 rounded-xl border border-white/10 overflow-hidden bg-card/40 p-2">
                  {event.posterUrl ? (
                    <img src={event.posterUrl} alt={event.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="w-6 h-6" />
                      <span>No poster available</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3 flex flex-col h-full">
                <h3 className="font-heading text-2xl font-bold text-foreground">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.shortDescription || event.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <p><span className="text-muted-foreground">Department:</span> <span className="text-foreground">{event.department}</span></p>
                  <p><span className="text-muted-foreground">Team Size:</span> <span className="text-foreground">{event.isTeamEvent ? `1-${event.teamSize || 1}` : "1"}</span></p>
                  <p><span className="text-muted-foreground">Price:</span> <span className="text-foreground">{isPaidEvent ? `₹ ${event.fee}` : "Free"}</span></p>
                  {prizeNumbers.length ? (
                    <p>
                      <span className="text-muted-foreground">Reward:</span>{" "}
                      <span className="text-foreground">
                        ₹ {prizeNumbers.join(", ")}
                      </span>
                    </p>
                  ) : null}
                  <p><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{formatDateLabel(event.time)}</span></p>
                  <p><span className="text-muted-foreground">Time:</span> <span className="text-foreground">{formatTimeLabel(event.time)}</span></p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Venue:</span> <span className="text-foreground">{event.address || "To be announced"}</span></p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between mb-10">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index <= step ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {index < step ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:inline ${index <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              {index < 2 && <div className={`flex-1 h-px mx-3 ${index < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="glass-card p-6 md:p-8">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
                  <input
                    id="reg-full-name"
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => {
                      setForm({ ...form, fullName: e.target.value });
                      clearError("fullName");
                    }}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                  <input
                    id="reg-email"
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      clearError("email");
                    }}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
                  <input
                    id="reg-phone"
                    className={inputClass}
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) });
                      clearError("phone");
                    }}
                    placeholder="9876543210"
                  />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">College Name</label>
                  <input
                    id="reg-college"
                    className={inputClass}
                    value={form.studentCollege}
                    onChange={(e) => {
                      setForm({ ...form, studentCollege: e.target.value });
                      clearError("studentCollege");
                    }}
                    placeholder="College name"
                  />
                  {errors.studentCollege && <p className="text-xs text-destructive mt-1">{errors.studentCollege}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Department</label>
                  <select
                    id="reg-department"
                    className={inputClass}
                    value={form.studentDepartment}
                    onChange={(e) => {
                      setForm({ ...form, studentDepartment: e.target.value });
                      clearError("studentDepartment");
                    }}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                  </select>
                  {errors.studentDepartment && <p className="text-xs text-destructive mt-1">{errors.studentDepartment}</p>}
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Year of Study</label>
                  <select
                    id="reg-year"
                    className={inputClass}
                    value={form.studentYear}
                    onChange={(e) => {
                      setForm({ ...form, studentYear: e.target.value });
                      clearError("studentYear");
                    }}
                  >
                    <option value="">Select year</option>
                    {["First Year", "Second Year", "Third Year", "Final Year"].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.studentYear && <p className="text-xs text-destructive mt-1">{errors.studentYear}</p>}
                </div>
                {isTeamEvent ? (
                  <>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Number of Members</label>
                      <input
                        id="reg-member-count"
                        className={`${inputClass} ${errors.memberCount ? "border-destructive" : ""}`}
                        type="number"
                        min={1}
                        max={Math.max(1, Number(event?.teamSize || 1) - 1)}
                        value={memberCount}
                        onChange={(e) => {
                          setMemberCountTouched(true);
                          const maxAllowed = Math.max(1, Number(event?.teamSize || 1) - 1);
                          const raw = e.target.value.replace(/\D/g, "");
                          const count = Number(raw);
                          const clamped = Number.isFinite(count) && count > maxAllowed ? maxAllowed : count;
                          setMemberCount(raw ? String(clamped) : "");
                          clearError("memberCount");

                          if (Number.isFinite(clamped) && clamped >= 1) {
                            setMemberNames((prev) => {
                              const next = [...prev];
                              while (next.length < clamped) next.push("");
                              return next.slice(0, clamped);
                            });
                          }
                        }}
                        onBlur={() => {
                          setMemberCountTouched(true);
                          const maxAllowed = Math.max(1, Number(event?.teamSize || 1) - 1);
                          const count = Math.max(1, Math.min(Number(memberCount || 1), maxAllowed));
                          setMemberCount(String(count));
                          setMemberNames((prev) => {
                            const next = [...prev];
                            while (next.length < count) next.push("");
                            return next.slice(0, count);
                          });
                        }}
                        placeholder="1"
                      />
                      {errors.memberCount && <p className="text-xs text-destructive mt-1">{errors.memberCount}</p>}
                    </div>
                    {memberCountTouched ? (
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground mb-1 block">Member Names</label>
                        {memberNames.map((name, index) => (
                          <input
                            key={`member-${index}`}
                            id={index === 0 ? "reg-member-names-0" : undefined}
                            className={`${inputClass} ${errors.memberNames ? "border-destructive" : ""}`}
                            value={name}
                            onChange={(e) => {
                              const next = [...memberNames];
                              next[index] = e.target.value;
                              setMemberNames(next);
                              clearError("memberNames");
                            }}
                            placeholder={`Member ${index + 1} name`}
                          />
                        ))}
                        {errors.memberNames && <p className="text-xs text-destructive mt-1">{errors.memberNames}</p>}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            )}

            {step === 1 && event && (
              <div className="space-y-5">
                <div className="rounded-xl border border-white/10 bg-card/30 p-5">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-3">
                    {isPaidEvent ? "Payment Confirmation" : "Final Confirmation"}
                  </h3>
                  {isPaidEvent ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">Pay <strong>₹ {event.fee}</strong> for this event and enter the payment reference/UTR below.</p>
                      {event.paymentQrUrl ? (
                        <img src={event.paymentQrUrl} alt="Payment QR" className="w-44 h-44 object-contain rounded-xl border border-white/10 bg-white p-2 mb-4" />
                      ) : (
                        <div className="w-44 h-44 rounded-xl border border-dashed border-white/15 bg-card/30 grid place-items-center text-muted-foreground mb-4">
                          Payment QR not uploaded
                        </div>
                      )}
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Payment Reference / UTR</label>
                        <input
                          id="reg-payment-ref"
                          className={inputClass}
                          value={form.paymentRef}
                          onChange={(e) => {
                            setForm({ ...form, paymentRef: e.target.value });
                            clearError("paymentRef");
                          }}
                          placeholder="Enter UTR / payment ref"
                        />
                        {errors.paymentRef && <p className="text-xs text-destructive mt-1">{errors.paymentRef}</p>}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">This event is free. Just confirm your details and generate your pass.</p>
                  )}
                </div>

                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    id="reg-confirm-check"
                    type="checkbox"
                    checked={form.confirmCheck}
                    onChange={(e) => {
                      setForm({ ...form, confirmCheck: e.target.checked });
                      clearError("confirmCheck");
                    }}
                  />
                  I confirm that my registration details are correct.
                </label>
                {errors.confirmCheck && <p className="text-xs text-destructive">{errors.confirmCheck}</p>}
              </div>
            )}

            {step === 2 && savedRegistration && (
              <div className="text-center space-y-5">
                <PartyPopper className="w-16 h-16 text-primary mx-auto" />
                <div>
                  <h3 className="font-heading text-2xl font-bold gradient-text mb-2">Pass Generated</h3>
                  <p className="text-sm text-muted-foreground">Your registration is complete and your event pass is ready.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/30 p-5 text-left max-w-xl mx-auto space-y-2">
                  <p><span className="text-muted-foreground">Registration ID:</span> <span className="text-foreground">{savedRegistration.registrationId}</span></p>
                  <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{savedRegistration.fullName}</span></p>
                  <p><span className="text-muted-foreground">Event:</span> <span className="text-foreground">{savedRegistration.eventName}</span></p>
                  <p><span className="text-muted-foreground">Venue:</span> <span className="text-foreground">{savedRegistration.address}</span></p>
                  <p><span className="text-muted-foreground">Time:</span> <span className="text-foreground">{savedRegistration.time}</span></p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => openPrintPassWindow(savedRegistration as never)}
                    className="px-8 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
                  >
                    Confirm Pass
                  </button>
                  <Link to={`/events/${eventId}`} className="px-8 py-3 rounded-lg border border-white/15 text-muted-foreground">
                    Back to Event
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {!!statusMessage && <p className="text-sm text-muted-foreground mt-4 text-center">{statusMessage}</p>}

        <div className="flex justify-between mt-6">
          <button
            onClick={prev}
            disabled={step === 0 || step === 2}
            className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          {step === 0 ? (
            <button
              onClick={next}
              disabled={registrationClosed}
              className="flex items-center gap-1 px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-70"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : step === 1 ? (
            <button
              onClick={submit}
              disabled={submitting || registrationClosed}
              className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-heading text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-70"
            >
              {submitting ? "Generating..." : "Generate Pass"}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

