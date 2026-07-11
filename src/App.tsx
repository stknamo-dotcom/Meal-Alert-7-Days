import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Settings,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Trash2,
  RefreshCw,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Check,
  Flame,
  User,
  ExternalLink,
  ChevronRight,
  Plus,
  Compass,
  ArrowRight,
  RotateCcw,
  UtensilsCrossed,
  Info
} from "lucide-react";
import { MealItem, DayOfWeek, MealType, MealStatus, NotificationTimes, ReminderNotification } from "./types";
import { playChime, speakText } from "./components/SoundUtility";
import { DEFAULT_MEALS } from "./components/DefaultMeals";
import { MealEditModal } from "./components/MealEditModal";

const DAYS_ORDER: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAYS_TH: Record<DayOfWeek, { name: string; bg: string; text: string; lightBg: string }> = {
  Monday: { name: "วันจันทร์", bg: "bg-yellow-500", text: "text-yellow-700", lightBg: "bg-yellow-50" },
  Tuesday: { name: "วันอังคาร", bg: "bg-pink-500", text: "text-pink-700", lightBg: "bg-pink-50" },
  Wednesday: { name: "วันพุธ", bg: "bg-emerald-500", text: "text-emerald-700", lightBg: "bg-emerald-50" },
  Thursday: { name: "วันพฤหัสบดี", bg: "bg-orange-500", text: "text-orange-700", lightBg: "bg-orange-50" },
  Friday: { name: "วันศุกร์", bg: "bg-sky-500", text: "text-sky-700", lightBg: "bg-sky-50" },
  Saturday: { name: "วันเสาร์", bg: "bg-purple-500", text: "text-purple-700", lightBg: "bg-purple-50" },
  Sunday: { name: "วันอาทิตย์", bg: "bg-rose-500", text: "text-rose-700", lightBg: "bg-rose-50" },
};

const MEAL_DETAILS: Record<MealType, { name: string; icon: React.ReactNode; color: string; defaultTime: string }> = {
  breakfast: {
    name: "มื้อเช้า",
    icon: <Coffee className="w-4 h-4" />,
    color: "from-amber-400 to-orange-500",
    defaultTime: "08:00",
  },
  lunch: {
    name: "มื้อเที่ยง",
    icon: <Sun className="w-4 h-4" />,
    color: "from-emerald-400 to-teal-500",
    defaultTime: "12:00",
  },
  dinner: {
    name: "มื้อเย็น",
    icon: <Moon className="w-4 h-4" />,
    color: "from-indigo-400 to-purple-600",
    defaultTime: "18:00",
  },
  snack: {
    name: "มื้อว่าง / อื่นๆ",
    icon: <UtensilsCrossed className="w-4 h-4" />,
    color: "from-pink-400 to-rose-500",
    defaultTime: "15:00",
  },
};

const getMealDefaultTime = (mealType: MealType, times: NotificationTimes) => {
  if (mealType === "snack") return "15:00";
  return times[mealType];
};

const GOALS_TH = [
  { id: "balance", name: "สุขภาพดีสมดุล (Balance Healthy)", icon: "🥗" },
  { id: "weight-loss", name: "ควบคุมน้ำหนัก & สลายไขมัน (Weight Loss)", icon: "🏃" },
  { id: "muscle-gain", name: "เพิ่มกล้ามเนื้อ & โปรตีนสูง (Muscle Gain)", icon: "💪" },
  { id: "clean", name: "กินคลีนธรรมชาติ 100% (Clean Eating)", icon: "🍃" },
  { id: "budget", name: "ประหยัดงบ & ทำเองง่ายๆ (Budget Friendly)", icon: "🪙" },
];

