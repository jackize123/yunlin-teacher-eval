import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  BookOpen, CheckCircle2, ChevronRight, Download, Home, 
  LogOut, AlertCircle, TrendingUp, Search, School, Sparkles, X,
  PlayCircle, Presentation, ExternalLink, ZoomIn
} from 'lucide-react';

// ================= Firebase 初始化 =================
const firebaseConfig = {
  apiKey: "AIzaSyCCfNs-czZWY6udP30-3OSyDoVSz5h74vA",
  authDomain: "yunlin-teacher-eval.firebaseapp.com",
  projectId: "yunlin-teacher-eval",
  storageBucket: "yunlin-teacher-eval.firebasestorage.app",
  messagingSenderId: "959208894089",
  appId: "1:959208894089:web:93a1f48059ddc80279a058",
  measurementId: "G-PYT9VME74M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= 首頁研習與影片專區設定 =================
const HOMEPAGE_RESOURCES = {
  A: [
    { title: "大屏基礎操作與連線故障排除", type: "VOD", link: "https://www.youtube.com/" },
    { title: "Apple TV 實戰演練工作坊", type: "研習", link: "https://www1.inservice.edu.tw/" }
  ],
  B: [
    { title: "雙屏協作：打造高互動課堂示範", type: "VOD", link: "https://www.youtube.com/" }
  ],
  C: [
    { title: "因材網適性教學應用分享", type: "VOD", link: "https://www.youtube.com/" },
    { title: "數位平台結合遊戲化教學", type: "研習", link: "https://www1.inservice.edu.tw/" }
  ],
  D: [
    { title: "生成式 AI 在教學與備課的應用入門", type: "VOD", link: "https://www.youtube.com/" }
  ]
};

// ================= QR Code 網址設定 =================
const QR_LINKS = {
  facebook: { title: "雲林縣數位辦公室 FB", url: "https://www.facebook.com/profile.php?id=100091764037844&locale=zh_TW" },
  website: { title: "雲林縣數位辦公室 官網", url: "https://dlo.ylc.edu.tw/" },
  app: { title: "數位教學評估系統 (本站)", url: "https://yunlin-teacher-eval.web.app/" }
};

// ================= 研習推薦庫 (當分數 <= 2 時跳出) =================
const RECOMMENDATION_WORKSHOPS = {
  A: [
    { title: "115/06/28 鎮西國小 - 智慧黑板與 Apple TV 實戰演練", date: "115/06/28", location: "鎮西國小", link: "https://www1.inservice.edu.tw/" },
    { title: "全縣大屏網路除錯與 AVACAST 進階管理研習", date: "115/07/15", location: "雲林縣數位辦公室", link: "https://www1.inservice.edu.tw/" }
  ],
  B: [
    { title: "雙屏協作與課堂四學實踐工作坊", date: "115/07/20", location: "土庫國小", link: "https://www1.inservice.edu.tw/" }
  ],
  C: [
    { title: "因材網與縣購軟體深度整合應用", date: "115/08/05", location: "斗六國中", link: "https://www1.inservice.edu.tw/" }
  ],
  D: [
    { title: "115/06/28 鎮西國小 - 足球無人機與新興科技 (AI 融入)", date: "115/06/28", location: "鎮西國小", link: "https://www1.inservice.edu.tw/" },
    { title: "生成式 AI 輔助備課與素養導向教學", date: "115/08/12", location: "雲林縣數位辦公室", link: "https://www1.inservice.edu.tw/" }
  ]
};

// ================= 全新 20 題庫設定 =================
const QUESTIONS = [
  {
    id: 'A', title: '大屏系統技術操作與管理能力', subtitle: '評估指標：硬體連線、跨系統切換與基礎故障排除。',
    qs: [
      { id: 'A1', name: 'Apple TV 無線投影與障礙排除', 
        options: [
          { score: 1, text: '常常連不上，或需要資訊股長、網管老師協助才能投影。' },
          { score: 2, text: '能順利將 iPad 畫面無線投影，但遇到突然斷線或黑畫面時不知如何處理。' },
          { score: 3, text: '能順利投影，且斷線時能自行嘗試重啟 Apple TV 或檢查 Wi-Fi 來排除障礙。' }
        ]
      },
      { id: 'A2', name: 'AVACAST 連線與辨識管理', 
        options: [
          { score: 1, text: '不知道什麼是 AVACAST，也不知道怎麼看大屏的連線名稱。' },
          { score: 2, text: '知道怎麼確認連線，但不知道或沒試過修改大屏的識別名稱。' },
          { score: 3, text: '能正確確認連線狀態，並會主動修改大屏名稱，以防隔壁班同學或老師誤連。' }
        ]
      },
      { id: 'A3', name: '多載具投影與畫面分割操作', 
        options: [
          { score: 1, text: '課堂上只會一對一投影，不清楚如何讓多台學生平板同時呈現。' },
          { score: 2, text: '知道有畫面分割功能，但不太熟悉操作步驟，很少在課堂使用。' },
          { score: 3, text: '能流暢開啟「四分割畫面」，同時展示多組學生的平板畫面進行對比。' }
        ]
      },
      { id: 'A4', name: '網路狀態檢測與除錯流程', 
        options: [
          { score: 1, text: '大屏或平板網路不通時，只能停止數位教學或立刻報修。' },
          { score: 2, text: '網路異常時會先檢查 Wi-Fi 開關，若還是不行才報修或找網管。' },
          { score: 3, text: '能主動檢查大屏與 iPad 是否在同一 Wi-Fi 網段，進行基礎除錯後再決定是否報修。' }
        ]
      },
      { id: 'A5', name: '訊號源切換與大屏系統整合', 
        options: [
          { score: 1, text: '不太會切換大屏訊號源，通常只固定使用其中一種系統（如只用大屏 Android）。' },
          { score: 2, text: '知道如何切換訊號源（如從 Android 內建切到 Apple TV），但切換時會打亂教學節奏。' },
          { score: 3, text: '能在「大屏內建系統」與「外部 Apple TV」間流暢切換，教學節奏完全不受影響。' }
        ]
      }
    ]
  },
  {
    id: 'B', title: '雙屏協作與課堂四學實踐', subtitle: '評估指標：落實「大屏引導、小屏操作」，並呼應自主、共學、互學、導學。',
    qs: [
      { id: 'B1', name: '雙屏協作教學設計', 
        options: [
          { score: 1, text: '課堂主要仍以大屏講述為主，學生較少有機會操作平板小屏。' },
          { score: 2, text: '能操作「大屏導學、小屏操作」，但兩者切換的時機點還在摸索中。' },
          { score: 3, text: '能流暢運用大屏與小屏的雙向協作，設計完整的學生自主或小組共學課程。' }
        ]
      },
      { id: 'B2', name: '課前自學與數據檢核（自主學習）', 
        options: [
          { score: 1, text: '很少或沒有指派課前數位自學任務。' },
          { score: 2, text: '有指派自學任務，但課堂上較少（或不知如何）利用平台的數據來檢討。' },
          { score: 3, text: '課前會查看自學數據，並在課堂一開始針對學生的錯誤類型進行精準導學。' }
        ]
      },
      { id: 'B3', name: '小組角色分配與共同解題（組內共學）', 
        options: [
          { score: 1, text: '讓學生用平板分組時，通常只是大家圍著看同一台，缺乏分工。' },
          { score: 2, text: '會分配小組角色（如記錄員、發言員），但學生操作平板共同解題的流暢度仍不足。' },
          { score: 3, text: '學生能依角色分工，利用平板共同編輯、協作解題，並展現良好的團隊合作。' }
        ]
      },
      { id: 'B4', name: '組間互學之分享發表（組間互學）', 
        options: [
          { score: 1, text: '學生完成作品後，較少利用平板展示，仍以傳統口頭或紙本發表為主。' },
          { score: 2, text: '會讓學生拍照上傳成果到大屏，但缺乏引導他組進行線上互評或回饋的機制。' },
          { score: 3, text: '能引導學生上台發表大屏畫面，並讓台下同學利用載具進行即時線上互評或講評。' }
        ]
      },
      { id: 'B5', name: '課堂即時回饋與迷思概念彙整（教師導學）', 
        options: [
          { score: 1, text: '尚未在課堂中引進數位隨堂測驗或即時反饋系統。' },
          { score: 2, text: '偶爾會用互動平台收集學生想法，但多流於純展示，較少針對答案進行延伸講解。' },
          { score: 3, text: '能精準運用互動工具進行即時測驗，當場統整全班的迷思概念並進行即時回饋。' }
        ]
      }
    ]
  },
  {
    id: 'C', title: '縣購軟體與數位教學平台熟悉度', subtitle: '評估指標：因材網、力宇、酷AI等縣購或教育部平台之應用頻率與深度。',
    qs: [
      { id: 'C1', name: '適性診斷與線上派題能力', 
        options: [
          { score: 1, text: '尚未嘗試、或非常少使用數位平台來指派任務或練習題。' },
          { score: 2, text: '每單元會固定派發 1-2 次影片或練習題，但尚未嘗試依學生程度進行「差異化派題」。' },
          { score: 3, text: '能熟練根據學生的學習程度，指派不同的數位練習題或進階/補救任務。' }
        ],
        tools: ['教育部因材網', '力宇(AI Leade365)', '翰林', '康軒']
      },
      { id: 'C2', name: '課堂互動與協作教學工具', 
        options: [
          { score: 1, text: '較少或從未使用過互動協作軟體（如 Loilo Note、Padlet）進行教學。' },
          { score: 2, text: '會使用這類軟體收集學生作業，但主要功能仍停留在「收作業」，互動變化較少。' },
          { score: 3, text: '能靈活運用這些工具進行師生即時發想、小組協作畫布，並進行動態發表。' }
        ],
        tools: ['Loilo Note', 'Padlet', 'SmartLumio']
      },
      { id: 'C3', name: '遊戲化引導與自主學習動機', 
        options: [
          { score: 1, text: '尚未嘗試將遊戲化平台（如 PaGamO、Kahoot）融入學科教學中。' },
          { score: 2, text: '偶爾會在課堂最後舉辦趣味測驗，但與單元核心學習目標的結合度可以再提高。' },
          { score: 3, text: '能將遊戲化競賽或任務包常態融入課程，有效提升學生的學習動機與答題素養。' }
        ],
        tools: ['PaGamO', 'Waygoground(原Quizizz)', 'Kahoot', 'Wordwall', '酷AI']
      },
      { id: 'C4', name: '學力檢測與數據輔助補救教學', 
        options: [
          { score: 1, text: '評量後主要看傳統分數，不清楚如何調閱數位平台產出的班級答錯率或診斷報告。' },
          { score: 2, text: '會看平台產出的錯誤率數據，但較不確定如何據此調整進度或落實個別補救。' },
          { score: 3, text: '能精準參考平台的學力診斷報告，針對落後學生進行精準補救或動態調整教學進度。' }
        ],
        tools: ['因材網', '均一平台', '力宇(AI Leade365)', '酷AI']
      },
      { id: 'C5', name: '學習歷程追蹤與進度管理', 
        options: [
          { score: 1, text: '尚未利用數位平台來建立或追蹤學生的個人長期學習歷程。' },
          { score: 2, text: '平台上有學生的成績記錄，但主要由系統自動產出，較少主動調閱來與親師溝通。' },
          { score: 3, text: '能善用平台的後台管理，長期追蹤學生的學習成長曲線，並作為親師溝通或導師輔導的實質依據。' }
        ]
      }
    ]
  },
  {
    id: 'D', title: 'AI 融入與素養導向教學能力 (AIPACK)', subtitle: '評估指標：生成式 AI 在教師備課、學生自學、多元評量與倫理思辨的應用。',
    qs: [
      { id: 'D1', name: 'AI 輔助備課與結構化教材設計', 
        options: [
          { score: 1, text: '尚未嘗試過用生成式 AI（如 ChatGPT、Copilot）來協助教案或教材編寫。' },
          { score: 2, text: '會用 AI 查資料或下簡單指令，但生成的內容通常需要大幅人工修改才能使用。' },
          { score: 3, text: '能撰寫結構化提示詞（Prompt），請 AI 生成具備情境的學習單、提問指引或階梯式教材。' }
        ]
      },
      { id: 'D2', name: 'AI 學習夥伴與課堂自學引導', 
        options: [
          { score: 1, text: '尚未引導學生在課堂上與 AI 工具（如 e度、各平台 AI 助教）進行互動。' },
          { score: 2, text: '曾讓學生跟 AI 對話，但學生多流於嬉鬧聊天，或是不知該如何問出有深度的小論文/問題。' },
          { score: 3, text: '能引導學生透過「精準提問與追問」與 AI 助教對話，澄清個人學習疑惑，落實探究學習。' }
        ]
      },
      { id: 'D3', name: 'AI 數位倫理與思辨素養指導', 
        options: [
          { score: 1, text: '教學中較少提及 AI 的版權、隱私或資訊正確性等倫理議題。' },
          { score: 2, text: '會口頭提醒學生不要直接複製貼上 AI 的答案，但缺乏具體指導學生如何查核。' },
          { score: 3, text: '能在教學中引導學生進行事實查核（Fact-checking），建立「視 AI 為助手而非代寫者」的正確觀念。' }
        ]
      },
      { id: 'D4', name: 'AI 輔助多元評量與差異化回饋', 
        options: [
          { score: 1, text: '尚未嘗試用 AI 來協助評分、產出評量規準（Rubric）或分析學生表現。' },
          { score: 2, text: '曾嘗試用 AI 幫忙草擬評分標準，但尚未實際應用於評估學生的課堂多元表現。' },
          { score: 3, text: '能運用 AI 協助設計差異化的評量規準，或利用 AI 輔助分析學生作品，提供個人化語音/文字回饋建議。' }
        ]
      },
      { id: 'D5', name: 'AI 課堂即時生成情境與動態提問', 
        options: [
          { score: 1, text: '課堂上完全依照預先準備好的 PPT 或教案進行，不曾因應現場狀況用 AI 即時產出內容。' },
          { score: 2, text: '知道可以即時用 AI 產出題目，但擔心操作卡頓，因此較少在教學現場當下使用。' },
          { score: 3, text: '能在課堂教學中，根據學生的即時反應，當場用 AI 生成新的情境故事、對比例子或差異化問題。' }
        ]
      }
    ]
  }
];

const QUALITATIVE_OPTS = {
  currentStatus: [
    "【日常內化融入】 數位工具已是我課堂的常態，能流暢且直覺地融入既有學科教學中。",
    "【亮點循序漸進】 平常教學以大屏講述為主，遇到特定單元或公開授課時，能精心設計雙屏或 AI 教學。",
    "【樂於探索嘗試】 對新工具與 AI 備課充滿好奇，雖然仍在摸索階段，但願意在課堂中多方嘗試。",
    "【務實高效導向】 偏好使用能「實質簡化教學流程、提升班級學習效率」的實用數位工具。",
    "【依自身步調調適】 面對日新月異的科技更新，希望能依據自己的教學節奏，穩步適應與調整。"
  ],
  painPoints: [
    "【課堂專注引導】 需花費較多心力引導學生專注於平板任務，避免其因載具功能而分心。",
    "【時間成本考量】 設計數位教材或調校 AI 提示詞（Prompt）較耗時，希望能有更高效的備課支援。",
    "【教學進度彈性】 學科既定進度較為緊湊，使用數位教學或小組協作時，較擔心影響既定進度。",
    "【科技容錯心理】 害怕課堂上遇到網路斷線、設備異常等突發狀況，進而影響教學流暢度。",
    "【軟體適應週期】 推動的平台與軟體種類較多，需要較充裕的時間與週期進行消化與熟悉。"
  ],
  supportPlans: [
    "【輕量精準研習】 建議多提供 3-5 分鐘的「重點功能短影片」或圖卡，方便隨時進行碎片化學習。",
    "【即用型資源庫】 期待學校提供現成的學科數位教案、Prompt 範本或學習單，方便直接參考修改。",
    "【校內同儕交流】 遇到技術瓶頸（如 Apple TV 設定）時，希望能有校內夥伴在空堂進行溫馨的一對一交流。",
    "【自主深化時間】 目前相關研習知能已足夠，希望能有充裕的時間與空間，在教室依自己的節奏慢慢摸索與內化。",
    "【經驗共享互助】 目前數位操作已算順手，願意在輕鬆、無壓力的氛圍下，與校內同好共享心得。"
  ]
};

// ================= 系統常數設定 =================
const ZONES = ["西螺區", "虎尾區", "斗南區", "斗六區", "台西區", "北港區"];
const DOMAINS = ["語文", "數學", "社會", "自然科學", "藝術", "綜合活動", "科技", "健康與體育", "其他"];

// 雲林縣198所學校資料庫 (已扣除退出計畫之4所)
const YUNLIN_SCHOOLS = [
  // 斗六區 (斗六市, 林內鄉, 莿桐鄉)
  { zone: "斗六區", level: "國中", code: "091502", name: "淵明國中", teacherCount: 65 },
  { zone: "斗六區", level: "國中", code: "094515", name: "斗六國中", teacherCount: 163 },
  { zone: "斗六區", level: "國中", code: "094516", name: "雲林國中", teacherCount: 67 },
  { zone: "斗六區", level: "國中", code: "094529", name: "石榴國中", teacherCount: 52 },
  { zone: "斗六區", level: "國小", code: "094601", name: "鎮西國小", teacherCount: 67 },
  { zone: "斗六區", level: "國小", code: "094602", name: "鎮東國小", teacherCount: 55 },
  { zone: "斗六區", level: "國小", code: "094603", name: "溝壩國小", teacherCount: 26 },
  { zone: "斗六區", level: "國小", code: "094604", name: "梅林國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094605", name: "石榴國小", teacherCount: 35 },
  { zone: "斗六區", level: "國小", code: "094606", name: "溪洲國小", teacherCount: 19 },
  { zone: "斗六區", level: "國小", code: "094607", name: "林頭國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094608", name: "保長國小", teacherCount: 17 },
  { zone: "斗六區", level: "國小", code: "094609", name: "鎮南國小", teacherCount: 68 },
  { zone: "斗六區", level: "國小", code: "094610", name: "公誠國小", teacherCount: 85 },
  { zone: "斗六區", level: "國小", code: "094611", name: "久安國小", teacherCount: 12 },
  { zone: "斗六區", level: "國小", code: "094755", name: "雲林國小", teacherCount: 76 },
  { zone: "斗六區", level: "國小", code: "094756", name: "斗六國小", teacherCount: 72 },
  { zone: "斗六區", level: "國中", code: "091308", name: "正心高級中學(國中部)", teacherCount: 103 },
  { zone: "斗六區", level: "國小", code: "091601", name: "維多利亞小學", teacherCount: 38 },
  { zone: "斗六區", level: "國中", code: "091320", name: "維多利亞實驗高級中學(國中部)", teacherCount: 27 },
  { zone: "斗六區", level: "國中", code: "094530", name: "林內國中", teacherCount: 34 },
  { zone: "斗六區", level: "國小", code: "094625", name: "林內國小", teacherCount: 20 },
  { zone: "斗六區", level: "國小", code: "094626", name: "重興國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094627", name: "九芎國小", teacherCount: 12 },
  { zone: "斗六區", level: "國小", code: "094628", name: "成功國小", teacherCount: 11 },
  { zone: "斗六區", level: "國小", code: "094629", name: "林中國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094630", name: "民生國小", teacherCount: 11 },
  { zone: "斗六區", level: "國中", code: "094510", name: "莿桐國中", teacherCount: 48 },
  { zone: "斗六區", level: "國小", code: "094637", name: "莿桐國小", teacherCount: 42 },
  { zone: "斗六區", level: "國小", code: "094638", name: "饒平國小", teacherCount: 25 },
  { zone: "斗六區", level: "國小", code: "094639", name: "大美國小", teacherCount: 15 },
  { zone: "斗六區", level: "國小", code: "094640", name: "六合國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094641", name: "僑和國小", teacherCount: 10 },
  { zone: "斗六區", level: "國小", code: "094642", name: "育仁國小", teacherCount: 11 },
  // 西螺區 (西螺鎮, 二崙鄉, 崙背鄉)
  { zone: "西螺區", level: "國中", code: "091503", name: "東南國中", teacherCount: 118 },
  { zone: "西螺區", level: "國中", code: "094519", name: "西螺國中", teacherCount: 37 },
  { zone: "西螺區", level: "國小", code: "094680", name: "文昌國小", teacherCount: 67 },
  { zone: "西螺區", level: "國小", code: "094681", name: "中山國小", teacherCount: 59 },
  { zone: "西螺區", level: "國小", code: "094682", name: "廣興國小", teacherCount: 12 },
  { zone: "西螺區", level: "國小", code: "094683", name: "安定國小", teacherCount: 24 },
  { zone: "西螺區", level: "國小", code: "094684", name: "吳厝國小", teacherCount: 12 },
  { zone: "西螺區", level: "國小", code: "094685", name: "大新國小", teacherCount: 11 },
  { zone: "西螺區", level: "國小", code: "094686", name: "文賢國小", teacherCount: 10 },
  { zone: "西螺區", level: "國小", code: "094687", name: "文興國小", teacherCount: 10 },
  { zone: "西螺區", level: "國中", code: "094508", name: "二崙國中", teacherCount: 60 },
  { zone: "西螺區", level: "國小", code: "094688", name: "二崙國小", teacherCount: 22 },
  { zone: "西螺區", level: "國小", code: "094689", name: "三和國小", teacherCount: 11 },
  { zone: "西螺區", level: "國小", code: "094690", name: "油車國小", teacherCount: 14 },
  { zone: "西螺區", level: "國小", code: "094691", name: "大同國小", teacherCount: 10 },
  { zone: "西螺區", level: "國小", code: "094692", name: "永定國小", teacherCount: 12 },
  { zone: "西螺區", level: "國小", code: "094693", name: "義賢國小", teacherCount: 10 },
  { zone: "西螺區", level: "國小", code: "094694", name: "旭光國小", teacherCount: 10 },
  { zone: "西螺區", level: "國小", code: "094695", name: "來惠國小", teacherCount: 10 },
  { zone: "西螺區", level: "國中", code: "094511", name: "崙背國中", teacherCount: 45 },
  { zone: "西螺區", level: "國小", code: "094696", name: "崙背國小", teacherCount: 54 },
  { zone: "西螺區", level: "國小", code: "094697", name: "豐榮國小", teacherCount: 11 },
  { zone: "西螺區", level: "國小", code: "094698", name: "大有國小", teacherCount: 12 },
  { zone: "西螺區", level: "國小", code: "094699", name: "中和國小", teacherCount: 11 },
  { zone: "西螺區", level: "國小", code: "094700", name: "陽明國小", teacherCount: 12 },
  { zone: "西螺區", level: "國小", code: "094701", name: "東興國小", teacherCount: 19 },
  // 斗南區 (斗南鎮, 大埤鄉, 古坑鄉)
  { zone: "斗南區", level: "高中部", code: "094301", name: "斗南高中", teacherCount: 42 },
  { zone: "斗南區", level: "國中", code: "094401", name: "斗南高中(國中部)", teacherCount: 59 },
  { zone: "斗南區", level: "國中", code: "094502", name: "東明國中", teacherCount: 57 },
  { zone: "斗南區", level: "國小", code: "094631", name: "斗南國小", teacherCount: 62 },
  { zone: "斗南區", level: "國小", code: "094632", name: "大東國小", teacherCount: 13 },
  { zone: "斗南區", level: "國小", code: "094633", name: "石龜國小", teacherCount: 13 },
  { zone: "斗南區", level: "國小", code: "094634", name: "重光國小", teacherCount: 14 },
  { zone: "斗南區", level: "國小", code: "094635", name: "文安國小", teacherCount: 22 },
  { zone: "斗南區", level: "國小", code: "094636", name: "僑真國小", teacherCount: 56 },
  { zone: "斗南區", level: "國中", code: "094503", name: "大埤國中", teacherCount: 31 },
  { zone: "斗南區", level: "國小", code: "094643", name: "大埤國小", teacherCount: 29 },
  { zone: "斗南區", level: "國小", code: "094644", name: "舊庄國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094645", name: "仁和國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094646", name: "嘉興國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094647", name: "聯美國小", teacherCount: 10 },
  { zone: "斗南區", level: "國中", code: "094512", name: "古坑國中小(國中)", teacherCount: 26 },
  { zone: "斗南區", level: "國小", code: "094612", name: "古坑國中小(國小)", teacherCount: 16 },
  { zone: "斗南區", level: "國中", code: "094527", name: "東和國中", teacherCount: 40 },
  { zone: "斗南區", level: "國中", code: "094544", name: "樟湖國中小(國中)", teacherCount: 21 },
  { zone: "斗南區", level: "國小", code: "094618", name: "樟湖國中小(國小)", teacherCount: 14 },
  { zone: "斗南區", level: "國小", code: "094613", name: "東和國小", teacherCount: 23 },
  { zone: "斗南區", level: "國小", code: "094614", name: "永光國小", teacherCount: 11 },
  { zone: "斗南區", level: "國小", code: "094615", name: "華山國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094616", name: "棋山國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094617", name: "桂林國小", teacherCount: 11 },
  { zone: "斗南區", level: "國小", code: "094619", name: "草嶺生態地質國小", teacherCount: 11 },
  { zone: "斗南區", level: "國小", code: "094620", name: "華南國小", teacherCount: 12 },
  { zone: "斗南區", level: "國小", code: "094621", name: "興昌國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094622", name: "山峰華德福實驗國小", teacherCount: 12 },
  { zone: "斗南區", level: "國小", code: "094623", name: "水碓國小", teacherCount: 10 },
  { zone: "斗南區", level: "國小", code: "094624", name: "新光國小", teacherCount: 10 },
  { zone: "斗南區", level: "國中", code: "091506", name: "福智實驗國民中學", teacherCount: 17 },
  { zone: "斗南區", level: "國中", code: "091319", name: "福智高級中學(國中部)", teacherCount: 21 },
  // 虎尾區 (虎尾鎮, 土庫鎮, 元長鄉, 褒忠鄉)
  { zone: "虎尾區", level: "國中", code: "094517", name: "虎尾國中", teacherCount: 40 },
  { zone: "虎尾區", level: "國中", code: "094518", name: "崇德國中", teacherCount: 100 },
  { zone: "虎尾區", level: "國中", code: "094543", name: "東仁國中", teacherCount: 47 },
  { zone: "虎尾區", level: "國小", code: "094648", name: "虎尾國小", teacherCount: 79 },
  { zone: "虎尾區", level: "國小", code: "094649", name: "立仁國小", teacherCount: 95 },
  { zone: "虎尾區", level: "國小", code: "094650", name: "大屯國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094651", name: "中溪國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094652", name: "光復國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094653", name: "中正國小", teacherCount: 25 },
  { zone: "虎尾區", level: "國小", code: "094654", name: "平和國小", teacherCount: 18 },
  { zone: "虎尾區", level: "國小", code: "094655", name: "廉使國小", teacherCount: 11 },
  { zone: "虎尾區", level: "國小", code: "094656", name: "惠來國小", teacherCount: 11 },
  { zone: "虎尾區", level: "國小", code: "094657", name: "拯民國小", teacherCount: 18 },
  { zone: "虎尾區", level: "國小", code: "094658", name: "安慶國小", teacherCount: 57 },
  { zone: "虎尾區", level: "國中", code: "091316", name: "揚子高級中學(國中部)", teacherCount: 33 },
  { zone: "虎尾區", level: "國中", code: "094525", name: "土庫國中", teacherCount: 62 },
  { zone: "虎尾區", level: "國中", code: "094528", name: "馬光國中", teacherCount: 41 },
  { zone: "虎尾區", level: "國小", code: "094659", name: "土庫國小", teacherCount: 59 },
  { zone: "虎尾區", level: "國小", code: "094660", name: "馬光國小", teacherCount: 23 },
  { zone: "虎尾區", level: "國小", code: "094661", name: "埤腳國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094662", name: "後埔國小", teacherCount: 14 },
  { zone: "虎尾區", level: "國小", code: "094663", name: "秀潭國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094664", name: "新庄國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094665", name: "宏崙國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094758", name: "越港國小", teacherCount: 25 },
  { zone: "虎尾區", level: "國中", code: "091307", name: "永年高級中學(國中部)", teacherCount: 41 },
  { zone: "虎尾區", level: "國中", code: "094514", name: "元長國中", teacherCount: 33 },
  { zone: "虎尾區", level: "國小", code: "094715", name: "元長國小", teacherCount: 32 },
  { zone: "虎尾區", level: "國小", code: "094716", name: "新生國小", teacherCount: 11 },
  { zone: "虎尾區", level: "國小", code: "094717", name: "客厝國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094718", name: "山內國小", teacherCount: 9 },
  { zone: "虎尾區", level: "國小", code: "094719", name: "仁德國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094720", name: "忠孝國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094721", name: "仁愛國小", teacherCount: 11 },
  { zone: "虎尾區", level: "國小", code: "094722", name: "信義國小", teacherCount: 11 },
  { zone: "虎尾區", level: "國小", code: "094723", name: "和平國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國中", code: "094509", name: "褒忠國中", teacherCount: 20 },
  { zone: "虎尾區", level: "國小", code: "094666", name: "褒忠國小", teacherCount: 27 },
  { zone: "虎尾區", level: "國小", code: "094667", name: "龍巖國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094668", name: "復興國小", teacherCount: 10 },
  { zone: "虎尾區", level: "國小", code: "094669", name: "潮厝華德福小學", teacherCount: 11 },
  // 台西區 (台西鄉, 四湖鄉, 麥寮鄉, 東勢鄉)
  { zone: "台西區", level: "高中部", code: "094307", name: "麥寮高中", teacherCount: 42 },
  { zone: "台西區", level: "國中", code: "094607", name: "麥寮高中(國中部)", teacherCount: 85 },
  { zone: "台西區", level: "國中", code: "094524", name: "台西國中", teacherCount: 28 },
  { zone: "台西區", level: "國小", code: "094675", name: "臺西國小", teacherCount: 30 },
  { zone: "台西區", level: "國小", code: "094676", name: "崙豐國小", teacherCount: 21 },
  { zone: "台西區", level: "國小", code: "094677", name: "泉州國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094678", name: "新興國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094679", name: "尚德國小", teacherCount: 10 },
  { zone: "台西區", level: "國中", code: "094504", name: "飛沙國中", teacherCount: 18 },
  { zone: "台西區", level: "國中", code: "094505", name: "四湖國中", teacherCount: 13 },
  { zone: "台西區", level: "國中", code: "091311", name: "文生高級中學(國中部)", teacherCount: 30 },
  { zone: "台西區", level: "國小", code: "094724", name: "四湖國小", teacherCount: 21 },
  { zone: "台西區", level: "國小", code: "094725", name: "東光國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094726", name: "飛沙國小", teacherCount: 12 },
  { zone: "台西區", level: "國小", code: "094727", name: "林厝國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094728", name: "三崙國小", teacherCount: 12 },
  { zone: "台西區", level: "國小", code: "094729", name: "建陽國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094730", name: "南光國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094731", name: "鹿場國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094732", name: "明德國小", teacherCount: 10 },
  { zone: "台西區", level: "國小", code: "094733", name: "建華國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094734", name: "內湖國小", teacherCount: 10 },
  { zone: "台西區", level: "國小", code: "094702", name: "麥寮國小", teacherCount: 89 },
  { zone: "台西區", level: "國小", code: "094703", name: "橋頭國小", teacherCount: 59 },
  { zone: "台西區", level: "國小", code: "094704", name: "明禮國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094705", name: "興華國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094706", name: "豐安國小", teacherCount: 13 },
  { zone: "台西區", level: "國中", code: "094513", name: "東勢國中", teacherCount: 20 },
  { zone: "台西區", level: "國小", code: "094670", name: "東勢國小", teacherCount: 21 },
  { zone: "台西區", level: "國小", code: "094671", name: "安南國小", teacherCount: 10 },
  { zone: "台西區", level: "國小", code: "094672", name: "明倫國小", teacherCount: 11 },
  { zone: "台西區", level: "國小", code: "094673", name: "同安國小", teacherCount: 10 },
  { zone: "台西區", level: "國小", code: "094674", name: "龍潭國小", teacherCount: 10 },
  // 北港區 (北港鎮, 水林鄉, 口湖鄉)
  { zone: "北港區", level: "高中部", code: "094326", name: "蔦松藝術高中", teacherCount: 30 },
  { zone: "北港區", level: "國中", code: "094426", name: "蔦松藝術高中(國中部)", teacherCount: 39 },
  { zone: "北港區", level: "國中", code: "094520", name: "北港國中", teacherCount: 40 },
  { zone: "北港區", level: "國中", code: "094521", name: "建國國中", teacherCount: 90 },
  { zone: "北港區", level: "國小", code: "094707", name: "南陽國小", teacherCount: 42 },
  { zone: "北港區", level: "國小", code: "094708", name: "北辰國小", teacherCount: 86 },
  { zone: "北港區", level: "國小", code: "094709", name: "好收國小", teacherCount: 16 },
  { zone: "北港區", level: "國小", code: "094711", name: "東榮國小", teacherCount: 10 },
  { zone: "北港區", level: "國小", code: "094712", name: "朝陽國小", teacherCount: 10 },
  { zone: "北港區", level: "國小", code: "094713", name: "辰光國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094714", name: "僑美國小", teacherCount: 11 },
  { zone: "北港區", level: "國中", code: "094506", name: "水林國中", teacherCount: 23 },
  { zone: "北港區", level: "國小", code: "094746", name: "蔦松國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094747", name: "尖山國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094748", name: "宏仁國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094749", name: "文正國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094750", name: "誠正國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094751", name: "中興國小", teacherCount: 9 },
  { zone: "北港區", level: "國小", code: "094753", name: "水燦林國小", teacherCount: 39 },
  { zone: "北港區", level: "國小", code: "094754", name: "大興國小", teacherCount: 10 },
  { zone: "北港區", level: "國中", code: "094522", name: "宜梧國中", teacherCount: 18 },
  { zone: "北港區", level: "國中", code: "094523", name: "口湖國中", teacherCount: 25 },
  { zone: "北港區", level: "國小", code: "094735", name: "口湖國小", teacherCount: 12 },
  { zone: "北港區", level: "國小", code: "094736", name: "文光國小", teacherCount: 41 },
  { zone: "北港區", level: "國小", code: "094737", name: "金湖國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094738", name: "下崙國小", teacherCount: 15 },
  { zone: "北港區", level: "國小", code: "094739", name: "興南國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094740", name: "崇文國小", teacherCount: 10 },
  { zone: "北港區", level: "國小", code: "094741", name: "成龍國小", teacherCount: 11 },
  { zone: "北港區", level: "國小", code: "094742", name: "臺興國小", teacherCount: 10 },
  { zone: "北港區", level: "國小", code: "094743", name: "頂湖國小", teacherCount: 11 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchoolCode, setSelectedSchoolCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  
  const [hasVerifiedProfile, setHasVerifiedProfile] = useState(false);
  const [scores, setScores] = useState({});
  const [qualitative, setQualitative] = useState({ currentStatus: [], painPoints: [], supportPlans: [] });
  const [softwareChecks, setSoftwareChecks] = useState({ C1: [], C2: [], C3: [], C4: [] });
  const [softwareOthers, setSoftwareOthers] = useState({ C1: '', C2: '', C3: '', C4: '' });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [recommendationModal, setRecommendationModal] = useState(null);
  
  const [isSchoolAdminLoggedIn, setIsSchoolAdminLoggedIn] = useState(false);
  const [schoolAdminZone, setSchoolAdminZone] = useState('');
  const [schoolAdminSchoolCode, setSchoolAdminSchoolCode] = useState('');
  const [schoolAdminPassword, setSchoolAdminPassword] = useState('');

  const [isSuperAdminLoggedIn, setIsSuperAdminLoggedIn] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomedQR, setZoomedQR] = useState(null);
  const ITEMS_PER_PAGE = 20;

  const [allAssessments, setAllAssessments] = useState([]);

  useEffect(() => {
    let unsub = () => {};
    try {
      unsub = onSnapshot(collection(db, 'assessments'), 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllAssessments(data);
        },
        (error) => {
          console.error("Firebase Snapshot Error:", error);
          if (error.code === 'permission-denied') {
            console.warn("目前 Firebase 資料庫權限未開啟，請至後台修改 Security Rules。");
          }
        }
      );
    } catch(err) {
      console.error(err);
    }
    return () => unsub();
  }, []);

  const uniqueLatestAssessments = useMemo(() => {
    const map = new Map();
    allAssessments.forEach(a => {
      const key = `${a.schoolCode}_${a.teacherId}_${a.teacherName}`;
      if (!map.has(key) || a.attemptNumber > map.get(key).attemptNumber) {
        map.set(key, a);
      }
    });
    return Array.from(map.values());
  }, [allAssessments]);

  const teacherAvailableZones = useMemo(() => {
    if (!selectedLevel) return [];
    if (selectedLevel === '高中部') {
      return Array.from(new Set(YUNLIN_SCHOOLS.filter(s => s.level === '高中部').map(s => s.zone)));
    }
    return ZONES;
  }, [selectedLevel]);

  const filteredSchools = useMemo(() => {
    return YUNLIN_SCHOOLS.filter(s => s.level === selectedLevel && s.zone === selectedZone);
  }, [selectedLevel, selectedZone]);

  const currentTeacherHistory = useMemo(() => {
    if (!teacherId || !teacherName || !selectedSchoolCode) return [];
    return allAssessments
      .filter(a => a.teacherId === teacherId && a.teacherName === teacherName && a.schoolCode === selectedSchoolCode)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }, [teacherId, teacherName, selectedSchoolCode, allAssessments]);

  // 即時計算四大維度平均（隨作答即時更新）
  const liveAverages = useMemo(() => {
    const dims = ['A', 'B', 'C', 'D'];
    const result = {};
    const dimAvgs = [];
    let answeredTotal = 0;
    dims.forEach(d => {
      const vals = [1, 2, 3, 4, 5]
        .map(n => scores[d + n])
        .filter(v => typeof v === 'number');
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      result[d] = { avg: parseFloat(avg.toFixed(2)), answered: vals.length };
      answeredTotal += vals.length;
      if (vals.length === 5) dimAvgs.push(avg);
    });
    result.total = dimAvgs.length === 4
      ? parseFloat((dimAvgs.reduce((a, b) => a + b, 0) / 4).toFixed(2))
      : null;
    result.answeredTotal = answeredTotal;
    return result;
  }, [scores]);

  const handleVerifyProfile = () => {
    if (!selectedLevel || !selectedDomain || !selectedZone || !selectedSchoolCode || !teacherName.trim() || !teacherId.trim()) {
      setModalMessage({ text: "請填寫完整資訊，包含教育階段、任教領域與分區！", type: "error" });
      return;
    }
    
    setHasVerifiedProfile(true);

    if (currentTeacherHistory.length > 0) {
      const latest = currentTeacherHistory[currentTeacherHistory.length - 1];
      setScores(latest.scores || {});
      // 防呆：舊版資料可能缺少部分欄位，統一補齊成完整結構，避免渲染時讀取 undefined 而當掉
      setQualitative({
        currentStatus: latest.qualitative?.currentStatus || latest.qualitative?.selfAnalysis || [],
        painPoints: latest.qualitative?.painPoints || [],
        supportPlans: latest.qualitative?.supportPlans || latest.qualitative?.supportNeeds || [],
      });
      setSoftwareChecks({
        C1: latest.softwareChecks?.C1 || [],
        C2: latest.softwareChecks?.C2 || [],
        C3: latest.softwareChecks?.C3 || [],
        C4: latest.softwareChecks?.C4 || [],
      });
      setSoftwareOthers({
        C1: latest.softwareOthers?.C1 || '',
        C2: latest.softwareOthers?.C2 || '',
        C3: latest.softwareOthers?.C3 || '',
        C4: latest.softwareOthers?.C4 || '',
      });
      setModalMessage({ text: "身分載入成功！已為您自動帶入上一次的評估紀錄。", type: "success" });
    } else {
      setScores({});
      setQualitative({ currentStatus: [], painPoints: [], supportPlans: [] });
      setSoftwareChecks({ C1: [], C2: [], C3: [], C4: [] });
      setSoftwareOthers({ C1: '', C2: '', C3: '', C4: '' });
      setModalMessage({ text: "身分載入成功！開始您的第一次評估。", type: "success" });
    }
  };

  const resetFormAndLogout = () => {
    setHasVerifiedProfile(false);
    setSelectedLevel('');
    setSelectedDomain('');
    setSelectedZone('');
    setSelectedSchoolCode('');
    setTeacherName('');
    setTeacherId('');
    setScores({});
    setQualitative({ currentStatus: [], painPoints: [], supportPlans: [] });
    setSoftwareChecks({ C1: [], C2: [], C3: [], C4: [] });
    setSoftwareOthers({ C1: '', C2: '', C3: '', C4: '' });
    setActiveTab('home');
  };

  const selectedSchoolObj = YUNLIN_SCHOOLS.find(s => s.code === selectedSchoolCode);

  const handleScoreChange = (qId, val) => setScores(prev => ({ ...prev, [qId]: val }));

  const handleSubmitAssessment = async () => {
    // 20 題必填檢核
    const requiredQs = ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','C4','C5','D1','D2','D3','D4','D5'];
    const isComplete = requiredQs.every(q => scores[q]);
    if (!isComplete) {
      setModalMessage({ text: "請確保所有指標 (20項) 皆已完成評分！", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const s = scores;
      const avgA = parseFloat(((s.A1 + s.A2 + s.A3 + s.A4 + s.A5) / 5).toFixed(2));
      const avgB = parseFloat(((s.B1 + s.B2 + s.B3 + s.B4 + s.B5) / 5).toFixed(2));
      const avgC = parseFloat(((s.C1 + s.C2 + s.C3 + s.C4 + s.C5) / 5).toFixed(2));
      const avgD = parseFloat(((s.D1 + s.D2 + s.D3 + s.D4 + s.D5) / 5).toFixed(2));
      const totalAvg = parseFloat(((avgA + avgB + avgC + avgD) / 4).toFixed(2));

      const now = new Date();
      const formattedTime = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newRecord = {
        schoolCode: selectedSchoolCode,
        schoolName: selectedSchoolObj.name,
        zone: selectedSchoolObj.zone,
        level: selectedSchoolObj.level,
        schoolTeacherCount: selectedSchoolObj.teacherCount,
        teacherDomain: selectedDomain,
        teacherName: teacherName.trim(),
        teacherId: teacherId.trim(),
        attemptNumber: currentTeacherHistory.length + 1,
        scores: s,
        averages: { A: avgA, B: avgB, C: avgC, D: avgD },
        totalAverage: totalAvg,
        qualitative,
        softwareChecks,
        softwareOthers,
        submitTime: formattedTime,
        createdAt: serverTimestamp()
      };

      // 設置 8 秒超時防呆機制
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
      await Promise.race([
        addDoc(collection(db, 'assessments'), newRecord),
        timeoutPromise
      ]);
      
      const lowDims = [];
      if (avgA <= 2) lowDims.push('A');
      if (avgB <= 2) lowDims.push('B');
      if (avgC <= 2) lowDims.push('C');
      if (avgD <= 2) lowDims.push('D');

      if (lowDims.length > 0) {
        setRecommendationModal({ dims: lowDims, message: "🎉 資料安全寫入成功！檢測到部分維度可再精進，為您推薦以下研習：" });
      } else {
        setModalMessage({ text: "🎉 資料安全寫入成功！您的數位教學能力非常優秀！", type: "success", isEnd: true });
      }
    } catch (err) {
      if (err.message === 'timeout') {
        setModalMessage({ text: "資料庫連線超時，請確認網路或聯絡系統管理員。", type: "error" });
      } else {
        setModalMessage({ text: "寫入失敗：權限不足或網路異常。請確認已於後台開放讀寫權限。", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchoolAdminLogin = () => {
    if (schoolAdminPassword === schoolAdminSchoolCode && schoolAdminSchoolCode !== '') {
      setIsSchoolAdminLoggedIn(true);
      setModalMessage({ text: "校級管理員登入成功", type: "success" });
    } else {
      setModalMessage({ text: "密碼錯誤，提示：密碼為學校6碼代碼", type: "error" });
    }
  };

  const handleSuperAdminLogin = (e) => {
    if (e.target.value === '056341014') {
      setIsSuperAdminLoggedIn(true);
      setModalMessage({ text: "總管理者登入成功！", type: "success" });
    }
  };

  const generateExcel = (data, options = {}) => {
    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return String(unsafe).replace(/[<>&'"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return '';
        }
      });
    };

    let xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">`;

    const headers = ['填報時間', '分區', '教育階段', '學校代碼', '學校名稱', '領域', '姓名', '教師識別碼', '總平均', 'A大屏平均', 'B雙屏平均', 'C平台平均', 'D生成式AI平均', 'A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5', 'D1', 'D2', 'D3', 'D4', 'D5', 'C1派題軟體', 'C2互動軟體', 'C3遊戲軟體', 'C4檢測軟體', '現況自剖', '真實痛點', '支持敲碗'];

    const buildWorksheet = (sheetName, sheetData) => {
      const safeSheetName = escapeXml(sheetName.substring(0, 31).replace(/[:\\/?*\[\]]/g, ''));
      let sheetXml = `\n <Worksheet ss:Name="${safeSheetName}">\n  <Table>`;
      
      sheetXml += `\n   <Row>`;
      headers.forEach(h => {
        sheetXml += `\n    <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
      });
      sheetXml += `\n   </Row>`;
      
      sheetData.forEach(item => {
        sheetXml += `\n   <Row>`;
        
        const c1Software = (item.softwareChecks?.C1 || []).concat(item.softwareOthers?.C1 ? [`其它(${item.softwareOthers.C1})`] : []).join(', ');
        const c2Software = (item.softwareChecks?.C2 || []).concat(item.softwareOthers?.C2 ? [`其它(${item.softwareOthers.C2})`] : []).join(', ');
        const c3Software = (item.softwareChecks?.C3 || []).concat(item.softwareOthers?.C3 ? [`其它(${item.softwareOthers.C3})`] : []).join(', ');
        const c4Software = (item.softwareChecks?.C4 || []).concat(item.softwareOthers?.C4 ? [`其它(${item.softwareOthers.C4})`] : []).join(', ');

        const rowData = [
          item.submitTime || '', item.zone || '', item.level || '', item.schoolCode || '', item.schoolName || '', item.teacherDomain || '', item.teacherName || '', item.teacherId || '', item.totalAverage || '', item.averages?.A || '', item.averages?.B || '', item.averages?.C || '', item.averages?.D || '',
          item.scores?.A1 || '', item.scores?.A2 || '', item.scores?.A3 || '', item.scores?.A4 || '', item.scores?.A5 || '',
          item.scores?.B1 || '', item.scores?.B2 || '', item.scores?.B3 || '', item.scores?.B4 || '', item.scores?.B5 || '',
          item.scores?.C1 || '', item.scores?.C2 || '', item.scores?.C3 || '', item.scores?.C4 || '', item.scores?.C5 || '',
          item.scores?.D1 || '', item.scores?.D2 || '', item.scores?.D3 || '', item.scores?.D4 || '', item.scores?.D5 || '',
          c1Software, c2Software, c3Software, c4Software,
          (item.qualitative?.currentStatus || []).join('、'),
          (item.qualitative?.painPoints || []).join('、'),
          (item.qualitative?.supportPlans || []).join('、')
        ];

        rowData.forEach(cellData => {
          sheetXml += `\n    <Cell><Data ss:Type="String">${escapeXml(String(cellData))}</Data></Cell>`;
        });
        sheetXml += `\n   </Row>`;
      });

      sheetXml += `\n  </Table>\n </Worksheet>`;
      return sheetXml;
    };

    if (options.singleSheetName) {
      // 各校後台：只匯出單一、以校名命名的工作表，僅含該校資料
      xml += buildWorksheet(options.singleSheetName, data);
    } else {
      // 大數據總後台：全縣總表 + 各分區總表 + 各校分頁
      xml += buildWorksheet("全縣總表", data);

      const zones = [...new Set(data.map(d => d.zone))];
      zones.forEach(z => {
        if(z) xml += buildWorksheet(`${z}總表`, data.filter(d => d.zone === z));
      });

      const schools = [...new Set(data.map(d => d.schoolName))];
      schools.forEach(s => {
        if(s) xml += buildWorksheet(s, data.filter(d => d.schoolName === s));
      });
    }

    xml += `\n</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${options.fileName || '雲林縣數位教學評估大數據'}_${new Date().getTime()}.xls`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      {/* 導覽列 */}
      <nav className="bg-teal-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setActiveTab('home')}>
            <School className="text-teal-400 shrink-0" size={22} />
            <span className="font-black text-base sm:text-xl tracking-wide whitespace-nowrap">雲林縣數位教學評估系統</span>
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
            <button onClick={() => setActiveTab('home')} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'home' ? 'bg-teal-800 text-white' : 'hover:bg-teal-800/50 text-teal-100'}`}><Home size={18}/> 首頁</button>
            <button onClick={() => setActiveTab('assessment')} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'assessment' ? 'bg-teal-800 text-white' : 'hover:bg-teal-800/50 text-teal-100'}`}><BookOpen size={18}/> 教師自評</button>
            <button onClick={() => setActiveTab('school-admin')} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'school-admin' ? 'bg-teal-800 text-white' : 'hover:bg-teal-800/50 text-teal-100'}`}><Search size={18}/> 各校後台</button>
            <button onClick={() => setActiveTab('super-admin')} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'super-admin' ? 'bg-teal-800 text-white' : 'hover:bg-teal-800/50 text-teal-100'}`}><Sparkles size={18}/> 大數據後台</button>
          </div>
        </div>
      </nav>

      {/* 主內容區 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ================= 首頁 ================= */}
        {activeTab === 'home' && (
          <>
            <div className="bg-white rounded-3xl p-10 md:p-16 shadow-sm border border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
              <h1 className="text-4xl md:text-5xl font-black text-teal-900 mb-6 tracking-tight">雲林縣 114 學年度數位教學評估</h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                落實數位融入教學，打造智慧教育新未來。本系統將客觀評估您的數位工具掌握度，並為您推薦專屬增能資源。
              </p>
              <div className="flex justify-center flex-wrap gap-4 mt-8">
                <button onClick={() => setActiveTab('assessment')} className="bg-teal-700 hover:bg-teal-800 text-white font-black text-lg py-4 px-10 rounded-2xl shadow-xl transition transform hover:-translate-y-1">開始教師自評</button>
                <button onClick={() => setActiveTab('school-admin')} className="bg-white border-2 border-slate-200 hover:border-teal-600 text-slate-700 hover:text-teal-700 font-bold text-lg py-4 px-8 rounded-2xl shadow transition">各校管理後台</button>
              </div>
            </div>

            {/* 研習與 VOD 專區 */}
            <div className="mt-16 max-w-6xl mx-auto px-4">
              <h3 className="text-2xl font-black text-center mb-8 text-teal-900 flex items-center justify-center gap-2">
                <PlayCircle className="text-red-500"/> 數位增能：推薦研習與錄影回放專區
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(HOMEPAGE_RESOURCES).map(([dim, resources]) => (
                  <div key={dim} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                    <div className={`px-4 py-3 font-bold text-white ${dim === 'A' ? 'bg-blue-600' : dim === 'B' ? 'bg-emerald-600' : dim === 'C' ? 'bg-purple-600' : 'bg-orange-500'}`}>
                      {dim === 'A' ? 'A. 大屏系統操作' : dim === 'B' ? 'B. 雙屏協作實踐' : dim === 'C' ? 'C. 數位平台整合' : 'D. AI 融入教學'}
                    </div>
                    <div className="p-4 space-y-4">
                      {resources.map((res, idx) => (
                        <a key={idx} href={res.link} target="_blank" rel="noreferrer" className="flex items-start gap-3 group">
                          <div className={`mt-0.5 rounded-lg p-1.5 ${res.type === 'VOD' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                            {res.type === 'VOD' ? <PlayCircle size={18} /> : <Presentation size={18} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-700 group-hover:text-teal-600 transition leading-snug">{res.title}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                              {res.type === 'VOD' ? '觀看回放' : '前往報名'} <ExternalLink size={12} />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code 專區 */}
            <div className="mt-16 max-w-4xl mx-auto mb-10 px-4">
              <div className="bg-gradient-to-br from-slate-50 to-teal-50 rounded-3xl p-8 border border-teal-100 shadow-inner">
                <h3 className="text-xl font-black text-center mb-8 text-teal-900">快速掃描連結站</h3>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                  {Object.entries(QR_LINKS).map(([key, data]) => (
                    <div key={key} className="flex flex-col items-center cursor-pointer group" onClick={() => setZoomedQR(data)}>
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 group-hover:border-teal-400 group-hover:shadow-lg transition-all duration-300 relative transform group-hover:-translate-y-2">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.url)}`} alt={data.title} className="w-28 h-28" />
                        <div className="absolute inset-0 bg-teal-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-2xl">
                          <ZoomIn className="text-white drop-shadow-md" size={36} />
                        </div>
                      </div>
                      <span className="mt-4 text-sm font-bold text-slate-600 group-hover:text-teal-700">{data.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= 教師自評 ================= */}
        {activeTab === 'assessment' && (
          <div className="max-w-4xl mx-auto space-y-6 relative">
            
            {!hasVerifiedProfile ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-black mb-6 text-teal-900 border-b pb-4">教師身分驗證與履歷載入</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">教育階段</label>
                    <select value={selectedLevel} onChange={(e) => {setSelectedLevel(e.target.value); setSelectedZone(''); setSelectedSchoolCode('');}} className="w-full p-3 border rounded-xl bg-slate-50">
                      <option value="">請選擇</option><option value="高中部">高中部</option><option value="國中">國中</option><option value="國小">國小</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">任教領域</label>
                    <select value={selectedDomain} onChange={e=>setSelectedDomain(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50">
                      <option value="">請選擇</option>{DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">鄉鎮市分區</label>
                    <select value={selectedZone} onChange={e => {setSelectedZone(e.target.value); setSelectedSchoolCode('');}} className="w-full p-3 border rounded-xl bg-slate-50" disabled={!selectedLevel}>
                      <option value="">請選擇分區</option>
                      {teacherAvailableZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">服務學校</label>
                    <select value={selectedSchoolCode} onChange={e => setSelectedSchoolCode(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" disabled={!selectedZone}>
                      <option value="">請選擇學校</option>
                      {filteredSchools.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">真實姓名</label>
                    <input type="text" placeholder="如：王小明" value={teacherName} onChange={e=>setTeacherName(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">身分證/居留證字號 (末4碼)</label>
                    <input type="text" placeholder="如：1234" value={teacherId} onChange={e=>setTeacherId(e.target.value)} maxLength={4} className="w-full p-3 border rounded-xl bg-slate-50" />
                  </div>
                </div>
                <button onClick={handleVerifyProfile} className="mt-8 w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-4 rounded-xl shadow-md transition">載入自評履歷 / 開始填寫</button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-teal-200 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-teal-800 flex items-center gap-2"><CheckCircle2 size={18} className="shrink-0"/> 歡迎回來，{teacherName} 老師</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {currentTeacherHistory.length > 0
                        ? `您先前已填報過 ${currentTeacherHistory.length} 次，上次總平均 ${currentTeacherHistory[currentTeacherHistory.length - 1]?.totalAverage ?? '—'} 分，系統已帶入您的紀錄。`
                        : '這是您的首次填報，請依據真實狀況勾選。'}
                    </p>
                  </div>
                  <button onClick={resetFormAndLogout} className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-1.5">
                    登出 <LogOut size={14}/>
                  </button>
                </div>
                
                {/* 20 題組區塊 Rendering */}
                {QUESTIONS.map(section => (
                  <div key={section.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b">
                      <h3 className="text-lg font-black text-slate-800">{section.id}. {section.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{section.subtitle}</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {section.qs.map(q => (
                        <div key={q.id} className="p-6 hover:bg-slate-50/30 transition">
                          <div className="font-bold text-slate-800 mb-4 text-lg">{q.id} {q.name}</div>
                          <div className="space-y-3">
                            {q.options.map(opt => (
                              <label key={opt.score} className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all duration-200 ${scores[q.id] === opt.score ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-slate-100 bg-white hover:border-teal-200'}`}>
                                <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full font-black text-sm mt-0.5 shadow-sm bg-white border border-slate-200">
                                  {scores[q.id] === opt.score ? <span className="text-teal-600">{opt.score}分</span> : <span className="text-slate-400">{opt.score}</span>}
                                </div>
                                <input type="radio" name={q.id} checked={scores[q.id] === opt.score} onChange={() => handleScoreChange(q.id, opt.score)} className="hidden" />
                                <span className={`text-[15px] leading-relaxed pt-1 ${scores[q.id] === opt.score ? 'text-teal-900 font-bold' : 'text-slate-600'}`}>{opt.text}</span>
                              </label>
                            ))}
                          </div>
                          
                          {/* C 大題軟體勾選 */}
                          {q.tools && (
                            <div className="mt-5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                              <span className="text-sm font-bold text-slate-700">【最常使用的平台/工具】（可複選）：</span>
                              <div className="flex flex-wrap gap-x-6 gap-y-3">
                                {q.tools.map(t => (
                                  <label key={t} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                    <input type="checkbox" checked={softwareChecks[q.id]?.includes(t)} onChange={(e) => {
                                      setSoftwareChecks(prev => {
                                        const arr = prev[q.id] || [];
                                        return { ...prev, [q.id]: e.target.checked ? [...arr, t] : arr.filter(x => x !== t) };
                                      });
                                    }} className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4" /> {t}
                                  </label>
                                ))}
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-600 font-bold">其它:</span>
                                  <input type="text" value={softwareOthers[q.id] || ''} onChange={e=>setSoftwareOthers(prev=>({...prev, [q.id]: e.target.value}))} className="border-b-2 focus:border-teal-500 outline-none text-sm w-32 bg-transparent px-1 pb-1" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 全新質性回饋 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-10">
                  <h3 className="text-xl font-black text-slate-800 border-b pb-4">質性與支持回饋</h3>
                  <p className="text-sm text-slate-500 -mt-6">填答說明：請依據您在課堂推動數位教學的現況填寫，每個項目皆為【可多選】。</p>
                  
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-4 bg-slate-100 p-3 rounded-lg">1. 現況自剖：對於目前的「數位/AI 教學」，我認為整體現況最接近：</label>
                    <div className="space-y-3 px-2">
                      {QUALITATIVE_OPTS.currentStatus.map(opt => (
                        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                          <input type="checkbox" checked={(qualitative.currentStatus || []).includes(opt)} onChange={(e)=>{
                            setQualitative(p => ({...p, currentStatus: e.target.checked ? [...(p.currentStatus || []), opt] : (p.currentStatus || []).filter(x => x !== opt)}));
                          }} className="mt-1 rounded text-teal-600 focus:ring-teal-500 w-5 h-5 cursor-pointer" />
                          <span className="text-sm text-slate-700 leading-relaxed group-hover:text-teal-700 transition">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-4 bg-slate-100 p-3 rounded-lg">2. 真實痛點：在課堂實踐數位教學時，我目前較希望克服的是：</label>
                    <div className="space-y-3 px-2">
                      {QUALITATIVE_OPTS.painPoints.map(opt => (
                        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                          <input type="checkbox" checked={(qualitative.painPoints || []).includes(opt)} onChange={(e)=>{
                            setQualitative(p => ({...p, painPoints: e.target.checked ? [...(p.painPoints || []), opt] : (p.painPoints || []).filter(x => x !== opt)}));
                          }} className="mt-1 rounded text-teal-600 focus:ring-teal-500 w-5 h-5 cursor-pointer" />
                          <span className="text-sm text-slate-700 leading-relaxed group-hover:text-teal-700 transition">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-4 bg-slate-100 p-3 rounded-lg">3. 支持敲碗：在未來的專業成長上，我最期待學校提供怎樣的後援：</label>
                    <div className="space-y-3 px-2">
                      {QUALITATIVE_OPTS.supportPlans.map(opt => (
                        <label key={opt} className="flex items-start gap-3 cursor-pointer group">
                          <input type="checkbox" checked={(qualitative.supportPlans || []).includes(opt)} onChange={(e)=>{
                            setQualitative(p => ({...p, supportPlans: e.target.checked ? [...(p.supportPlans || []), opt] : (p.supportPlans || []).filter(x => x !== opt)}));
                          }} className="mt-1 rounded text-teal-600 focus:ring-teal-500 w-5 h-5 cursor-pointer" />
                          <span className="text-sm text-slate-700 leading-relaxed group-hover:text-teal-700 transition">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 即時四維度平均分數 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><TrendingUp size={20} className="text-teal-600"/> 我的即時評估分數</h3>
                    <span className="text-sm font-bold text-slate-400">已完成 {liveAverages.answeredTotal} / 20 題</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { dim: 'A', label: 'A 大屏操作', color: 'blue' },
                      { dim: 'B', label: 'B 雙屏協作', color: 'emerald' },
                      { dim: 'C', label: 'C 平台整合', color: 'purple' },
                      { dim: 'D', label: 'D 生成式AI', color: 'orange' },
                    ].map(({ dim, label, color }) => {
                      const d = liveAverages[dim];
                      const done = d.answered === 5;
                      const colorMap = {
                        blue: 'bg-blue-50 border-blue-100 text-blue-700',
                        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                        purple: 'bg-purple-50 border-purple-100 text-purple-700',
                        orange: 'bg-orange-50 border-orange-100 text-orange-700',
                      };
                      return (
                        <div key={dim} className={`rounded-xl border p-4 flex flex-col items-center justify-center ${colorMap[color]}`}>
                          <span className="text-xs font-bold mb-1">{label}</span>
                          <span className="text-3xl font-black leading-none">{done ? d.avg : '—'}</span>
                          <span className="text-[11px] mt-1.5 opacity-70 font-bold">{d.answered}/5 題</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 bg-teal-800 rounded-xl p-4 flex items-center justify-between text-white">
                    <span className="font-bold">總平均分數</span>
                    <span className="text-3xl font-black">{liveAverages.total ?? '—'}</span>
                  </div>
                  {liveAverages.total === null && (
                    <p className="text-center text-xs text-slate-400 font-bold mt-3">完成全部 20 題後，即可看到您的總平均分數</p>
                  )}
                </div>

                <button onClick={handleSubmitAssessment} disabled={isSubmitting} className={`w-full font-black text-lg py-5 rounded-2xl shadow-xl transition transform hover:-translate-y-1 ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-teal-800 hover:bg-teal-900 text-white'}`}>
                  {isSubmitting ? '資料安全寫入中，請稍候...' : '完成評估並送出資料庫'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= 各校管理後台 ================= */}
        {activeTab === 'school-admin' && (
          <div className="space-y-6">
            {!isSchoolAdminLoggedIn ? (
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto mt-10">
                 <div className="flex justify-center mb-4"><School size={48} className="text-teal-600" /></div>
                 <h2 className="font-black text-2xl text-center mb-6">各校管理後台</h2>
                 
                 <select value={schoolAdminZone} onChange={e=>{setSchoolAdminZone(e.target.value); setSchoolAdminSchoolCode('');}} className="w-full p-4 border-2 border-slate-200 rounded-xl mb-4 bg-slate-50 text-lg font-bold text-slate-700 focus:border-teal-500 outline-none transition">
                    <option value="">-- 請先選擇分區 --</option>
                    {ZONES.map(zone => (
                      <option key={zone} value={zone}>📍 {zone}</option>
                    ))}
                 </select>

                 <select value={schoolAdminSchoolCode} onChange={e=>setSchoolAdminSchoolCode(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-xl mb-6 bg-slate-50 text-base font-bold focus:border-teal-500 outline-none transition disabled:opacity-50" disabled={!schoolAdminZone}>
                    <option value="">-- 請選擇您的學校 --</option>
                    {YUNLIN_SCHOOLS.filter(s => s.zone === schoolAdminZone).map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                 </select>
                 
                 <input type="password" placeholder="輸入學校 6 碼代碼" value={schoolAdminPassword} onChange={e=>setSchoolAdminPassword(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-xl mb-6 bg-slate-50 text-center text-lg font-mono tracking-widest focus:border-teal-500 outline-none transition" />
                 <button onClick={handleSchoolAdminLogin} className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-4 rounded-xl shadow-lg transition text-lg">安全登入</button>
               </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
                  <div>
                    <h2 className="font-black text-2xl flex items-center gap-2 text-teal-900">{YUNLIN_SCHOOLS.find(s=>s.code===schoolAdminSchoolCode)?.name} 專屬看板</h2>
                    <p className="opacity-80 text-sm mt-1 text-slate-500">掌握校內教師數位教學熟悉度與研習需求</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => {
                      const schoolName = YUNLIN_SCHOOLS.find(s=>s.code===schoolAdminSchoolCode)?.name || '本校';
                      generateExcel(
                        uniqueLatestAssessments.filter(a => a.schoolCode === schoolAdminSchoolCode),
                        { singleSheetName: schoolName, fileName: `${schoolName}_數位教學評估` }
                      );
                    }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow transition">
                      <Download size={18}/> 匯出本校大數據 (Excel)
                    </button>
                    <button onClick={() => {
                      setIsSchoolAdminLoggedIn(false);
                      setSchoolAdminZone('');
                      setSchoolAdminSchoolCode('');
                      setSchoolAdminPassword('');
                    }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition">
                      登出 <LogOut size={16}/>
                    </button>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-800">
                        <th className="p-3">填報時間</th>
                        <th className="p-3">領域</th>
                        <th className="p-3">姓名</th>
                        <th className="p-3 text-center">總平均</th>
                        <th className="p-3 text-center">A操作</th>
                        <th className="p-3 text-center">B協作</th>
                        <th className="p-3 text-center">C平台</th>
                        <th className="p-3 text-center">D生成AI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueLatestAssessments.filter(a => a.schoolCode === schoolAdminSchoolCode).sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds).map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 border-b text-slate-500">{item.submitTime}</td>
                          <td className="p-3 border-b text-slate-500">{item.teacherDomain}</td>
                          <td className="p-3 border-b font-bold text-slate-700">{item.teacherName}</td>
                          <td className="p-3 border-b text-center font-black text-teal-700">{item.totalAverage}</td>
                          <td className={`p-3 border-b text-center font-bold ${item.averages.A <= 2 ? 'text-red-500' : 'text-slate-600'}`}>{item.averages.A}</td>
                          <td className={`p-3 border-b text-center font-bold ${item.averages.B <= 2 ? 'text-red-500' : 'text-slate-600'}`}>{item.averages.B}</td>
                          <td className={`p-3 border-b text-center font-bold ${item.averages.C <= 2 ? 'text-red-500' : 'text-slate-600'}`}>{item.averages.C}</td>
                          <td className={`p-3 border-b text-center font-bold ${item.averages.D <= 2 ? 'text-red-500' : 'text-slate-600'}`}>{item.averages.D}</td>
                        </tr>
                      ))}
                      {uniqueLatestAssessments.filter(a => a.schoolCode === schoolAdminSchoolCode).length === 0 && (
                        <tr><td colSpan="8" className="p-8 text-center text-slate-400 font-bold">尚無教師填報資料</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= 大數據總部 ================= */}
        {activeTab === 'super-admin' && (
          <div className="space-y-6">
            {!isSuperAdminLoggedIn ? (
               <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl max-w-md mx-auto mt-10 border border-slate-700">
                 <div className="flex justify-center mb-4"><Sparkles size={48} className="text-teal-400" /></div>
                 <h2 className="font-black text-2xl text-center mb-6 text-white">大數據後台</h2>
                 <input type="password" placeholder="請輸入總管理密碼" onChange={handleSuperAdminLogin} className="w-full p-4 border-none rounded-xl mb-4 bg-slate-800 text-white text-center text-lg focus:ring-2 focus:ring-teal-500 outline-none" />
               </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-gradient-to-r from-teal-900 to-slate-800 rounded-3xl p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between sm:items-end gap-6">
                  <div>
                    <h2 className="font-black text-3xl flex items-center gap-2"><Sparkles className="text-yellow-400"/> 雲林縣大數據後台</h2>
                    <p className="opacity-80 text-sm mt-2">即時統計全縣各校教師填報數據，支援分區與跨校檢索匯出。</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => generateExcel(uniqueLatestAssessments)} className="bg-white text-teal-900 px-5 py-3 rounded-xl text-sm font-black shadow-lg flex items-center justify-center gap-2 hover:bg-slate-100 transition"><Download size={18}/> 導出全縣 Excel (自動多工作表)</button>
                    <button onClick={() => setIsSuperAdminLoggedIn(false)} className="px-4 py-2 border border-white/30 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10"><LogOut size={16}/></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-sm font-bold mb-2">全縣獨立教師數</span>
                    <span className="text-4xl font-black text-teal-700">{uniqueLatestAssessments.length}</span>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-blue-700 text-sm font-bold mb-2">A 大屏操作平均</span>
                    <span className="text-4xl font-black text-blue-700">{(uniqueLatestAssessments.reduce((sum, a) => sum + (a.averages?.A || 0), 0) / (uniqueLatestAssessments.length || 1)).toFixed(2)}</span>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-emerald-700 text-sm font-bold mb-2">B 雙屏協作平均</span>
                    <span className="text-4xl font-black text-emerald-700">{(uniqueLatestAssessments.reduce((sum, a) => sum + (a.averages?.B || 0), 0) / (uniqueLatestAssessments.length || 1)).toFixed(2)}</span>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-purple-700 text-sm font-bold mb-2">C 平台軟體平均</span>
                    <span className="text-4xl font-black text-purple-700">{(uniqueLatestAssessments.reduce((sum, a) => sum + (a.averages?.C || 0), 0) / (uniqueLatestAssessments.length || 1)).toFixed(2)}</span>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-orange-700 text-sm font-bold mb-2">D 生成式AI平均</span>
                    <span className="text-4xl font-black text-orange-700">{(uniqueLatestAssessments.reduce((sum, a) => sum + (a.averages?.D || 0), 0) / (uniqueLatestAssessments.length || 1)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="搜尋 學校/姓名/代碼" value={adminSearchQuery} onChange={e=>setAdminSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border rounded-xl w-64 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="bg-white text-slate-600">
                          <th className="p-4 border-b">填報時間</th>
                          <th className="p-4 border-b">分區 / 學校</th>
                          <th className="p-4 border-b">姓名 (識別碼)</th>
                          <th className="p-4 border-b text-center">總平均</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = uniqueLatestAssessments.filter(a => a.schoolName?.includes(adminSearchQuery) || a.teacherName?.includes(adminSearchQuery) || a.teacherId?.includes(adminSearchQuery)).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
                          const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                          return paginated.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 border-b last:border-0">
                              <td className="p-4 text-slate-500">{item.submitTime}</td>
                              <td className="p-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded mr-2">{item.zone}</span><span className="font-bold text-slate-700">{item.schoolName}</span></td>
                              <td className="p-4">{item.teacherName} <span className="text-slate-400">({item.teacherId})</span></td>
                              <td className="p-4 text-center font-black text-teal-700">{item.totalAverage}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const filteredLen = uniqueLatestAssessments.filter(a => a.schoolName?.includes(adminSearchQuery) || a.teacherName?.includes(adminSearchQuery) || a.teacherId?.includes(adminSearchQuery)).length;
                    const totalPages = Math.ceil(filteredLen / ITEMS_PER_PAGE) || 1;
                    return (
                      <div className="p-4 border-t flex items-center justify-between text-sm text-slate-500">
                        <span>共 {filteredLen} 筆資料</span>
                        <div className="flex gap-2">
                          <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">上一頁</button>
                          <span className="px-3 py-1">第 {currentPage} / {totalPages} 頁</span>
                          <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-3 py-1 border rounded hover:bg-slate-50 disabled:opacity-50">下一頁</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= 系統提示彈窗 ================= */}
      {modalMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center animate-in zoom-in duration-200">
            {modalMessage.type === 'error' ? <AlertCircle size={48} className="text-red-500 mb-4" /> : <CheckCircle2 size={48} className="text-teal-500 mb-4" />}
            <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">{modalMessage.text}</h3>
            <button onClick={() => {
              setModalMessage(null);
              if (modalMessage.isEnd) resetFormAndLogout();
            }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition text-lg">確定</button>
          </div>
        </div>
      )}

      {/* ================= 研習推薦彈窗 ================= */}
      {recommendationModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-300 my-8">
            <div className="text-center mb-8">
              <Sparkles size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-slate-800 mb-2">{recommendationModal.message}</h2>
              <p className="text-slate-500">雲林縣數位辦公室為您準備了專屬的增能課程，助您輕鬆提升數位教學力！</p>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {recommendationModal.dims.map(dim => (
                <div key={dim} className="bg-slate-50 border rounded-2xl overflow-hidden">
                  <div className={`px-4 py-3 font-bold text-white ${dim === 'A' ? 'bg-blue-600' : dim === 'B' ? 'bg-emerald-600' : dim === 'C' ? 'bg-purple-600' : 'bg-orange-500'}`}>
                    維度 {dim} 推薦研習
                  </div>
                  <div className="p-4 space-y-3">
                    {RECOMMENDATION_WORKSHOPS[dim].map((ws, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-teal-300 transition">
                        <div>
                          <div className="font-bold text-slate-800 mb-1">{ws.title}</div>
                          <div className="text-sm text-slate-500 flex gap-3">
                            <span>📅 {ws.date}</span>
                            <span>📍 {ws.location}</span>
                          </div>
                        </div>
                        <a href={ws.link} target="_blank" rel="noreferrer" className="shrink-0 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                          前往報名 <ChevronRight size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => {
              setRecommendationModal(null);
              resetFormAndLogout();
            }} className="mt-8 w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg transition text-lg">我了解了，安全登出</button>
          </div>
        </div>
      )}

      {/* ================= QR Code 放大視窗 ================= */}
      {zoomedQR && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <button onClick={() => setZoomedQR(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition">
              <X size={24} />
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-6 text-center leading-relaxed">{zoomedQR.title}</h3>
            <div className="bg-white p-4 rounded-2xl border-2 border-teal-100 mb-6 shadow-sm">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zoomedQR.url)}`} alt={zoomedQR.title} className="w-64 h-64" />
            </div>
            <p className="text-sm text-slate-500 mb-3 text-center">請掃描條碼，或點擊下方網址前往：</p>
            <a href={zoomedQR.url} target="_blank" rel="noreferrer" className="w-full bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-700 font-bold py-3 px-4 rounded-xl shadow-sm transition text-center break-all text-sm underline leading-snug">
              {zoomedQR.url}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}