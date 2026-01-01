
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

export type AppLocale = "en" | "si";


const deviceLocale: AppLocale =
  Localization.getLocales?.()[0]?.languageCode?.toLowerCase() === "si" ? "si" : "en";

const translations = {
  en: {
    common: {
      details: "Details",
      ok: "OK",
      error: "Error",
      comingSoon: "Coming soon",
      updatedAgo: "Updated {{time}} ago",
      lastUpdated: "Last updated: {{time}}",
      memberSince: "Member since {{value}}",
      languageShort: { en: "EN", si: "SI" },
    },
    farmer: {
      greeting: "Good morning, {{name}}",
      searchPlaceholder: "Search for a fruit",
      demandLabel: "Demand",
      priceLabel: "Price",
      perKg: "/kg",
      featuredTitle: "Mango prices are predicted to rise!",
      featuredDescription: "The average price is expected to increase by 2.5% this week.",
      updatedTime: "Updated 5 mins ago",
      priceDetails: "Price prediction details",
      cards: {
        forecastTitle: "7-Day Forecast",
        forecastSubtitle: "Future price trends",
        liveMarketTitle: "Live Market Prices",
        liveMarketSubtitle: "Current actual prices",
        accuracyTitle: "Accuracy Insights",
        accuracySubtitle: "Prediction progress",
        feedbackTitle: "Feedback",
        feedbackSubtitle: "Share your thoughts",
        predictionTitle: "Run a Prediction",
        predictionSubtitle: "Manual price check",
        dailyPriceTitle: "FreshRoute Price",
        dailyPriceSubtitle: "Check today prices",
      },
      nav: {
        home: "Home",
        forecast: "Forecast",
        market: "Market",
        profile: "Profile",
      },
      errors: {
        generic: "Could not load dashboard",
        failed: "Failed to load dashboard",
      },
    },
    forecast: {
      headerTitle: "7-Day Prediction",
      tabDemand: "Demand",
      tabPrice: "Price",
      fruitLabel: "Fruit Prediction",
      lastUpdated: "Last update: Just now",
      days: {
        mon: "Monday",
        tue: "Tuesday",
        wed: "Wednesday",
        thu: "Thursday",
        fri: "Friday",
        sat: "Saturday",
        sun: "Sunday",
      },
      trends: {
        priceDemand: "Price Demand",
        priceIncrease: "Price Increase",
        dip: "Dip",
        constant: "Constant Demand",
        rising: "Rising Demand",
        slightDip: "Slight Dip",
        stable: "Stable",
      },
    },
    liveMarket: {
      headerTitle: "Prices & Demand",
      ctaPill: "FreshRoute Prices",
      ctaTitle: "Check Today FreshRoute Price",
      ctaSubtitle: "Daily curated prices for our 3 fruits",
      sortBy: "Sort by: {{value}}",
      demandOrder: "Demand: {{value}}",
      lastUpdated: "Last updated: 3 mins ago",
      sortOptions: {
        price: "Price",
        demand: "Demand",
      },
      order: {
        high: "High",
        low: "Low",
      },
      status: {
        high: "High",
        medium: "Medium",
        low: "Low",
      },
    },
    dailyPrices: {
      headerTitle: "Daily Prices",
      dateToday: "Today, October 26",
      searchPlaceholder: "Search for a fruit",
      sortPrice: "Sort by Price",
      sortName: "Sort by Name",
      sortDemand: "Sort by Demand",
      cta: "Open for Sell",
      status: {
        highDemand: "High Demand",
        stable: "Stable",
      },
    },
    feedback: {
      headerTitle: "Feedback",
      mainTitle: "Help us improve FreshRoute!",
      placeholder: "Share your thoughts or ideas...",
      submit: "Submit",
      tabs: {
        recent: "Recent",
        top: "Top",
        mine: "My Feedback",
      },
    },
    fruitForecast: {
      headerTitle: "7-Day Forecast",
      forecastTitle: "{{fruit}} Forecast",
      forecastSubtitle: "Next 7 Days",
      legendDemand: "Demand",
      legendPrice: "Price",
      axisHigh: "High",
      axisMed: "Med",
      axisLow: "Low",
      insightTitle: "Peak Demand: Friday",
      insightDescription: "The highest demand for {{fruit}} is expected this Friday, with prices remaining stable.",
      bottomHint: "Swipe to view other fruits or use the tabs above",
      details: "Details",
    },
    notifications: {
      headerTitle: "Notifications",
      filters: {
        all: "All",
        priceAlerts: "Price Alerts",
        demandUpdates: "Demand Updates",
        appNotifs: "App Notifs",
      },
      sections: {
        unread: "UNREAD",
        earlier: "EARLIER",
      },
      emptyTitle: "All caught up!",
      emptyText: "You have no older notifications",
    },
    notificationDetail: {
      headerTitle: "Notifications",
      received: "Received {{time}}",
    },
    profile: {
      headerTitle: "Farmer Profile",
      memberSince: "Member since Jan 2020",
      message: "Message",
      farmLocation: "Farm Location",
      grows: "Grows These Fruits",
      recentActivity: "Recent Activity",
      logout: "Logout",
    },
    accuracy: {
      headerTitle: "Accuracy Insights",
      cardTitle: "Prediction Progress & Accuracy",
      accuracyLabel: "Overall Accuracy",
      accuracyDescription: "High accuracy achieved this week",
      accuracySubtext: "Last 7 Days",
      sectionTitle: "Key Metrics",
      metricLabels: {
        overall: "Overall Accuracy",
        price: "Price Prediction",
        demand: "Demand Forecast",
      },
      metricChanges: {
        weekUp4: "+4% this week",
        weekUp2: "+2% this week",
        stable: "Stable",
      },
      chartTitle: "Price Performance",
      chartSubtitle: "Predicted vs. Actual",
      legendActual: "Actual",
      legendPredicted: "Predicted",
      fruitPerformance: "Fruit-wise Performance",
      accuracySuffix: "{{value}}% Accuracy",
      insightTitle: "Performance Insight",
      insightText:
        "Your demand forecasts are performing exceptionally well this week. Consider using this model for other produce categories.",
    },
  },
  si: {
    common: {
      details: "විස්තර",
      ok: "හරි",
      error: "දෝෂය",
      comingSoon: "ඉක්මනින් ලැබේ",
      updatedAgo: "අලුත් කළේ {{time}} පෙර",
      lastUpdated: "අවසන් යාවත්කාලීන: {{time}}",
      memberSince: "සාමාජික වූයේ {{value}} සිට",
      languageShort: { en: "EN", si: "සි" },
    },
    farmer: {
      greeting: "සුභ උදෑසනක්, {{name}}",
      searchPlaceholder: "පළතුරු සොයන්න",
      demandLabel: "ඉල්ලුම",
      priceLabel: "මිල",
      perKg: "/කි.ග්.",
      featuredTitle: "අඹ මිල වැඩි වීමට පුරෝකථනය වේ!",
      featuredDescription: "මෙම සතියේ සාමාන්‍ය මිල 2.5% කින් ඉහළ යැයි අපේක්ෂා කරයි.",
      updatedTime: "අලුත් කළේ මිනිත්තු 5 කට පෙර",
      priceDetails: "මිල පුරෝකථන විස්තර",
      cards: {
        forecastTitle: "දින 7ක අනුමාන",
        forecastSubtitle: "ඉදිරි මිල ප්‍රවණතා",
        liveMarketTitle: "සජීව වෙළඳ මිල",
        liveMarketSubtitle: "වත්මන් සැබෑ මිල",
        accuracyTitle: "නිරවද්‍යතා අවබෝධ",
        accuracySubtitle: "අනුමාන ප්‍රගතිය",
        feedbackTitle: "ප්‍රතිචාර",
        feedbackSubtitle: "ඔබේ අදහස් බෙදා ගන්න",
        predictionTitle: "අනුමානයක් ධාවනය කරන්න",
        predictionSubtitle: "ස්වයං අනුමාන පරීක්ෂාව",
        dailyPriceTitle: "FreshRoute මිල",
        dailyPriceSubtitle: "අද මිල බලන්න",
      },
      nav: {
        home: "මුල් පිටුව",
        forecast: "අනුමානය",
        market: "වෙළඳපොල",
        profile: "පැතිකඩ",
      },
      errors: {
        generic: "ඩැෂ්බෝර්ඩ් පූරණය කිරීමට නොහැකි විය",
        failed: "ඩැෂ්බෝර්ඩ් ලබා ගැනීමට අසමත් විය",
      },
    },
    forecast: {
      headerTitle: "දින 7ක අනුමානය",
      tabDemand: "ඉල්ලුම",
      tabPrice: "මිල",
      fruitLabel: "පළතුරු අනුමානය",
      lastUpdated: "අවසන් යාවත්කාලීන: දැන්",
      days: {
        mon: "සඳුදා",
        tue: "අඟහරුවාදා",
        wed: "බදාදා",
        thu: "බ්‍රහස්පතින්දා",
        fri: "සිකුරාදා",
        sat: "සෙනසුරාදා",
        sun: "ඉරිදා",
      },
      trends: {
        priceDemand: "මිල ඉල්ලුම",
        priceIncrease: "මිල ඉහළ යයි",
        dip: "හ්‍රාසය",
        constant: "නිත්‍ය ඉල්ලුම",
        rising: "ඉල්ලුම ඉහළ යයි",
        slightDip: "මද හ්‍රාසය",
        stable: "ස්ථාවර",
      },
    },
    liveMarket: {
      headerTitle: "මිල සහ ඉල්ලුම",
      ctaPill: "FreshRoute මිල",
      ctaTitle: "අද FreshRoute මිල බලන්න",
      ctaSubtitle: "අපගේ පලතුරු තුනට දෛනික මිල",
      sortBy: "වර්ගීකරණය: {{value}}",
      demandOrder: "ඉල්ලුම: {{value}}",
      lastUpdated: "අවසන් යාවත්කාලීන: මිනිත්තු 3 කට පෙර",
      sortOptions: {
        price: "මිල",
        demand: "ඉල්ලුම",
      },
      order: {
        high: "ඉහළ",
        low: "අඩු",
      },
      status: {
        high: "ඉහළ",
        medium: "මධ්‍යම",
        low: "අඩු",
      },
    },
    dailyPrices: {
      headerTitle: "දෛනික මිල",
      dateToday: "අද, ඔක්තෝබර් 26",
      searchPlaceholder: "පළතුරු සොයන්න",
      sortPrice: "මිල අනුව",
      sortName: "නම අනුව",
      sortDemand: "ඉල්ලුම අනුව",
      cta: "විකිණීමට විවෘත කරන්න",
      status: {
        highDemand: "ඉහළ ඉල්ලුම",
        stable: "ස්ථාවර",
      },
    },
    feedback: {
      headerTitle: "ප්‍රතිචාර",
      mainTitle: "FreshRoute වැඩි දියුණු කිරීමට උදව් කරන්න!",
      placeholder: "ඔබගේ අදහස් හෝ අදහස් බෙදා ගන්න...",
      submit: "ඉදිරිපත් කරන්න",
      tabs: {
        recent: "අලුත්",
        top: "ඉහළ",
        mine: "මගේ ප්‍රතිචාර",
      },
    },
    fruitForecast: {
      headerTitle: "දින 7ක අනුමානය",
      forecastTitle: "{{fruit}} අනුමානය",
      forecastSubtitle: "ඊළඟ දින 7",
      legendDemand: "ඉල්ලුම",
      legendPrice: "මිල",
      axisHigh: "ඉහළ",
      axisMed: "මධ්‍ය",
      axisLow: "අඩු",
      insightTitle: "උච්චම ඉල්ලුම: සිකුරාදා",
      insightDescription:
        "මෙම සිකුරාදා {{fruit}} සඳහා ඉහලම ඉල්ලුම ඇතිවනු ඇත, මිල ස්ථාවර වනු ඇත.",
      bottomHint: "වෙනත් පළතුරු බලීමට ස්වයිප් කරන්න හෝ ඉහළ ටැබ් භාවිතා කරන්න",
      details: "විස්තර",
    },
    notifications: {
      headerTitle: "දැනුම්දීම්",
      filters: {
        all: "සියල්ල",
        priceAlerts: "මිල ඇඟවීම්",
        demandUpdates: "ඉල්ලුම් යාවත්කාලීන",
        appNotifs: "යෙදුම් දැනුම්දීම්",
      },
      sections: {
        unread: "නොකියවූ",
        earlier: "පෙර",
      },
      emptyTitle: "සියල්ල කියවා අවසන්!",
      emptyText: "තවත් පරණ දැනුම්දීම් නොමැත",
    },
    notificationDetail: {
      headerTitle: "දැනුම්දීම්",
      received: "ලැබුණේ {{time}}",
    },
    profile: {
      headerTitle: "ගොවි පැතිකඩ",
      memberSince: "සාමාජික වූයේ 2020 ජනවාරි සිට",
      message: "පණිවිඩය",
      farmLocation: "ගොවිපල පිහිටීම",
      grows: "මෙම පළතුරු වගා කරයි",
      recentActivity: "මෑත කටයුතු",
      logout: "පිටවීම",
    },
    accuracy: {
      headerTitle: "නිරවද්‍යතා අවබෝධ",
      cardTitle: "අනුමාන ප්‍රගතිය සහ නිරවද්‍යතාව",
      accuracyLabel: "සම්පූර්ණ නිරවද්‍යතාව",
      accuracyDescription: "මෙම සතියේ උසස් නිරවද්‍යතාව",
      accuracySubtext: "අවසන් දින 7",
      sectionTitle: "ප්‍රධාන මැනුම්",
      metricLabels: {
        overall: "සම්පූර්ණ නිරවද්‍යතාව",
        price: "මිල අනුමානය",
        demand: "ඉල්ලුම් අනුමානය",
      },
      metricChanges: {
        weekUp4: "මෙම සතියේ +4%",
        weekUp2: "මෙම සතියේ +2%",
        stable: "ස්ථාවර",
      },
      chartTitle: "මිල කාර්ය සාධනය",
      chartSubtitle: "අනුමාන කලේ විරුද්ධ සැබෑ",
      legendActual: "සැබෑ",
      legendPredicted: "අනුමාන කල",
      fruitPerformance: "පළතුරු කාර්ය සාධනය",
      accuracySuffix: "{{value}}% නිරවද්‍යතාව",
      insightTitle: "ක්‍රියාකාරී මඟපෙන්වීම",
      insightText:
        "ඔබගේ ඉල්ලුම් අනුමාන මෙම සතියේ විශිෂ්ටයි. මේ ආකෘතිය වෙනත් වගාවන් සඳහාත් භාවිතා කරන්න.",
    },
  },
} as const;

const i18n = new I18n(translations);
i18n.locale = deviceLocale;
i18n.enableFallback = true;
i18n.defaultLocale = "en";

export const translate = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
export const setI18nLocale = (locale: AppLocale) => {
  i18n.locale = locale;
};
export const getCurrentLocale = (): AppLocale => (i18n.locale as AppLocale) || deviceLocale;
export const SUPPORTED_LOCALES: AppLocale[] = ["en", "si"];
