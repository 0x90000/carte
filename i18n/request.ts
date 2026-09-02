import { getRequestConfig } from "next-intl/server";
import en from "@/messages/en.json";
import zhCN from "@/messages/zh-CN.json";
import { defaultLocale, isLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  return { locale, messages: locale === "zh-CN" ? zhCN : en };
});
