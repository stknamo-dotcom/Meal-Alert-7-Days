import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Flame, AlignLeft, Info, Utensils, HelpCircle, Ban, Clock, Trash2 } from "lucide-react";
import { MealItem, MealStatus } from "../types";

interface MealEditModalProps {
  meal: MealItem | null;
  isOpen: boolean;
  defaultTime: string; // The global default time for this mealType
  onClose: () => void;
  onSave: (updatedMeal: MealItem) => void;
  onDelete?: (mealId: string) => void;
}

const MEAL_TYPE_TH = {
  breakfast: "มื้อเช้า 🌅",
  lunch: "มื้อเที่ยง ☀️",
  dinner: "มื้อเย็น 🌙",
  snack: "มื้อว่าง / อื่นๆ 🍎",
};

const DAY_TH = {
  Monday: "วันจันทร์",
  Tuesday: "วันอังคาร",
  Wednesday: "วันพุธ",
  Thursday: "วันพฤหัสบดี",
  Friday: "วันศุกร์",
  Saturday: "วันเสาร์",
  Sunday: "วันอาทิตย์",
};

export const MealEditModal: React.FC<MealEditModalProps> = ({
  meal,
  isOpen,
  defaultTime,
  onClose,
  onSave,
  onDelete,
}) => {
  const [menuName, setMenuName] = useState("");
  const [calories, setCalories] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<MealStatus>("planned");
  const [time, setTime] = useState("");
  const [useDefaultTime, setUseDefaultTime] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (meal) {
      setMenuName(meal.menuName);
      setCalories(meal.calories);
      setDescription(meal.description);
      setStatus(meal.status);
      setConfirmDelete(false);
      if (meal.time) {
        setTime(meal.time);
        setUseDefaultTime(false);
      } else {
        setTime(defaultTime);
        setUseDefaultTime(true);
      }
    }
  }, [meal, isOpen, defaultTime]);

  if (!meal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...meal,
      menuName: menuName.trim() || "มื้อว่างเพื่อสุขภาพ",
      calories: isNaN(calories) ? 0 : calories,
      description: description.trim(),
      status,
      time: useDefaultTime ? undefined : time,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg bg-white rounded-3xl border border-emerald-100 shadow-2xl shadow-emerald-950/15 overflow-hidden text-slate-800"
            id="meal_edit_modal"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs bg-emerald-500/30 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-400/20 font-semibold uppercase tracking-wider">
                  {DAY_TH[meal.day]}
                </span>
                <h3 className="text-lg font-black mt-1">
                  แก้ไข {MEAL_TYPE_TH[meal.mealType]}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full text-emerald-100 hover:text-white transition-colors"
                id="close_modal_btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Menu Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                  เมนูอาหารที่ทาน
                </label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  placeholder="เช่น ข้าวต้มปลา, อกไก่ย่างน้ำจิ้มแจ่ว"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-sm font-semibold text-slate-800 bg-slate-50/50"
                  required
                  id="menu_name_input"
                />
              </div>

              {/* Calories Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  พลังงานแคลอรี่ (kcal)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={calories || ""}
                    onChange={(e) => setCalories(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="เช่น 350"
                    min="0"
                    max="5000"
                    className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-sm font-semibold text-slate-800 bg-slate-50/50"
                    required
                    id="calories_input"
                  />
                  <span className="absolute right-4 font-mono text-xs font-bold text-slate-400">
                    KCAL
                  </span>
                </div>
              </div>

              {/* Alert Time Configuration */}
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    เวลาแจ้งเตือนมื้อนี้
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full font-bold">
                    {useDefaultTime ? "เวลามาตรฐาน" : "เวลาเจาะจง"}
                  </span>
                </label>

                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="use_default_time_chk"
                    checked={useDefaultTime}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseDefaultTime(checked);
                      if (checked) {
                        setTime(defaultTime);
                      }
                    }}
                    className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="use_default_time_chk" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    ใช้เวลามาตรฐานร่วมกัน ({defaultTime} น.)
                  </label>
                </div>

                {!useDefaultTime && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 space-y-1.5"
                  >
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold text-slate-800 bg-white"
                      id="custom_meal_time_input"
                    />
                    <span className="text-[10px] text-slate-400 font-medium block">
                      * มื้อนี้เฉพาะ{DAY_TH[meal.day]} จะแจ้งเตือนเวลา {time} น. แทนเวลามาตรฐาน
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                  ประโยชน์สุขภาพ / บันทึกย่อ
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดสารอาหาร หรือบันทึกวิธีการปรุง..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all text-sm font-semibold text-slate-800 bg-slate-50/50 resize-none leading-relaxed"
                  id="description_input"
                />
              </div>

              {/* Meal Status Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  สถานะความคืบหน้ามื้อนี้
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("planned")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === "planned"
                        ? "border-amber-500 bg-amber-50/70 text-amber-800 shadow-sm shadow-amber-200/50"
                        : "border-slate-150 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <HelpCircle className={`w-4 h-4 ${status === "planned" ? "text-amber-500" : "text-slate-400"}`} />
                    <span>วางแผนไว้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("eaten")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === "eaten"
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-sm shadow-emerald-200/50"
                        : "border-slate-150 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Check className={`w-4 h-4 ${status === "eaten" ? "text-emerald-500" : "text-slate-400"}`} />
                    <span>รับประทานแล้ว</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus("skipped")}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      status === "skipped"
                        ? "border-rose-500 bg-rose-50/70 text-rose-800 shadow-sm shadow-rose-200/50"
                        : "border-slate-150 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Ban className={`w-4 h-4 ${status === "skipped" ? "text-rose-500" : "text-slate-400"}`} />
                    <span>ข้ามมื้อนี้</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                {meal.isCustom && onDelete && (
                  <div className="w-full flex flex-col gap-2 bg-rose-50/50 p-3 rounded-2xl border border-rose-100">
                    {!confirmDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบมื้ออาหารเสริมนี้
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs font-black transition active:scale-95 cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(meal.id);
                            onClose();
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black transition active:scale-95 shadow-md shadow-rose-900/10 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          ยืนยันลบมื้อนี้
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm font-black transition active:scale-95 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-sm font-black transition active:scale-95 shadow-md shadow-emerald-800/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    บันทึกรายการ
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
