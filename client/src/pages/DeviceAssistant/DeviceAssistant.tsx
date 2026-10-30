import { demoSession } from '@/demo/storage';
import { PageBackIcon } from '@/components/PageNavigation';
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  BookOpen,
  HelpCircle,
  FileText,
  Headphones,
  ShoppingBag,
  X,
} from "lucide-react";
import IPhoneFrame from "@client/src/components/IPhoneFrame";
import { useTranslation } from "@client/src/hooks/useTranslation";

interface AssistantItem {
  labelKey: string;
  icon: React.ReactNode;
  descKey: string;
  route?: string;
  url?: string;
}

const ASSISTANT_ITEMS: AssistantItem[] = [
  {
    labelKey: "deviceAssistant.guide",
    icon: <BookOpen className="h-5 w-5" style={{ color: "#8B4A1B" }} />,
    descKey: "deviceAssistant.guideDesc",
  },
  {
    labelKey: "deviceAssistant.faq",
    icon: <HelpCircle className="h-5 w-5" style={{ color: "#8B4A1B" }} />,
    descKey: "deviceAssistant.faqDesc",
    route: "/faq",
  },
  {
    labelKey: "deviceAssistant.manual",
    icon: <FileText className="h-5 w-5" style={{ color: "#8B4A1B" }} />,
    descKey: "deviceAssistant.manualDesc",
  },
  {
    labelKey: "deviceAssistant.contactSupport",
    icon: <Headphones className="h-5 w-5" style={{ color: "#8B4A1B" }} />,
    descKey: "deviceAssistant.contactSupportDesc",
  },
  {
    labelKey: "deviceAssistant.accessories",
    icon: <ShoppingBag className="h-5 w-5" style={{ color: "#8B4A1B" }} />,
    descKey: "deviceAssistant.accessoriesDesc",
    url: "https://www.momcozy.com",
  },
];

const DeviceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [browserUrl, setBrowserUrl] = React.useState<string | null>(null);

  const handleItemClick = (item: AssistantItem) => {
    if (item.url) {
      setBrowserUrl(item.url);
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const browserOverlay = browserUrl ? (
    <div className="absolute inset-0 z-30 flex flex-col bg-white">
      {/* Browser header */}
      <div className="flex items-center gap-2 px-3 pt-14 pb-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setBrowserUrl(null)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F0F0F0" }}
        >
          <X className="h-4 w-4" style={{ color: "#333" }} />
        </motion.button>
        <div
          className="flex flex-1 items-center justify-center rounded-full py-1.5 text-[12px]"
          style={{ backgroundColor: "#F0F0F0", color: "#666" }}
        >
          www.momcozy.com
        </div>
      </div>
      {/* Browser content */}
      <iframe
        src={browserUrl}
        className="flex-1 border-0"
        title="Momcozy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  ) : null;

  return (
    <IPhoneFrame background="#F7F7F7" overlay={browserOverlay}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(
              demoSession.getItem('device_assistant_return_to') === '/device'
                ? '/device'
                : '/device-settings',
            )}
            className="fd06-page-back" aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <h1
            className="text-[16px] font-semibold"
            style={{ color: "#1A1A1A" }}
          >
            {t("deviceAssistant.title")}
          </h1>
          <div className="h-8 w-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="overflow-hidden rounded-[10px] bg-white">
            {ASSISTANT_ITEMS.map((item, index) => (
                <motion.button
                  key={item.labelKey}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleItemClick(item)}
                  className={`flex w-full items-center justify-between px-4 py-4 ${
                    index < ASSISTANT_ITEMS.length - 1
                      ? "border-b border-[#EEEEEE]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "#FFF5EE" }}
                    >
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <p
                        className="text-[14px] font-medium"
                        style={{ color: "#1A1A1A" }}
                      >
                        {t(item.labelKey)}
                      </p>
                      <p
                        className="mt-0.5 text-[12px]"
                        style={{ color: "#999999" }}
                      >
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="h-5 w-5"
                    style={{ color: "#CCCCCC" }}
                  />
                </motion.button>
            ))}
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default DeviceAssistant;
