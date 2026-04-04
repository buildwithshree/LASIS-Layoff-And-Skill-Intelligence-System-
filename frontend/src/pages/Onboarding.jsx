import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const proficiencyColor = (level) => {
  switch (level) {
    case "expert":       return "bg-teal-600 text-white";
    case "advanced":     return "bg-teal-400 text-white";
    case "intermediate": return "bg-amber-400 text-white";
    case "beginner":     return "bg-gray-300 text-gray-700";
    default:             return "bg-gray-100 text-gray-500";
  }
};

const STEPS = ["Profile", "Academic", "Skills", "Review"];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, idx) => {
        const done   = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  done
                    ? "bg-teal-600 text-white"
                    : active
                    ? "bg-teal-50 border-2 border-teal-600 text-teal-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {done ? "✓" : idx + 1}
              </div>
              <span
                className={`text-xs ${
                  active
                    ? "text-teal-700 font-medium"
                    : done
                    ? "text-teal-600"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-px ${done ? "bg-teal-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ResumeUpload({ file, onFile, error }) {
  const inputRef        = useRef(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDrag(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDrag(true);
  }

  function handleDragLeave() {
    setDrag(false);
  }

  function handleBrowse(e) {
    const picked = e.target.files[0];
    if (picked) onFile(picked);
  }

  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">
        Resume <span className="text-red-500">*</span>
      </label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${
          drag
            ? "border-teal-500 bg-teal-50"
            : file
            ? "border-teal-400 bg-teal-50"
            : error
            ? "border-red-300 bg-red-50"
            : "border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.html,.doc,.docx,.txt"
          onChange={handleBrowse}
          className="hidden"
        />
        {file ? (
          <div>
            <p className="text-sm font-medium text-teal-700">✓ {file.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(file.size / 1024).toFixed(1)} KB · Click to replace
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              Drop your resume here or{" "}
              <span className="text-teal-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, HTML, DOC, DOCX or TXT supported
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export default function Onboarding() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [step, setStep]               = useState(0);
  const [departments, setDepartments] = useState([]);
  const [allSkills, setAllSkills]     = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState(null);
  const [resumeFile, setResumeFile]   = useState(null);
  const [resumeError, setResumeError] = useState(null);

  const [form, setForm] = useState({
    fullName:       user?.fullName || "",
    email:          user?.email    || "",
    phone:          "",
    departmentId:   "",
    gpa:            "",
    graduationYear: "",
    backlogs:       "0",
    projectScore:   "0",
  });

  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    fetchMeta();
  }, []);

  async function fetchMeta() {
    try {
      const [deptRes, skillsRes] = await Promise.all([
        api.get("/departments"),
        api.get("/skills"),
      ]);
      setDepartments(deptRes.data.data || []);
      setAllSkills(skillsRes.data.data || []);
    } catch {
      setError("Failed to load setup data. Ensure all servers are running.");
    }
  }

  function handleField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleSkill(skill) {
    setSelectedSkills((prev) => {
      const exists = prev.find((s) => s.skillId === skill.skillId);
      if (exists) return prev.filter((s) => s.skillId !== skill.skillId);
      return [
        ...prev,
        {
          skillId:          skill.skillId,
          skillName:        skill.skillName,
          proficiencyLevel: "intermediate",
        },
      ];
    });
  }

  function setProficiency(skillId, level) {
    setSelectedSkills((prev) =>
      prev.map((s) =>
        s.skillId === skillId ? { ...s, proficiencyLevel: level } : s
      )
    );
  }

  const filteredSkills = allSkills.filter((s) =>
    s.skillName.toLowerCase().includes(skillSearch.toLowerCase())
  );

  function validateStep() {
    setError(null);
    setResumeError(null);

    if (step === 0) {
      if (!form.fullName.trim()) {
        setError("Full name is required.");
        return false;
      }
      if (!form.email.trim()) {
        setError("Email is required.");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        return false;
      }
      if (form.email.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        setError(
          "Email must match your login email (" + user?.email + ") so the system can find your profile."
        );
        return false;
      }
      if (!resumeFile) {
        setResumeError("Please upload your resume.");
        return false;
      }
    }

    if (step === 1) {
      if (!form.departmentId) {
        setError("Please select a department.");
        return false;
      }
      if (!form.gpa) {
        setError("GPA is required.");
        return false;
      }
      const gpaNum = parseFloat(form.gpa);
      if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
        setError("GPA must be between 0.00 and 10.00.");
        return false;
      }
      if (!form.graduationYear) {
        setError("Graduation year is required.");
        return false;
      }
      const yearNum = parseInt(form.graduationYear);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        setError("Graduation year must be between 2020 and 2030.");
        return false;
      }
      const projNum = parseFloat(form.projectScore);
      if (isNaN(projNum) || projNum < 0 || projNum > 100) {
        setError("Project score must be between 0 and 100.");
        return false;
      }
    }

    if (step === 2) {
      if (selectedSkills.length === 0) {
        setError("Please add at least one skill.");
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (validateStep()) setStep((s) => s + 1);
  }

  function prevStep() {
    setError(null);
    setResumeError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const gpaValue     = parseFloat(parseFloat(form.gpa).toFixed(2));
      const projectValue = parseFloat(parseFloat(form.projectScore || "0").toFixed(2));

      const studentPayload = {
        fullName:       form.fullName.trim(),
        email:          form.email.trim().toLowerCase(),
        phone:          form.phone.trim() || null,
        departmentId:   Number(form.departmentId),
        gpa:            gpaValue,
        graduationYear: Number(form.graduationYear),
        backlogs:       Number(form.backlogs) || 0,
        resumeUrl:      resumeFile ? resumeFile.name : null,
        projectScore:   projectValue,
        isPlaced:       false,
        isActive:       true,
      };

      const studentRes = await api.post("/students", studentPayload);
      const studentId  = studentRes.data.data.studentId;

      for (const skill of selectedSkills) {
        try {
          await api.post(
            `/students/${studentId}/skills/${skill.skillId}?proficiencyLevel=${skill.proficiencyLevel}`
          );
        } catch {
          // individual skill failure must not abort the whole flow
        }
      }

      navigate("/dashboard");
    } catch (err) {
      const raw = err.response?.data?.message || "";
      const status = err.response?.status;

      if (
        raw.toLowerCase().includes("duplicate") ||
        raw.toLowerCase().includes("already exists") ||
        raw.toLowerCase().includes("unique constraint")
      ) {
        setError(
          "A profile with this email already exists. If you have already completed onboarding, please sign out and log in again."
        );
      } else if (status === 400) {
        setError("Invalid data submitted. Please review your details and try again.");
      } else if (status === 500) {
        setError("Server error. Please ensure Spring Boot and the database are running.");
      } else if (!raw) {
        setError("Connection failed. Please ensure all servers are running.");
      } else {
        setError(raw);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const deptName =
    departments.find((d) => d.departmentId === Number(form.departmentId))
      ?.deptName || "—";

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 pb-12 px-4">
      <div className="w-full max-w-2xl">

        <div className="mb-8 text-center">
          <p className="text-lg font-medium text-gray-900">LASIS</p>
          <p className="text-xs text-gray-400 mt-0.5">Placement Intelligence</p>
          <h1 className="text-xl font-medium text-gray-900 mt-4">
            Set up your student profile
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            This links your account to the placement system.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <StepIndicator current={step} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5 leading-relaxed">
              {error}
            </div>
          )}

          {/* STEP 0: Profile */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Personal details
              </p>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleField}
                  placeholder="e.g. Shreejal Mehta"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleField}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Must match your login email so the system can find your profile.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Phone (optional)
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleField}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              <ResumeUpload
                file={resumeFile}
                onFile={setResumeFile}
                error={resumeError}
              />
            </div>
          )}

          {/* STEP 1: Academic */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Academic details
              </p>

              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="departmentId"
                  value={form.departmentId}
                  onChange={handleField}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.deptName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    GPA (0.00 – 10.00) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="gpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.gpa}
                    onChange={handleField}
                    placeholder="e.g. 8.50"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Graduation year <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="graduationYear"
                    type="number"
                    min="2020"
                    max="2030"
                    value={form.graduationYear}
                    onChange={handleField}
                    placeholder="e.g. 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Active backlogs
                  </label>
                  <input
                    name="backlogs"
                    type="number"
                    min="0"
                    value={form.backlogs}
                    onChange={handleField}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Project score (0 – 100)
                  </label>
                  <input
                    name="projectScore"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.projectScore}
                    onChange={handleField}
                    placeholder="e.g. 85"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Score reflecting your project work quality (0–100).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Skills */}
          {step === 2 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Select your skills <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Click a skill to add it, then set your proficiency level.
              </p>

              <input
                type="text"
                placeholder="Search skills..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-teal-500"
              />

              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-5 p-1">
                {filteredSkills.map((skill) => {
                  const selected = selectedSkills.find(
                    (s) => s.skillId === skill.skillId
                  );
                  return (
                    <button
                      key={skill.skillId}
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selected
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {skill.skillName}
                    </button>
                  );
                })}
                {filteredSkills.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No skills match your search.
                  </p>
                )}
              </div>

              {selectedSkills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-3">
                    Set proficiency for each selected skill
                  </p>
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {selectedSkills.map((s) => (
                      <div
                        key={s.skillId}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2"
                      >
                        <span className="text-sm text-gray-700">
                          {s.skillName}
                        </span>
                        <div className="flex gap-1">
                          {PROFICIENCY_LEVELS.map((level) => (
                            <button
                              key={level}
                              onClick={() => setProficiency(s.skillId, level)}
                              className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                s.proficiencyLevel === level
                                  ? proficiencyColor(level)
                                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                              }`}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Review your profile
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-400">Personal</p>
                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Full name</p>
                    <p className="text-sm text-gray-800">{form.fullName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm text-gray-800">{form.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm text-gray-800">{form.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Resume</p>
                    <p className="text-sm text-teal-700 font-medium">
                      ✓ {resumeFile?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-400">Academic</p>
                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className="text-xs text-gray-400">Department</p>
                    <p className="text-sm text-gray-800">{deptName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">GPA</p>
                    <p className="text-sm text-gray-800">
                      {parseFloat(form.gpa) || 0} / 10
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Graduation year</p>
                    <p className="text-sm text-gray-800">{form.graduationYear}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Backlogs</p>
                    <p className="text-sm text-gray-800">
                      {parseInt(form.backlogs) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Project score</p>
                    <p className="text-sm text-gray-800">
                      {parseFloat(form.projectScore) || 0} / 100
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">
                  Skills ({selectedSkills.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((s) => (
                    <span
                      key={s.skillId}
                      className={`text-xs px-2.5 py-1 rounded-full ${proficiencyColor(s.proficiencyLevel)}`}
                    >
                      {s.skillName} · {s.proficiencyLevel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={prevStep}
                disabled={submitting}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                className="text-sm font-medium px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm font-medium px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Creating profile..." : "Complete setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}