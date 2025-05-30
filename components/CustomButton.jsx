import { TouchableOpacity, Text } from "react-native";
import { useTranslation } from "react-i18next";

// cSpell:word psemibold
export default function CustomButton({
  onPress,
  title,
  style,
  textStyle,
  isLoading,
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      title={title}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isLoading}
      className={`bg-secondary justify-center items-center rounded-xl 
                        ${isLoading ? "opacity-50" : ""} ${style}`}
    >
      <Text
        className={`text-black text-center text-lg font-psemibold ${textStyle}`}
      >
        {t(title)}
      </Text>
    </TouchableOpacity>
  );
}
