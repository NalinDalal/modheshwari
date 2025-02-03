import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        appTitle: "Community Connect",
        appTagline: "Bringing families together, one connection at a time",
        exploreFeatures: "Explore Features",
        keyFeatures: "Key Features",
        "Profile Management": "Profile Management",
        "Event Planning": "Event Planning",
        "Family Connections": "Family Connections",
        featureDescription:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      },
    },
    hi: {
      translation: {
        appTitle: "समुदाय कनेक्ट",
        appTagline: "परिवारों को एक साथ लाना, एक कनेक्शन एक बार में",
        exploreFeatures: "सुविधाओं का अन्वेषण करें",
        keyFeatures: "मुख्य विशेषताएँ",
        "Profile Management": "प्रोफ़ाइल प्रबंधन",
        "Event Planning": "कार्यक्रम योजना",
        "Family Connections": "पारिवारिक संबंध",
        featureDescription:
          "लोरेम इप्सम डोलर सिट अमेट, कंसेक्टेटूर अडिपिसिंग एलिट।",
      },
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
