🍗 Myin Thar Roast - Smart Ordering System
Myin Thar Roast သည် Customer များအတွက် အော်ဒါတင်ခြင်းနှင့် မှာယူမှုအခြေအနေအား အချိန်နှင့်တပြေးညီ စစ်ဆေးနိုင်ခြင်း (Live Tracking) တို့ကို လုပ်ဆောင်နိုင်သော Premium Web Application တစ်ခုဖြစ်သည်။
🌟 Key Features (အဓိက ပါဝင်သော လုပ်ဆောင်ချက်များ)
Premium UI/UX: ခေတ်မီပြီး သေသပ်သော Navy & Gold ဒီဇိုင်း၊ Smooth Animation များနှင့် Shimmer Loading Effects များ ပါဝင်ခြင်း။
Real-time Tracking: မှာယူထားသော အော်ဒါ ID ကို အသုံးပြု၍ Google Sheet မှ နောက်ဆုံးရ အခြေအနေ (Pending, Processing, Ready) ကို တိုက်ရိုက်ကြည့်ရှုနိုင်ခြင်း။
Local History: Customer ၏ ဖုန်းအတွင်းမှာပင် မှာယူခဲ့သော အော်ဒါမှတ်တမ်းများကို အလိုအလျောက် သိမ်းဆည်းပေးထားခြင်း။
Google Sheets Integration: Database အဖြစ် Google Sheets ကို အသုံးပြုထားသဖြင့် ဒေတာများကို အလွယ်တကူ စီမံခန့်ခွဲနိုင်ခြင်း။
Future-Ready Admin Support: Admin Panel မှတစ်ဆင့် အော်ဒါများကို စီမံနိုင်ရန် API စနစ် ကြိုတင်ထည့်သွင်းထားခြင်း။
🛠️ Tech Stack (အသုံးပြုထားသော နည်းပညာများ)
Frontend: HTML5, CSS3 (Custom Styles), JavaScript (ES6+).
Backend: Google Apps Script (GAS).
Database: Google Sheets.
Icons: Font Awesome 6.0.
📊 System Architecture (စနစ် ချိတ်ဆက်ပုံ)
Ordering: Customer မှ အော်ဒါတင်လိုက်သောအခါ JavaScript မှတစ်ဆင့် JSON ဒေတာများကို Google Apps Script ဆီသို့ POST Request ပို့လွှတ်သည်။
Storage: Apps Script သည် လက်ခံရရှိသော ဒေတာများကို သတ်မှတ်ထားသော Google Sheet တွင် အချိန်နှင့်တပြေးညီ သိမ်းဆည်းသည်။
Tracking: Tracking Page မှ အော်ဒါ ID ကို ပို့လိုက်သောအခါ Apps Script မှ Sheet ထဲတွင် ရှာဖွေပြီး Status, Items နှင့် Total ဒေတာများကို Website ဆီသို့ GET Request ဖြင့် ပြန်လည်ပေးပို့သည်။
🚀 Installation & Setup (စနစ် ထည့်သွင်းပုံ)
၁။ Google Sheets ပြင်ဆင်ခြင်း
Sheet ၏ ပထမဆုံး Column ခေါင်းစဉ်များကို အောက်ပါအတိုင်း သတ်မှတ်ပါ-
ID | Name | Phone | Items | Total | Status | Date
၂။ Google Apps Script ထည့်သွင်းခြင်း
Sheet အတွင်းရှိ Extensions > Apps Script သို့သွားပါ။
ပေးထားသော Code.gs ကို ကူးထည့်ပါ။
Deploy > New Deployment ကိုနှိပ်ပြီး Web App URL ကို ရယူပါ။
၃။ Frontend ချိတ်ဆက်ခြင်း
index.html နှင့် track.html ရှိ const SCRIPT_URL နေရာတွင် မိမိ၏ Web App URL ကို အစားထိုးပါ။
📂 File Structure
├── index.html       # ပစ္စည်းရွေးချယ်ရန်နှင့် အော်ဒါတင်ရန် စာမျက်နှာ
├── track.html       # မှာယူမှုမှတ်တမ်းနှင့် Status စစ်ဆေးရန် စာမျက်နှာ
└── code.gs          # Google Sheets နှင့် ချိတ်ဆက်ပေးသော Backend Script
📝 Admin Panel Guide (နောင်တွင် လုပ်ဆောင်ရန်)
Admin Panel မှတစ်ဆင့် Status ပြောင်းလဲလိုပါက updateStatus function ကို Script တွင် ထပ်မံဖြည့်စွက်နိုင်ပြီး ?admin=true parameter ဖြင့် အော်ဒါအားလုံးကို ဆွဲထုတ်နိုင်ပါသည်။