export default function App() {
  // State variables loaded from local storage
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [notificationTimes, setNotificationTimes] = useState<NotificationTimes>({
    breakfast: "08:00",
    lunch: "12:00",
    dinner: "18:00",
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isDesktopNotificationEnabled, setIsDesktopNotificationEnabled] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("balance");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("meal_reminders_theme") === "dark";
  });

  // Local runtime state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ meal: MealItem; timeStr: string } | null>(null);
  const [countdownTest, setCountdownTest] = useState<number | null>(null);

  // Load state on mount
  useEffect(() => {
    const savedMeals = localStorage.getItem("meal_reminders_meals");
    if (savedMeals) {
      try {
        setMeals(JSON.parse(savedMeals));
      } catch (e) {
        setMeals(DEFAULT_MEALS);
      }
    } else {
      setMeals(DEFAULT_MEALS);
    }

    const savedTimes = localStorage.getItem("meal_reminders_times");
    if (savedTimes) {
      try {
        setNotificationTimes(JSON.parse(savedTimes));
      } catch (e) {}
    }

    const savedSound = localStorage.getItem("meal_reminders_sound");
    if (savedSound !== null) setIsSoundEnabled(savedSound === "true");

    const savedVoice = localStorage.getItem("meal_reminders_voice");
    if (savedVoice !== null) setIsVoiceEnabled(savedVoice === "true");

    const savedGoal = localStorage.getItem("meal_reminders_goal");
    if (savedGoal) setSelectedGoal(savedGoal);

    // Initial permission check
    if ("Notification" in window) {
      setIsDesktopNotificationEnabled(Notification.permission === "granted");
    }
  }, []);

  // Sync state to local storage
  const updateMeals = (newMeals: MealItem[]) => {
    setMeals(newMeals);
    localStorage.setItem("meal_reminders_meals", JSON.stringify(newMeals));
  };

  const updateTimes = (newTimes: NotificationTimes) => {
    setNotificationTimes(newTimes);
    localStorage.setItem("meal_reminders_times", JSON.stringify(newTimes));
    showToast("บันทึกเวลาเตือนเริ่มต้นเรียบร้อยแล้ว", "success");
  };

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem("meal_reminders_theme", nextVal ? "dark" : "light");
    showToast(nextVal ? "เปิดใช้งานโหมดมืด (Dark Mode) สำหรับตอนกลางคืนแล้ว 🌙" : "เปิดใช้งานโหมดสว่าง (Light Mode) ☀️", "success");
  };

  // Real-time tick engine
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Perform check on every new minute boundary
      if (now.getSeconds() === 0) {
        checkAndTriggerNotifications(now);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [meals, notificationTimes, isSoundEnabled, isVoiceEnabled, isDesktopNotificationEnabled]);

  // Request browser notification permissions
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนระบบ", "error");
      return;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === "granted";
    setIsDesktopNotificationEnabled(granted);

    if (granted) {
      showToast("เปิดใช้งานการแจ้งเตือนบนเบราว์เซอร์สำเร็จ!", "success");
      new Notification("แอปแจ้งเตือนมื้ออาหารสุขภาพ", {
        body: "ขอบคุณที่อนุญาตระบบแจ้งเตือน! เราจะแจ้งเวลาอาหารของคุณทุกวัน",
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='64' height='64'><rect width='24' height='24' fill='%2310b981' rx='6'/><text x='50%' y='65%' text-anchor='middle' fill='white' font-size='12' font-weight='bold'>🥗</text></svg>"
      });
    } else {
      showToast("การอนุญาตถูกปฏิเสธ คุณสามารถเปิดรับการแจ้งเตือนในแอปแทนได้", "info");
    }
  };

  // Toast feedback helper
  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to map Date index to English DayOfWeek
  const getDayOfWeekName = (dayIndex: number): DayOfWeek => {
    const map: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return map[dayIndex];
  };

  // Check and fire alerts
  const checkAndTriggerNotifications = (now: Date) => {
    const currentDay = getDayOfWeekName(now.getDay());
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${hours}:${minutes}`;

    // Loop through meals to find match
    const updatedMeals = [...meals];
    let stateChanged = false;

    // Check all meals assigned to today
    const todayMeals = updatedMeals.filter((m) => m.day === currentDay);
    todayMeals.forEach((meal) => {
      // Use the custom meal alarm time if set, otherwise fallback to global standard settings
      const alarmTime = meal.time || getMealDefaultTime(meal.mealType, notificationTimes);
      if (currentTimeStr === alarmTime && !meal.notified) {
        meal.notified = true;
        stateChanged = true;
        triggerAlert(meal, currentTimeStr);
      }
    });

    // Reset notification flags at midnight
    if (currentTimeStr === "00:00") {
      updatedMeals.forEach((m) => (m.notified = false));
      stateChanged = true;
    }

    if (stateChanged) {
      updateMeals(updatedMeals);
    }
  };

  // Core trigger routine for chime, voice, OS banner & popup overlay
  const triggerAlert = (meal: MealItem, timeStr: string) => {
    // 1. Synthesize chime sound
    if (isSoundEnabled) {
      playChime();
    }

    // 2. TTS Announcement
    if (isVoiceEnabled) {
      const mealNameTh = MEAL_DETAILS[meal.mealType].name;
      const ttsMessage = `ได้เวลารับประทาน ${mealNameTh} ประจำ ${DAYS_TH[meal.day].name} แล้วค่ะ วันนี้คุณมีเมนูสุขภาพคือ ${meal.menuName} พลังงานโดยประมาณ ${meal.calories} แคลอรี่ อย่าลืมรับประทานอาหารให้ตรงเวลานะคะ`;
      
      // Delay speech slightly to allow the chime to finish playing smoothly
      setTimeout(() => speakText(ttsMessage), 1000);
    }

    // 3. Desktop Native Banner
    if (isDesktopNotificationEnabled && "Notification" in window && Notification.permission === "granted") {
      new Notification(`🔔 ได้เวลารับประทาน ${MEAL_DETAILS[meal.mealType].name}!`, {
        body: `เมนูวันนี้: ${meal.menuName} (${meal.calories} kcal)\nสุขภาพดีสร้างได้ทุกมื้ออาหาร`,
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='64' height='64'><circle cx='12' cy='12' r='10' fill='%2310b981'/><text x='50%' y='65%' text-anchor='middle' fill='white' font-size='12' font-weight='bold'>🍽️</text></svg>"
      });
    }

    // 4. In-App Modal alert panel
    setActiveAlert({ meal, timeStr });
  };

  // Simulate Instant Alarm for Demonstration/Testing
  const simulateInstantAlarm = () => {
    if (countdownTest !== null) return;
    
    setCountdownTest(5);
    showToast("เริ่มระบบทดสอบจำลองเตือนความจำใน 5 วินาที...", "info");

    const interval = setInterval(() => {
      setCountdownTest((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          
          // Pick a random meal to simulate
          const randomMeal = meals[Math.floor(Math.random() * meals.length)] || DEFAULT_MEALS[0];
          triggerAlert(
            {
              ...randomMeal,
              menuName: randomMeal.menuName + " (มื้อจำลองทดสอบระบบ)",
            },
            new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })
          );
          
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // AI Generation Trigger using server route
  const generateMealPlanWithAI = async () => {
    setIsAILoading(true);
    showToast("กำลังให้แพทย์โภชนาการ AI (Gemini) ออกแบบรายการอาหาร 7 วันของคุณ...", "info");

    try {
      const response = await fetch("/api/generate-meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: GOALS_TH.find((g) => g.id === selectedGoal)?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.meals) {
        throw new Error(data.error || "ไม่สามารถเชื่อมต่อระบบ AI ได้ในขณะนี้");
      }

      // Convert response to local meal plan schema
      const mappedMeals: MealItem[] = data.meals.map((m: any, index: number) => {
        // Find match or map standard day name to English
        const formattedDay = m.day as DayOfWeek;
        const formattedMealType = m.mealType as MealType;

        return {
          id: `${formattedDay}-${formattedMealType}`,
          day: formattedDay,
          mealType: formattedMealType,
          menuName: m.menuName,
          calories: m.calories || 300,
          description: m.description || "",
          status: "planned",
        };
      });

      // Confirm we got 21 meals, otherwise merge or fill missing
      if (mappedMeals.length > 0) {
        // Update local state and save
        updateMeals(mappedMeals);
        localStorage.setItem("meal_reminders_goal", selectedGoal);
        
        // Play success chime
        playChime();
        showToast("ปรับปรุงแผนอาหารอัจฉริยะ 7 วันด้วย AI สำเร็จแล้ว!", "success");
        speakText("ระบบจัดทำเมนูอาหารเพื่อสุขภาพด้วยเอไอเจมินายเสร็จสิ้นเรียบร้อยแล้วค่ะ แผนสุขภาพใหม่พร้อมสำหรับคุณแล้ว");
      } else {
        throw new Error("โครงสร้างข้อมูลอาหารจาก AI ไม่ถูกต้อง");
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "ล้มเหลวในการเชื่อมต่อ AI กำลังใช้แผนสำรองสุขภาพแทน", "error");
      
      // Fallback: Randomize slightly or reset
      const randomizedFallback = DEFAULT_MEALS.map((m) => ({
        ...m,
        status: "planned" as const,
        menuName: m.menuName.replace("อกไก่", "ปลาแซลมอนย่าง"),
      }));
      updateMeals(randomizedFallback);
    } finally {
      setIsAILoading(false);
    }
  };

  // Reset to original preset plan
  const resetToDefaultPlan = () => {
    if (confirm("คุณต้องการล้างข้อมูลแผนปัจจุบันและเปลี่ยนกลับเป็นเมนูเริ่มต้นใช่หรือไม่?")) {
      updateMeals(DEFAULT_MEALS);
      showToast("คืนค่าตารางอาหาร 7 วันสไตล์สุขภาพดั้งเดิมเรียบร้อย", "info");
    }
  };

  // Handle single meal save from modal
  const handleSaveMeal = (updatedMeal: MealItem) => {
    const updated = meals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m));
    updateMeals(updated);
    showToast(`อัปเดตเมนู ${MEAL_DETAILS[updatedMeal.mealType].name} สำเร็จ`, "success");
  };

  // Handle single custom meal deletion
  const handleDeleteMeal = (mealId: string) => {
    const updated = meals.filter((m) => m.id !== mealId);
    updateMeals(updated);
    showToast("ลบมื้ออาหารเสริมออกเรียบร้อยแล้ว", "info");
  };

  // Add custom meal to a day
  const handleAddMeal = (selectedDay: DayOfWeek, selectedType: MealType) => {
    const mealTypeName = MEAL_DETAILS[selectedType].name;
    const newMeal: MealItem = {
      id: `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      day: selectedDay,
      mealType: selectedType,
      menuName: `อาหารเสริม / ${mealTypeName} ใหม่`,
      calories: selectedType === "snack" ? 120 : 350,
      description: "",
      status: "planned",
      isCustom: true,
      time: selectedType === "snack" ? "15:00" : undefined // if snack, default to 15:00
    };

    updateMeals([...meals, newMeal]);
    setEditingMeal(newMeal);
    showToast(`เพิ่มมื้อ ${mealTypeName} ของ ${DAYS_TH[selectedDay].name} แล้ว! กำลังเปิดเมนูให้คุณแก้ไข`, "success");
  };

  // Switch status from inline or card quickly
  const toggleMealStatus = (id: string, newStatus: MealStatus) => {
    const updated = meals.map((m) => {
      if (m.id === id) {
        return { ...m, status: newStatus };
      }
      return m;
    });
    updateMeals(updated);
    
    if (newStatus === "eaten") {
      playChime();
      showToast("บันทึกอาหารมื้อสุขภาพลงท้องเรียบร้อย! ยอดเยี่ยมมาก 🎉", "success");
    } else {
      showToast("บันทึกการเปลี่ยนสถานะเรียบร้อย", "info");
    }
  };

  // Aggregate values for Bento Stats
  const totalPlannedMeals = meals.length || 21;
  const eatenMealsCount = meals.filter((m) => m.status === "eaten").length;
  const skippedMealsCount = meals.filter((m) => m.status === "skipped").length;
  const remainingMealsCount = totalPlannedMeals - eatenMealsCount - skippedMealsCount;

  const totalCaloriesEaten = meals
    .filter((m) => m.status === "eaten")
    .reduce((sum, m) => sum + m.calories, 0);

  const totalCaloriesPlanned = meals.reduce((sum, m) => sum + m.calories, 0);

  const completionPercentage = totalPlannedMeals > 0 
    ? Math.round((eatenMealsCount / totalPlannedMeals) * 100) 
    : 0;

  // Find next upcoming meal
  const getNextMealInfo = () => {
    const now = new Date();
    const currentDay = getDayOfWeekName(now.getDay());
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    const parseTimeToMin = (tStr: string) => {
      if (!tStr) return 0;
      const [h, m] = tStr.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    // Get all meals for today
    const todayMeals = meals.filter((m) => m.day === currentDay);
    
    // Sort today's meals by their alarm time
    const todayMealsWithTime = todayMeals.map(m => {
      const timeStr = m.time || getMealDefaultTime(m.mealType, notificationTimes);
      return {
        meal: m,
        timeStr,
        min: parseTimeToMin(timeStr)
      };
    }).sort((a, b) => a.min - b.min);

    // Find the first meal today that is in the future
    const futureMealToday = todayMealsWithTime.find(item => item.min > currentTotalMin);

    if (futureMealToday) {
      return {
        type: futureMealToday.meal.mealType,
        timeStr: futureMealToday.timeStr,
        mealItem: futureMealToday.meal,
        statusText: "กำลังรอถึงเวลา",
      };
    }

    // If no future meal today, find the first meal tomorrow
    const tomorrowIndex = (now.getDay() + 1) % 7;
    const tomorrowDay = getDayOfWeekName(tomorrowIndex);
    const tomorrowMeals = meals.filter((m) => m.day === tomorrowDay);

    const tomorrowMealsWithTime = tomorrowMeals.map(m => {
      const timeStr = m.time || getMealDefaultTime(m.mealType, notificationTimes);
      return {
        meal: m,
        timeStr,
        min: parseTimeToMin(timeStr)
      };
    }).sort((a, b) => a.min - b.min);

    if (tomorrowMealsWithTime.length > 0) {
      const firstTomorrow = tomorrowMealsWithTime[0];
      return {
        type: firstTomorrow.meal.mealType,
        timeStr: firstTomorrow.timeStr,
        mealItem: firstTomorrow.meal,
        statusText: "วันพรุ่งนี้เช้า/มื้อแรก",
      };
    }

    // Fallback if no meals found at all
    return {
      type: "breakfast" as MealType,
      timeStr: "08:00",
      mealItem: undefined,
      statusText: "ไม่มีข้อมูลมื้ออาหาร",
    };
  };

  const nextMeal = getNextMealInfo();

  // Format current date beautifully in Thai
  const formatThaiDate = (date: Date) => {
    const daysTh = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
    const monthsTh = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    
    const dayName = daysTh[date.getDay()];
    const dayNum = date.getDate();
    const monthName = monthsTh[date.getMonth()];
    const yearNum = date.getFullYear() + 543; // Buddhist Era
    
    const timeStr = date.toLocaleTimeString("th-TH", { hour12: false });
    
    return {
      fullDate: `${dayName}ที่ ${dayNum} ${monthName} พ.ศ. ${yearNum}`,
      time: timeStr,
    };
  };

  const thaiDate = formatThaiDate(currentTime);

  return (
    <div className={`min-h-screen font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors duration-300 ${
      darkMode ? "dark dark-theme bg-slate-950 text-slate-100" : "bg-slate-50/80 text-slate-800"
    }`} id="app_root">
      {/* Visual Organic Background Shapes */}
      <div className={`absolute top-0 left-0 right-0 h-[380px] -z-10 transition-colors duration-300 ${
        darkMode ? "bg-gradient-to-b from-indigo-950/40 to-indigo-950/0" : "bg-gradient-to-b from-emerald-50 to-emerald-50/0"
      }`} />

      {/* Main Header Nav */}
      <header className="h-20 px-6 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-100" id="app_header">
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button (Sun/Moon) */}
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              darkMode
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
                : "bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50"
            }`}
            title={darkMode ? "สลับเป็นโหมดสว่าง (Light Mode) ☀️" : "สลับเป็นโหมดมืด (Dark Mode) 🌙"}
            id="toggle_theme_btn"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              Meal Alert 7 Days
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                โภชนาการอัจฉริยะ
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">ตารางอาหาร 3 มื้อและแจ้งเตือนครบวงจร</p>
          </div>
        </div>

        {/* Global Settings & Toggles */}
        <div className="flex items-center gap-2.5">
          {/* Audio Chime Config */}
          <button
            onClick={() => {
              setIsSoundEnabled(!isSoundEnabled);
              localStorage.setItem("meal_reminders_sound", String(!isSoundEnabled));
              showToast(!isSoundEnabled ? "เปิดเสียงเตือน Chime" : "ปิดเสียงเตือน Chime", "info");
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              isSoundEnabled
                ? "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
            title={isSoundEnabled ? "ปิดเสียงกริ่งเตือน" : "เปิดเสียงกริ่งเตือน"}
            id="toggle_sound_btn"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* AI TTS Voice Config */}
          <button
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              localStorage.setItem("meal_reminders_voice", String(!isVoiceEnabled));
              showToast(!isVoiceEnabled ? "เปิดเสียงผู้ประกาศข่าว AI (ภาษาไทย)" : "ปิดเสียงพูด AI", "info");
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              isVoiceEnabled
                ? "bg-white border-teal-100 text-teal-600 hover:bg-teal-50"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
            title={isVoiceEnabled ? "ปิดเสียงอ่านเมนูอาหาร" : "เปิดเสียงอ่านเมนูอาหาร"}
            id="toggle_voice_btn"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              AI พูด
            </span>
          </button>

          {/* OS Push Banner Setup */}
          <button
            onClick={requestNotificationPermission}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isDesktopNotificationEnabled
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            id="toggle_browser_push_btn"
          >
            <Bell className={`w-3.5 h-3.5 ${isDesktopNotificationEnabled ? "animate-pulse" : ""}`} />
            <span className="hidden sm:inline">
              {isDesktopNotificationEnabled ? "เตือนระบบเปิดแล้ว" : "ขอสิทธิ์เตือนเบราว์เซอร์"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6" id="dashboard_workspace">
        
        {/* Toast Notification Container */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`fixed top-4 right-4 z-50 px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
                toastMessage.type === "success"
                  ? "bg-white border-emerald-100 text-slate-800"
                  : toastMessage.type === "error"
                  ? "bg-rose-50 border-rose-100 text-rose-800"
                  : "bg-sky-50 border-sky-100 text-sky-800"
              }`}
              id="toast_banner"
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : toastMessage.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-sky-500 shrink-0" />
              )}
              <span className="text-xs font-black">{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Bento Dashboard Panel (Aesthetic Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6" id="bento_stats_section">
          
          {/* Card 1: Beautiful clock and active schedule (Spans 4 columns) */}
          <div className="md:col-span-4 bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden" id="clock_bento">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/5 to-teal-500/10 rounded-bl-full pointer-events-none" />
            
            <div className="space-y-1.5">
              <span className="text-[10px] bg-slate-100 text-slate-500 font-black tracking-widest uppercase px-2.5 py-1 rounded-lg">
                เวลาท้องถิ่นปัจจุบัน
              </span>
              <div className="pt-2">
                <span className="text-4xl font-mono font-black tracking-tight text-slate-900 block leading-none">
                  {thaiDate.time}
                </span>
                <span className="text-xs font-bold text-slate-400 block mt-1.5">
                  {thaiDate.fullDate}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black text-emerald-600">
                  ระบบวิเคราะห์เวลาทำงานอยู่
                </span>
              </div>
              
              {/* Test system button */}
              <button
                onClick={simulateInstantAlarm}
                disabled={countdownTest !== null}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black rounded-xl transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="คลิกเพื่อจำลองเหตุการณ์แจ้งเตือนมื้ออาหารทันทีโดยไม่ต้องรอเวลา"
                id="simulate_alarm_btn"
              >
                {countdownTest !== null ? (
                  <span>เตือนใน {countdownTest}s...</span>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>ทดสอบระบบเตือน</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: AI Planner & Goal selector (Spans 4 columns) */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden" id="ai_planner_bento">
            <div className="absolute top-0 right-0 w-40 h-40 bg-radial-gradient from-emerald-500/20 via-transparent to-transparent opacity-60 pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  ตัวกำหนดเป้าหมายสุขภาพ AI
                </h3>
                {isAILoading && (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                )}
              </div>

              {/* Goal dropdown Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  เป้าหมายโภชนาการของคุณ:
                </label>
                <div className="relative">
                  <select
                    value={selectedGoal}
                    onChange={(e) => {
                      setSelectedGoal(e.target.value);
                      localStorage.setItem("meal_reminders_goal", e.target.value);
                    }}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-400 transition"
                    id="goal_select_dropdown"
                  >
                    {GOALS_TH.map((g) => (
                      <option key={g.id} value={g.id} className="text-slate-800 bg-white font-bold text-xs">
                        {g.icon} {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={generateMealPlanWithAI}
                disabled={isAILoading}
                className="flex-grow py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                id="ai_generate_plan_btn"
              >
                <Sparkles className="w-4 h-4" />
                <span>จัดอาหาร 7 วันด้วย AI (Gemini)</span>
              </button>

              <button
                onClick={resetToDefaultPlan}
                disabled={isAILoading}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                title="รีเซ็ตกลับเป็นเมนูดั้งเดิม"
                id="reset_meals_btn"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Eating Progress & Calories (Spans 3 columns) */}
          <div className="md:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between shadow-sm" id="progress_bento">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                ความคืบหน้าสัปดาห์นี้
              </h3>
              <span className="text-xs font-mono font-black text-emerald-600">
                {completionPercentage}%
              </span>
            </div>

            {/* Circular progress simulated bar */}
            <div className="flex items-center gap-4 py-1">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center bg-slate-50 rounded-full border border-slate-100">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    className="stroke-slate-100 stroke-[4] fill-none"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="18"
                    className="stroke-emerald-500 stroke-[4] fill-none"
                    strokeDasharray={2 * Math.PI * 18}
                    initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - completionPercentage / 100) }}
                    transition={{ duration: 0.8 }}
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-black text-slate-700">
                  {eatenMealsCount}/{totalPlannedMeals}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  ทานตรงเวลา
                </span>
                <span className="text-sm font-black text-slate-800">
                  {eatenMealsCount} จาก {totalPlannedMeals} มื้อ
                </span>
              </div>
            </div>

            {/* Calorie breakdown */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                  ทานแล้วรวม
                </span>
                <span className="text-xs font-mono font-black text-emerald-600">
                  {totalCaloriesEaten} kcal
                </span>
              </div>
              <div className="border-l border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">
                  แคลอรีทั้งหมด
                </span>
                <span className="text-xs font-mono font-black text-slate-600">
                  {totalCaloriesPlanned} kcal
                </span>
              </div>
            </div>
          </div>

        </section>

        {/* 2. Next Upcoming Meal Banner Card */}
        <section className="bg-emerald-50 border border-emerald-100/70 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm" id="next_meal_banner">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-150 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
              {MEAL_DETAILS[nextMeal.type].icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  เตือนความจำมื้ออาหารคิวถัดไปของคุณ ({nextMeal.statusText})
                </span>
                <span className="text-[10px] font-mono font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  ⏰ {nextMeal.timeStr} น.
                </span>
              </div>
              
              {nextMeal.mealItem ? (
                <div className="mt-1">
                  <h4 className="text-base font-black text-slate-900 leading-snug">
                    {nextMeal.mealItem.menuName}
                  </h4>
                  <p className="text-xs text-emerald-800/80 mt-0.5 font-medium flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>พลังงานประมาณ {nextMeal.mealItem.calories} kcal | </span>
                    <span className="line-clamp-1">{nextMeal.mealItem.description}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1">ยังไม่มีกำหนดรายการอาหารในเวลานี้</p>
              )}
            </div>
          </div>

          {nextMeal.mealItem && (
            <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
              {nextMeal.mealItem.status !== "eaten" ? (
                <button
                  onClick={() => nextMeal.mealItem && toggleMealStatus(nextMeal.mealItem.id, "eaten")}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/10 cursor-pointer"
                  id="mark_next_eaten_btn"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ฉันทานเสร็จแล้ว</span>
                </button>
              ) : (
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1 px-3 py-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  คุณทานเรียบร้อยแล้ว
                </span>
              )}
            </div>
          )}
        </section>

        {/* 3. Global Notification Time Setting Card */}
        <section className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm" id="time_config_section">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-slate-500" />
            <h3 className="font-black text-slate-800 text-sm">
              ตั้งค่าเวลาสำหรับการแจ้งเตือนแต่ละมื้อ (มีผลทั้ง 7 วัน)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Breakfast Time input */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">แจ้งเตือนมื้อเช้า</span>
                  <span className="text-[10px] text-slate-400 block font-medium">เริ่มต้นวันดีๆ</span>
                </div>
              </div>
              <input
                type="time"
                value={notificationTimes.breakfast}
                onChange={(e) => updateTimes({ ...notificationTimes, breakfast: e.target.value })}
                className="bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 outline-none"
                id="breakfast_time_input"
              />
            </div>

            {/* Lunch Time input */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">แจ้งเตือนมื้อเที่ยง</span>
                  <span className="text-[10px] text-slate-400 block font-medium">เพิ่มพลังช่วงบ่าย</span>
                </div>
              </div>
              <input
                type="time"
                value={notificationTimes.lunch}
                onChange={(e) => updateTimes({ ...notificationTimes, lunch: e.target.value })}
                className="bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 outline-none"
                id="lunch_time_input"
              />
            </div>

            {/* Dinner Time input */}
            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">แจ้งเตือนมื้อเย็น</span>
                  <span className="text-[10px] text-slate-400 block font-medium">มื้อเบาๆ พักผ่อน</span>
                </div>
              </div>
              <input
                type="time"
                value={notificationTimes.dinner}
                onChange={(e) => updateTimes({ ...notificationTimes, dinner: e.target.value })}
                className="bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold text-slate-800 outline-none"
                id="dinner_time_input"
              />
            </div>
          </div>
        </section>

        {/* 4. The 7-Day Weekly Interactive Meal Planner Grid */}
        <section className="space-y-4" id="weekly_planner_section">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-black text-slate-900">
                ตารางโภชนาการและการจัดการอาหาร 7 วัน (จันทร์ - อาทิตย์)
              </h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              *คลิกที่กล่องมื้ออาหารใดๆ เพื่อพิมพ์แก้ไขเมนู แคลอรี่ บันทึกย่อ หรือสลับสถานะ
            </span>
          </div>

          {/* 7 Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-5" id="days_7_grid">
            {DAYS_ORDER.map((day) => {
              const dayMeals = meals.filter((m) => m.day === day);
              const dayObj = DAYS_TH[day];

              return (
                <div
                  key={day}
                  className="bg-white border border-slate-150 rounded-3xl p-4 flex flex-col shadow-sm gap-3.5 relative overflow-hidden"
                  id={`day_card_${day}`}
                >
                  {/* Day Label Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${dayObj.bg} text-white`}>
                      {dayObj.name}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      {day.substring(0, 3)}
                    </span>
                  </div>

                  {/* Daily Eating Progress */}
                  {(() => {
                    const dayEatenMeals = dayMeals.filter((m) => m.status === "eaten");
                    const dayEatenCount = dayEatenMeals.length;
                    const dayTotalCount = dayMeals.length;
                    const dayProgressPercent = dayTotalCount > 0 ? Math.round((dayEatenCount / dayTotalCount) * 100) : 0;
                    const dayCaloriesEaten = dayEatenMeals.reduce((sum, m) => sum + m.calories, 0);
                    const dayCaloriesTotal = dayMeals.reduce((sum, m) => sum + m.calories, 0);

                    return (
                      <div className="bg-slate-50/60 rounded-2xl p-2.5 border border-slate-100 space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <span>ความคืบหน้า</span>
                          <span className="text-emerald-600 font-mono font-bold">
                            {dayEatenCount}/{dayTotalCount} มื้อ ({dayProgressPercent}%)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${dayProgressPercent}%` }}
                          />
                        </div>
                        {/* Daily Calories info */}
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>พลังงานทานแล้ว:</span>
                          <span className="font-mono text-slate-600">{dayCaloriesEaten} / {dayCaloriesTotal} kcal</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3 Meals List for this Day */}
                  <div className="flex flex-col gap-2.5">
                    {dayMeals.map((meal) => {
                      const mDetail = MEAL_DETAILS[meal.mealType];
                      const alarmTime = meal.time || getMealDefaultTime(meal.mealType, notificationTimes);

                      return (
                        <div
                          key={meal.id}
                          onClick={() => setEditingMeal(meal)}
                          className={`group text-left p-3 rounded-2xl border transition-all cursor-pointer relative ${
                            meal.status === "eaten"
                              ? "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 shadow-sm"
                              : meal.status === "skipped"
                              ? "bg-rose-50/20 border-rose-100 hover:border-rose-200 opacity-70"
                              : "bg-slate-50/25 border-slate-150 hover:border-emerald-200 hover:bg-white"
                          }`}
                          id={`meal_item_${meal.id}`}
                        >
                          {/* Alert Badge Indicator on corner */}
                          <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              meal.time 
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                : "bg-slate-100 text-slate-400"
                            }`}>
                              ⏰ {alarmTime}
                            </span>
                          </div>

                          {/* Meal type header */}
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 tracking-wider uppercase">
                            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${mDetail.color}`} />
                            <span>{mDetail.name}</span>
                          </div>

                          {/* Menu title */}
                          <h4 className="text-xs font-black text-slate-800 mt-1 line-clamp-2 leading-relaxed group-hover:text-emerald-700 transition-colors">
                            {meal.menuName}
                          </h4>

                          {/* Stats and status badge bottom */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100/60">
                            <span className="text-[10px] font-mono font-black text-slate-400 flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {meal.calories} kcal
                            </span>

                            {/* Custom Status indicators */}
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                meal.status === "eaten"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : meal.status === "skipped"
                                  ? "bg-rose-100 text-rose-800 animate-pulse"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {meal.status === "eaten"
                                ? "ทานแล้ว"
                                : meal.status === "skipped"
                                ? "ข้ามมื้อ"
                                : "รอกิน"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Add quick custom snack button inside day column */}
                    <button
                      type="button"
                      onClick={() => handleAddMeal(day, "snack")}
                      className="group border border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 text-slate-400 hover:text-emerald-700 rounded-2xl py-2 px-3 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer w-full mt-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span>เพิ่มมื้อว่าง/อาหารเสริม</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Meal Section Under the Food Grid */}
          <div className="bg-slate-50/80 rounded-3xl p-5 border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-5 mt-4" id="add_custom_meal_bar">
            <div className="space-y-1 text-left">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                เพิ่มมื้ออาหารเสริม / มื้ออาหารเพิ่มเติมรายวัน
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                ออกแบบมื้อทานส่วนตัวเพิ่มเติม เช่น ของว่างยามบ่าย บูสเตอร์โปรตีน หรืออาหารเสริมผลไม้ ได้แบบไร้ขีดจำกัด
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Day selection */}
              <div className="flex flex-col gap-1 w-full sm:w-auto text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">วันในสัปดาห์</label>
                <select
                  id="add_meal_day_select"
                  defaultValue="Monday"
                  className="bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black text-slate-700 outline-none cursor-pointer h-9"
                >
                  {DAYS_ORDER.map(d => (
                    <option key={d} value={d}>{DAYS_TH[d].name}</option>
                  ))}
                </select>
              </div>

              {/* MealType selection */}
              <div className="flex flex-col gap-1 w-full sm:w-auto text-left">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">ประเภทมื้อ</label>
                <select
                  id="add_meal_type_select"
                  defaultValue="snack"
                  className="bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-black text-slate-700 outline-none cursor-pointer h-9"
                >
                  <option value="snack">มื้อว่าง / อื่นๆ</option>
                  <option value="breakfast">มื้อเช้า (เพิ่มเติม)</option>
                  <option value="lunch">มื้อเที่ยง (เพิ่มเติม)</option>
                  <option value="dinner">มื้อเย็น (เพิ่มเติม)</option>
                </select>
              </div>

              <div className="flex items-end h-full w-full sm:w-auto pt-4 sm:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    const daySelect = document.getElementById("add_meal_day_select") as HTMLSelectElement;
                    const typeSelect = document.getElementById("add_meal_type_select") as HTMLSelectElement;
                    if (daySelect && typeSelect) {
                      handleAddMeal(daySelect.value as DayOfWeek, typeSelect.value as MealType);
                    }
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-700/10 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer h-9"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มมื้ออาหารลงตาราง
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Helpful healthy guidelines card */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center" id="guidelines_block">
          <div className="md:col-span-8 space-y-2">
            <h3 className="text-base font-black text-emerald-400 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-emerald-400" />
              เคล็ดลับสำคัญในการรับประทานอาหารเพื่อสุขภาพที่ดีและยั่งยืน
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              การกินอาหารตรงเวลาทั้ง 3 มื้อช่วยรักษาความเสถียรของระดับน้ำตาลในเลือด กระตุ้นระบบการเผาผลาญไขมันในร่างกายอย่างสม่ำเสมอ และป้องกันการหลั่งกรดในกระเพาะอาหารที่ผิดเวลา ระบบตั้งเตือนของแอปเราทำงานบนพื้นหลังเบราว์เซอร์อย่างเต็มรูปแบบ ขอแนะนำให้คุณปักหมุดแท็บนี้ทิ้งไว้เพื่อระบบรายงานที่มีเสถียรภาพสูงสุด
            </p>
          </div>
          <div className="md:col-span-4 bg-slate-800 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              ต้องการปรับเมนูใช่ไหม?
            </span>
            <span className="text-xs font-bold text-slate-300 leading-relaxed block mb-3">
              คุณสามารถกดปุ่มจัดแผนด้วย AI เพื่อใช้เทคโนโลยีชั้นนำของ Gemini ในการรังสรรค์เมนูที่มีแคลอรี่สมบูรณ์แบบได้ทันที
            </span>
            <div className="text-right">
              <span className="text-[10px] bg-slate-750 border border-slate-700 font-mono font-black text-slate-400 px-2 py-1 rounded">
                Powered by gemini-3.5-flash
              </span>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-8 text-center text-xs text-slate-400" id="app_footer_details">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold">7-Day Meal Reminder & Planner © 2026. All rights reserved.</p>
          <p className="font-medium text-[11px] text-slate-300">
            แอปพลิเคชันเพื่อช่วยสนับสนุนสุขนิสัยเชิงบวก ปรุงแต่งและวิเคราะห์ด้วยโมเดลเอไอชั้นนำ
          </p>
        </div>
      </footer>

      {/* Active Notification Event Alarm Pop-up Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Glowing Alert Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="relative w-full max-w-md bg-white border border-emerald-100 rounded-3xl p-6 text-center space-y-5 shadow-2xl text-slate-800"
              id="active_alarm_panel"
            >
              {/* Spinning Food Ring */}
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto animate-bounce shadow-md">
                <Coffee className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ได้เวลารับประทาน {MEAL_DETAILS[activeAlert.meal.mealType].name} แล้ว!
                </span>
                <span className="text-[11px] font-mono font-black text-slate-400 block mt-1">
                  เวลาตรงตามแจ้งเตือน: {activeAlert.timeStr} น. ({DAYS_TH[activeAlert.meal.day].name})
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {activeAlert.meal.menuName}
                </h3>
                <p className="text-xs text-orange-600 font-mono font-black mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{activeAlert.meal.calories} kcal</span>
                </p>
                {activeAlert.meal.description && (
                  <p className="text-xs text-slate-500 mt-2 border-t border-slate-200/60 pt-2 leading-relaxed">
                    {activeAlert.meal.description}
                  </p>
                )}
              </div>

              {/* Action options */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    toggleMealStatus(activeAlert.meal.id, "skipped");
                    setActiveAlert(null);
                  }}
                  className="py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-black transition active:scale-95 cursor-pointer"
                >
                  ข้ามมื้อนี้ไปก่อน
                </button>
                <button
                  onClick={() => {
                    toggleMealStatus(activeAlert.meal.id, "eaten");
                    setActiveAlert(null);
                  }}
                  className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition active:scale-95 shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>รับประทานเรียบร้อย</span>
                </button>
              </div>

              <button
                onClick={() => setActiveAlert(null)}
                className="text-xs text-slate-400 hover:text-slate-600 underline font-medium block mx-auto pt-1"
              >
                ปิดหน้าต่างนี้ชั่วคราว
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Meal Editing Dialog Modal Popup */}
      <MealEditModal
        meal={editingMeal}
        isOpen={editingMeal !== null}
        defaultTime={editingMeal ? getMealDefaultTime(editingMeal.mealType, notificationTimes) : ""}
        onClose={() => setEditingMeal(null)}
        onSave={handleSaveMeal}
        onDelete={handleDeleteMeal}
      />
    </div>
  );
}
