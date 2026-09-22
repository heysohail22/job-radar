import React, { useState } from "react";
import { X, Plus, Trash2, Check, User, Wrench, Rocket, GraduationCap } from "lucide-react";
import type { ResumeDataType, SkillCategory, ProjectItem } from "../lib/resumeData";

interface ResumeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeDataType;
  onSave: (updated: ResumeDataType) => void;
  onReset: () => void;
}

export const ResumeEditorModal: React.FC<ResumeEditorModalProps> = ({
  isOpen,
  onClose,
  resume,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<ResumeDataType>(resume);
  const [activeTab, setActiveTab] = useState<"header" | "skills" | "projects" | "education">("header");

  // Keep form in sync when props change
  React.useEffect(() => {
    setFormData(resume);
  }, [resume]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // Skill item helper
  const handleUpdateSkillItems = (catIdx: number, itemsStr: string) => {
    const updated = [...formData.skills];
    updated[catIdx] = {
      ...updated[catIdx],
      items: itemsStr.split(",").map((s) => s.trim()).filter(Boolean),
    };
    setFormData({ ...formData, skills: updated });
  };

  // Add new skill category
  const handleAddSkillCategory = () => {
    const newCategory: SkillCategory = {
      category: "New Skill Group",
      items: ["Skill 1", "Skill 2"],
    };
    setFormData({ ...formData, skills: [...formData.skills, newCategory] });
  };

  // Remove skill category
  const handleRemoveSkillCategory = (idx: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== idx),
    });
  };

  // Project bullet update
  const handleUpdateProjectBullet = (pIdx: number, bIdx: number, val: string) => {
    const updated = [...formData.projects];
    const bullets = [...updated[pIdx].bullets];
    bullets[bIdx] = val;
    updated[pIdx] = { ...updated[pIdx], bullets };
    setFormData({ ...formData, projects: updated });
  };

  const handleAddProjectBullet = (pIdx: number) => {
    const updated = [...formData.projects];
    updated[pIdx] = {
      ...updated[pIdx],
      bullets: [...updated[pIdx].bullets, "New quantifiable engineering achievement or metric."],
    };
    setFormData({ ...formData, projects: updated });
  };

  const handleRemoveProjectBullet = (pIdx: number, bIdx: number) => {
    const updated = [...formData.projects];
    updated[pIdx] = {
      ...updated[pIdx],
      bullets: updated[pIdx].bullets.filter((_, i) => i !== bIdx),
    };
    setFormData({ ...formData, projects: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-[#101828] border border-[#232B3B] flex flex-col max-h-[90vh] shadow-2xl text-left overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#232B3B] bg-[#080F18]/80">
          <div>
            <h3 className="font-extrabold text-base text-[#F8F8F8]">Edit Resume Information</h3>
            <p className="text-xs text-[#AAB4C5]">Structured editor for summary, skills, and projects</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-[#232B3B] bg-[#101828] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("header")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === "header"
                ? "bg-[#4F46E5] text-white"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }`}
          >
            <User size={14} />
            <span>Profile & Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("skills")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === "skills"
                ? "bg-[#4F46E5] text-white"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }`}
          >
            <Wrench size={14} />
            <span>Skills ({formData.skills.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === "projects"
                ? "bg-[#4F46E5] text-white"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }`}
          >
            <Rocket size={14} />
            <span>Projects ({formData.projects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === "education"
                ? "bg-[#4F46E5] text-white"
                : "text-[#AAB4C5] hover:text-[#F8F8F8] hover:bg-[#181F30]"
            }`}
          >
            <GraduationCap size={14} />
            <span>Education & Contact</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Tab 1: Header & Summary */}
          {activeTab === "header" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[#AAB4C5] font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-[#AAB4C5] font-bold mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#AAB4C5] font-bold mb-1">Professional Summary</label>
                <textarea
                  rows={4}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#181F30] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1] leading-relaxed resize-y font-sans"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Technical Skills */}
          {activeTab === "skills" && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#AAB4C5]">Group skills into logical categories</span>
                <button
                  type="button"
                  onClick={handleAddSkillCategory}
                  className="px-2.5 py-1.5 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Skill Group</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.skills.map((skillGroup, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#181F30] border border-[#232B3B] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={skillGroup.category}
                        onChange={(e) => {
                          const updated = [...formData.skills];
                          updated[idx] = { ...updated[idx], category: e.target.value };
                          setFormData({ ...formData, skills: updated });
                        }}
                        className="font-bold text-xs text-[#6366F1] bg-transparent border-b border-[#232B3B] focus:border-[#6366F1] focus:outline-hidden px-1 py-0.5 w-1/2"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillCategory(idx)}
                        className="text-[#667085] hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={skillGroup.items.join(", ")}
                      onChange={(e) => handleUpdateSkillItems(idx, e.target.value)}
                      placeholder="Comma-separated items (e.g. Python, SQL, Docker)"
                      className="w-full px-3 py-2 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Projects */}
          {activeTab === "projects" && (
            <div className="space-y-5 text-xs">
              {formData.projects.map((proj, pIdx) => (
                <div key={pIdx} className="p-4 rounded-xl bg-[#181F30] border border-[#232B3B] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#AAB4C5] font-bold mb-1">Project Name</label>
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => {
                          const updated = [...formData.projects];
                          updated[pIdx] = { ...updated[pIdx], name: e.target.value };
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#AAB4C5] font-bold mb-1">Subtitle / Stack Overview</label>
                      <input
                        type="text"
                        value={proj.subtitle}
                        onChange={(e) => {
                          const updated = [...formData.projects];
                          updated[pIdx] = { ...updated[pIdx], subtitle: e.target.value };
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                      />
                    </div>
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#AAB4C5]">Bullets & Achievements</span>
                      <button
                        type="button"
                        onClick={() => handleAddProjectBullet(pIdx)}
                        className="text-[11px] text-[#A5B4FC] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={11} /> Add Bullet
                      </button>
                    </div>
                    {proj.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={b}
                          onChange={(e) => handleUpdateProjectBullet(pIdx, bIdx, e.target.value)}
                          className="flex-1 p-2 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1] leading-relaxed resize-y"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectBullet(pIdx, bIdx)}
                          className="text-[#667085] hover:text-rose-400 p-1.5 mt-1 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Education & Contact */}
          {activeTab === "education" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#181F30] border border-[#232B3B] space-y-3">
                <h4 className="font-bold text-[#F8F8F8]">Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.contact.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.contact.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact, phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.contact.location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact, location: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={formData.contact.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact: { ...formData.contact, linkedin: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#181F30] border border-[#232B3B] space-y-3">
                <h4 className="font-bold text-[#F8F8F8]">Education Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">Degree</label>
                    <input
                      type="text"
                      value={formData.education.degree}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          education: { ...formData.education, degree: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#AAB4C5] font-semibold mb-1">Institution</label>
                    <input
                      type="text"
                      value={formData.education.institution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          education: { ...formData.education, institution: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-[#101828] border border-[#232B3B] text-[#F8F8F8] focus:outline-hidden focus:border-[#6366F1]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#232B3B] bg-[#080F18]/90">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all resume edits back to default?")) {
                onReset();
                onClose();
              }
            }}
            className="text-xs text-[#AAB4C5] hover:text-rose-400 font-semibold cursor-pointer"
          >
            Reset to Default
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#181F30] hover:bg-[#232B3B] border border-[#232B3B] text-[#F8F8F8] text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#6366F1] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check size={14} />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
