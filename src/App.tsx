import React, { useState, useMemo } from 'react';

type Affiliation = "協力会社所属" | "個人事業主" | "自社";

type AttributeFlags = {
  smoking: "非喫煙者" | "喫煙者(勤務中厳守)" | "喫煙制限に不安";
  odor: "無臭" | "わずかに気になる" | "強く気になる";
  appearance: "清潔感あり" | "普通" | "清潔感に欠ける";
  vehicle_type: string;
  ev_support: boolean;
  tags: string[];
};

type Availability = {
  areas: string[];
  time_slots: { start: string; end: string }[];
  weekdays: ("月" | "火" | "水" | "木" | "金" | "土" | "日")[];
};

type QuantKPI = {
  incidents_12m: number;
  damage_rate: number;
  late_rate: number;
  cancel_rate: number;
  cs_avg: number;
  complaints: number;
  workdays_90d: number;
  night_ratio: number;
  app_error_rate: number;
  docs_valid: 0 | 50 | 100;
  vehicle_fit: 60 | 80 | 100;
};

type QualScoreInputs = {
  manners: number;
  communication: number;
  trust_impression: number;
  problem_handling: number;
  vehicle_tidy: number;
};

type Driver = {
  driver_id: string;
  name: string;
  affiliation: Affiliation;
  company_name?: string;
  base_area: string;
  attributes: AttributeFlags;
  availability: Availability;
  kpi: QuantKPI;
  qin: QualScoreInputs;
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const timeOverlap = (a: { start: string; end: string }, b: { start: string; end: string }) => {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const aStart = toMin(a.start), aEnd = toMin(a.end);
  const bStart = toMin(b.start), bEnd = toMin(b.end);
  return aStart < bEnd && bStart < aEnd;
};

const quantScore = (kpi: QuantKPI): number => {
  let safety = kpi.incidents_12m === 0 ? 15 : kpi.incidents_12m === 1 ? 10 : 0;
  safety -= kpi.damage_rate * 100 * 0.1;
  safety = clamp(safety, 0, 15);

  let reliability = 15;
  reliability -= kpi.late_rate * 100 * 0.5 + kpi.cancel_rate * 100 * 0.8;
  reliability = clamp(reliability, 0, 15);

  let cs = ((kpi.cs_avg - 1) / 4) * 10;
  cs -= Math.min(kpi.complaints * 3, 5);
  cs = clamp(cs, 0, 10);

  let workdays = kpi.workdays_90d >= 60 ? 10 : kpi.workdays_90d >= 30 ? 7 : kpi.workdays_90d >= 10 ? 4 : 1;
  workdays += Math.min(kpi.night_ratio * 10, 3);
  workdays = clamp(workdays, 0, 10);

  let docs = kpi.docs_valid === 100 ? 5 : kpi.docs_valid === 50 ? 3 : 0;
  docs -= Math.min(kpi.app_error_rate * 100 * 0.05, 2);
  docs = clamp(docs, 0, 5);

  const vehicle = kpi.vehicle_fit === 100 ? 5 : kpi.vehicle_fit === 80 ? 4 : 3;

  return Math.round(safety + reliability + cs + workdays + docs + vehicle);
};

const qualScore = (qin: QualScoreInputs): number => {
  const m = Math.round((qin.manners / 100) * 8);
  const c = Math.round((qin.communication / 100) * 8);
  const t = Math.round((qin.trust_impression / 100) * 8);
  const p = Math.round((qin.problem_handling / 100) * 8);
  const v = Math.round((qin.vehicle_tidy / 100) * 8);
  return m + c + t + p + v;
};

const totalScore = (d: Driver) => quantScore(d.kpi) + qualScore(d.qin);

const INITIAL_DRIVERS: Driver[] = [
  {
    driver_id: "D001",
    name: "田中太郎",
    affiliation: "協力会社所属",
    company_name: "東京運輸",
    base_area: "東京都23区",
    attributes: {
      smoking: "非喫煙者",
      odor: "無臭",
      appearance: "清潔感あり",
      vehicle_type: "軽バン(冷凍)",
      ev_support: true,
      tags: ["夜間", "長距離"]
    },
    availability: {
      areas: ["東京都23区", "神奈川県川崎市"],
      time_slots: [{ start: "08:00", end: "20:00" }],
      weekdays: ["月", "火", "水", "木", "金"]
    },
    kpi: {
      incidents_12m: 0,
      damage_rate: 0.002,
      late_rate: 0.01,
      cancel_rate: 0.005,
      cs_avg: 4.8,
      complaints: 0,
      workdays_90d: 65,
      night_ratio: 0.4,
      app_error_rate: 0.01,
      docs_valid: 100,
      vehicle_fit: 100
    },
    qin: {
      manners: 90,
      communication: 95,
      trust_impression: 92,
      problem_handling: 88,
      vehicle_tidy: 90
    }
  },
  {
    driver_id: "D002",
    name: "佐藤花子",
    affiliation: "個人事業主",
    base_area: "神奈川県横浜市",
    attributes: {
      smoking: "非喫煙者",
      odor: "無臭",
      appearance: "清潔感あり",
      vehicle_type: "軽バン",
      ev_support: false,
      tags: ["短距離", "日中"]
    },
    availability: {
      areas: ["神奈川県横浜市", "東京都23区"],
      time_slots: [{ start: "09:00", end: "17:00" }],
      weekdays: ["月", "水", "金"]
    },
    kpi: {
      incidents_12m: 0,
      damage_rate: 0.005,
      late_rate: 0.02,
      cancel_rate: 0.01,
      cs_avg: 4.6,
      complaints: 1,
      workdays_90d: 45,
      night_ratio: 0.1,
      app_error_rate: 0.02,
      docs_valid: 100,
      vehicle_fit: 80
    },
    qin: {
      manners: 85,
      communication: 88,
      trust_impression: 85,
      problem_handling: 82,
      vehicle_tidy: 87
    }
  },
  {
    driver_id: "D003",
    name: "鈴木一郎",
    affiliation: "自社",
    base_area: "千葉県船橋市",
    attributes: {
      smoking: "喫煙者(勤務中厳守)",
      odor: "わずかに気になる",
      appearance: "普通",
      vehicle_type: "1tトラック",
      ev_support: false,
      tags: ["大型荷物", "夜間"]
    },
    availability: {
      areas: ["千葉県船橋市", "東京都23区", "埼玉県さいたま市"],
      time_slots: [{ start: "06:00", end: "22:00" }],
      weekdays: ["月", "火", "水", "木", "金", "土"]
    },
    kpi: {
      incidents_12m: 1,
      damage_rate: 0.008,
      late_rate: 0.05,
      cancel_rate: 0.02,
      cs_avg: 4.2,
      complaints: 2,
      workdays_90d: 58,
      night_ratio: 0.5,
      app_error_rate: 0.03,
      docs_valid: 100,
      vehicle_fit: 100
    },
    qin: {
      manners: 75,
      communication: 78,
      trust_impression: 72,
      problem_handling: 80,
      vehicle_tidy: 70
    }
  },
  {
    driver_id: "D004",
    name: "高橋美咲",
    affiliation: "協力会社所属",
    company_name: "神奈川配送",
    base_area: "神奈川県川崎市",
    attributes: {
      smoking: "非喫煙者",
      odor: "わずかに気になる",
      appearance: "清潔感あり",
      vehicle_type: "軽バン",
      ev_support: true,
      tags: ["短距離"]
    },
    availability: {
      areas: ["神奈川県川崎市", "東京都大田区"],
      time_slots: [{ start: "10:00", end: "16:00" }],
      weekdays: ["火", "木", "土", "日"]
    },
    kpi: {
      incidents_12m: 0,
      damage_rate: 0.003,
      late_rate: 0.03,
      cancel_rate: 0.015,
      cs_avg: 4.5,
      complaints: 1,
      workdays_90d: 32,
      night_ratio: 0.05,
      app_error_rate: 0.015,
      docs_valid: 50,
      vehicle_fit: 80
    },
    qin: {
      manners: 80,
      communication: 82,
      trust_impression: 78,
      problem_handling: 75,
      vehicle_tidy: 83
    }
  },
  {
    driver_id: "D005",
    name: "伊藤健",
    affiliation: "個人事業主",
    base_area: "埼玉県さいたま市",
    attributes: {
      smoking: "喫煙制限に不安",
      odor: "強く気になる",
      appearance: "清潔感に欠ける",
      vehicle_type: "軽バン",
      ev_support: false,
      tags: []
    },
    availability: {
      areas: ["埼玉県さいたま市"],
      time_slots: [{ start: "08:00", end: "18:00" }],
      weekdays: ["月", "火", "水"]
    },
    kpi: {
      incidents_12m: 2,
      damage_rate: 0.01,
      late_rate: 0.12,
      cancel_rate: 0.05,
      cs_avg: 3.8,
      complaints: 3,
      workdays_90d: 15,
      night_ratio: 0,
      app_error_rate: 0.05,
      docs_valid: 0,
      vehicle_fit: 60
    },
    qin: {
      manners: 55,
      communication: 60,
      trust_impression: 50,
      problem_handling: 58,
      vehicle_tidy: 52
    }
  },
  {
    driver_id: "D006",
    name: "渡辺京子",
    affiliation: "自社",
    base_area: "東京都世田谷区",
    attributes: {
      smoking: "非喫煙者",
      odor: "無臭",
      appearance: "清潔感あり",
      vehicle_type: "軽バン(冷凍)",
      ev_support: true,
      tags: ["夜間", "冷凍"]
    },
    availability: {
      areas: ["東京都23区"],
      time_slots: [{ start: "18:00", end: "06:00" }],
      weekdays: ["金", "土", "日"]
    },
    kpi: {
      incidents_12m: 0,
      damage_rate: 0.001,
      late_rate: 0.008,
      cancel_rate: 0.003,
      cs_avg: 4.9,
      complaints: 0,
      workdays_90d: 28,
      night_ratio: 0.6,
      app_error_rate: 0.005,
      docs_valid: 100,
      vehicle_fit: 100
    },
    qin: {
      manners: 92,
      communication: 90,
      trust_impression: 95,
      problem_handling: 93,
      vehicle_tidy: 88
    }
  }
];

export default function DriverScoreApp() {
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  
  const [formData, setFormData] = useState<Partial<Driver>>({
    name: "",
    affiliation: "協力会社所属",
    company_name: "",
    base_area: "",
    attributes: {
      smoking: "非喫煙者",
      odor: "無臭",
      appearance: "清潔感あり",
      vehicle_type: "",
      ev_support: false,
      tags: []
    },
    availability: {
      areas: [],
      time_slots: [],
      weekdays: []
    },
    kpi: {
      incidents_12m: 0,
      damage_rate: 0,
      late_rate: 0,
      cancel_rate: 0,
      cs_avg: 4.0,
      complaints: 0,
      workdays_90d: 0,
      night_ratio: 0,
      app_error_rate: 0,
      docs_valid: 100,
      vehicle_fit: 100
    },
    qin: {
      manners: 80,
      communication: 80,
      trust_impression: 80,
      problem_handling: 80,
      vehicle_tidy: 80
    }
  });

  const [tempArea, setTempArea] = useState<string>("");
  const [tempTimeStart, setTempTimeStart] = useState<string>("");
  const [tempTimeEnd, setTempTimeEnd] = useState<string>("");
  const [tempTag, setTempTag] = useState<string>("");

  const [keyword, setKeyword] = useState<string>("");
  const [affFilter, setAffFilter] = useState<"all" | Affiliation>("all");
  const [minTotal, setMinTotal] = useState<number>(70);
  const [minQuant, setMinQuant] = useState<number>(35);
  const [minQual, setMinQual] = useState<number>(20);
  const [nonSmokerOnly, setNonSmokerOnly] = useState<boolean>(false);
  const [odorMax, setOdorMax] = useState<"無臭" | "わずかに気になる" | "強く気になる">("わずかに気になる");
  const [appearanceMin, setAppearanceMin] = useState<"清潔感あり" | "普通" | "清潔感に欠ける">("普通");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [timeStart, setTimeStart] = useState<string>("");
  const [timeEnd, setTimeEnd] = useState<string>("");
  const [weekdayFilter, setWeekdayFilter] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setFormData({
      name: "",
      affiliation: "協力会社所属",
      company_name: "",
      base_area: "",
      attributes: {
        smoking: "非喫煙者",
        odor: "無臭",
        appearance: "清潔感あり",
        vehicle_type: "",
        ev_support: false,
        tags: []
      },
      availability: {
        areas: [],
        time_slots: [],
        weekdays: []
      },
      kpi: {
        incidents_12m: 0,
        damage_rate: 0,
        late_rate: 0,
        cancel_rate: 0,
        cs_avg: 4.0,
        complaints: 0,
        workdays_90d: 0,
        night_ratio: 0,
        app_error_rate: 0,
        docs_valid: 100,
        vehicle_fit: 100
      },
      qin: {
        manners: 80,
        communication: 80,
        trust_impression: 80,
        problem_handling: 80,
        vehicle_tidy: 80
      }
    });
    setTempArea("");
    setTempTimeStart("");
    setTempTimeEnd("");
    setTempTag("");
    setStep(1);
  };

  const handleSubmit = () => {
    const newId = `D${String(drivers.length + 1).padStart(3, '0')}`;
    const newDriver: Driver = {
      driver_id: newId,
      name: formData.name!,
      affiliation: formData.affiliation!,
      company_name: formData.company_name,
      base_area: formData.base_area!,
      attributes: formData.attributes!,
      availability: formData.availability!,
      kpi: formData.kpi!,
      qin: formData.qin!
    };
    setDrivers([...drivers, newDriver]);
    setShowModal(false);
    resetForm();
  };

  const filteredDrivers = useMemo(() => {
    let result = drivers.map(d => ({
      driver: d,
      quant: quantScore(d.kpi),
      qual: qualScore(d.qin),
      total: totalScore(d)
    }));

    result = result.filter(item => {
      const { driver: d, quant, qual, total } = item;

      if (total < minTotal || quant < minQuant || qual < minQual) return false;

      if (affFilter !== "all" && d.affiliation !== affFilter) return false;

      if (keyword.trim()) {
        const kw = keyword.toLowerCase();
        const searchText = [
          d.name,
          d.company_name || "",
          d.base_area,
          ...d.availability.areas,
          ...d.attributes.tags
        ].join(" ").toLowerCase();
        if (!searchText.includes(kw)) return false;
      }

      if (nonSmokerOnly && d.attributes.smoking !== "非喫煙者") return false;

      const odorRank = { "無臭": 0, "わずかに気になる": 1, "強く気になる": 2 };
      if (odorRank[d.attributes.odor] > odorRank[odorMax]) return false;

      const appRank = { "清潔感あり": 2, "普通": 1, "清潔感に欠ける": 0 };
      if (appRank[d.attributes.appearance] < appRank[appearanceMin]) return false;

      if (areaFilter.trim()) {
        const areaKw = areaFilter.toLowerCase();
        if (!d.availability.areas.some(a => a.toLowerCase().includes(areaKw))) return false;
      }

      if (timeStart && timeEnd) {
        const searchSlot = { start: timeStart, end: timeEnd };
        if (!d.availability.time_slots.some(slot => timeOverlap(searchSlot, slot))) return false;
      }

      if (weekdayFilter.size > 0) {
        if (!d.availability.weekdays.some(wd => weekdayFilter.has(wd))) return false;
      }

      return true;
    });

    result.sort((a, b) => b.total - a.total);
    return result;
  }, [drivers, keyword, affFilter, minTotal, minQuant, minQual, nonSmokerOnly, odorMax, appearanceMin, areaFilter, timeStart, timeEnd, weekdayFilter]);

  const toggleWeekday = (wd: string) => {
    setWeekdayFilter(prev => {
      const next = new Set(prev);
      if (next.has(wd)) next.delete(wd);
      else next.add(wd);
      return next;
    });
  };

  const toggleFormWeekday = (wd: "月" | "火" | "水" | "木" | "金" | "土" | "日") => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        weekdays: prev.availability.weekdays.includes(wd)
          ? prev.availability.weekdays.filter(d => d !== wd)
          : [...prev.availability.weekdays, wd]
      }
    }));
  };

  const addArea = () => {
    if (tempArea.trim()) {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          areas: [...prev.availability.areas, tempArea.trim()]
        }
      }));
      setTempArea("");
    }
  };

  const removeArea = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        areas: prev.availability!.areas.filter((_, i) => i !== index)
      }
    }));
  };

  const addTimeSlot = () => {
    if (tempTimeStart && tempTimeEnd) {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability!,
          time_slots: [...prev.availability!.time_slots, { start: tempTimeStart, end: tempTimeEnd }]
        }
      }));
      setTempTimeStart("");
      setTempTimeEnd("");
    }
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability!,
        time_slots: prev.availability!.time_slots.filter((_, i) => i !== index)
      }
    }));
  };

  const addTag = () => {
    if (tempTag.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes!,
          tags: [...prev.attributes!.tags, tempTag.trim()]
        }
      }));
      setTempTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        tags: prev.attributes.tags.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ドライバー信用スコアデータベース　　　　　</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            新規登録
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">ドライバー新規登録 - ステップ {step}/5</h2>
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">基本情報</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">氏名</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">所属形態</label>
                      <select
                        value={formData.affiliation}
                        onChange={e => setFormData({ ...formData, affiliation: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="協力会社所属">協力会社所属</option>
                        <option value="個人事業主">個人事業主</option>
                        <option value="自社">自社</option>
                      </select>
                    </div>
                    {formData.affiliation === "協力会社所属" && (
                      <div>
                        <label className="block text-sm font-medium mb-1">会社名</label>
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1">ベースエリア</label>
                      <input
                        type="text"
                        value={formData.base_area}
                        onChange={e => setFormData({ ...formData, base_area: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">属性情報</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">喫煙状況</label>
                      <select
                        value={formData.attributes.smoking}
                        onChange={e => setFormData({
                          ...formData,
                          attributes: { ...formData.attributes, smoking: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="非喫煙者">非喫煙者</option>
                        <option value="喫煙者(勤務中厳守)">喫煙者(勤務中厳守)</option>
                        <option value="喫煙制限に不安">喫煙制限に不安</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">におい</label>
                      <select
                        value={formData.attributes.odor}
                        onChange={e => setFormData({
                          ...formData,
                          attributes: { ...formData.attributes, odor: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="無臭">無臭</option>
                        <option value="わずかに気になる">わずかに気になる</option>
                        <option value="強く気になる">強く気になる</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">清潔感</label>
                      <select
                        value={formData.attributes.appearance}
                        onChange={e => setFormData({
                          ...formData,
                          attributes: { ...formData.attributes, appearance: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="清潔感あり">清潔感あり</option>
                        <option value="普通">普通</option>
                        <option value="清潔感に欠ける">清潔感に欠ける</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">車両タイプ</label>
                      <input
                        type="text"
                        value={formData.attributes.vehicle_type}
                        onChange={e => setFormData({
                          ...formData,
                          attributes: { ...formData.attributes, vehicle_type: e.target.value }
                        })}
                        className="w-full border rounded px-3 py-2"
                        placeholder="例: 軽バン、1tトラック"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.attributes.ev_support}
                          onChange={e => setFormData({
                            ...formData,
                            attributes: { ...formData.attributes, ev_support: e.target.checked }
                          })}
                        />
                        <span className="text-sm font-medium">EV対応</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">タグ</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tempTag}
                          onChange={e => setTempTag(e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                          placeholder="タグを入力"
                        />
                        <button onClick={addTag} className="bg-blue-600 text-white px-4 py-2 rounded">追加</button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {formData.attributes.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded flex items-center gap-2">
                            {tag}
                            <button onClick={() => removeTag(i)} className="text-blue-600 hover:text-blue-800">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">可用性情報</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">配送可能エリア</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tempArea}
                          onChange={e => setTempArea(e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                          placeholder="エリアを入力"
                        />
                        <button onClick={addArea} className="bg-blue-600 text-white px-4 py-2 rounded">追加</button>
                      </div>
                      <div className="space-y-1">
                        {formData.availability.areas.map((area, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                            <span>{area}</span>
                            <button onClick={() => removeArea(i)} className="text-red-600 hover:text-red-800">削除</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">対応可能時間帯</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="time"
                          value={tempTimeStart}
                          onChange={e => setTempTimeStart(e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <span className="self-center">〜</span>
                        <input
                          type="time"
                          value={tempTimeEnd}
                          onChange={e => setTempTimeEnd(e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <button onClick={addTimeSlot} className="bg-blue-600 text-white px-4 py-2 rounded">追加</button>
                      </div>
                      <div className="space-y-1">
                        {formData.availability.time_slots.map((slot, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                            <span>{slot.start} 〜 {slot.end}</span>
                            <button onClick={() => removeTimeSlot(i)} className="text-red-600 hover:text-red-800">削除</button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">対応可能曜日</label>
                      <div className="flex gap-2 flex-wrap">
                        {["月", "火", "水", "木", "金", "土", "日"].map(wd => (
                          <label key={wd} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={formData.availability.weekdays.includes(wd)}
                              onChange={() => toggleFormWeekday(wd)}
                            />
                            <span className="text-sm">{wd}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">KPI情報</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">12ヶ月間の事故件数</label>
                        <input
                          type="number"
                          value={formData.kpi.incidents_12m}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, incidents_12m: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">破損率 (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.kpi.damage_rate * 100}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, damage_rate: +e.target.value / 100 }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">遅延率 (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.kpi.late_rate * 100}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, late_rate: +e.target.value / 100 }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">キャンセル率 (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.kpi.cancel_rate * 100}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, cancel_rate: +e.target.value / 100 }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">顧客満足度平均 (1-5)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.kpi.cs_avg}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, cs_avg: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="1"
                          max="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">クレーム件数</label>
                        <input
                          type="number"
                          value={formData.kpi.complaints}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, complaints: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">90日稼働日数</label>
                        <input
                          type="number"
                          value={formData.kpi.workdays_90d}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, workdays_90d: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                          max="90"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">夜間配送比率 (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.kpi.night_ratio * 100}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, night_ratio: +e.target.value / 100 }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">アプリエラー率 (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.kpi.app_error_rate * 100}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, app_error_rate: +e.target.value / 100 }
                          })}
                          className="w-full border rounded px-3 py-2"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">書類整備</label>
                        <select
                          value={formData.kpi.docs_valid}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, docs_valid: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="100">完全整備 (100)</option>
                          <option value="50">一部不備 (50)</option>
                          <option value="0">未整備 (0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">車両適合度</label>
                        <select
                          value={formData.kpi.vehicle_fit}
                          onChange={e => setFormData({
                            ...formData,
                            kpi: { ...formData.kpi, vehicle_fit: +e.target.value }
                          })}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="100">完全適合 (100)</option>
                          <option value="80">概ね適合 (80)</option>
                          <option value="60">最低限 (60)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">定性評価 (0-100)</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">礼儀: {formData.qin.manners}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.qin.manners}
                        onChange={e => setFormData({
                          ...formData,
                          qin: { ...formData.qin, manners: +e.target.value }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">コミュニケーション: {formData.qin.communication}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.qin.communication}
                        onChange={e => setFormData({
                          ...formData,
                          qin: { ...formData.qin, communication: +e.target.value }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">信頼感: {formData.qin.trust_impression}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.qin.trust_impression}
                        onChange={e => setFormData({
                          ...formData,
                          qin: { ...formData.qin, trust_impression: +e.target.value }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">問題対応: {formData.qin.problem_handling}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.qin.problem_handling}
                        onChange={e => setFormData({
                          ...formData,
                          qin: { ...formData.qin, problem_handling: +e.target.value }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">車両整頓: {formData.qin.vehicle_tidy}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.qin.vehicle_tidy}
                        onChange={e => setFormData({
                          ...formData,
                          qin: { ...formData.qin, vehicle_tidy: +e.target.value }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                    className="px-6 py-2 border rounded disabled:opacity-50"
                  >
                    戻る
                  </button>
                  {step < 5 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                    >
                      次へ
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    >
                      登録
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">キーワード</label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="氏名/会社/エリア/タグ"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">所属形態</label>
              <select value={affFilter} onChange={e => setAffFilter(e.target.value)} className="w-full border rounded px-3 py-2">
                <option value="all">すべて</option>
                <option value="協力会社所属">協力会社所属</option>
                <option value="個人事業主">個人事業主</option>
                <option value="自社">自社</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">総合スコア下限（0-100）</label>
              <input type="number" value={minTotal} onChange={e => setMinTotal(+e.target.value)} min="0" max="100" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">定量スコア下限（0-60）</label>
              <input type="number" value={minQuant} onChange={e => setMinQuant(+e.target.value)} min="0" max="60" className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">定性スコア下限（0-40）</label>
              <input type="number" value={minQual} onChange={e => setMinQual(+e.target.value)} min="0" max="40" className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-sm">属性フィルタ</div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={nonSmokerOnly} onChange={e => setNonSmokerOnly(e.target.checked)} />
              <span className="text-sm">非喫煙者のみ</span>
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm">におい:</span>
              <select value={odorMax} onChange={e => setOdorMax(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="無臭">無臭まで</option>
                <option value="わずかに気になる">わずかに気になるまで</option>
                <option value="強く気になる">すべて</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">清潔感:</span>
              <select value={appearanceMin} onChange={e => setAppearanceMin(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="清潔感あり">清潔感あり以上</option>
                <option value="普通">普通以上</option>
                <option value="清潔感に欠ける">すべて</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">配送可能エリア</label>
            <input
              type="text"
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              placeholder="部分一致検索"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">時間帯（開始）</label>
              <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">時間帯（終了）</label>
              <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">曜日</div>
            <div className="flex gap-2 flex-wrap">
              {["月", "火", "水", "木", "金", "土", "日"].map(wd => (
                <label key={wd} className="flex items-center gap-1">
                  <input type="checkbox" checked={weekdayFilter.has(wd)} onChange={() => toggleWeekday(wd)} />
                  <span className="text-sm">{wd}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">該当なし</div>
        ) : (
          <div className="space-y-4">
            {filteredDrivers.map(({ driver: d, quant, qual, total }) => {
              const safetyDetail = `安全: ${Math.round(clamp(
                (d.kpi.incidents_12m === 0 ? 15 : d.kpi.incidents_12m === 1 ? 10 : 0) - d.kpi.damage_rate * 100 * 0.1,
                0, 15
              ))}`;
              const reliabilityDetail = `信頼性: ${Math.round(clamp(15 - d.kpi.late_rate * 100 * 0.5 - d.kpi.cancel_rate * 100 * 0.8, 0, 15))}`;
              const csDetail = `顧客満足: ${Math.round(clamp(((d.kpi.cs_avg - 1) / 4) * 10 - Math.min(d.kpi.complaints * 3, 5), 0, 10))}`;
              const workDetail = `稼働: ${Math.round(clamp((d.kpi.workdays_90d >= 60 ? 10 : d.kpi.workdays_90d >= 30 ? 7 : d.kpi.workdays_90d >= 10 ? 4 : 1) + Math.min(d.kpi.night_ratio * 10, 3), 0, 10))}`;
              const docsDetail = `書類: ${Math.round(clamp((d.kpi.docs_valid === 100 ? 5 : d.kpi.docs_valid === 50 ? 3 : 0) - Math.min(d.kpi.app_error_rate * 100 * 0.05, 2), 0, 5))}`;
              const vehicleDetail = `車両: ${d.kpi.vehicle_fit === 100 ? 5 : d.kpi.vehicle_fit === 80 ? 4 : 3}`;

              const qualDetail = `礼儀${Math.round((d.qin.manners / 100) * 8)} / コミュ${Math.round((d.qin.communication / 100) * 8)} / 信頼感${Math.round((d.qin.trust_impression / 100) * 8)} / 問題対応${Math.round((d.qin.problem_handling / 100) * 8)} / 整頓${Math.round((d.qin.vehicle_tidy / 100) * 8)}`;

              return (
                <div key={d.driver_id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-4">
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-blue-600">{total}</div>
                      <div className="text-sm text-gray-500">総合スコア</div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{d.name}</h2>
                      <div className="text-sm text-gray-600 mt-1">
                        {d.affiliation}{d.company_name && ` / ${d.company_name}`} / {d.base_area}
                      </div>
                      <div className="text-sm text-gray-600">
                        {d.attributes.vehicle_type} {d.attributes.ev_support && "(EV対応)"}
                      </div>
                      {d.attributes.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {d.attributes.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium mb-1">定量スコア: {quant}/60</div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div>{safetyDetail}</div>
                        <div>{reliabilityDetail}</div>
                        <div>{csDetail}</div>
                        <div>{workDetail}</div>
                        <div>{docsDetail}</div>
                        <div>{vehicleDetail}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">定性スコア: {qual}/40</div>
                      <div className="text-xs text-gray-600">{qualDetail}</div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">属性:</span> {d.attributes.smoking} / {d.attributes.odor} / {d.attributes.appearance}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">配送可能エリア:</span> {d.availability.areas.join(", ")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">時間帯:</span> {d.availability.time_slots.map(t => `${t.start}-${t.end}`).join(", ")}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">曜日:</span> {d.availability.weekdays.join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}